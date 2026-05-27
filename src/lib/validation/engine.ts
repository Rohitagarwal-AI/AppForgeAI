/**
 * @module lib/validation/engine
 * @description Main validation engine orchestrator.
 * Provides stage-aware validation functions that aggregate errors from
 * all relevant rule modules and return structured ValidationResults.
 * Never throws — always returns structured results.
 */

import type { AppIntent } from '@/types/intent';
import type { DataSchema } from '@/types/schema';
import type { AppSpec } from '@/types/appspec';
import type { ValidationError } from '@/types/pipeline';
import type { ValidationResult } from '@/lib/validation/types';
import {
  appIntentSchema,
  appSpecSchema,
  dataSchemaSchema,
} from '@/lib/schemas';
import {
  validateRequiredFields,
  validateNonEmpty,
} from '@/lib/validation/rules/structural';
import { runAllSchemaValidations } from '@/lib/validation/rules/schema';
import { runAllApiConsistencyValidations } from '@/lib/validation/rules/api-consistency';
import { runAllAuthValidations } from '@/lib/validation/rules/auth-consistency';
import { runAllIntegrationValidations } from '@/lib/validation/rules/integration-validity';

/** Required top-level keys for an AppIntent object. */
const INTENT_REQUIRED_KEYS = [
  'appName',
  'appType',
  'features',
  'entities',
  'integrationsRequested',
  'assumptions',
  'clarificationRequired',
  'ambiguityScore',
  'conflicts',
] as const;

/** Required top-level keys for a DataSchema object. */
const SCHEMA_REQUIRED_KEYS = ['entities', 'version'] as const;

/** Required top-level keys for an AppSpec object. */
const APPSPEC_REQUIRED_KEYS = [
  'appName',
  'appType',
  'pages',
  'apiEndpoints',
  'authRules',
  'integrationHooks',
  'workflowStubs',
  'dataSchema',
  'metadata',
] as const;

/**
 * Build a ValidationResult from a flat list of validation errors.
 * Separates critical/blocking errors from warnings.
 *
 * @param allErrors - All validation errors collected from rule modules.
 * @returns A structured ValidationResult with valid flag, errors, and warnings.
 */
function buildResult(allErrors: ValidationError[]): ValidationResult {
  const errors = allErrors.filter((e) => e.severity === 'critical');
  const warnings = allErrors.filter(
    (e) => e.severity === 'warning' || e.severity === 'info',
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

function zodIssuesToErrors(
  stage: string,
  codePrefix: string,
  issues: Array<{ path: PropertyKey[]; message: string }>,
): ValidationError[] {
  return issues.map((issue) => ({
    code: `${codePrefix}_ZOD_CONTRACT`,
    stage,
    path: issue.path.length > 0 ? issue.path.map(String).join('.') : '',
    message: issue.message,
    severity: 'critical',
    suggestedFix: 'Conform the stage output to the declared Zod schema.',
  }));
}

/**
 * Validates an AppIntent (Stage 1 output).
 * Checks structural completeness and non-empty constraints on key fields.
 *
 * @param intent - The AppIntent object to validate.
 * @returns A ValidationResult with any detected issues.
 */
export function validateIntent(intent: unknown): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Structural: required keys
  allErrors.push(
    ...validateRequiredFields(intent, INTENT_REQUIRED_KEYS, 'intent_extraction'),
  );

  if (!isRecord(intent)) {
    return buildResult(allErrors);
  }

  const parsed = appIntentSchema.safeParse(intent);
  if (!parsed.success) {
    allErrors.push(
      ...zodIssuesToErrors(
        'intent_extraction',
        'INTENT',
        parsed.error.issues,
      ),
    );
  }

  const typedIntent = intent as unknown as AppIntent;

  // Non-empty checks for critical fields
  allErrors.push(...validateNonEmpty(intent, 'appName', 'intent_extraction'));
  allErrors.push(...validateNonEmpty(intent, 'appType', 'intent_extraction'));
  allErrors.push(...validateNonEmpty(intent, 'features', 'intent_extraction'));
  allErrors.push(...validateNonEmpty(intent, 'entities', 'intent_extraction'));

  // Ambiguity score range check
  if (
    typeof typedIntent.ambiguityScore !== 'number' ||
    typedIntent.ambiguityScore < 0 ||
    typedIntent.ambiguityScore > 10
  ) {
    allErrors.push({
      code: 'INTENT_INVALID_AMBIGUITY_SCORE',
      stage: 'intent_extraction',
      path: 'ambiguityScore',
      message: `Ambiguity score must be a number between 0 and 10, got ${String(typedIntent.ambiguityScore)}`,
      severity: 'warning',
      suggestedFix: 'Set ambiguityScore to a number between 0 and 10.',
    });
  }

  // Clarification consistency
  if (typedIntent.clarificationRequired && !typedIntent.clarificationQuestion) {
    allErrors.push({
      code: 'INTENT_MISSING_CLARIFICATION_QUESTION',
      stage: 'intent_extraction',
      path: 'clarificationQuestion',
      message:
        'clarificationRequired is true but no clarificationQuestion is provided',
      severity: 'warning',
      suggestedFix:
        'Either set clarificationRequired to false or provide a clarificationQuestion.',
    });
  }

  return buildResult(allErrors);
}

/**
 * Validates a DataSchema (Stage 2 output).
 * Checks structural completeness then runs all schema-specific rules.
 *
 * @param schema - The DataSchema object to validate.
 * @returns A ValidationResult with any detected issues.
 */
export function validateSchema(schema: unknown): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Structural: required keys
  allErrors.push(
    ...validateRequiredFields(schema, SCHEMA_REQUIRED_KEYS, 'schema_generation'),
  );

  if (!isRecord(schema)) {
    return buildResult(allErrors);
  }

  const parsed = dataSchemaSchema.safeParse(schema);
  if (!parsed.success) {
    allErrors.push(
      ...zodIssuesToErrors(
        'schema_generation',
        'SCHEMA',
        parsed.error.issues,
      ),
    );
  }

  const typedSchema = schema as unknown as DataSchema;

  // Non-empty checks
  allErrors.push(...validateNonEmpty(schema, 'entities', 'schema_generation'));
  allErrors.push(...validateNonEmpty(schema, 'version', 'schema_generation'));

  // Schema-specific rules
  if (Array.isArray(typedSchema.entities)) {
    allErrors.push(...runAllSchemaValidations(typedSchema));
  }

  return buildResult(allErrors);
}

