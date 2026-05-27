/**
 * @module lib/gateway/types
 * @description Core type definitions for the AI Provider Gateway.
 * Defines provider names, routing configuration, request/response shapes,
 * the AIProvider interface, and structured error types.
 */

/** Supported AI provider identifiers. */
export type ProviderName =
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'gemini'
  | 'google_ai'
  | 'deepseek'
  | 'openrouter'
  | 'mistral'
  | 'local';

/** Configuration for a specific provider + model combination. */
export interface ProviderModelConfig {
  /** Which AI provider to use. */
  provider: ProviderName;

  /** Model identifier for the provider (e.g. "gpt-4o", "claude-sonnet-4-20250514"). */
  model: string;
}

/** Primary + fallback routing for a single pipeline stage. */
export interface StageRoutingConfig {
  /** Primary provider/model to attempt first. */
  primary: ProviderModelConfig;

  /** Fallback provider/model if primary fails with a retryable error. */
  fallback: ProviderModelConfig;

  /** Optional final escalation path, normally OpenRouter. */
  escalation?: ProviderModelConfig;
}

/** Complete routing configuration mapping pipeline stages to providers. */
export interface RoutingConfig {
  /** Routing for the intent extraction stage. */
  intentExtraction: StageRoutingConfig;

  /** Routing for the schema generation stage. */
  schemaGeneration: StageRoutingConfig;

  /** Routing for the full AppSpec generation stage. */
  appSpecGeneration: StageRoutingConfig;

  /** Routing for the repair/fix stage. */
  repair: StageRoutingConfig;
}

/** Request payload for an AI completion call. */
export interface AICompletionRequest {
  /** System-level prompt providing context and instructions. */
  systemPrompt: string;

  /** User-level prompt containing the specific query. */
  userPrompt: string;

  /** Optional response format hint; 'json' requests structured JSON output. */
  responseFormat?: 'json';

  /** Maximum number of tokens to generate. */
  maxTokens?: number;

  /** Sampling temperature (0 = deterministic, higher = more creative). */
  temperature?: number;
}

/** Canonical pipeline stages used by provider routing. */
export type GatewayStage =
  | 'intentExtraction'
  | 'schemaGeneration'
  | 'appSpecGeneration'
  | 'repair';

/** Token usage and cost telemetry for a single AI call. */
export interface TokenUsage {
  /** Number of tokens in the prompt. */
  promptTokens: number;

  /** Number of tokens generated in the completion. */
  completionTokens: number;

  /** Total tokens (prompt + completion). */
  totalTokens: number;

  /** Estimated cost in USD for this call. */
  estimatedCostUsd: number;
}

/** Response from a successful AI completion call. */
export interface AICompletionResponse {
  /** The generated text content. */
  content: string;

  /** Token usage and cost information. */
  usage: TokenUsage;

  /** Which provider fulfilled the request. */
  provider: ProviderName;

  /** Which model was used. */
  model: string;

  /** Wall-clock latency in milliseconds. */
  latencyMs: number;
}

/**
 * AIProvider — interface that every provider adapter must implement.
 * Provides a uniform API for making AI completion calls across providers.
 */
export interface AIProvider {
  /** The provider's canonical name. */
  readonly name: ProviderName;

  /**
   * Execute a completion request against a specific model.
   * @param request - The completion request payload.
   * @param model - The model identifier to use.
   * @returns The completion response with content and usage data.
   */
  complete(request: AICompletionRequest, model: string): Promise<AICompletionResponse>;

  /**
   * Check whether this provider is available (API key configured).
   * @returns true if the provider can accept requests.
   */
  isAvailable(): boolean;
}

/** Structured error from a provider call, with retry information. */
export interface ProviderError {
  /** Which provider produced the error. */
  provider: ProviderName;

  /** Which model was being called. */
  model: string;

  /** HTTP status code from the provider API. */
  statusCode: number;

  /** Human-readable error message. */
  message: string;

  /** Whether this error is transient and can be retried. */
  retryable: boolean;
}
