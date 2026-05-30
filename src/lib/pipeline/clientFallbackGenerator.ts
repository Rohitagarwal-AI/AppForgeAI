import type { AppIntentContract } from '../schemas/appIntent.schema.js';
import type { AppSpecContract } from '../schemas/appSpec.schema.js';
import type { DataSchemaContract } from '../schemas/dataSchema.schema.js';
import { GeneratedProjectFile, generateProjectFiles } from './codeGenerator.js';
import { extractIntent, GenerationInput } from './intentExtractor.js';
import { repairPipelineOutput } from './repairEngine.js';
import { generateAppSpec } from './appSpecGenerator.js';
import { generateDataSchema } from './schemaGenerator.js';
import { ValidationReport, validatePipelineOutput } from './validator.js';

const FALLBACK_STAGES = [
  'Understanding Prompt',
  'Planning App Architecture',
  'Designing Database Schema',
  'Generating Frontend',
  'Generating Backend',
  'Creating API Routes',
  'Adding Authentication',
  'Creating UI Polish',
  'Building Deployment Files',
  'Final Review',
  'Preview Ready',
] as const;

export interface ClientFallbackGenerationResult {
  jobId: string;
  status: 'completed';
  prompt: string;
  appIntent: AppIntentContract;
  dataSchema: DataSchemaContract;
  appSpec: AppSpecContract;
  validation: ValidationReport;
  repairLog: string[];
  activityLogs: string[];
  files: Record<string, GeneratedProjectFile>;
  summary: {
    appName: string;
    appType: string;
    techStack: string[];
    generatedFilesCount: number;
    providerUsed: string;
  };
  events: { stage: string; status: 'completed'; latencyMs: number }[];
  providerUsed: string;
  createdAt: string;
}

export async function runClientFallbackGeneration(input: GenerationInput): Promise<ClientFallbackGenerationResult> {
  const startedAt = Date.now();
  const techStack = normalizeTechStack(input.techStack);
  const activityLogs: string[] = [];
  const stamp = (message: string) => activityLogs.push(`[${new Date().toISOString()}] ${message}`);

  stamp('Fallback generator started: local deterministic AppForgeAI pipeline active');
  const rawIntent = extractIntent(input);
  stamp('Understanding prompt: extracted app intent from the submitted description');
  const rawSchema = generateDataSchema(rawIntent);
  stamp('Designing database schema: generated relational entities, fields, relations, and CRUD requirements');
  const rawSpec = generateAppSpec(rawIntent, rawSchema);
  stamp('Planning app architecture: generated pages, routes, API routes, auth flow, and navigation');

  const repair = repairPipelineOutput(rawIntent, rawSchema, rawSpec);
  const validation = validatePipelineOutput(repair.appIntent, repair.dataSchema, repair.appSpec, repair.repairLog.length);
  const files = generateProjectFiles(repair.appIntent, repair.dataSchema, repair.appSpec, techStack);

  stamp(`Generating frontend/backend/database/API files: produced ${Object.keys(files).length} source artifacts`);
  stamp('Final review: local validation finished and fallback demo output is ready');

  return {
    jobId: createFallbackJobId(),
    status: 'completed',
    prompt: input.prompt,
    appIntent: repair.appIntent,
    dataSchema: repair.dataSchema,
    appSpec: repair.appSpec,
    validation,
    repairLog: repair.repairLog.length ? repair.repairLog : ['No blocking repairs required -> fallback defaults preserved'],
    activityLogs,
    files,
    summary: {
      appName: repair.appIntent.appName,
      appType: repair.appIntent.appType,
      techStack,
      generatedFilesCount: Object.keys(files).length,
      providerUsed: 'local-demo-fallback',
    },
    events: FALLBACK_STAGES.map((stage, index) => ({
      stage,
      status: 'completed',
      latencyMs: Math.max(100, Math.round((Date.now() - startedAt) / FALLBACK_STAGES.length) + index * 8),
    })),
    providerUsed: 'local-demo-fallback',
    createdAt: new Date().toISOString(),
  };
}

function normalizeTechStack(techStack: GenerationInput['techStack']) {
  if (Array.isArray(techStack) && techStack.length) return techStack;
  if (typeof techStack === 'string' && techStack.trim()) {
    return techStack.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return ['React', 'Node.js', 'Express', 'PostgreSQL'];
}

function createFallbackJobId() {
  return `job_demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
