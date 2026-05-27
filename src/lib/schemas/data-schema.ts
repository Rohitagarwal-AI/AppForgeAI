/**
 * @module lib/schemas/data-schema
 * @description Zod validation schemas for Stage 2 — Data Schema Generation.
 * Mirrors the FieldSchema, Relation, EntitySchema, and DataSchema interfaces
 * from @/types/schema.
 */

import { z } from 'zod';

/** Zod schema for supported column / field types. */
export const fieldTypeSchema = z.union([
  z.literal('string'),
  z.literal('number'),
  z.literal('integer'),
  z.literal('float'),
  z.literal('decimal'),
  z.literal('boolean'),
  z.literal('date'),
  z.literal('datetime'),
  z.literal('json'),
  z.literal('uuid'),
  z.literal('text'),
  z.literal('email'),
  z.literal('url'),
  z.literal('phone'),
  z.literal('enum'),
]);

/** Zod schema for supported relation cardinalities. */
export const relationTypeSchema = z.union([
  z.literal('hasMany'),
  z.literal('belongsTo'),
  z.literal('hasOne'),
]);

/**
 * Zod schema for FieldSchema — a single column within an entity.
 */
export const fieldSchemaSchema = z.object({
  /** Column name (camelCase in TypeScript, snake_case in DB). */
  name: z.string().min(1, 'Field name must not be empty'),

  /** Data type of the field. */
  type: fieldTypeSchema,

  /** Whether the field accepts null values. */
  nullable: z.boolean(),

  /** Whether this field represents a foreign-key relation. */
  isRelation: z.boolean(),

  /** Whether this field is the primary key. */
  isPrimary: z.boolean(),

  /** Whether a unique constraint is enforced on this field. */
  isUnique: z.boolean(),

  /** Optional default value for the field. */
  defaultValue: z
    .union([z.string(), z.number(), z.boolean(), z.null()])
    .optional(),

  /** Allowed values when type is 'enum'. */
  enumValues: z.array(z.string()).optional(),

  /** Foreign-key reference when isRelation is true. */
  references: z
    .object({
      entity: z.string().min(1),
      field: z.string().min(1),
    })
    .optional(),
});

/**
 * Zod schema for Relation — a directional relationship between two entities.
 */
export const relationSchema = z.object({
  /** Cardinality of the relation. */
  type: relationTypeSchema,

  /** Name of the target entity. */
  targetEntity: z.string().min(1, 'Target entity must not be empty'),

  /** Foreign key column name that establishes the link. */
  foreignKey: z.string().min(1, 'Foreign key must not be empty'),
});

/**
 * Zod schema for EntitySchema — full schema definition for a single domain entity.
 */
export const entitySchemaSchema = z.object({
  /** Logical entity name (PascalCase, e.g. "OrderItem"). */
  name: z.string().min(1, 'Entity name must not be empty'),

  /** Database table name (snake_case, e.g. "order_items"). */
  tableName: z.string().min(1, 'Table name must not be empty'),

  /** Ordered list of fields belonging to this entity. */
  fields: z.array(fieldSchemaSchema).min(1, 'At least one field is required'),

  /** Relations this entity participates in. */
  relations: z.array(relationSchema),

  /** Tenant isolation flag — always true; every entity is tenant-scoped. */
  tenantId: z.literal(true),
});

/**
 * Zod schema for DataSchema — the complete data model emitted by Stage 2.
 */
export const dataSchemaSchema = z.object({
  /** All entities in the generated application. */
  entities: z
    .array(entitySchemaSchema)
    .min(1, 'At least one entity is required'),

  /** Semantic version of the schema (e.g. "1.0.0"). */
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (e.g. "1.0.0")'),
});

/** Inferred TypeScript types from the Zod schemas. */
export type ValidatedFieldSchema = z.infer<typeof fieldSchemaSchema>;
export type ValidatedRelation = z.infer<typeof relationSchema>;
export type ValidatedEntitySchema = z.infer<typeof entitySchemaSchema>;
export type ValidatedDataSchema = z.infer<typeof dataSchemaSchema>;
