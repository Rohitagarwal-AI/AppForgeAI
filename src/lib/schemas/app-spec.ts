/**
 * @module lib/schemas/app-spec
 * @description Zod validation schema for Stage 3 — Full AppSpec Generation.
 * Mirrors the AppSpec and all nested interfaces from @/types/appspec.
 */

import { z } from 'zod';
import { dataSchemaSchema } from '@/lib/schemas/data-schema';

// ---------------------------------------------------------------------------
// Enums / Unions
// ---------------------------------------------------------------------------

/** Zod schema for PageLayout. */
export const pageLayoutSchema = z.union([
  z.literal('list'),
  z.literal('detail'),
  z.literal('dashboard'),
  z.literal('settings'),
  z.literal('form'),
]);

/** Zod schema for ComponentType. */
export const componentTypeSchema = z.union([
  z.literal('table'),
  z.literal('form'),
  z.literal('chart'),
  z.literal('card'),
  z.literal('stats'),
  z.literal('filter'),
]);

/** Zod schema for HttpMethod. */
export const httpMethodSchema = z.union([
  z.literal('GET'),
  z.literal('POST'),
  z.literal('PUT'),
  z.literal('PATCH'),
  z.literal('DELETE'),
]);

/** Zod schema for Permission. */
export const permissionSchema = z.union([
  z.literal('read'),
  z.literal('write'),
  z.literal('delete'),
]);

// ---------------------------------------------------------------------------
// Page & Component
// ---------------------------------------------------------------------------

/** Zod schema for PageComponent. */
export const pageComponentSchema = z.object({
  /** Unique identifier for this component instance. */
  id: z.string().min(1, 'Component ID must not be empty'),

  /** The kind of UI component. */
  type: componentTypeSchema,

  /** Optional entity this component is bound to for data display. */
  boundEntity: z.string().optional(),

  /** Arbitrary configuration for the component renderer. */
  config: z.record(z.string(), z.unknown()).optional(),
});

