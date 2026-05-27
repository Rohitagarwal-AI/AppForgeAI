/**
 * @module lib/repair/strategies/structural-repair
 * @description Structural repair strategy for fixing malformed JSON,
 * stripping code fences, fixing trailing commas, balancing brackets,
 * and filling missing top-level required keys with sensible defaults.
 */

import type { ValidationError, RepairLog } from '@/types/pipeline';
import type { RepairStrategy, RepairResult } from '@/lib/repair/types';

/** Error codes this strategy can handle. */
const HANDLEABLE_CODES = new Set([
  'STRUCTURAL_INVALID_JSON',
  'STRUCTURAL_MISSING_KEY',
  'STRUCTURAL_NOT_OBJECT',
  'STRUCTURAL_EMPTY_INPUT',
  'STRUCTURAL_EMPTY_FIELD',
  'STRUCTURAL_EMPTY_ARRAY',
  'STRUCTURAL_EMPTY_STRING',
]);

/**
 * Creates a RepairLog entry.
 *
 * @param error   - The original validation error.
 * @param outcome - The repair outcome.
 * @param before  - Value before repair.
 * @param after   - Value after repair.
 * @returns A structured RepairLog.
 */
function createLog(
  error: ValidationError,
  outcome: 'repaired' | 'failed' | 'escalated',
  before?: unknown,
  after?: unknown,
): RepairLog {
  return {
    strategy: 'structural',
    inputError: error,
    outcome,
    timestamp: new Date().toISOString(),
    aiCallMade: false,
    beforeValue: before,
    afterValue: after,
  };
}

/**
 * Strips markdown code fences from raw JSON strings.
 * Handles ```json ... ``` and ``` ... ``` patterns.
 *
 * @param raw - The raw string potentially wrapped in code fences.
 * @returns The cleaned string with code fences removed.
 */
