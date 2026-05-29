import { appSpecSchema, AppSpecContract } from '../schemas/appSpec.schema.js';
import { dataSchemaSchema, DataSchemaContract } from '../schemas/dataSchema.schema.js';
import { appIntentSchema, AppIntentContract } from '../schemas/appIntent.schema.js';

export interface ReliabilityCheck {
  label: string;
  status: 'passed' | 'warning' | 'failed';
  detail: string;
}

export interface ValidationReport {
  overallStatus: 'passed' | 'warning' | 'failed';
  checks: ReliabilityCheck[];
  warnings: string[];
  repairAttempts: number;
}

export function validatePipelineOutput(
  appIntent: unknown,
  dataSchema: unknown,
  appSpec: unknown,
  repairAttempts = 0,
): ValidationReport {
  const checks: ReliabilityCheck[] = [];

  checks.push(schemaCheck('AppIntent validation', appIntentSchema.safeParse(appIntent)));
  checks.push(schemaCheck('DataSchema validation', dataSchemaSchema.safeParse(dataSchema)));
  checks.push(schemaCheck('AppSpec validation', appSpecSchema.safeParse(appSpec)));

  const intent = appIntent as AppIntentContract;
  const schema = dataSchema as DataSchemaContract;
  const spec = appSpec as AppSpecContract;
  const entityNames = new Set(schema.entities?.map((entity) => entity.name) || []);
  const pageRoutes = new Set(spec.pages?.map((page) => page.route) || []);

  checks.push({
    label: 'Route consistency',
    status: spec.pages?.every((page) => page.route.startsWith('/')) ? 'passed' : 'failed',
    detail: 'Every generated page has a normalized application route.',
  });

  checks.push({
    label: 'Entity completeness',
    status: schema.entities?.every((entity) => entity.fields.some((field) => field.name === 'id') && entity.fields.length > 1) ? 'passed' : 'failed',
    detail: 'Every entity includes an id field and at least one business field.',
  });

  checks.push({
    label: 'API-to-entity mapping',
    status: spec.apiRoutes?.every((route) => entityNames.has(route.entity)) ? 'passed' : 'failed',
    detail: 'REST endpoints are bound only to generated DataSchema entities.',
  });

  checks.push({
    label: 'Page-to-route mapping',
    status: pageRoutes.has('/dashboard') && pageRoutes.has('/settings') ? 'passed' : 'warning',
    detail: 'Core workspace pages are routable from the generated navigation flow.',
  });

  checks.push({
    label: 'Preview readiness',
    status: intent.appName && spec.pages?.length && schema.entities?.length ? 'passed' : 'failed',
    detail: 'Preview can render from AppIntent, pages, entities, and API structure.',
  });

  const warnings = [...(intent.warnings || []), ...(intent.missingInfo || [])];
  const hasFailure = checks.some((check) => check.status === 'failed');
  const hasWarning = checks.some((check) => check.status === 'warning') || warnings.length > 0;

  return {
    overallStatus: hasFailure ? 'failed' : hasWarning ? 'warning' : 'passed',
    checks,
    warnings,
    repairAttempts,
  };
}

function schemaCheck(label: string, result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): ReliabilityCheck {
  if (result.success) {
    return { label, status: 'passed', detail: 'Zod contract accepted the generated object.' };
  }
  return {
    label,
    status: 'failed',
    detail: result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') || 'Schema validation failed.',
  };
}
