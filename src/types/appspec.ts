/**
 * @module types/appspec
 * @description Type definitions for Stage 3 — Full AppSpec Generation.
 * The AppSpec is the complete, self-contained specification that drives
 * code generation for pages, API endpoints, auth, integrations, and workflows.
 */

import type { DataSchema } from '@/types/schema';

// ---------------------------------------------------------------------------
// Enums / Unions
// ---------------------------------------------------------------------------

/** Layout strategy for a generated page. */
export type PageLayout = 'list' | 'detail' | 'dashboard' | 'settings' | 'form';

/** Component types available for page composition. */
export type ComponentType = 'table' | 'form' | 'chart' | 'card' | 'stats' | 'filter';

/** HTTP methods supported by API endpoint definitions. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Granular permission levels. */
export type Permission = 'read' | 'write' | 'delete';

// ---------------------------------------------------------------------------
// Page & Component
// ---------------------------------------------------------------------------

/**
 * PageComponent — a UI building block placed inside a Page.
 */
export interface PageComponent {
  /** Unique identifier for this component instance. */
  id: string;

  /** The kind of UI component. */
  type: ComponentType;

  /** Optional entity this component is bound to for data display. */
  boundEntity?: string;

  /** Arbitrary configuration for the component renderer. */
  config?: Record<string, unknown>;
}

/**
 * Page — a routable screen in the generated application.
 */
export interface Page {
  /** Human-readable page name. */
  name: string;

  /** URL route path (e.g. "/orders", "/orders/:id"). */
  route: string;

  /** Layout strategy applied to this page. */
  layout: PageLayout;

  /** Primary entity this page operates on. */
  boundEntity?: string;

  /** Ordered list of components rendered on this page. */
  components: PageComponent[];
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * ApiEndpoint — a single REST endpoint in the generated backend.
 */
export interface ApiEndpoint {
  /** URL path template (e.g. "/api/orders/:id"). */
  path: string;

  /** HTTP method. */
  method: HttpMethod;

  /** Natural-language description of what the handler does. */
  handlerDescription: string;

  /** Entity this endpoint is bound to. */
  boundEntity: string;

  /** Whether the endpoint requires authentication. */
  authRequired: boolean;

  /** Whether rate limiting should be applied. */
  rateLimitFlag: boolean;

  /** Optional request body schema (field name → type string). */
  requestSchema?: Record<string, string>;

  /** Optional response body schema (field name → type string). */
  responseSchema?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Auth & Roles
// ---------------------------------------------------------------------------

/**
 * RolePermission — maps a role to its allowed permissions and entities.
 */
export interface RolePermission {
  /** Role name (e.g. "admin", "viewer"). */
  role: string;

  /** Permissions granted to this role. */
  permissions: Permission[];

  /** Entities this role may access. */
  allowedEntities: string[];
}

/**
 * AuthRules — authentication and authorization configuration.
 */
export interface AuthRules {
  /** Authentication strategy. */
  strategy: 'jwt' | 'session' | 'api_key';

  /** Role definitions with their permissions. */
  roles: RolePermission[];

  /** Default role assigned to new users. */
  defaultRole: string;
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

/**
 * IntegrationHook — a configured instance of an integration within the app.
 */
export interface IntegrationHook {
  /** Reference to the integration definition id. */
  integrationId: string;

  /** Event or condition that fires this hook. */
  trigger: string;

  /** Action to perform when triggered. */
  action: string;

  /** Optional runtime configuration for the hook. */
  config?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

/**
 * WorkflowStub — a declarative automation stub for code generation.
 */
export interface WorkflowStub {
  /** Unique workflow identifier. */
  id: string;

  /** Human-readable workflow name. */
  name: string;

  /** Description of the workflow's purpose. */
  description: string;

  /** Event trigger specifying which entity and event fires this workflow. */
  trigger: { entity: string; event: string };

  /** Ordered sequence of actions to execute. */
  actions: { type: string; config: Record<string, unknown> }[];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/**
 * ProviderUsageEntry — telemetry for a single AI provider call.
 */
export interface ProviderUsageEntry {
  /** Pipeline stage that made the call. */
  stage: string;

  /** AI provider name (e.g. "openai", "anthropic"). */
  provider: string;

  /** Model identifier (e.g. "gpt-4o", "claude-sonnet-4-20250514"). */
  model: string;

  /** Number of prompt tokens consumed. */
  promptTokens: number;

  /** Number of completion tokens generated. */
  completionTokens: number;

  /** Estimated cost in USD. */
  costUsd: number;

  /** Wall-clock latency in milliseconds. */
  latencyMs: number;
}

/**
 * AppSpecMetadata — pipeline run metadata embedded in the AppSpec.
 */
export interface AppSpecMetadata {
  /** ISO-8601 timestamp of generation. */
  generatedAt: string;

  /** Semantic version of the pipeline that produced this spec. */
  pipelineVersion: string;

  /** Total end-to-end latency in milliseconds. */
  totalLatencyMs: number;

  /** Total estimated cost in USD across all stages. */
  totalCostUsd: number;

  /** Per-stage provider usage breakdown. */
  providerUsage: ProviderUsageEntry[];
}

// ---------------------------------------------------------------------------
// Root AppSpec
// ---------------------------------------------------------------------------

/**
 * AppSpec — the fully resolved, self-contained application specification.
 * This is the final output of Stage 3 and the primary input to code generation.
 */
export interface AppSpec {
  /** Application name. */
  appName: string;

  /** Application type / archetype. */
  appType: string;

  /** All pages in the application. */
  pages: Page[];

  /** All REST API endpoints. */
  apiEndpoints: ApiEndpoint[];

  /** Authentication and authorization rules. */
  authRules: AuthRules;

  /** Configured integration hooks. */
  integrationHooks: IntegrationHook[];

  /** Declarative workflow stubs. */
  workflowStubs: WorkflowStub[];

  /** Complete data schema (entities, fields, relations). */
  dataSchema: DataSchema;

  /** Pipeline run metadata. */
  metadata: AppSpecMetadata;
}