function stripCodeFences(raw: string): string {
  let cleaned = raw.trim();

  // Remove opening code fence with optional language identifier
  cleaned = cleaned.replace(/^```(?:json|typescript|ts|javascript|js)?\s*\n?/i, '');

  // Remove closing code fence
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');

  return cleaned.trim();
}

/**
 * Fixes trailing commas in JSON strings.
 * Removes commas before closing braces/brackets.
 *
 * @param raw - The JSON string with potential trailing commas.
 * @returns The fixed JSON string.
 */
function fixTrailingCommas(raw: string): string {
  // Remove trailing commas before } or ]
  return raw.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Attempts to balance unmatched brackets and braces.
 *
 * @param raw - The JSON string with potentially unbalanced delimiters.
 * @returns The balanced JSON string.
 */
function balanceBrackets(raw: string): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of raw) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    switch (char) {
      case '{':
        openBraces++;
        break;
      case '}':
        openBraces--;
        break;
      case '[':
        openBrackets++;
        break;
      case ']':
        openBrackets--;
        break;
    }
  }

  let result = raw;

  // Append missing closing brackets/braces
  while (openBrackets > 0) {
    result += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    result += '}';
    openBraces--;
  }

  return result;
}

/**
 * Attempts to fix malformed JSON by applying multiple heuristic passes:
 * 1. Strip code fences
 * 2. Fix trailing commas
 * 3. Balance brackets/braces
 *
 * @param raw   - The raw malformed JSON string.
 * @param error - The validation error describing the issue.
 * @returns A RepairResult with the parsed data if successful.
 */
function repairMalformedJson(
  raw: unknown,
  error: ValidationError,
): RepairResult {
  if (typeof raw !== 'string') {
    return {
      repaired: false,
      data: raw,
      logs: [createLog(error, 'failed', raw)],
    };
  }

  let cleaned = stripCodeFences(raw);
  cleaned = fixTrailingCommas(cleaned);
  cleaned = balanceBrackets(cleaned);

  try {
    const parsed: unknown = JSON.parse(cleaned);
    return {
      repaired: true,
      data: parsed,
      logs: [createLog(error, 'repaired', raw, parsed)],
    };
  } catch {
    return {
      repaired: false,
      data: raw,
      logs: [createLog(error, 'escalated', raw)],
    };
  }
}

/**
 * Determines the sensible default for a missing key based on its name.
 *
 * @param key - The key name to determine a default for.
 * @returns A sensible default value.
 */
function getDefaultForKey(key: string): unknown {
  // Array-like field names
  const arrayFields = new Set([
    'features',
    'entities',
    'integrationsRequested',
    'assumptions',
    'conflicts',
    'pages',
    'apiEndpoints',
    'integrationHooks',
    'workflowStubs',
    'fields',
    'relations',
    'roles',
    'providerUsage',
    'components',
    'permissions',
    'allowedEntities',
    'actions',
  ]);

  // Object-like field names
  const objectFields = new Set([
    'authRules',
    'dataSchema',
    'metadata',
    'config',
    'trigger',
    'requestSchema',
    'responseSchema',
  ]);

  // Boolean field names
  const booleanFields = new Set([
    'clarificationRequired',
    'authRequired',
    'rateLimitFlag',
    'nullable',
    'isRelation',
    'isPrimary',
    'isUnique',
    'tenantId',
  ]);

  // Number field names
  const numberFields = new Set([
    'ambiguityScore',
    'promptTokens',
    'completionTokens',
    'costUsd',
    'latencyMs',
    'totalLatencyMs',
    'totalCostUsd',
  ]);

  if (arrayFields.has(key)) return [];
  if (objectFields.has(key)) return {};
  if (booleanFields.has(key)) return false;
  if (numberFields.has(key)) return 0;

  return '';
}

/**
 * Fills a missing top-level key with a sensible default value.
 *
 * @param data  - The data object with the missing key.
 * @param error - The validation error describing the missing key.
 * @returns A RepairResult with the patched data.
 */
function fillMissingKey(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (data === null || data === undefined || typeof data !== 'object') {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed', data)],
    };
  }

  const record = data as Record<string, unknown>;
  const key = error.path;

  if (!key || key in record) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed', undefined)],
    };
  }

  const defaultValue = getDefaultForKey(key);
  const patched = { ...record, [key]: defaultValue };

  return {
    repaired: true,
    data: patched,
    logs: [createLog(error, 'repaired', undefined, defaultValue)],
  };
}

/**
 * structuralRepairStrategy — handles JSON parse failures, missing keys,
 * and empty field defaults via deterministic heuristics.
 */
export const structuralRepairStrategy: RepairStrategy = {
  name: 'structural',

  canHandle(error: ValidationError): boolean {
    return HANDLEABLE_CODES.has(error.code);
  },

  repair(data: unknown, error: ValidationError): RepairResult {
    switch (error.code) {
      case 'STRUCTURAL_INVALID_JSON':
      case 'STRUCTURAL_EMPTY_INPUT':
        return repairMalformedJson(data, error);

      case 'STRUCTURAL_MISSING_KEY':
        return fillMissingKey(data, error);

      case 'STRUCTURAL_NOT_OBJECT': {
        // If data is a string, try to parse it as JSON
        if (typeof data === 'string') {
          return repairMalformedJson(data, error);
        }
        return {
          repaired: false,
          data,
          logs: [createLog(error, 'escalated', data)],
        };
      }

      case 'STRUCTURAL_EMPTY_FIELD':
      case 'STRUCTURAL_EMPTY_ARRAY':
      case 'STRUCTURAL_EMPTY_STRING': {
        if (data === null || data === undefined || typeof data !== 'object') {
          return {
            repaired: false,
            data,
            logs: [createLog(error, 'failed', data)],
          };
        }
        const record = data as Record<string, unknown>;
        const field = error.path;
        const defaultValue = getDefaultForKey(field);
        const patched = { ...record, [field]: defaultValue };
        return {
          repaired: true,
          data: patched,
          logs: [createLog(error, 'repaired', record[field], defaultValue)],
        };
      }

      default:
        return {
          repaired: false,
          data,
          logs: [createLog(error, 'failed', data)],
        };
    }
  },
};
