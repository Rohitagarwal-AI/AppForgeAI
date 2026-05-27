/**
 * @module lib/repair/strategies/field-repair
 * @description Field-level repair strategy for fixing individual entity fields.
 * Handles missing required fields, invalid field types, missing primary keys,
 * missing tenant_id fields, and snake_case table name conversion.
 */

import type { ValidationError, RepairLog } from '@/types/pipeline';
import type { RepairStrategy, RepairResult } from '@/lib/repair/types';
import type { DataSchema, EntitySchema, FieldSchema } from '@/types/schema';

/** Error codes this strategy can handle. */
const HANDLEABLE_CODES = new Set([
  'SCHEMA_INVALID_FIELD_TYPE',
  'SCHEMA_MISSING_PRIMARY_KEY',
  'SCHEMA_MISSING_TENANT_ID',
  'SCHEMA_TABLE_NAME_NOT_SNAKE_CASE',
  'SCHEMA_DUPLICATE_FIELD_NAME',
  'SCHEMA_DUPLICATE_TABLE_NAME',
  'SCHEMA_DANGLING_FK',
  'SCHEMA_DANGLING_RELATION',
  'SCHEMA_MISSING_INVERSE_RELATION',
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
    strategy: 'field',
    inputError: error,
    outcome,
    timestamp: new Date().toISOString(),
    aiCallMade: false,
    beforeValue: before,
    afterValue: after,
  };
}

/**
 * Converts a string to snake_case.
 *
 * @param str - The string to convert.
 * @returns The snake_case version.
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Parses an entity index from a validation error path.
 * Expected path patterns: "entities[N]..." where N is the index.
 *
 * @param path - The dot-notation or bracket-notation path.
 * @returns The parsed entity index, or -1 if not parseable.
 */
function parseEntityIndex(path: string): number {
  const match = /entities\[(\d+)\]/.exec(path);
  if (!match || match[1] === undefined) return -1;
  return parseInt(match[1], 10);
}

/**
 * Parses a field index from a validation error path.
 * Expected path patterns: "entities[N].fields[M]..." where M is the index.
 *
 * @param path - The dot-notation or bracket-notation path.
 * @returns The parsed field index, or -1 if not parseable.
 */
function parseFieldIndex(path: string): number {
  const match = /fields\[(\d+)\]/.exec(path);
  if (!match || match[1] === undefined) return -1;
  return parseInt(match[1], 10);
}

function parseRelationIndex(path: string): number {
  const match = /relations\[(\d+)\]/.exec(path);
  if (!match || match[1] === undefined) return -1;
  return parseInt(match[1], 10);
}

/**
 * Creates a default primary key field.
 *
 * @returns A FieldSchema representing a UUID primary key.
 */
function createPrimaryKeyField(): FieldSchema {
  return {
    name: 'id',
    type: 'uuid',
    nullable: false,
    isRelation: false,
    isPrimary: true,
    isUnique: true,
    defaultValue: null,
  };
}

/**
 * Creates a default tenant_id field.
 *
 * @returns A FieldSchema representing a tenant isolation field.
 */
function createTenantIdField(): FieldSchema {
  return {
    name: 'tenant_id',
    type: 'uuid',
    nullable: false,
    isRelation: false,
    isPrimary: false,
    isUnique: false,
    defaultValue: null,
  };
}

function repairDuplicateTableName(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const entityIdx = parseEntityIndex(error.path);
  if (entityIdx < 0) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];
  if (!entity) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const before = entity.tableName;
  entity.tableName = `${toSnakeCase(entity.name)}_${entityIdx}`;

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', before, entity.tableName)],
  };
}

function repairDanglingForeignKey(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const entityIdx = parseEntityIndex(error.path);
  const fieldIdx = parseFieldIndex(error.path);
  if (entityIdx < 0 || fieldIdx < 0) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const schema = cloneSchema(data);
  const field = schema.entities[entityIdx]?.fields[fieldIdx];
  if (!field) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const before = { ...field };
  field.isRelation = false;
  field.references = undefined;

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', before, field)],
  };
}

function repairDanglingRelation(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const entityIdx = parseEntityIndex(error.path);
  const relationIdx = parseRelationIndex(error.path);
  if (entityIdx < 0 || relationIdx < 0) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];
  const removed = entity?.relations[relationIdx];
  if (!entity || !removed) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  entity.relations.splice(relationIdx, 1);

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', removed, `removed relation at index ${relationIdx}`)],
  };
}

function repairMissingInverseRelation(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const entityIdx = parseEntityIndex(error.path);
  const relationIdx = parseRelationIndex(error.path);
  if (entityIdx < 0 || relationIdx < 0) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];
  const relation = entity?.relations[relationIdx];
  if (!entity || !relation) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const target = schema.entities.find((candidate) => candidate.name === relation.targetEntity);
  if (!target) {
    return { repaired: false, data, logs: [createLog(error, 'failed')] };
  }

  const inverseType = relation.type === 'belongsTo' ? 'hasMany' : 'belongsTo';
  const exists = target.relations.some(
    (candidate) =>
      candidate.targetEntity === entity.name && candidate.type === inverseType,
  );

  if (!exists) {
    target.relations.push({
      type: inverseType,
      targetEntity: entity.name,
      foreignKey: relation.foreignKey,
    });
  }

  return {
    repaired: true,
    data: schema,
    logs: [
      createLog(
        error,
        'repaired',
        undefined,
        `Added ${inverseType} relation from ${target.name} to ${entity.name}`,
      ),
    ],
  };
}

/**
 * Deep-clones a DataSchema to avoid mutations.
 *
 * @param schema - The schema to clone.
 * @returns A deep copy of the schema.
 */