/**
 * Validates an AppSpec (Stage 3 output).
 * Checks structural completeness then runs API consistency, auth,
 * and integration validation rules.
 *
 * @param appSpec - The AppSpec object to validate.
 * @returns A ValidationResult with any detected issues.
 */
export function validateAppSpec(appSpec: unknown): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Structural: required keys
  allErrors.push(
    ...validateRequiredFields(
      appSpec,
      APPSPEC_REQUIRED_KEYS,
      'appspec_generation',
    ),
  );

  if (!isRecord(appSpec)) {
    return buildResult(allErrors);
  }

  const parsed = appSpecSchema.safeParse(appSpec);
  if (!parsed.success) {
    allErrors.push(
      ...zodIssuesToErrors(
        'appspec_generation',
        'APPSPEC',
        parsed.error.issues,
      ),
    );
  }

  const typedAppSpec = appSpec as unknown as AppSpec;

  // Non-empty checks for critical fields
  allErrors.push(...validateNonEmpty(appSpec, 'appName', 'appspec_generation'));
  allErrors.push(...validateNonEmpty(appSpec, 'pages', 'appspec_generation'));
  allErrors.push(
    ...validateNonEmpty(appSpec, 'apiEndpoints', 'appspec_generation'),
  );

  // Validate the embedded data schema if present
  if (typedAppSpec.dataSchema && Array.isArray(typedAppSpec.dataSchema.entities)) {
    const schemaErrors = runAllSchemaValidations(typedAppSpec.dataSchema);
    allErrors.push(...schemaErrors);
  }

  // API consistency rules
  if (
    Array.isArray(typedAppSpec.pages) &&
    Array.isArray(typedAppSpec.apiEndpoints) &&
    typedAppSpec.authRules &&
    typedAppSpec.dataSchema &&
    Array.isArray(typedAppSpec.dataSchema.entities)
  ) {
    allErrors.push(...runAllApiConsistencyValidations(typedAppSpec));

    // Auth consistency rules
    allErrors.push(...runAllAuthValidations(typedAppSpec));

    // Integration validity rules
    allErrors.push(...runAllIntegrationValidations(typedAppSpec));
  }

  return buildResult(allErrors);
}

/**
 * Validates arbitrary stage output by dispatching to the appropriate
 * stage-specific validator.
 *
 * @param stage  - The pipeline stage name.
 * @param output - The raw output data from the stage.
 * @returns A ValidationResult with any detected issues.
 */
export function validateStageOutput(
  stage: string,
  output: unknown,
): ValidationResult {
  switch (stage) {
    case 'intent_extraction':
      return validateIntent(output);

    case 'schema_generation':
      return validateSchema(output);

    case 'appspec_generation':
      return validateAppSpec(output);

    default:
      return {
        valid: false,
        errors: [
          {
            code: 'VALIDATION_UNKNOWN_STAGE',
            stage,
            path: '',
            message: `Unknown pipeline stage "${stage}" — no validation rules available`,
            severity: 'critical',
            suggestedFix: `Use one of: intent_extraction, schema_generation, appspec_generation.`,
          },
        ],
        warnings: [],
      };
  }
}
