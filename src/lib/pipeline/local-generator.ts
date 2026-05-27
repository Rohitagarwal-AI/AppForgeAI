/**
 * @module lib/pipeline/local-generator
 * @description Deterministic planning engine used for offline evaluation,
 * local development, and graceful fallback when AI providers are unavailable.
 */

import type { AppIntent } from '@/types/intent';
import type { AppSpec, ApiEndpoint, IntegrationHook, Page, WorkflowStub } from '@/types/appspec';
import type { DataSchema, EntitySchema, FieldSchema, Relation } from '@/types/schema';
import type { EntityFieldTemplate, EntityTemplate } from '@/types/catalog';
import {
  detectConflicts,
  isVaguePrompt,
  matchDomainKeywords,
  matchEntityKeywords,
  matchFeatureKeywords,
  matchIntegrationKeywords,
} from '@/lib/catalog/prompt-keywords';
import { getAppTypeDefinition } from '@/lib/catalog/app-types';
import { getEntityTemplate } from '@/lib/catalog/entity-templates';
import {
  getDefaultIntegrationAction,
  getDefaultIntegrationTrigger,
  getIntegrationById,
} from '@/lib/integrations/registry';

const BASE_FEATURES = ['auth', 'rbac', 'dashboard', 'search'];

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function toPascalSingular(value: string): string {
  const normalized = value.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  const singular = normalized.endsWith('ies')
    ? normalized.replace(/ies$/, 'y')
    : normalized.endsWith('sses')
      ? normalized.replace(/sses$/, 'ss')
      : normalized.endsWith('s') && !normalized.endsWith('ss')
        ? normalized.slice(0, -1)
        : normalized;

  return singular
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function toSlugPlural(value: string): string {
  const snake = value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  if (snake.endsWith('ss')) {
    return `${snake}es`;
  }
  if (snake.endsWith('ies') || snake.endsWith('s')) {
    return snake;
  }
  if (snake.endsWith('y')) {
    return `${snake.slice(0, -1)}ies`;
  }
  return `${snake}s`;
}

function toSlugSingular(value: string): string {
  const snake = value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  if (snake.endsWith('ies')) {
    return snake.replace(/ies$/, 'y');
  }
  if (snake.endsWith('sses')) {
    return snake.replace(/sses$/, 'ss');
  }
  if (snake.endsWith('s') && !snake.endsWith('ss')) {
    return snake.slice(0, -1);
  }
  return snake;
}

function toKebabPlural(entityName: string): string {
  return toSlugPlural(entityName).replace(/_/g, '-');
}

function inferAppName(prompt: string, appType: AppIntent['appType']): string {
  const lower = prompt.toLowerCase();
  const appTypeDef = getAppTypeDefinition(appType);

  if (lower.includes('real estate') && appType === 'crm') {
    return 'Real Estate CRM';
  }

  if (lower.includes('warehouse') && appType === 'inventory') {
    return 'Warehouse Inventory Manager';
  }

  return appTypeDef
    ? `${appTypeDef.displayName} Builder`
    : 'Custom Operations App';
}

export function extractIntentDeterministic(prompt: string): AppIntent {
  const lower = prompt.toLowerCase();
  const domainMatches = matchDomainKeywords(lower);
  const appType = (domainMatches[0] ?? 'custom') as AppIntent['appType'];
  const appTypeDef = getAppTypeDefinition(appType);
  const promptIsVague = isVaguePrompt(lower);
  const featureMatches = matchFeatureKeywords(lower);
  const entityMatches = matchEntityKeywords(lower);
  const integrationMatches = matchIntegrationKeywords(lower);
  const conflicts = detectConflicts(lower);

  const features = unique([
    ...BASE_FEATURES,
    ...(appTypeDef?.defaultFeatures ?? []),
    ...featureMatches,
    ...(integrationMatches.length > 0 ? ['integration_workflows'] : []),
  ]);

  const entitySlugs = unique([
    ...(appTypeDef?.defaultEntities ?? []),
    ...entityMatches,
    ...(lower.includes('lead') ? ['contacts', 'deals'] : []),
    ...(lower.includes('agent') ? ['users'] : []),
  ]);

  const assumptions = [
    'Assumed JWT authentication with role-based access control.',
    'Assumed every generated entity is tenant-scoped with tenant_id.',
    'Assumed REST APIs are generated for user-facing entities.',
  ];

  if (integrationMatches.length > 0) {
    assumptions.push('Assumed requested integrations are executed through workflow hooks.');
  }

  return {
    appName: inferAppName(prompt, appType),
    appType,
    features,
    entities: unique(entitySlugs.map(toPascalSingular)),
    integrationsRequested: integrationMatches,
    assumptions,
    clarificationRequired: promptIsVague,
    clarificationQuestion: promptIsVague
      ? 'What type of application should AppForgeAI generate, and who will use it?'
      : undefined,
    ambiguityScore: promptIsVague ? 9 : Math.min(6, 2 + assumptions.length),
    conflicts: conflicts.map((conflict) => conflict.reason),
  };
}

function mapField(templateField: EntityFieldTemplate): FieldSchema {
  if (templateField.name === 'tenant_id') {
    return {
      name: 'tenant_id',
      type: 'uuid',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
    };
  }

  const field: FieldSchema = {
    name: templateField.name,
    type: templateField.type,
    nullable: templateField.nullable,
    isRelation: templateField.isRelation,
    isPrimary: templateField.isPrimary,
    isUnique: templateField.isUnique,
  };

  if (templateField.defaultValue !== undefined) {
    field.defaultValue = templateField.defaultValue;
  }

  if (templateField.enumValues) {
    field.enumValues = [...templateField.enumValues];
  }

  if (templateField.references && templateField.references.entity !== 'tenants') {
    field.references = {
      entity: toPascalSingular(templateField.references.entity),
      field: templateField.references.field,
    };
  } else if (templateField.references?.entity === 'tenants') {
    field.isRelation = false;
  }

  return field;
}

function mapRelationType(type: string): Relation['type'] {
  switch (type) {
    case 'many_to_one':
      return 'belongsTo';
    case 'one_to_one':
      return 'hasOne';
    case 'one_to_many':
    case 'many_to_many':
    default:
      return 'hasMany';
  }
}

function fromTemplate(template: EntityTemplate): EntitySchema {
  return {
    name: toPascalSingular(template.name),
    tableName: template.tableName,
    fields: template.fields.map(mapField),
    relations: template.defaultRelations.map((relation) => ({
      type: mapRelationType(relation.type),
      targetEntity: toPascalSingular(relation.targetEntity),
      foreignKey: relation.foreignKey,
    })),
    tenantId: true,
  };
}

function createGenericEntity(entityName: string): EntitySchema {
  return {
    name: toPascalSingular(entityName),
    tableName: toSlugPlural(entityName),
    tenantId: true,
    fields: [
      {
        name: 'id',
        type: 'uuid',
        nullable: false,
        isRelation: false,
        isPrimary: true,
        isUnique: true,
        defaultValue: 'gen_random_uuid()',
      },
      {
        name: 'tenant_id',
        type: 'uuid',
        nullable: false,
        isRelation: false,
        isPrimary: false,
        isUnique: false,
      },
      {
        name: 'name',
        type: 'string',
        nullable: false,
        isRelation: false,
        isPrimary: false,
        isUnique: false,
      },
      {
        name: 'status',
        type: 'enum',
        nullable: false,
        isRelation: false,
        isPrimary: false,
        isUnique: false,
        enumValues: ['active', 'archived'],
        defaultValue: 'active',
      },
      {
        name: 'created_at',
        type: 'datetime',
        nullable: false,
        isRelation: false,
        isPrimary: false,
        isUnique: false,
        defaultValue: 'now()',
      },
      {
        name: 'updated_at',
        type: 'datetime',
        nullable: false,
        isRelation: false,
        isPrimary: false,
        isUnique: false,
        defaultValue: 'now()',
      },
    ],
    relations: [],
  };
}

function entitySlugCandidates(entityName: string): string[] {
  const plural = toSlugPlural(entityName);
  const singular = toSlugSingular(plural);
  return unique([plural, singular]);
}

function ensureBaseFields(entity: EntitySchema): EntitySchema {
  const fields = [...entity.fields];

  if (!fields.some((field) => field.name === 'id')) {
    fields.unshift({
      name: 'id',
      type: 'uuid',
      nullable: false,
      isRelation: false,
      isPrimary: true,
      isUnique: true,
      defaultValue: 'gen_random_uuid()',
    });
  }

  if (!fields.some((field) => field.name === 'tenant_id')) {
    fields.splice(1, 0, {
      name: 'tenant_id',
      type: 'uuid',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
    });
  }

  if (!fields.some((field) => field.name === 'created_at')) {
    fields.push({
      name: 'created_at',
      type: 'datetime',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
      defaultValue: 'now()',
    });
  }

  if (!fields.some((field) => field.name === 'updated_at')) {
    fields.push({
      name: 'updated_at',
      type: 'datetime',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
      defaultValue: 'now()',
    });
  }

  return {
    ...entity,
    tenantId: true,
    fields,
  };
}

function addInverseRelations(entities: EntitySchema[]): EntitySchema[] {
  const cloned = entities.map((entity) => ({
    ...entity,
    fields: entity.fields.map((field) => ({ ...field })),
    relations: entity.relations.map((relation) => ({ ...relation })),
  }));
  const entityMap = new Map(cloned.map((entity) => [entity.name, entity]));

  for (const entity of cloned) {
    for (const relation of entity.relations) {
      const target = entityMap.get(relation.targetEntity);
      if (!target) {
        continue;
      }

      if (relation.type === 'belongsTo') {
        const inverseExists = target.relations.some(
          (candidate) =>
            candidate.targetEntity === entity.name &&
            (candidate.type === 'hasMany' || candidate.type === 'hasOne'),
        );
        if (!inverseExists) {
          target.relations.push({
            type: 'hasMany',
            targetEntity: entity.name,
            foreignKey: relation.foreignKey,
          });
        }
      }

      if (relation.type === 'hasMany' || relation.type === 'hasOne') {
        const inverseExists = target.relations.some(
          (candidate) =>
            candidate.targetEntity === entity.name &&
            candidate.type === 'belongsTo',
        );
        if (!inverseExists) {
          target.relations.push({
            type: 'belongsTo',
            targetEntity: entity.name,
            foreignKey: relation.foreignKey,
          });
        }
      }
    }
  }

  return cloned;
}

export function generateSchemaDeterministic(intent: AppIntent): DataSchema {
  const appTypeDef = getAppTypeDefinition(intent.appType);
  const slugs = unique([
    ...(appTypeDef?.defaultEntities ?? []),
    ...intent.entities.flatMap(entitySlugCandidates),
  ]);

  const entities: EntitySchema[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    const template = getEntityTemplate(slug);
    const entity = ensureBaseFields(template ? fromTemplate(template) : createGenericEntity(slug));

    if (!seen.has(entity.name)) {
      seen.add(entity.name);
      entities.push(entity);
    }
  }

  const entityNames = new Set(entities.map((entity) => entity.name));
  const sanitized = entities.map((entity) => ({
    ...entity,
    fields: entity.fields.map((field) => {
      if (field.references && !entityNames.has(field.references.entity)) {
        return {
          ...field,
          isRelation: false,
          references: undefined,
        };
      }
      return field;
    }),
    relations: entity.relations.filter((relation) =>
      entityNames.has(relation.targetEntity),
    ),
  }));

  return {
    entities: addInverseRelations(sanitized),
    version: '1.0.0',
  };
}

function createEntityPages(entity: EntitySchema): Page[] {
  const kebab = toKebabPlural(entity.name);
  const label = titleCase(entity.name);

  return [
    {
      name: `${label} List`,
      route: `/${kebab}`,
      layout: 'list',
      boundEntity: entity.name,
      components: [
        {
          id: `${kebab}-table`,
          type: 'table',
          boundEntity: entity.name,
          config: { columns: entity.fields.slice(0, 6).map((field) => field.name) },
        },
        {
          id: `${kebab}-filters`,
          type: 'filter',
          boundEntity: entity.name,
        },
      ],
    },
    {
      name: `${label} Detail`,
      route: `/${kebab}/:id`,
      layout: 'detail',
      boundEntity: entity.name,
      components: [
        {
          id: `${kebab}-summary`,
          type: 'card',
          boundEntity: entity.name,
        },
        {
          id: `${kebab}-form`,
          type: 'form',
          boundEntity: entity.name,
        },
      ],
    },
  ];
}

function createCrudEndpoints(entity: EntitySchema): ApiEndpoint[] {
  const basePath = `/api/${toSlugPlural(entity.name)}`;
  const responseSchema = Object.fromEntries(
    entity.fields.map((field) => [field.name, field.type]),
  );

  return [
    {
      path: basePath,
      method: 'GET',
      handlerDescription: `List ${entity.name} records for the active tenant.`,
      boundEntity: entity.name,
      authRequired: true,
      rateLimitFlag: false,
      responseSchema,
    },
    {
      path: `${basePath}/:id`,
      method: 'GET',
      handlerDescription: `Fetch a single ${entity.name} record by id.`,
      boundEntity: entity.name,
      authRequired: true,
      rateLimitFlag: false,
      responseSchema,
    },
    {
      path: basePath,
      method: 'POST',
      handlerDescription: `Create a ${entity.name} record with tenant isolation.`,
      boundEntity: entity.name,
      authRequired: true,
      rateLimitFlag: true,
      requestSchema: responseSchema,
      responseSchema,
    },
    {
      path: `${basePath}/:id`,
      method: 'PUT',
      handlerDescription: `Update an existing ${entity.name} record.`,
      boundEntity: entity.name,
      authRequired: true,
      rateLimitFlag: true,
      requestSchema: responseSchema,
      responseSchema,
    },
    {
      path: `${basePath}/:id`,
      method: 'DELETE',
      handlerDescription: `Delete or archive a ${entity.name} record.`,
      boundEntity: entity.name,
      authRequired: true,
      rateLimitFlag: true,
    },
  ];
}

function createIntegrationHooks(
  intent: AppIntent,
  schema: DataSchema,
): IntegrationHook[] {
  const entityNames = schema.entities.map((entity) => entity.name);
  const preferredEntity = entityNames.includes('Deal')
    ? 'Deal'
    : entityNames.find((entity) => entity !== 'User') ?? entityNames[0] ?? 'User';

  return intent.integrationsRequested
    .filter((integrationId) => Boolean(getIntegrationById(integrationId)))
    .map((integrationId) => ({
      integrationId,
      trigger:
        integrationId === 'stripe'
          ? 'payment_completed'
          : getDefaultIntegrationTrigger(integrationId) ?? 'record_created',
      action: getDefaultIntegrationAction(integrationId) ?? 'post_payload',
      config: {
        entity: preferredEntity,
        executionMode: 'async',
      },
    }));
}

function createWorkflowStubs(
  intent: AppIntent,
  hooks: IntegrationHook[],
  schema: DataSchema,
): WorkflowStub[] {
  const entityNames = schema.entities.map((entity) => entity.name);
  const workflowEntity = entityNames.includes('Deal')
    ? 'Deal'
    : entityNames.find((entity) => entity !== 'User') ?? entityNames[0] ?? 'User';

  return hooks.map((hook) => ({
    id: `${hook.integrationId}-${workflowEntity.toLowerCase()}-workflow`,
    name: `${titleCase(hook.integrationId)} ${titleCase(workflowEntity)} Workflow`,
    description: `Runs ${hook.integrationId} action ${hook.action} when ${workflowEntity} records match the configured trigger.`,
    trigger: {
      entity: workflowEntity,
      event:
        hook.trigger === 'status_changed' ||
        intent.features.some((feature) => feature.includes('notification'))
          ? 'status_changed'
          : 'created',
    },
    actions: [
      {
        type: hook.action,
        config: {
          integrationId: hook.integrationId,
          hookTrigger: hook.trigger,
        },
      },
    ],
  }));
}

function createRoles(intent: AppIntent, schema: DataSchema): AppSpec['authRules']['roles'] {
  const entityNames = schema.entities.map((entity) => entity.name);
  const appTypeDef = getAppTypeDefinition(intent.appType);
  const roles = unique(['admin', ...(appTypeDef?.defaultRoles ?? ['user'])]);

  return roles.map((role) => ({
    role,
    permissions:
      role === 'admin'
        ? ['read', 'write', 'delete']
        : role.includes('viewer') || role === 'customer'
          ? ['read']
          : ['read', 'write'],
    allowedEntities: entityNames,
  }));
}

export function generateAppSpecDeterministic(
  intent: AppIntent,
  dataSchema: DataSchema,
): AppSpec {
  const pages: Page[] = [
    {
      name: 'Dashboard',
      route: '/',
      layout: 'dashboard',
      components: [
        { id: 'pipeline-overview', type: 'stats', config: { source: 'api' } },
        { id: 'activity-chart', type: 'chart', config: { metric: 'records_by_status' } },
      ],
    },
    ...dataSchema.entities.flatMap(createEntityPages),
    {
      name: 'Settings',
      route: '/settings',
      layout: 'settings',
      components: [
        { id: 'integration-settings', type: 'card' },
        { id: 'role-settings', type: 'table' },
      ],
    },
  ];

  const apiEndpoints = dataSchema.entities.flatMap(createCrudEndpoints);
  const integrationHooks = createIntegrationHooks(intent, dataSchema);
  const workflowStubs = createWorkflowStubs(intent, integrationHooks, dataSchema);
  const roles = createRoles(intent, dataSchema);
  const defaultRole = roles.find((role) => role.role !== 'admin')?.role ?? 'admin';

  return {
    appName: intent.appName,
    appType: intent.appType,
    pages,
    apiEndpoints,
    authRules: {
      strategy: 'jwt',
      roles,
      defaultRole,
    },
    integrationHooks,
    workflowStubs,
    dataSchema,
    metadata: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: '1.0.0',
      totalLatencyMs: 0,
      totalCostUsd: 0,
      providerUsage: [],
    },
  };
}
