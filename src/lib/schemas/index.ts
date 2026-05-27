/**
 * @module lib/schemas/index
 * @description Barrel re-export of all Zod validation schemas.
 */

export {
  appTypeSchema,
  appIntentSchema,
  type ValidatedAppIntent,
} from '@/lib/schemas/intent';

export {
  fieldTypeSchema,
  relationTypeSchema,
  fieldSchemaSchema,
  relationSchema,
  entitySchemaSchema,
  dataSchemaSchema,
  type ValidatedFieldSchema,
  type ValidatedRelation,
  type ValidatedEntitySchema,
  type ValidatedDataSchema,
} from '@/lib/schemas/data-schema';

export {
  pageLayoutSchema,
  componentTypeSchema,
  httpMethodSchema,
  permissionSchema,
  pageComponentSchema,
  pageSchema,
  apiEndpointSchema,
  rolePermissionSchema,
  authRulesSchema,
  integrationHookSchema,
  workflowStubSchema,
  providerUsageEntrySchema,
  appSpecMetadataSchema,
  appSpecSchema,
  type ValidatedAppSpec,
  type ValidatedPage,
  type ValidatedPageComponent,
  type ValidatedApiEndpoint,
  type ValidatedAuthRules,
  type ValidatedRolePermission,
  type ValidatedIntegrationHook,
  type ValidatedWorkflowStub,
  type ValidatedProviderUsageEntry,
  type ValidatedAppSpecMetadata,
} from '@/lib/schemas/app-spec';

export {
  authTypeSchema,
  triggerDefinitionSchema,
  actionDefinitionSchema,
  integrationDefinitionSchema,
  type ValidatedTriggerDefinition,
  type ValidatedActionDefinition,
  type ValidatedIntegrationDefinition,
} from '@/lib/schemas/integration';
