export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface FileMetric {
  name: string;
  size: number;
  type: string;
  lastModified: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'Backlog' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  category: string;
  createdAt: string;
}

export interface BridgeStatus {
  connected: boolean;
  lastSync: string | null;
  agentVersion: string | null;
  hostname: string | null;
  os: string | null;
  cpuModel: string | null;
}

export interface AppForgeProject {
  projectName: string;
  activeBranch: string;
  commitHistory: Commit[];
  fileMetrics: FileMetric[];
  backlog: ProjectTask[];
  stats: {
    totalFiles: number;
    linesOfCode: number;
    issuesSolved: number;
    testsPassingPercentage: number;
  };
  bridge: BridgeStatus;
}

// ==========================================
// AI Blueprint Generation Interfaces
// ==========================================

export interface AppIntent {
  appName: string;
  appType: string;
  targetUsers?: string[];
  features: string[];
  entities: string[];
  authRequired?: boolean;
  integrations?: string[];
  integrations_requested?: string[];
  assumptions: string[];
  missingInfo?: string[];
  warnings?: string[];
}

export interface DataField {
  name: string;
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'json';
  nullable: boolean;
  primary: boolean;
  unique: boolean;
}

export interface DataRelation {
  field: string;
  targetEntity: string;
  type: 'one-to-many' | 'one-to-one' | 'many-to-one' | 'many-to-many';
}

export interface DataEntity {
  name: string;
  tableName: string;
  tenantId: string; // The specific field name for multi-tenancy, e.g. "tenantId"
  fields: DataField[];
  relations: DataRelation[];
}

export interface DataSchema {
  entities: DataEntity[];
  relations?: unknown[];
  indexes?: unknown[];
  crudRequirements?: string[];
}

export interface AppPage {
  name: string;
  route?: string;
  path: string;
  layout: string;
  components: string[];
  apiEndpoints: string[]; // Reference to paths from apiEndpoints list
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  boundEntity: string; // Must refer to a valid DataEntity name
  authRequired: boolean;
  rateLimit: number; // requests/min
  authRoles: string[];
  permissions: string[];
}

export interface IntegrationHook {
  name: string;
  integration: 'Slack' | 'WhatsApp' | 'Gmail' | 'Stripe' | 'Google Sheets' | 'Jira' | 'Webhook';
  trigger: string;
  action: string;
}

export interface WorkflowStub {
  name: string;
  entity: string; // References a valid entity name
  steps: string[];
}

export interface AppSpec {
  pages: AppPage[];
  apiEndpoints?: ApiEndpoint[];
  apiRoutes?: unknown[];
  databaseTables?: string[];
  authFlow?: unknown;
  navigationFlow?: unknown[];
  integrationHooks: IntegrationHook[];
  workflowStubs: WorkflowStub[];
}

export interface ValidationErrorDetail {
  path: string;
  message: string;
}

export interface GenerationValidation {
  valid: boolean;
  errors: ValidationErrorDetail[];
}

export interface RepairLogEntry {
  strategy: 'structural_repair' | 'field_repair' | 'consistency_repair';
  errorInput: string;
  outcome: string;
  timestamp: string;
}

export interface PipelineStageEvent {
  stage: string;
  status: 'processing' | 'completed' | 'failed';
  latencyMs: number;
}

export interface CostBreakdown {
  promptTokens: number;
  completionTokens: number;
  estimatedCostUSD: number;
}

export interface GenerationJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  mode: 'demo' | 'ai';
  prompt: string;
  appIntent?: AppIntent;
  dataSchema?: DataSchema;
  appSpec?: AppSpec;
  validation?: GenerationValidation;
  repairLog: RepairLogEntry[];
  events: PipelineStageEvent[];
  costBreakdown: CostBreakdown;
  latencyMs: number;
  providerUsed: string;
  createdAt: string;
}

export interface IntegrationRegistryEntry {
  id: string;
  name: string;
  status: 'active' | 'configured' | 'available';
  description: string;
  capabilities: string[];
  authType: string;
  triggers: string[];
  actions: string[];
}
