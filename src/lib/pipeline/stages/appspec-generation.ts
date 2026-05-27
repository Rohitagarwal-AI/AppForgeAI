/**
 * @module lib/pipeline/stages/appspec-generation
 * @description Stage 3 — AppSpec Generation.
 * Combines {@link AppIntent} and {@link DataSchema} to produce a
 * comprehensive {@link AppSpec} covering pages, API endpoints,
 * auth rules, integration hooks, and workflow stubs.
 */

import type { AppIntent } from '@/types/intent';
import type { DataSchema } from '@/types/schema';
import type { AppSpec } from '@/types/appspec';
import type { AICompletionRequest, AICompletionResponse } from '@/lib/gateway/types';
import { INTEGRATION_KEYWORDS } from '@/lib/catalog/prompt-keywords';
import { getIntegrationRegistry } from '@/lib/integrations/registry';

/** Valid integration IDs derived from the keyword catalog. */
const VALID_INTEGRATION_IDS: readonly string[] = Object.keys(INTEGRATION_KEYWORDS);

/**
 * Builds the system prompt that instructs the AI how to generate the full AppSpec.
 *
 * @returns The complete system-prompt string.
 */
function buildSystemPrompt(): string {
  const integrationIds = VALID_INTEGRATION_IDS.join(', ');
  const integrationContracts = getIntegrationRegistry()
    .map(
      (integration) =>
        `- ${integration.id}: triggers=[${integration.triggers.map((trigger) => trigger.id).join(', ')}], actions=[${integration.actions.map((action) => action.id).join(', ')}]`,
    )
    .join('\n');

  return `You are an expert full-stack application architect. Your task is to generate a complete application specification (AppSpec) based on the provided intent and data schema.

## Pages

Generate an array of pages. Each page represents a routable screen in the application.

Rules:
- Every entity with user-facing CRUD should have at least a list page and a detail/form page.
- Include a Dashboard page as the first page (route: "/", layout: "dashboard").
- Include a Settings page (route: "/settings", layout: "settings").
- Each page must have:
  - name: Human-readable page name (e.g. "Orders List", "Order Detail")
  - route: URL path (e.g. "/orders", "/orders/:id"). Use kebab-case for multi-word routes.
  - layout: One of "list", "detail", "dashboard", "settings", "form"
  - boundEntity: The primary entity this page operates on (optional for dashboard/settings)
  - components: Array of component objects, each with:
    - id: Unique identifier (e.g. "orders-table", "order-form")
    - type: One of "table", "form", "chart", "card", "stats", "filter"
    - boundEntity: Entity bound to this component (optional)
    - config: Optional configuration object

## API Endpoints

Generate an array of REST API endpoints. Each endpoint represents a backend route.

Rules:
- For every entity, generate at minimum: GET (list), GET (by id), POST (create), PUT (update), DELETE (delete).
- All paths should start with "/api/" (e.g. "/api/orders", "/api/orders/:id").
- Each endpoint must have:
  - path: URL path template
  - method: One of "GET", "POST", "PUT", "PATCH", "DELETE"
  - handlerDescription: A natural-language description of the handler logic
  - boundEntity: The entity this endpoint operates on
  - authRequired: Boolean (true for most endpoints, false only for public ones)
  - rateLimitFlag: Boolean (true for write operations and public endpoints)

## Auth Rules

Generate authentication and authorization configuration.

Rules:
- strategy: One of "jwt", "session", "api_key". Prefer "jwt" unless the intent suggests otherwise.
- roles: Array of role objects, each with:
  - role: Role name (e.g. "admin", "manager", "user")
  - permissions: Array of permission strings: "read", "write", "delete"
  - allowedEntities: Array of entity names this role can access. Admin can access all.
- defaultRole: The role assigned to new users (usually "user" or the least-privileged role).

## Integration Hooks

Generate integration hooks ONLY for integrations that match the intent's integrationsRequested.

Valid integration IDs: ${integrationIds}

Valid integration contracts:
${integrationContracts}

Rules:
- Each hook must have:
  - integrationId: Must be from the valid list above
  - trigger: Must be a valid trigger ID for that integration (e.g. "record_created", "status_changed")
  - action: Must be a valid action ID for that integration (e.g. "send_email", "send_channel_message")
  - config: Optional configuration object
- Only include hooks for integrations explicitly requested or strongly implied by the intent.

## Workflow Stubs

Generate workflow stubs for automation patterns detected in the intent.

Rules:
- Look for patterns like: "send notification when X", "update Y when Z changes", "generate report daily".
- Each stub must have:
  - id: Unique kebab-case identifier (e.g. "order-confirmation-email")
  - name: Human-readable name
  - description: What the workflow does
  - trigger: Object with "entity" (must exist in the schema) and "event" (e.g. "created", "updated", "deleted", "status_changed")
  - actions: Array of action objects, each with "type" (e.g. "send_email", "update_field", "call_webhook") and "config" (object with relevant parameters)

## General Rules

- Every page that displays data must have a corresponding API endpoint.
- Workflow trigger entities must exist in the data schema.
- Integration IDs must be from the valid list.
- Do NOT include metadata — that is generated by the pipeline, not the AI.
- Do NOT include dataSchema — it will be attached by the pipeline.

## Output Format

Return ONLY valid JSON matching this exact shape (no markdown fences, no commentary):

{
  "appName": "string",
  "appType": "string",
  "pages": [...],
  "apiEndpoints": [...],
  "authRules": {
    "strategy": "jwt",
    "roles": [...],
    "defaultRole": "string"
  },
  "integrationHooks": [...],
  "workflowStubs": [...]
}`;
}

