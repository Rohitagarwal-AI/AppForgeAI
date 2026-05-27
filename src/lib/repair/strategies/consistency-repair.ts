/**
 * @module lib/repair/strategies/consistency-repair
 * @description Consistency repair strategy for fixing cross-cutting concerns.
 * Handles stub entity creation for missing references, auto-generating
 * CRUD endpoints for orphaned pages, adding missing admin roles,
 * removing dangling integration hooks, and fixing workflow stub references.
 */

import type { ValidationError, RepairLog } from '@/types/pipeline';
import type { RepairStrategy, RepairResult } from '@/lib/repair/types';
import type { AppSpec, ApiEndpoint, RolePermission, Page } from '@/types/appspec';
import type { EntitySchema, FieldSchema } from '@/types/schema';

/** Error codes this strategy can handle. */
const HANDLEABLE_CODES = new Set([
  'API_PAGE_INVALID_ENTITY',
  'API_ENDPOINT_INVALID_ENTITY',
  'API_PAGE_NO_ENDPOINT',
  'AUTH_MISSING_ADMIN_ROLE',
  'AUTH_ADMIN_MISSING_PERMISSIONS',
  'AUTH_DEFAULT_ROLE_NOT_DEFINED',
  'AUTH_ROLE_MISSING_READ',
  'INTEGRATION_UNKNOWN_ID',
  'INTEGRATION_INVALID_ACTION',
  'INTEGRATION_WORKFLOW_INVALID_ENTITY',
]);

/**
 * Creates a RepairLog entry.
 *
 * @param error   - The original validation error.
 * @param outcome - The repair outcome.
 * @param before  - Value before repair.
 * @param after   - Value after repair.
 * @returns A structured RepairLog.
 */
function createLog(
  error: ValidationError,
  outcome: 'repaired' | 'failed' | 'escalated',
  before?: unknown,
  after?: unknown,
): RepairLog {
  return {
    strategy: 'consistency',
    inputError: error,
    outcome,
    timestamp: new Date().toISOString(),
    aiCallMade: false,
    beforeValue: before,
    afterValue: after,
  };
}

/**
 * Checks if the given data is an AppSpec object.
 *
 * @param data - The data to check.
 * @returns True if data looks like an AppSpec.
 */
function isAppSpec(data: unknown): data is AppSpec {
  if (data === null || data === undefined || typeof data !== 'object') {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    Array.isArray(record['pages']) &&
    Array.isArray(record['apiEndpoints']) &&
    record['dataSchema'] !== undefined &&
    record['authRules'] !== undefined
  );
}

/**
 * Deep-clones an AppSpec to avoid mutations.
 *
 * @param spec - The AppSpec to clone.
 * @returns A deep copy of the AppSpec.
 */
function cloneAppSpec(spec: AppSpec): AppSpec {
  return JSON.parse(JSON.stringify(spec)) as AppSpec;
}

/**
 * Creates a minimal stub entity with standard fields (id, tenant_id, name, created_at).
 *
 * @param entityName - The name for the new entity.
 * @returns A minimal EntitySchema.
 */
function createStubEntity(entityName: string): EntitySchema {
  const tableName = entityName
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .replace(/_+/g, '_')
    .toLowerCase();

  const fields: FieldSchema[] = [
    {
      name: 'id',
      type: 'uuid',
      nullable: false,
      isRelation: false,
      isPrimary: true,
      isUnique: true,
      defaultValue: null,
    },
    {
      name: 'tenant_id',
      type: 'uuid',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
      defaultValue: null,
    },
    {
      name: 'name',
      type: 'string',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
      defaultValue: null,
    },
    {
      name: 'created_at',
      type: 'datetime',
      nullable: false,
      isRelation: false,
      isPrimary: false,
      isUnique: false,
      defaultValue: null,
    },
  ];

  return {
    name: entityName,
    tableName: tableName.endsWith('s') ? tableName : `${tableName}s`,
    fields,
    relations: [],
    tenantId: true,
  };
}

/**
 * Creates basic CRUD API endpoints for a given entity.
 *
 * @param entityName - The entity to generate endpoints for.
 * @returns Array of CRUD ApiEndpoints.
 */