/** Zod schema for Page. */
export const pageSchema = z.object({
  /** Human-readable page name. */
  name: z.string().min(1, 'Page name must not be empty'),

  /** URL route path (e.g. "/orders", "/orders/:id"). */
  route: z.string().min(1, 'Route must not be empty'),

  /** Layout strategy applied to this page. */
  layout: pageLayoutSchema,

  /** Primary entity this page operates on. */
  boundEntity: z.string().optional(),

  /** Ordered list of components rendered on this page. */
  components: z.array(pageComponentSchema),
});

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Zod schema for ApiEndpoint. */
export const apiEndpointSchema = z.object({
  /** URL path template (e.g. "/api/orders/:id"). */
  path: z.string().min(1, 'API path must not be empty'),

  /** HTTP method. */
  method: httpMethodSchema,

  /** Natural-language description of what the handler does. */
  handlerDescription: z.string().min(1, 'Handler description must not be empty'),

  /** Entity this endpoint is bound to. */
  boundEntity: z.string().min(1, 'Bound entity must not be empty'),

  /** Whether the endpoint requires authentication. */
  authRequired: z.boolean(),

  /** Whether rate limiting should be applied. */
  rateLimitFlag: z.boolean(),

  /** Optional request body schema (field name → type string). */
  requestSchema: z.record(z.string(), z.string()).optional(),

  /** Optional response body schema (field name → type string). */
  responseSchema: z.record(z.string(), z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Auth & Roles
// ---------------------------------------------------------------------------

/** Zod schema for RolePermission. */
export const rolePermissionSchema = z.object({
  /** Role name (e.g. "admin", "viewer"). */
  role: z.string().min(1, 'Role name must not be empty'),

  /** Permissions granted to this role. */
  permissions: z.array(permissionSchema).min(1, 'At least one permission is required'),

  /** Entities this role may access. */
  allowedEntities: z.array(z.string()),
});

/** Zod schema for AuthRules. */
export const authRulesSchema = z.object({
  /** Authentication strategy. */
  strategy: z.union([
    z.literal('jwt'),
    z.literal('session'),
    z.literal('api_key'),
  ]),

  /** Role definitions with their permissions. */
  roles: z.array(rolePermissionSchema).min(1, 'At least one role is required'),

  /** Default role assigned to new users. */
  defaultRole: z.string().min(1, 'Default role must not be empty'),
});

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

/** Zod schema for IntegrationHook. */
export const integrationHookSchema = z.object({
  /** Reference to the integration definition id. */
  integrationId: z.string().min(1, 'Integration ID must not be empty'),

  /** Event or condition that fires this hook. */
  trigger: z.string().min(1, 'Trigger must not be empty'),

  /** Action to perform when triggered. */
  action: z.string().min(1, 'Action must not be empty'),

  /** Optional runtime configuration for the hook. */
  config: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

/** Zod schema for WorkflowStub. */
export const workflowStubSchema = z.object({
  /** Unique workflow identifier. */
  id: z.string().min(1, 'Workflow ID must not be empty'),

  /** Human-readable workflow name. */
  name: z.string().min(1, 'Workflow name must not be empty'),

  /** Description of the workflow's purpose. */
  description: z.string().min(1, 'Workflow description must not be empty'),

  /** Event trigger specifying which entity and event fires this workflow. */
  trigger: z.object({
    entity: z.string().min(1, 'Trigger entity must not be empty'),
    event: z.string().min(1, 'Trigger event must not be empty'),
  }),

  /** Ordered sequence of actions to execute. */
  actions: z.array(
    z.object({
      type: z.string().min(1, 'Action type must not be empty'),
      config: z.record(z.string(), z.unknown()),
    })
  ),
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/** Zod schema for ProviderUsageEntry. */
export const providerUsageEntrySchema = z.object({
  /** Pipeline stage that made the call. */
  stage: z.string().min(1),

  /** AI provider name (e.g. "openai", "anthropic"). */
  provider: z.string().min(1),

  /** Model identifier (e.g. "gpt-4o", "claude-sonnet-4-20250514"). */
  model: z.string().min(1),

  /** Number of prompt tokens consumed. */
  promptTokens: z.number().int().nonnegative(),

  /** Number of completion tokens generated. */
  completionTokens: z.number().int().nonnegative(),

  /** Estimated cost in USD. */
  costUsd: z.number().nonnegative(),

  /** Wall-clock latency in milliseconds. */
  latencyMs: z.number().nonnegative(),
});

/** Zod schema for AppSpecMetadata. */
export const appSpecMetadataSchema = z.object({
  /** ISO-8601 timestamp of generation. */
  generatedAt: z.string().min(1),

  /** Semantic version of the pipeline that produced this spec. */
  pipelineVersion: z.string().min(1),

  /** Total end-to-end latency in milliseconds. */
  totalLatencyMs: z.number().nonnegative(),

  /** Total estimated cost in USD across all stages. */
  totalCostUsd: z.number().nonnegative(),

  /** Per-stage provider usage breakdown. */
  providerUsage: z.array(providerUsageEntrySchema),
});

// ---------------------------------------------------------------------------
// Root AppSpec
// ---------------------------------------------------------------------------

/**
 * Zod schema for AppSpec — the fully resolved, self-contained application
 * specification. This is the final output of Stage 3 and the primary input
 * to code generation.
 */
export const appSpecSchema = z.object({
  /** Application name. */
  appName: z.string().min(1, 'App name must not be empty'),

  /** Application type / archetype. */
  appType: z.string().min(1, 'App type must not be empty'),

  /** All pages in the application. */
  pages: z.array(pageSchema).min(1, 'At least one page is required'),

  /** All REST API endpoints. */
  apiEndpoints: z.array(apiEndpointSchema),

  /** Authentication and authorization rules. */
  authRules: authRulesSchema,

  /** Configured integration hooks. */
  integrationHooks: z.array(integrationHookSchema),

  /** Declarative workflow stubs. */
  workflowStubs: z.array(workflowStubSchema),

  /** Complete data schema (entities, fields, relations). */
  dataSchema: dataSchemaSchema,

  /** Pipeline run metadata. */
  metadata: appSpecMetadataSchema,
});

/** Inferred TypeScript types from the Zod schemas. */
export type ValidatedAppSpec = z.infer<typeof appSpecSchema>;
export type ValidatedPage = z.infer<typeof pageSchema>;
export type ValidatedPageComponent = z.infer<typeof pageComponentSchema>;
export type ValidatedApiEndpoint = z.infer<typeof apiEndpointSchema>;
export type ValidatedAuthRules = z.infer<typeof authRulesSchema>;
export type ValidatedRolePermission = z.infer<typeof rolePermissionSchema>;
export type ValidatedIntegrationHook = z.infer<typeof integrationHookSchema>;
export type ValidatedWorkflowStub = z.infer<typeof workflowStubSchema>;
export type ValidatedProviderUsageEntry = z.infer<typeof providerUsageEntrySchema>;
export type ValidatedAppSpecMetadata = z.infer<typeof appSpecMetadataSchema>;