/**
 * Generates a full {@link AppSpec} from {@link AppIntent} and {@link DataSchema}.
 *
 * @param intent - The structured application intent from Stage 1.
 * @param dataSchema - The data schema from Stage 2.
 * @param completeAI - Gateway function to call the AI provider.
 * @returns A fully populated {@link AppSpec} (metadata is left empty for the orchestrator to fill).
 * @throws {Error} If the AI response cannot be parsed or does not conform.
 */
export async function generateAppSpec(
  intent: AppIntent,
  dataSchema: DataSchema,
  completeAI: (request: AICompletionRequest) => Promise<AICompletionResponse>
): Promise<AppSpec> {
  const systemPrompt = buildSystemPrompt();

  const entitySummary = dataSchema.entities
    .map((e) => {
      const fieldNames = e.fields.map((f) => f.name).join(', ');
      const relationSummary = e.relations
        .map((r) => `${r.type} → ${r.targetEntity}`)
        .join(', ');
      return `  - ${e.name} (table: ${e.tableName}): fields=[${fieldNames}]${relationSummary ? `, relations=[${relationSummary}]` : ''}`;
    })
    .join('\n');

  const userPrompt = `Generate a complete AppSpec for the following application:

## Application Intent
- App Name: ${intent.appName}
- App Type: ${intent.appType}
- Features: ${intent.features.join(', ') || 'none specified'}
- Entities: ${intent.entities.join(', ') || 'none specified'}
- Integrations Requested: ${intent.integrationsRequested.join(', ') || 'none'}
- Assumptions: ${intent.assumptions.join('; ') || 'none'}
- Conflicts: ${intent.conflicts.join('; ') || 'none'}

## Data Schema (from Stage 2)
Entities:
${entitySummary}

Generate pages, API endpoints, auth rules, integration hooks, and workflow stubs based on the intent and schema above.`;

  const request: AICompletionRequest = {
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 8192,
    responseFormat: 'json',
  };

  const response = await completeAI(request);
  const rawContent = response.content.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(
      `AppSpec generation failed: AI response is not valid JSON. Raw content: ${rawContent.slice(0, 500)}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AppSpec generation failed: AI response is not a JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  const appSpec: AppSpec = {
    appName: typeof obj['appName'] === 'string' ? obj['appName'] : intent.appName,
    appType: typeof obj['appType'] === 'string' ? obj['appType'] : intent.appType,
    pages: parsePages(obj['pages']),
    apiEndpoints: parseApiEndpoints(obj['apiEndpoints']),
    authRules: parseAuthRules(obj['authRules']),
    integrationHooks: parseIntegrationHooks(obj['integrationHooks']),
    workflowStubs: parseWorkflowStubs(obj['workflowStubs']),
    dataSchema,
    metadata: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: '1.0.0',
      totalLatencyMs: 0,
      totalCostUsd: 0,
      providerUsage: [],
    },
  };

  return appSpec;
}

/* ------------------------------------------------------------------ */
/*  Parse helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Parses the raw pages array from the AI response.
 */
function parsePages(raw: unknown): AppSpec['pages'] {
  if (!Array.isArray(raw)) return [];

  return raw.map((p: unknown) => {
    const page = p as Record<string, unknown>;
    return {
      name: typeof page['name'] === 'string' ? page['name'] : 'Untitled Page',
      route: typeof page['route'] === 'string' ? page['route'] : '/',
      layout: validatePageLayout(page['layout']),
      boundEntity: typeof page['boundEntity'] === 'string' ? page['boundEntity'] : undefined,
      components: parseComponents(page['components']),
    };
  });
}

/**
 * Validates a page layout value against allowed types.
 */
function validatePageLayout(value: unknown): AppSpec['pages'][number]['layout'] {
  const validLayouts = new Set(['list', 'detail', 'dashboard', 'settings', 'form']);
  if (typeof value === 'string' && validLayouts.has(value)) {
    return value as AppSpec['pages'][number]['layout'];
  }
  return 'list';
}

/**
 * Parses the components array for a page.
 */
function parseComponents(raw: unknown): AppSpec['pages'][number]['components'] {
  if (!Array.isArray(raw)) return [];

  return raw.map((c: unknown) => {
    const comp = c as Record<string, unknown>;
    const validTypes = new Set(['table', 'form', 'chart', 'card', 'stats', 'filter']);
    const rawType = typeof comp['type'] === 'string' ? comp['type'] : 'card';
    const componentType = validTypes.has(rawType)
      ? (rawType as AppSpec['pages'][number]['components'][number]['type'])
      : 'card';

    return {
      id: typeof comp['id'] === 'string' ? comp['id'] : `comp-${Math.random().toString(36).slice(2, 8)}`,
      type: componentType,
      boundEntity: typeof comp['boundEntity'] === 'string' ? comp['boundEntity'] : undefined,
      config: typeof comp['config'] === 'object' && comp['config'] !== null
        ? (comp['config'] as Record<string, unknown>)
        : undefined,
    };
  });
}

/**
 * Parses the API endpoints array from the AI response.
 */
function parseApiEndpoints(raw: unknown): AppSpec['apiEndpoints'] {
  if (!Array.isArray(raw)) return [];

  return raw.map((ep: unknown) => {
    const endpoint = ep as Record<string, unknown>;
    const validMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    const rawMethod = typeof endpoint['method'] === 'string' ? endpoint['method'].toUpperCase() : 'GET';
    const method = validMethods.has(rawMethod)
      ? (rawMethod as AppSpec['apiEndpoints'][number]['method'])
      : 'GET';

    return {
      path: typeof endpoint['path'] === 'string' ? endpoint['path'] : '/api/unknown',
      method,
      handlerDescription: typeof endpoint['handlerDescription'] === 'string'
        ? endpoint['handlerDescription']
        : 'No description provided',
      boundEntity: typeof endpoint['boundEntity'] === 'string' ? endpoint['boundEntity'] : 'Unknown',
      authRequired: typeof endpoint['authRequired'] === 'boolean' ? endpoint['authRequired'] : true,
      rateLimitFlag: typeof endpoint['rateLimitFlag'] === 'boolean' ? endpoint['rateLimitFlag'] : false,
      requestSchema: parseRecordStringString(endpoint['requestSchema']),
      responseSchema: parseRecordStringString(endpoint['responseSchema']),
    };
  });
}

/**
 * Parses a Record<string, string> from unknown, used for request/response schemas.
 */
function parseRecordStringString(raw: unknown): Record<string, string> | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    result[key] = String(value);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Parses auth rules from the AI response.
 */
function parseAuthRules(raw: unknown): AppSpec['authRules'] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { strategy: 'jwt', roles: [], defaultRole: 'user' };
  }

  const obj = raw as Record<string, unknown>;
  const validStrategies = new Set(['jwt', 'session', 'api_key']);
  const rawStrategy = typeof obj['strategy'] === 'string' ? obj['strategy'] : 'jwt';
  const strategy = validStrategies.has(rawStrategy)
    ? (rawStrategy as AppSpec['authRules']['strategy'])
    : 'jwt';

  const roles: AppSpec['authRules']['roles'] = Array.isArray(obj['roles'])
    ? (obj['roles'] as Record<string, unknown>[]).map((r) => {
        const validPermissions = new Set(['read', 'write', 'delete']);
        const rawPerms = Array.isArray(r['permissions']) ? r['permissions'] : [];
        const permissions = rawPerms
          .filter((p): p is string => typeof p === 'string' && validPermissions.has(p))
          .map((p) => p as AppSpec['authRules']['roles'][number]['permissions'][number]);

        return {
          role: typeof r['role'] === 'string' ? r['role'] : 'user',
          permissions,
          allowedEntities: Array.isArray(r['allowedEntities'])
            ? (r['allowedEntities'] as unknown[]).filter((e): e is string => typeof e === 'string')
            : [],
        };
      })
    : [];

  return {
    strategy,
    roles,
    defaultRole: typeof obj['defaultRole'] === 'string' ? obj['defaultRole'] : 'user',
  };
}

/**
 * Parses integration hooks from the AI response.
 */
function parseIntegrationHooks(raw: unknown): AppSpec['integrationHooks'] {
  if (!Array.isArray(raw)) return [];

  const validIds = new Set(VALID_INTEGRATION_IDS);

  return raw
    .map((h: unknown) => {
      const hook = h as Record<string, unknown>;
      const integrationId = typeof hook['integrationId'] === 'string' ? hook['integrationId'] : '';

      // Only include hooks with valid integration IDs
      if (!validIds.has(integrationId)) return null;

      return {
        integrationId,
        trigger: typeof hook['trigger'] === 'string' ? hook['trigger'] : 'unknown',
        action: typeof hook['action'] === 'string' ? hook['action'] : 'unknown',
        config: typeof hook['config'] === 'object' && hook['config'] !== null && !Array.isArray(hook['config'])
          ? (hook['config'] as Record<string, unknown>)
          : undefined,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);
}

/**
 * Parses workflow stubs from the AI response.
 */
function parseWorkflowStubs(raw: unknown): AppSpec['workflowStubs'] {
  if (!Array.isArray(raw)) return [];

  return raw.map((w: unknown) => {
    const wf = w as Record<string, unknown>;
    const trigger = typeof wf['trigger'] === 'object' && wf['trigger'] !== null && !Array.isArray(wf['trigger'])
      ? (wf['trigger'] as Record<string, unknown>)
      : {};

    const actions = Array.isArray(wf['actions'])
      ? (wf['actions'] as Record<string, unknown>[]).map((a) => ({
          type: typeof a['type'] === 'string' ? a['type'] : 'unknown',
          config: typeof a['config'] === 'object' && a['config'] !== null && !Array.isArray(a['config'])
            ? (a['config'] as Record<string, unknown>)
            : {},
        }))
      : [];

    return {
      id: typeof wf['id'] === 'string' ? wf['id'] : `workflow-${Math.random().toString(36).slice(2, 8)}`,
      name: typeof wf['name'] === 'string' ? wf['name'] : 'Untitled Workflow',
      description: typeof wf['description'] === 'string' ? wf['description'] : '',
      trigger: {
        entity: typeof trigger['entity'] === 'string' ? trigger['entity'] : 'Unknown',
        event: typeof trigger['event'] === 'string' ? trigger['event'] : 'created',
      },
      actions,
    };
  });
}
