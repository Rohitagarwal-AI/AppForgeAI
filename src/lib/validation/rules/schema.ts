/**
 * @module lib/validation/rules/schema
 * @description Schema validation rules for DataSchema (Stage 2 output).
 * Enforces naming conventions, field type validity, primary key presence,
 * foreign key consistency, uniqueness constraints, and bidirectional relations.
 */

import type { ValidationError } from '@/types/pipeline';
import type { DataSchema, EntitySchema, FieldType } from '@/types/schema';

/** Exhaustive set of valid field types from the FieldType union. */
const VALID_FIELD_TYPES: readonly FieldType[] = [
  'string',
  'number',
  'integer',
  'float',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'json',
  'uuid',
  'text',
  'email',
  'url',
  'phone',
  'enum',
] as const;

/** Regex pattern for valid snake_case identifiers. */
const SNAKE_CASE_RE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * Validates that a table name follows snake_case convention.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for non-snake_case table names.
 */
export function validateSnakeCaseTableNames(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];
    if (!SNAKE_CASE_RE.test(entity.tableName)) {
      errors.push({
        code: 'SCHEMA_TABLE_NAME_NOT_SNAKE_CASE',
        stage: 'schema_generation',
        path: `entities[${i}].tableName`,
        message: `Table name "${entity.tableName}" is not valid snake_case`,
        severity: 'critical',
        suggestedFix: `Convert "${entity.tableName}" to snake_case (e.g. "${toSnakeCase(entity.tableName)}").`,
      });
    }
  }

  return errors;
}

/**
 * Validates that every entity has a tenantId field set to true.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for entities missing tenantId.
 */
export function validateTenantIdPresent(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];
    const hasTenantField = entity.fields.some(
      (f) => f.name === 'tenant_id' || f.name === 'tenantId',
    );
    if (!entity.tenantId || !hasTenantField) {
      errors.push({
        code: 'SCHEMA_MISSING_TENANT_ID',
        stage: 'schema_generation',
        path: `entities[${i}]`,
        message: `Entity "${entity.name}" is missing a tenant_id field`,
        severity: 'critical',
        suggestedFix: `Add a "tenant_id" field of type "uuid" to entity "${entity.name}".`,
      });
    }
  }

  return errors;
}

/**
 * Validates that all field types are members of the FieldType union.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for invalid field types.
 */
