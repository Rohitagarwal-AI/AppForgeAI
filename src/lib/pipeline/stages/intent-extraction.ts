/**
 * @module lib/pipeline/stages/intent-extraction
 * @description Stage 1 — Intent Extraction.
 * Takes a raw user prompt and produces a structured {@link AppIntent} by
 * asking the AI to classify the app type, extract features / entities /
 * integrations, detect ambiguity, and flag conflicts.
 */

import type { AppIntent } from '@/types/intent';
import type { AICompletionRequest, AICompletionResponse } from '@/lib/gateway/types';
import { getAppTypeSlugs } from '@/lib/catalog/app-types';
import { INTEGRATION_KEYWORDS } from '@/lib/catalog/prompt-keywords';

/** Valid integration IDs derived from the keyword catalog. */
const VALID_INTEGRATION_IDS: readonly string[] = Object.keys(INTEGRATION_KEYWORDS);

/**
 * Build the system prompt that instructs the AI how to extract intent.
 *
 * @returns The full system-prompt string.
 */
function buildSystemPrompt(): string {
  const appTypes = getAppTypeSlugs().join(', ');
  const integrationIds = VALID_INTEGRATION_IDS.join(', ');

  return `You are an expert application architect. Your task is to analyze a user's natural-language application description and extract a structured intent object.

## Rules

1. **appName** — Infer a concise, human-readable name for the application from the prompt. If none is obvious, generate a short descriptive name (e.g. "Sales Pipeline Tracker").

2. **appType** — Classify the application into EXACTLY ONE of the following types:
   ${appTypes}
   If the prompt does not clearly match any archetype, use "custom".

3. **features** — Extract a list of feature descriptions. Include features the user explicitly mentions AND features you can reasonably infer from the app type (e.g. a CRM implies "auth", "dashboard", "search"). Each feature should be a short descriptive string.

4. **entities** — Extract domain entity names the user mentions or implies. Use PascalCase singular form (e.g. "User", "Order", "Product"). Always include "User" as a minimum.

5. **integrationsRequested** — Identify any third-party integrations the user mentions or implies. Use ONLY IDs from this list:
   ${integrationIds}
   If the user mentions "email notifications", map to "gmail". If they mention "payments", map to "stripe". Return an empty array if none are detected.

6. **assumptions** — List any assumptions you made when the prompt was under-specified. For example: "Assumed JWT-based authentication since no auth strategy was specified."

7. **clarificationRequired** — Set to true ONLY when the prompt is extremely vague (e.g. "An app", "Build me a tool", "A platform") and you cannot confidently determine the app type or any features. For most prompts with at least one domain hint, set to false.

8. **clarificationQuestion** — If clarificationRequired is true, provide a single clear question to ask the user. Otherwise omit this field.

9. **ambiguityScore** — An integer from 0 to 10:
   - 0 = perfectly clear, detailed prompt
   - 1-3 = minor gaps, easily inferred
   - 4-6 = moderate ambiguity, several assumptions needed
   - 7-9 = highly ambiguous, many assumptions
   - 10 = essentially no useful information

10. **conflicts** — Detect contradictory requirements. Examples:
    - "no login" combined with "admin dashboard"
    - "free only" combined with "premium subscriptions"
    - "offline only" combined with "real-time sync"
    Return an empty array if no conflicts are found.

## Output Format

Return ONLY valid JSON matching this exact shape (no markdown fences, no commentary):

{
  "appName": "string",
  "appType": "string",
  "features": ["string"],
  "entities": ["string"],
  "integrationsRequested": ["string"],
  "assumptions": ["string"],
  "clarificationRequired": false,
  "clarificationQuestion": "string | omit",
  "ambiguityScore": 0,
  "conflicts": ["string"]
}`;
}

/**
 * Extracts structured {@link AppIntent} from a raw user prompt.
 *
 * @param prompt - The user's natural-language application description.
 * @param completeAI - Gateway function to call the AI provider.
 * @returns A fully populated {@link AppIntent} object.
 * @throws {Error} If the AI response cannot be parsed as valid JSON or
 *   does not conform to the expected shape.
 */
export async function extractIntent(
  prompt: string,
  completeAI: (request: AICompletionRequest) => Promise<AICompletionResponse>
): Promise<AppIntent> {
  const systemPrompt = buildSystemPrompt();

  const request: AICompletionRequest = {
    systemPrompt,
    userPrompt: `Analyze the following user prompt and extract the structured intent:\n\n"${prompt}"`,
    temperature: 0.2,
    maxTokens: 2048,
    responseFormat: 'json',
  };

  const response = await completeAI(request);

  const rawContent = response.content.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(
      `Intent extraction failed: AI response is not valid JSON. Raw content: ${rawContent.slice(0, 500)}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Intent extraction failed: AI response is not a JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  const intent: AppIntent = {
    appName: typeof obj['appName'] === 'string' ? obj['appName'] : 'Untitled App',
    appType: validateAppType(obj['appType']),
    features: asStringArray(obj['features']),
    entities: asStringArray(obj['entities']),
    integrationsRequested: asStringArray(obj['integrationsRequested']),
    assumptions: asStringArray(obj['assumptions']),
    clarificationRequired: typeof obj['clarificationRequired'] === 'boolean' ? obj['clarificationRequired'] : false,
    clarificationQuestion: typeof obj['clarificationQuestion'] === 'string' ? obj['clarificationQuestion'] : undefined,
    ambiguityScore: typeof obj['ambiguityScore'] === 'number' ? Math.min(10, Math.max(0, Math.round(obj['ambiguityScore']))) : 5,
    conflicts: asStringArray(obj['conflicts']),
  };

  return intent;
}

/**
 * Validates the appType against known slugs; falls back to "custom".
 */
function validateAppType(value: unknown): AppIntent['appType'] {
  const validTypes = getAppTypeSlugs();
  if (typeof value === 'string' && validTypes.includes(value)) {
    return value as AppIntent['appType'];
  }
  return 'custom';
}

/**
 * Coerces an unknown value to a string array, filtering out non-strings.
 */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}
