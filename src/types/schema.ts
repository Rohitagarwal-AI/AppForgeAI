/**
 * @module types/schema
 * @description Type definitions for Stage 2 — Data Schema Generation.
 * Defines the entity/field model that backs every generated application,
 * including relations, primary keys, enums, and tenant isolation.
 */

/** Supported column / field types for entity fields. */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'uuid'
  | 'text'
  | 'email'
  | 'enum';

/** Supported relation cardinalities between entities. */
export type RelationType = 'hasMany' | 'belongsTo' | 'hasOne';

/**
 * FieldSchema — describes a single column within an entity.
 */
export interface FieldSchema {
  /** Column name (camelCase in TypeScript, snake_case in DB). */
  name: string;

  /** Data type of the field. */
  type: FieldType;

  /** Whether the field accepts null values. */
  nullable: boolean;

  /** Whether this field represents a foreign-key relation. */
  isRelation: boolean;

  /** Whether this field is the primary key. */
  isPrimary: boolean;

  /** Whether a unique constraint is enforced on this field. */
  isUnique: boolean;

  /** Optional default value for the field. */
  defaultValue?: string | number | boolean | null;

  /** Allowed values when `type` is `'enum'`. */
  enumValues?: string[];

  /** Foreign-key reference when `isRelation` is true. */
  references?: { entity: string; field: string };
}

/**
 * Relation — a directional relationship between two entities.
 */
export interface Relation {
  /** Cardinality of the relation. */
  type: RelationType;

  /** Name of the target entity. */
  targetEntity: string;

  /** Foreign key column name that establishes the link. */
  foreignKey: string;
}

/**
 * EntitySchema — full schema definition for a single domain entity.
 */
export interface EntitySchema {
  /** Logical entity name (PascalCase, e.g. "OrderItem"). */
  name: string;

  /** Database table name (snake_case, e.g. "order_items"). */
  tableName: string;

  /** Ordered list of fields belonging to this entity. */
  fields: FieldSchema[];

  /** Relations this entity participates in. */
  relations: Relation[];

  /** Tenant isolation flag — always true; every entity is tenant-scoped. */
  tenantId: true;
}

/**
 * DataSchema — the complete data model emitted by Stage 2.
 */
export interface DataSchema {
  /** All entities in the generated application. */
  entities: EntitySchema[];

  /** Semantic version of the schema (e.g. "1.0.0"). */
  version: string;
}