function cloneSchema(schema: DataSchema): DataSchema {
  return {
    version: schema.version,
    entities: schema.entities.map((entity) => ({
      name: entity.name,
      tableName: entity.tableName,
      tenantId: entity.tenantId,
      fields: entity.fields.map((f) => ({ ...f })),
      relations: entity.relations.map((r) => ({ ...r })),
    })),
  };
}

/**
 * Checks if the given data is a DataSchema object.
 *
 * @param data - The data to check.
 * @returns True if data looks like a DataSchema.
 */
function isDataSchema(data: unknown): data is DataSchema {
  if (data === null || data === undefined || typeof data !== 'object') {
    return false;
  }
  const record = data as Record<string, unknown>;
  return Array.isArray(record['entities']);
}

/**
 * Repairs an invalid field type by defaulting to 'string'.
 *
 * @param data  - The DataSchema to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched schema.
 */
function repairInvalidFieldType(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const entityIdx = parseEntityIndex(error.path);
  const fieldIdx = parseFieldIndex(error.path);

  if (entityIdx < 0 || fieldIdx < 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];

  if (!entity) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const field = entity.fields[fieldIdx];

  if (!field) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const beforeType = field.type;
  field.type = 'string';

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', beforeType, 'string')],
  };
}

/**
 * Adds a primary key field to an entity that lacks one.
 *
 * @param data  - The DataSchema to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched schema.
 */
function repairMissingPrimaryKey(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const entityIdx = parseEntityIndex(error.path);

  if (entityIdx < 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];

  if (!entity) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  // Check if a field named 'id' already exists
  const existingId = entity.fields.find((f) => f.name === 'id');
  if (existingId) {
    existingId.isPrimary = true;
    return {
      repaired: true,
      data: schema,
      logs: [createLog(error, 'repaired', false, true)],
    };
  }

  // Prepend a new primary key field
  entity.fields.unshift(createPrimaryKeyField());

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', undefined, 'id (uuid, primary)')],
  };
}

/**
 * Adds a tenant_id field to an entity that lacks one.
 *
 * @param data  - The DataSchema to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched schema.
 */
function repairMissingTenantId(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const entityIdx = parseEntityIndex(error.path);

  if (entityIdx < 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];

  if (!entity) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  // Check if tenant_id already exists
  const hasTenantField = entity.fields.some(
    (f) => f.name === 'tenant_id' || f.name === 'tenantId',
  );

  if (!hasTenantField) {
    entity.fields.push(createTenantIdField());
  }

  // Ensure tenantId flag is set
  (entity as EntitySchema).tenantId = true;

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', undefined, 'tenant_id (uuid)')],
  };
}

/**
 * Converts a non-snake_case table name to snake_case.
 *
 * @param data  - The DataSchema to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched schema.
 */
function repairTableName(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const entityIdx = parseEntityIndex(error.path);

  if (entityIdx < 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];

  if (!entity) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const beforeName = entity.tableName;
  entity.tableName = toSnakeCase(beforeName);

  return {
    repaired: true,
    data: schema,
    logs: [createLog(error, 'repaired', beforeName, entity.tableName)],
  };
}

/**
 * Removes duplicate field names within an entity, keeping the first occurrence.
 *
 * @param data  - The DataSchema to repair.
 * @param error - The validation error.
 * @returns A RepairResult with the patched schema.
 */
function repairDuplicateFieldName(
  data: unknown,
  error: ValidationError,
): RepairResult {
  if (!isDataSchema(data)) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const entityIdx = parseEntityIndex(error.path);
  const fieldIdx = parseFieldIndex(error.path);

  if (entityIdx < 0 || fieldIdx < 0) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const schema = cloneSchema(data);
  const entity = schema.entities[entityIdx];

  if (!entity) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  const duplicateField = entity.fields[fieldIdx];

  if (!duplicateField) {
    return {
      repaired: false,
      data,
      logs: [createLog(error, 'failed')],
    };
  }

  // Remove the later duplicate (the one the error points to)
  const removedFieldName = duplicateField.name;
  entity.fields.splice(fieldIdx, 1);

  return {
    repaired: true,
    data: schema,
    logs: [
      createLog(error, 'repaired', removedFieldName, `removed duplicate at index ${fieldIdx}`),
    ],
  };
}

/**
 * fieldRepairStrategy — handles field-level fixes including type corrections,
 * missing PKs, missing tenant_id, and snake_case table name conversion.
 */
export const fieldRepairStrategy: RepairStrategy = {
  name: 'field',

  canHandle(error: ValidationError): boolean {
    return HANDLEABLE_CODES.has(error.code);
  },

  repair(data: unknown, error: ValidationError): RepairResult {
    switch (error.code) {
      case 'SCHEMA_INVALID_FIELD_TYPE':
        return repairInvalidFieldType(data, error);

      case 'SCHEMA_MISSING_PRIMARY_KEY':
        return repairMissingPrimaryKey(data, error);

      case 'SCHEMA_MISSING_TENANT_ID':
        return repairMissingTenantId(data, error);

      case 'SCHEMA_TABLE_NAME_NOT_SNAKE_CASE':
        return repairTableName(data, error);

      case 'SCHEMA_DUPLICATE_FIELD_NAME':
        return repairDuplicateFieldName(data, error);

      case 'SCHEMA_DUPLICATE_TABLE_NAME':
        return repairDuplicateTableName(data, error);

      case 'SCHEMA_DANGLING_FK':
        return repairDanglingForeignKey(data, error);

      case 'SCHEMA_DANGLING_RELATION':
        return repairDanglingRelation(data, error);

      case 'SCHEMA_MISSING_INVERSE_RELATION':
        return repairMissingInverseRelation(data, error);

      default:
        return {
          repaired: false,
          data,
          logs: [createLog(error, 'failed')],
        };
    }
  },
};
