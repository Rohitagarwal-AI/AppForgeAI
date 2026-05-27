/**
 * @module lib/gateway/config
 * @description Config-driven provider routing and cost estimation.
 */

import type {
  GatewayStage,
  ProviderName,
  RoutingConfig,
} from '@/lib/gateway/types';

export const COST_TABLE: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o': { input: 2.5, output: 10 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'anthropic/claude-sonnet-4-20250514': { input: 3, output: 15 },
  'anthropic/claude-3-5-haiku-latest': { input: 0.8, output: 4 },
  'groq/llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'groq/llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'gemini/gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini/gemini-2.5-pro-preview-05-06': { input: 1.25, output: 10 },
  'google_ai/gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'deepseek/deepseek-chat': { input: 0.27, output: 1.1 },
  'deepseek/deepseek-reasoner': { input: 0.55, output: 2.19 },
  'mistral/mistral-large-latest': { input: 2, output: 6 },
  'mistral/mistral-small-latest': { input: 0.2, output: 0.6 },
  'openrouter/openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'openrouter/anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
  'local/deterministic': { input: 0, output: 0 },
};

const PROVIDERS: readonly ProviderName[] = [
  'openai',
  'anthropic',
  'groq',
  'gemini',
  'google_ai',
  'deepseek',
  'openrouter',
  'mistral',
  'local',
];

function providerFromEnv(key: string, fallback: ProviderName): ProviderName {
  const raw = process.env[key];
  if (raw && PROVIDERS.includes(raw as ProviderName)) {
    return raw as ProviderName;
  }
  return fallback;
}

function envModel(key: string, fallback: string): string {
  const raw = process.env[key];
  return raw && raw.trim().length > 0 ? raw.trim() : fallback;
}

const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  intentExtraction: {
    primary: {
      provider: providerFromEnv('APPFORGE_INTENT_PRIMARY_PROVIDER', 'openai'),
      model: envModel('APPFORGE_INTENT_PRIMARY_MODEL', 'gpt-4o-mini'),
    },
    fallback: {
      provider: providerFromEnv('APPFORGE_INTENT_FALLBACK_PROVIDER', 'groq'),
      model: envModel('APPFORGE_INTENT_FALLBACK_MODEL', 'llama-3.1-8b-instant'),
    },
    escalation: {
      provider: providerFromEnv('APPFORGE_INTENT_ESCALATION_PROVIDER', 'openrouter'),
      model: envModel('APPFORGE_INTENT_ESCALATION_MODEL', 'openai/gpt-4o-mini'),
    },
  },
  schemaGeneration: {
    primary: {
      provider: providerFromEnv('APPFORGE_SCHEMA_PRIMARY_PROVIDER', 'anthropic'),
      model: envModel('APPFORGE_SCHEMA_PRIMARY_MODEL', 'claude-sonnet-4-20250514'),
    },
    fallback: {
      provider: providerFromEnv('APPFORGE_SCHEMA_FALLBACK_PROVIDER', 'openai'),
      model: envModel('APPFORGE_SCHEMA_FALLBACK_MODEL', 'gpt-4o'),
    },
    escalation: {
      provider: providerFromEnv('APPFORGE_SCHEMA_ESCALATION_PROVIDER', 'openrouter'),
      model: envModel('APPFORGE_SCHEMA_ESCALATION_MODEL', 'anthropic/claude-3.5-sonnet'),
    },
  },
  appSpecGeneration: {
    primary: {
      provider: providerFromEnv('APPFORGE_APPSPEC_PRIMARY_PROVIDER', 'openai'),
      model: envModel('APPFORGE_APPSPEC_PRIMARY_MODEL', 'gpt-4o'),
    },
    fallback: {
      provider: providerFromEnv('APPFORGE_APPSPEC_FALLBACK_PROVIDER', 'gemini'),
      model: envModel('APPFORGE_APPSPEC_FALLBACK_MODEL', 'gemini-2.5-pro-preview-05-06'),
    },
    escalation: {
      provider: providerFromEnv('APPFORGE_APPSPEC_ESCALATION_PROVIDER', 'openrouter'),
      model: envModel('APPFORGE_APPSPEC_ESCALATION_MODEL', 'openai/gpt-4o-mini'),
    },
  },
  repair: {
    primary: {
      provider: providerFromEnv('APPFORGE_REPAIR_PRIMARY_PROVIDER', 'openai'),
      model: envModel('APPFORGE_REPAIR_PRIMARY_MODEL', 'gpt-4o-mini'),
    },
    fallback: {
      provider: providerFromEnv('APPFORGE_REPAIR_FALLBACK_PROVIDER', 'anthropic'),
      model: envModel('APPFORGE_REPAIR_FALLBACK_MODEL', 'claude-3-5-haiku-latest'),
    },
    escalation: {
      provider: providerFromEnv('APPFORGE_REPAIR_ESCALATION_PROVIDER', 'openrouter'),
      model: envModel('APPFORGE_REPAIR_ESCALATION_MODEL', 'openai/gpt-4o-mini'),
    },
  },
};

export function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = COST_TABLE[`${provider}/${model}`];
  if (!pricing) {
    return 0;
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export function getRoutingConfig(overrides?: Partial<RoutingConfig>): RoutingConfig {
  if (!overrides) {
    return { ...DEFAULT_ROUTING_CONFIG };
  }

  return {
    intentExtraction:
      overrides.intentExtraction ?? DEFAULT_ROUTING_CONFIG.intentExtraction,
    schemaGeneration:
      overrides.schemaGeneration ?? DEFAULT_ROUTING_CONFIG.schemaGeneration,
    appSpecGeneration:
      overrides.appSpecGeneration ?? DEFAULT_ROUTING_CONFIG.appSpecGeneration,
    repair: overrides.repair ?? DEFAULT_ROUTING_CONFIG.repair,
  };
}

export function getRoutingForStage(
  stage: GatewayStage,
  overrides?: Partial<RoutingConfig>,
): RoutingConfig[GatewayStage] {
  return getRoutingConfig(overrides)[stage];
}