function createCrudEndpoints(entityName: string): ApiEndpoint[] {
  const basePath = `/api/${entityName.toLowerCase()}s`;

  return [
    {
      path: basePath,
      method: 'GET',
      handlerDescription: `List all ${entityName} records`,
      boundEntity: entityName,
      authRequired: true,
      rateLimitFlag: true,
    },
    {
      path: `${basePath}/:id`,
      method: 'GET',
      handlerDescription: `Get a single ${entityName} by ID`,
      boundEntity: entityName,
      authRequired: true,
      rateLimitFlag: false,
    },
    {
      path: basePath,
      method: 'POST',
      handlerDescription: `Create a new ${entityName}`,
      boundEntity: entityName,
      authRequired: true,
      rateLimitFlag: true,
    },
    {
      path: `${basePath}/:id`,
      method: 'PUT',
      handlerDescription: `Update an existing ${entityName}`,
      boundEntity: entityName,
      authRequired: true,
      rateLimitFlag: false,
    },
    {
      path: `${basePath}/:id`,
      method: 'DELETE',
      handlerDescription: `Delete a ${entityName}`,
      boundEntity: entityName,
      authRequired: true,
      rateLimitFlag: false,
    },
  ];
}

/**
 * Parses a page or endpoint index from a validation error path.
 *
 * @param path    - The error path.
 * @param prefix  - The prefix to match (e.g. "pages", "integrationHooks").
 * @returns The parsed index, or -1 if not parseable.
 */
function parseIndex(path: string, prefix: string): number {
  const regex = new RegExp(`${prefix}\\[(\\d+)\\]`);
  const match = regex.exec(path);
  if (!match || match[1] === undefined) return -1;
  return parseInt(match[1], 10);
}

/**
 * Adds a stub entity to the data schema when a page or endpoint
 * references a non-existent entity.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairMissingEntity(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);

  // Extract entity name from the error message
  let entityName: string | undefined;

  if (error.code === 'API_PAGE_INVALID_ENTITY') {
    const pageIdx = parseIndex(error.path, 'pages');
    const page = pageIdx >= 0 ? spec.pages[pageIdx] : undefined;
    entityName = page?.boundEntity;
  } else if (error.code === 'API_ENDPOINT_INVALID_ENTITY') {
    const endpointIdx = parseIndex(error.path, 'apiEndpoints');
    const endpoint =
      endpointIdx >= 0 ? spec.apiEndpoints[endpointIdx] : undefined;
    entityName = endpoint?.boundEntity;
  }

  if (!entityName) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  // Check if entity already exists (may have been added in a previous repair)
  const alreadyExists = spec.dataSchema.entities.some(
    (e) => e.name === entityName,
  );

  if (alreadyExists) {
    return {
      repaired: true,
      data: spec,
      logs: [createLog(error, 'repaired', undefined, `Entity "${entityName}" already exists`)],
    };
  }

  const stubEntity = createStubEntity(entityName);
  spec.dataSchema.entities.push(stubEntity);

  return {
    repaired: true,
    data: spec,
    logs: [
      createLog(error, 'repaired', undefined, `Created stub entity "${entityName}"`),
    ],
  };
}

/**
 * Adds missing CRUD API endpoints for a page that has no corresponding endpoints.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairMissingEndpoints(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);
  const pageIdx = parseIndex(error.path, 'pages');
  const page: Page | undefined = pageIdx >= 0 ? spec.pages[pageIdx] : undefined;

  if (!page?.boundEntity) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  // Check if endpoints already exist for this entity
  const existingEndpoints = spec.apiEndpoints.filter(
    (e) => e.boundEntity === page.boundEntity,
  );

  if (existingEndpoints.length > 0) {
    return {
      repaired: true,
      data: spec,
      logs: [
        createLog(
          error,
          'repaired',
          undefined,
          `Endpoints for "${page.boundEntity}" already exist`,
        ),
      ],
    };
  }

  const crudEndpoints = createCrudEndpoints(page.boundEntity);
  spec.apiEndpoints.push(...crudEndpoints);

  return {
    repaired: true,
    data: spec,
    logs: [
      createLog(
        error,
        'repaired',
        undefined,
        `Added ${crudEndpoints.length} CRUD endpoints for "${page.boundEntity}"`,
      ),
    ],
  };
}

/**
 * Adds the admin role with full permissions if missing.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairMissingAdminRole(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);
  const existingAdmin = spec.authRules.roles.find((r) => r.role === 'admin');

  if (existingAdmin) {
    // Admin exists but may be missing permissions
    const allPerms = new Set(existingAdmin.permissions);
    const toAdd: ('read' | 'write' | 'delete')[] = [];
    if (!allPerms.has('read')) toAdd.push('read');
    if (!allPerms.has('write')) toAdd.push('write');
    if (!allPerms.has('delete')) toAdd.push('delete');
    existingAdmin.permissions.push(...toAdd);

    return {
      repaired: true,
      data: spec,
      logs: [
        createLog(
          error,
          'repaired',
          existingAdmin.permissions.filter((p) => !toAdd.includes(p as 'read' | 'write' | 'delete')),
          existingAdmin.permissions,
        ),
      ],
    };
  }

  // Create admin role with all permissions and access to all entities
  const entityNames = spec.dataSchema.entities.map((e) => e.name);

  const adminRole: RolePermission = {
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
    allowedEntities: entityNames,
  };

  spec.authRules.roles.push(adminRole);

  return {
    repaired: true,
    data: spec,
    logs: [createLog(error, 'repaired', undefined, adminRole)],
  };
}

/**
 * Fixes default role not defined by setting it to the first available role.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairDefaultRole(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);
  const beforeRole = spec.authRules.defaultRole;

  if (spec.authRules.roles.length === 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'escalated', beforeRole, 'No roles defined')],
    };
  }

  // Prefer a non-admin role as the default, fallback to first role
  const nonAdminRole = spec.authRules.roles.find((r) => r.role !== 'admin');
  const fallbackRole = spec.authRules.roles[0];
  const selectedRole = nonAdminRole ?? fallbackRole;

  if (!selectedRole) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed', beforeRole)],
    };
  }

  spec.authRules.defaultRole = selectedRole.role;

  return {
    repaired: true,
    data: spec,
    logs: [createLog(error, 'repaired', beforeRole, selectedRole.role)],
  };
}

/**
 * Adds 'read' permission to a role that is missing it.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairMissingReadPermission(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);
  const roleIdx = parseIndex(error.path, 'roles');

  if (roleIdx < 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const role = spec.authRules.roles[roleIdx];

  if (!role) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const beforePerms = [...role.permissions];
  if (!role.permissions.includes('read')) {
    role.permissions.push('read');
  }

  return {
    repaired: true,
    data: spec,
    logs: [createLog(error, 'repaired', beforePerms, role.permissions)],
  };
}

/**
 * Removes dangling integration hooks with unknown integration IDs or invalid actions.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairDanglingIntegration(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);
  const hookIdx = parseIndex(error.path, 'integrationHooks');

  if (hookIdx < 0 || hookIdx >= spec.integrationHooks.length) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const removedHook = spec.integrationHooks[hookIdx];
  spec.integrationHooks.splice(hookIdx, 1);

  return {
    repaired: true,
    data: spec,
    logs: [
      createLog(
        error,
        'repaired',
        removedHook,
        `Removed invalid integration hook at index ${hookIdx}`,
      ),
    ],
  };
}

/**
 * Fixes workflow stubs that reference non-existent entities
 * by removing the invalid workflow stub.
 *
 * @param data  - The AppSpec to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched AppSpec.
 */
