/**
 * @module lib/gateway/provider-gateway
 * @description Provider abstraction, concrete adapters, routing, retry, and
 * escalation for AI completion calls.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import type {
  AICompletionRequest,
  AICompletionResponse,
  AIProvider,
  GatewayStage,
  ProviderModelConfig,
  ProviderName,
  RoutingConfig,
  TokenUsage,
} from '@/lib/gateway/types';
import { calculateCost, getRoutingForStage } from '@/lib/gateway/config';
import { createLogger } from '@/lib/observability/logger';

const logger = createLogger({ stage: 'gateway' });

interface ChatCompletionJsonResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function buildUsage(
  provider: ProviderName,
  model: string,
  promptText: string,
  completionText: string,
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  },
): TokenUsage {
  const promptTokens = usage?.promptTokens ?? estimateTokens(promptText);
  const completionTokens = usage?.completionTokens ?? estimateTokens(completionText);
  const totalTokens = usage?.totalTokens ?? promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd: calculateCost(provider, model, promptTokens, completionTokens),
  };
}

function promptText(request: AICompletionRequest): string {
  return `${request.systemPrompt}\n\n${request.userPrompt}`;
}

function requireContent(content: string | null | undefined, provider: ProviderName): string {
  if (!content || content.trim().length === 0) {
    throw new Error(`${provider} returned an empty completion`);
  }
  return content;
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('rate') ||
    message.includes('429') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504')
  );
}

abstract class BaseProvider implements AIProvider {
  abstract readonly name: ProviderName;

  abstract complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse>;

  protected abstract apiKey(): string | undefined;

  isAvailable(): boolean {
    return Boolean(this.apiKey());
  }

  protected response(
    request: AICompletionRequest,
    model: string,
    content: string,
    latencyMs: number,
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    },
  ): AICompletionResponse {
    return {
      content,
      usage: buildUsage(this.name, model, promptText(request), content, usage),
      provider: this.name,
      model,
      latencyMs,
    };
  }
}

class OpenAIProvider extends BaseProvider {
  readonly name = 'openai' as const;

  private client(): OpenAI {
    return new OpenAI({ apiKey: this.apiKey() });
  }

  protected apiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  async complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse> {
    const startedAt = performance.now();
    const completion = await this.client().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      response_format:
        request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    });

    const content = requireContent(
      completion.choices[0]?.message?.content,
      this.name,
    );

    return this.response(request, model, content, Math.round(performance.now() - startedAt), {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    });
  }
}

class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic' as const;

  private client(): Anthropic {
    return new Anthropic({ apiKey: this.apiKey() });
  }

  protected apiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  async complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse> {
    const startedAt = performance.now();
    const message = await this.client().messages.create({
      model,
      system: request.systemPrompt,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.2,
      messages: [{ role: 'user', content: request.userPrompt }],
    });

    const textBlocks = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text);
    const content = requireContent(textBlocks.join('\n'), this.name);

    return this.response(request, model, content, Math.round(performance.now() - startedAt), {
      promptTokens: message.usage.input_tokens,
      completionTokens: message.usage.output_tokens,
      totalTokens: message.usage.input_tokens + message.usage.output_tokens,
    });
  }
}

class GroqProvider extends BaseProvider {
  readonly name = 'groq' as const;

  private client(): Groq {
    return new Groq({ apiKey: this.apiKey() });
  }

  protected apiKey(): string | undefined {
    return process.env.GROQ_API_KEY;
  }

  async complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse> {
    const startedAt = performance.now();
    const completion = await this.client().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      response_format:
        request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    });

    const content = requireContent(
      completion.choices[0]?.message?.content,
      this.name,
    );

    return this.response(request, model, content, Math.round(performance.now() - startedAt), {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    });
  }
}

class GeminiProvider extends BaseProvider {
  readonly name: ProviderName;

  constructor(name: 'gemini' | 'google_ai') {
    super();
    this.name = name;
  }

  protected apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  }

  async complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse> {
    const startedAt = performance.now();
    const ai = new GoogleGenAI({ apiKey: this.apiKey() });
    const response = await ai.models.generateContent({
      model,
      contents: `${request.systemPrompt}\n\n${request.userPrompt}`,
      config: {
        temperature: request.temperature ?? 0.2,
        maxOutputTokens: request.maxTokens,
        responseMimeType:
          request.responseFormat === 'json' ? 'application/json' : undefined,
      },
    });

    const content = requireContent(response.text, this.name);
    const rawUsage = response.usageMetadata;

    return this.response(request, model, content, Math.round(performance.now() - startedAt), {
      promptTokens: rawUsage?.promptTokenCount,
      completionTokens: rawUsage?.candidatesTokenCount,
      totalTokens: rawUsage?.totalTokenCount,
    });
  }
}

abstract class OpenAICompatibleProvider extends BaseProvider {
  protected abstract endpoint(): string;

  protected abstract extraHeaders(): Record<string, string>;

  async complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse> {
    const startedAt = performance.now();
    const response = await fetch(this.endpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey()}`,
        ...this.extraHeaders(),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens,
        response_format:
          request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      }),
    });

    const json = (await response.json()) as ChatCompletionJsonResponse;

    if (!response.ok) {
      throw new Error(
        json.error?.message ??
          `${this.name} request failed with status ${response.status}`,
      );
    }

    const content = requireContent(json.choices?.[0]?.message?.content, this.name);

    return this.response(request, model, content, Math.round(performance.now() - startedAt), {
      promptTokens: json.usage?.prompt_tokens,
      completionTokens: json.usage?.completion_tokens,
      totalTokens: json.usage?.total_tokens,
    });
  }
}

class OpenRouterProvider extends OpenAICompatibleProvider {
  readonly name = 'openrouter' as const;

  protected apiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY;
  }

  protected endpoint(): string {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }

  protected extraHeaders(): Record<string, string> {
    return {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'AppForgeAI',
    };
  }
}

class MistralProvider extends OpenAICompatibleProvider {
  readonly name = 'mistral' as const;

  protected apiKey(): string | undefined {
    return process.env.MISTRAL_API_KEY;
  }

  protected endpoint(): string {
    return 'https://api.mistral.ai/v1/chat/completions';
  }

  protected extraHeaders(): Record<string, string> {
    return {};
  }
}

class DeepSeekProvider extends OpenAICompatibleProvider {
  readonly name = 'deepseek' as const;

  protected apiKey(): string | undefined {
    return process.env.DEEPSEEK_API_KEY;
  }

  protected endpoint(): string {
    return 'https://api.deepseek.com/chat/completions';
  }

  protected extraHeaders(): Record<string, string> {
    return {};
  }
}

class LocalProvider extends BaseProvider {
  readonly name = 'local' as const;

  protected apiKey(): string | undefined {
    return 'local';
  }

  async complete(
    request: AICompletionRequest,
    model: string,
  ): Promise<AICompletionResponse> {
    const content = request.responseFormat === 'json' ? '{}' : '';
    return this.response(request, model, content, 0, {
      promptTokens: estimateTokens(promptText(request)),
      completionTokens: estimateTokens(content),
      totalTokens: estimateTokens(promptText(request)) + estimateTokens(content),
    });
  }
}

export class ProviderGateway {
  private readonly providers: Record<ProviderName, AIProvider>;

  constructor(private readonly routingOverrides?: Partial<RoutingConfig>) {
    this.providers = {
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      groq: new GroqProvider(),
      gemini: new GeminiProvider('gemini'),
      google_ai: new GeminiProvider('google_ai'),
      deepseek: new DeepSeekProvider(),
      openrouter: new OpenRouterProvider(),
      mistral: new MistralProvider(),
      local: new LocalProvider(),
    };
  }

  availableProviders(): ProviderName[] {
    return Object.values(this.providers)
      .filter((provider) => provider.isAvailable())
      .map((provider) => provider.name);
  }

  async complete(
    stage: GatewayStage,
    request: AICompletionRequest,
  ): Promise<AICompletionResponse> {
    const route = getRoutingForStage(stage, this.routingOverrides);
    const candidates = this.routeCandidates(route.primary, route.fallback, route.escalation);
    const attempted: string[] = [];
    let lastError: unknown;

    for (const candidate of candidates) {
      const provider = this.providers[candidate.provider];
      if (!provider?.isAvailable()) {
        continue;
      }

      attempted.push(`${candidate.provider}/${candidate.model}`);

      try {
        return await provider.complete(request, candidate.model);
      } catch (error: unknown) {
        lastError = error;
        logger.warn('Provider call failed', {
          stage,
          provider: candidate.provider,
          model: candidate.model,
          retryable: isRetryableError(error),
          error: error instanceof Error ? error.message : 'Unknown provider error',
        });

        if (isRetryableError(error)) {
          try {
            return await provider.complete(request, candidate.model);
          } catch (retryError: unknown) {
            lastError = retryError;
            logger.warn('Provider retry failed', {
              stage,
              provider: candidate.provider,
              model: candidate.model,
              error:
                retryError instanceof Error
                  ? retryError.message
                  : 'Unknown provider retry error',
            });
          }
        }
      }
    }

    if (process.env.APPFORGE_ALLOW_LOCAL_FALLBACK !== 'false') {
      logger.warn('No configured provider succeeded; using local fallback', {
        stage,
        attempted,
      });
      return this.providers.local.complete(request, 'deterministic');
    }

    throw new Error(
      `No AI provider completed stage "${stage}". Attempted: ${attempted.join(', ') || 'none'}. Last error: ${
        lastError instanceof Error ? lastError.message : 'unknown'
      }`,
    );
  }

  private routeCandidates(
    primary: ProviderModelConfig,
    fallback: ProviderModelConfig,
    escalation?: ProviderModelConfig,
  ): ProviderModelConfig[] {
    const candidates = [primary, fallback];
    if (escalation) {
      candidates.push(escalation);
    }

    const unique = new Map<string, ProviderModelConfig>();
    for (const candidate of candidates) {
      unique.set(`${candidate.provider}/${candidate.model}`, candidate);
    }
    return [...unique.values()];
  }
}

export function createProviderGateway(
  routingOverrides?: Partial<RoutingConfig>,
): ProviderGateway {
  return new ProviderGateway(routingOverrides);
}
