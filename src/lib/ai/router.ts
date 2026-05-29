import { generateGeminiJson, hasGeminiKey } from './gemini.js';
import { generateOpenAIJson, hasOpenAIKey } from './openai.js';

export type AIProviderName = 'openai' | 'gemini' | 'groq' | 'anthropic' | 'local';

export function resolveProvider(): AIProviderName {
  const preferred = (process.env.APPFORGE_AI_PROVIDER || '').toLowerCase();
  if (preferred === 'openai' && hasOpenAIKey()) return 'openai';
  if (preferred === 'gemini' && hasGeminiKey()) return 'gemini';
  if (preferred === 'groq' && process.env.GROQ_API_KEY) return 'groq';
  if (preferred === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (hasOpenAIKey()) return 'openai';
  if (hasGeminiKey()) return 'gemini';
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'local';
}

export async function generateJsonWithProvider(system: string, prompt: string) {
  const provider = resolveProvider();
  if (provider === 'openai') {
    return { provider, data: await generateOpenAIJson(system, prompt) };
  }
  if (provider === 'gemini') {
    return { provider, data: await generateGeminiJson(system, prompt) };
  }
  if (provider === 'groq') {
    return { provider, data: await generateOpenAICompatibleJson('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY!, process.env.GROQ_MODEL || 'llama-3.1-8b-instant', system, prompt) };
  }
  if (provider === 'anthropic') {
    return { provider, data: await generateAnthropicJson(system, prompt) };
  }
  throw new Error('No AI provider API key is configured');
}

async function generateOpenAICompatibleJson(url: string, apiKey: string, model: string, system: string, prompt: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Provider request failed with HTTP ${response.status}`);
  }
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Provider returned an empty response');
  return JSON.parse(content);
}

async function generateAnthropicJson(system: string, prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 3000,
      temperature: 0.2,
      system: `${system}\nReturn valid JSON only.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic request failed with HTTP ${response.status}`);
  }
  const json = await response.json();
  const text = json.content?.map((part: any) => part.text || '').join('').trim();
  if (!text) throw new Error('Anthropic returned an empty response');
  return JSON.parse(text);
}
