/**
 * @module lib/validation/rules/integration-validity
 * @description Integration and workflow validation rules for AppSpec.
 * Validates integration hooks against a known registry of integration IDs,
 * actions, and triggers. Also validates workflow stub entity references.
 */

import type { ValidationError } from '@/types/pipeline';
import type { AppSpec } from '@/types/appspec';
import {
  getIntegrationActions,
  getIntegrationById,
  getIntegrationRegistry,
  getIntegrationTriggers,
  getKnownIntegrationIds as getRegistryIntegrationIds,
} from '@/lib/integrations/registry';

/**
 * Validates that each integration hook's integrationId is a known integration.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for unknown integration IDs.
 */
export function validateIntegrationIds(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < appSpec.integrationHooks.length; i++) {
    const hook = appSpec.integrationHooks[i];
    if (!getIntegrationById(hook.integrationId)) {
      errors.push({
        code: 'INTEGRATION_UNKNOWN_ID',
        stage: 'appspec_generation',
        path: `integrationHooks[${i}].integrationId`,
        message: `Integration "${hook.integrationId}" is not a known integration`,
        severity: 'critical',
        suggestedFix: `Use one of the known integrations: ${getIntegrationRegistry().map((integration) => integration.id).join(', ')}.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that each integration hook's action is valid for its integration.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for invalid integration actions.
 */
export function validateIntegrationActions(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < appSpec.integrationHooks.length; i++) {
    const hook = appSpec.integrationHooks[i];
    const integration = getIntegrationById(hook.integrationId);

    if (!integration) {
      // Already reported by validateIntegrationIds
      continue;
    }

    const validActions = getIntegrationActions(hook.integrationId).map(
      (action) => action.id,
    );

    if (!validActions.includes(hook.action)) {
      errors.push({
        code: 'INTEGRATION_INVALID_ACTION',
        stage: 'appspec_generation',
        path: `integrationHooks[${i}].action`,
        message: `Action "${hook.action}" is not valid for integration "${hook.integrationId}". Valid actions: [${validActions.join(', ')}]`,
        severity: 'critical',
        suggestedFix: `Change action to one of: ${validActions.join(', ')}.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that each integration hook's trigger is valid for its integration.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for invalid integration triggers.
 */
export function validateIntegrationTriggers(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < appSpec.integrationHooks.length; i++) {
    const hook = appSpec.integrationHooks[i];
    const integration = getIntegrationById(hook.integrationId);

    if (!integration) {
      // Already reported by validateIntegrationIds
      continue;
    }

    const validTriggers = getIntegrationTriggers(hook.integrationId).map(
      (trigger) => trigger.id,
    );

    if (validTriggers.length > 0 && hook.trigger.length > 0) {
      if (!validTriggers.includes(hook.trigger)) {
        errors.push({
          code: 'INTEGRATION_INVALID_TRIGGER',
          stage: 'appspec_generation',
          path: `integrationHooks[${i}].trigger`,
          message: `Trigger "${hook.trigger}" is not valid for integration "${hook.integrationId}". Valid triggers: [${validTriggers.join(', ')}]`,
          severity: 'warning',
          suggestedFix: `Change trigger to one of: ${validTriggers.join(', ')}.`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates that workflow stubs' trigger.entity references a valid entity in dataSchema.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for workflow stubs referencing non-existent entities.
 */
export function validateWorkflowStubEntities(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set(
    appSpec.dataSchema.entities.map((e) => e.name),
  );

  for (let i = 0; i < appSpec.workflowStubs.length; i++) {
    const workflow = appSpec.workflowStubs[i];

    if (!entityNames.has(workflow.trigger.entity)) {
      errors.push({
        code: 'INTEGRATION_WORKFLOW_INVALID_ENTITY',
        stage: 'appspec_generation',
        path: `workflowStubs[${i}].trigger.entity`,
        message: `Workflow "${workflow.name}" trigger references non-existent entity "${workflow.trigger.entity}"`,
        severity: 'critical',
        suggestedFix: `Add entity "${workflow.trigger.entity}" to the data schema or update the workflow trigger.`,
      });
    }
  }

  return errors;
}

/**
 * Runs all integration validity validation rules against the given AppSpec.
 *
 * @param appSpec - The full application specification.
 * @returns Aggregated array of all integration validation errors.
 */
export function runAllIntegrationValidations(
  appSpec: AppSpec,
): ValidationError[] {
  return [
    ...validateIntegrationIds(appSpec),
    ...validateIntegrationActions(appSpec),
    ...validateIntegrationTriggers(appSpec),
    ...validateWorkflowStubEntities(appSpec),
  ];
}

/**
 * Returns the set of known integration IDs for use in repair strategies.
 *
 * @returns Read-only set of known integration ID strings.
 */
export function getKnownIntegrationIds(): ReadonlySet<string> {
  return getRegistryIntegrationIds();
}