export function validateFieldTypes(schema: DataSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  const validSet = new Set<string>(VALID_FIELD_TYPES);

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];
    for (let j = 0; j < entity.fields.length; j++) {
      const field = entity.fields[j];
      if (!validSet.has(field.type)) {
        errors.push({
          code: 'SCHEMA_INVALID_FIELD_TYPE',
          stage: 'schema_generation',
          path: `entities[${i}].fields[${j}].type`,
          message: `Field "${field.name}" in entity "${entity.name}" has invalid type "${field.type}"`,
          severity: 'critical',
          suggestedFix: `Change field type to one of: ${VALID_FIELD_TYPES.join(', ')}.`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates that every entity has at least one primary key field.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for entities missing a primary key.
 */
export function validatePrimaryKeyExists(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];
    const hasPk = entity.fields.some((f) => f.isPrimary);
    if (!hasPk) {
      errors.push({
        code: 'SCHEMA_MISSING_PRIMARY_KEY',
        stage: 'schema_generation',
        path: `entities[${i}]`,
        message: `Entity "${entity.name}" has no primary key field`,
        severity: 'critical',
        suggestedFix: `Add a primary key field (e.g. "id" of type "uuid") to entity "${entity.name}".`,
      });
    }
  }

  return errors;
}

/**
 * Validates that all foreign key references point to entities that exist in the schema.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for dangling foreign key references.
 */
export function validateForeignKeyTargets(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set(schema.entities.map((e) => e.name));

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];

    // Check field-level references
    for (let j = 0; j < entity.fields.length; j++) {
      const field = entity.fields[j];
      if (field.isRelation && field.references) {
        if (!entityNames.has(field.references.entity)) {
          errors.push({
            code: 'SCHEMA_DANGLING_FK',
            stage: 'schema_generation',
            path: `entities[${i}].fields[${j}].references.entity`,
            message: `Field "${field.name}" in "${entity.name}" references non-existent entity "${field.references.entity}"`,
            severity: 'critical',
            suggestedFix: `Ensure entity "${field.references.entity}" exists in the schema, or remove the foreign key reference.`,
          });
        }
      }
    }

    // Check relation-level targets
    for (let k = 0; k < entity.relations.length; k++) {
      const relation = entity.relations[k];
      if (!entityNames.has(relation.targetEntity)) {
        errors.push({
          code: 'SCHEMA_DANGLING_RELATION',
          stage: 'schema_generation',
          path: `entities[${i}].relations[${k}].targetEntity`,
          message: `Relation in "${entity.name}" targets non-existent entity "${relation.targetEntity}"`,
          severity: 'critical',
          suggestedFix: `Ensure entity "${relation.targetEntity}" exists in the schema.`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates that there are no duplicate table names across entities.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for duplicate table names.
 */
export function validateNoDuplicateTableNames(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number>();

  for (let i = 0; i < schema.entities.length; i++) {
    const tableName = schema.entities[i].tableName;
    const previousIndex = seen.get(tableName);

    if (previousIndex !== undefined) {
      errors.push({
        code: 'SCHEMA_DUPLICATE_TABLE_NAME',
        stage: 'schema_generation',
        path: `entities[${i}].tableName`,
        message: `Duplicate table name "${tableName}" found at entities[${previousIndex}] and entities[${i}]`,
        severity: 'critical',
        suggestedFix: `Rename one of the duplicate "${tableName}" tables to be unique.`,
      });
    } else {
      seen.set(tableName, i);
    }
  }

  return errors;
}

/**
 * Validates that there are no duplicate field names within a single entity.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for duplicate field names.
 */
export function validateNoDuplicateFieldNames(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];
    const fieldNamesSeen = new Map<string, number>();

    for (let j = 0; j < entity.fields.length; j++) {
      const fieldName = entity.fields[j].name;
      const previousIndex = fieldNamesSeen.get(fieldName);

      if (previousIndex !== undefined) {
        errors.push({
          code: 'SCHEMA_DUPLICATE_FIELD_NAME',
          stage: 'schema_generation',
          path: `entities[${i}].fields[${j}].name`,
          message: `Duplicate field "${fieldName}" in entity "${entity.name}" at positions ${previousIndex} and ${j}`,
          severity: 'critical',
          suggestedFix: `Remove or rename one of the duplicate "${fieldName}" fields.`,
        });
      } else {
        fieldNamesSeen.set(fieldName, j);
      }
    }
  }

  return errors;
}

/**
 * Validates bidirectional relation consistency.
 * If entity A hasMany entity B, then entity B should belongsTo entity A.
 *
 * @param schema - The data schema to validate.
 * @returns Array of validation errors for missing bidirectional relations.
 */
export function validateBidirectionalRelations(
  schema: DataSchema,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityMap = new Map<string, EntitySchema>();

  for (const entity of schema.entities) {
    entityMap.set(entity.name, entity);
  }

  for (let i = 0; i < schema.entities.length; i++) {
    const entity = schema.entities[i];

    for (let k = 0; k < entity.relations.length; k++) {
      const relation = entity.relations[k];
      const targetEntity = entityMap.get(relation.targetEntity);

      if (!targetEntity) {
        // Already caught by validateForeignKeyTargets
        continue;
      }

      if (relation.type === 'hasMany') {
        const hasInverse = targetEntity.relations.some(
          (r) =>
            r.targetEntity === entity.name && r.type === 'belongsTo',
        );
        if (!hasInverse) {
          errors.push({
            code: 'SCHEMA_MISSING_INVERSE_RELATION',
            stage: 'schema_generation',
            path: `entities[${i}].relations[${k}]`,
            message: `"${entity.name}" hasMany "${relation.targetEntity}" but "${relation.targetEntity}" has no corresponding belongsTo "${entity.name}"`,
            severity: 'warning',
            suggestedFix: `Add a belongsTo relation from "${relation.targetEntity}" to "${entity.name}".`,
          });
        }
      }

      if (relation.type === 'belongsTo') {
        const hasInverse = targetEntity.relations.some(
          (r) =>
            r.targetEntity === entity.name &&
            (r.type === 'hasMany' || r.type === 'hasOne'),
        );
        if (!hasInverse) {
          errors.push({
            code: 'SCHEMA_MISSING_INVERSE_RELATION',
            stage: 'schema_generation',
            path: `entities[${i}].relations[${k}]`,
            message: `"${entity.name}" belongsTo "${relation.targetEntity}" but "${relation.targetEntity}" has no corresponding hasMany/hasOne "${entity.name}"`,
            severity: 'warning',
            suggestedFix: `Add a hasMany or hasOne relation from "${relation.targetEntity}" to "${entity.name}".`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Runs all schema validation rules against the given DataSchema.
 *
 * @param schema - The data schema to validate.
 * @returns Aggregated array of all schema validation errors.
 */
export function runAllSchemaValidations(
  schema: DataSchema,
): ValidationError[] {
  return [
    ...validateSnakeCaseTableNames(schema),
    ...validateTenantIdPresent(schema),
    ...validateFieldTypes(schema),
    ...validatePrimaryKeyExists(schema),
    ...validateForeignKeyTargets(schema),
    ...validateNoDuplicateTableNames(schema),
    ...validateNoDuplicateFieldNames(schema),
    ...validateBidirectionalRelations(schema),
  ];
}

/**
 * Utility: convert a string to snake_case.
 *
 * @param str - The string to convert.
 * @returns The snake_case version of the string.
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .replace(/_+/g, '_')
    .toLowerCase();
}