function repairWorkflowStubEntity(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isAppSpec(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const spec = cloneAppSpec(data);
  const stubIdx = parseIndex(error.path, 'workflowStubs');

  if (stubIdx < 0 || stubIdx >= spec.workflowStubs.length) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const removedStub = spec.workflowStubs[stubIdx];
  spec.workflowStubs.splice(stubIdx, 1);

  return {
    repaired: true,
    data: spec,
    logs: [
      createLog(
        error,
        'repaired',
        removedStub,
        `Removed workflow stub "${removedStub?.name ?? 'unknown'}" referencing non-existent entity`,
      ),
    ],
  };
}

/**
 * consistencyRepairStrategy — handles cross-cutting consistency fixes
 * including stub entity creation, CRUD endpoint generation, admin role
 * creation, and dangling reference cleanup.
 */
export const consistencyRepairStrategy: RepairStrategy = {
  name: 'consistency',

  canHandle(error: ValidationError): boolean {
    return HANDLEABLE_CODES.has(error.code);
  },

  repair(data: unknown, error: ValidationError): RepairResult {
    switch (error.code) {
      case 'API_PAGE_INVALID_ENTITY':
      case 'API_ENDPOINT_INVALID_ENTITY':
        return repairMissingEntity(data, error);

      case 'API_PAGE_NO_ENDPOINT':
        return repairMissingEndpoints(data, error);

      case 'AUTH_MISSING_ADMIN_ROLE':
      case 'AUTH_ADMIN_MISSING_PERMISSIONS':
        return repairMissingAdminRole(data, error);

      case 'AUTH_DEFAULT_ROLE_NOT_DEFINED':
        return repairDefaultRole(data, error);

      case 'AUTH_ROLE_MISSING_READ':
        return repairMissingReadPermission(data, error);

      case 'INTEGRATION_UNKNOWN_ID':
      case 'INTEGRATION_INVALID_ACTION':
        return repairDanglingIntegration(data, error);

      case 'INTEGRATION_WORKFLOW_INVALID_ENTITY':
        return repairWorkflowStubEntity(data, error);

      default:
        return {
          repaired: false,
          data,
          logs: [createLog(error, 'failed')],
        };
    }
  },
};
