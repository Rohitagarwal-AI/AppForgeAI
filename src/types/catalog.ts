/**
 * @module types/catalog
 * @description Type definitions for the domain catalog system — app types,
 * entity templates, field types, and keyword dictionaries.
 */

/** Supported column / field types in entity schemas. */
export type FieldType =
  | 'uuid'
  | 'string'
  | 'text'
  | 'integer'
  | 'float'
  | 'decimal'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'json'
  | 'enum'
  | 'email'
  | 'url'
  | 'phone';

/** Relation cardinality between entities. */
export type RelationType = 'one_to_many' | 'many_to_one' | 'many_to_many' | 'one_to_one';

/**
 * Definition of a single field within an entity template.
 */
export interface EntityFieldTemplate {
  /** Column / property name (snake_case). */
  readonly name: string;
  /** Data type of the field. */
  readonly type: FieldType;
  /** Whether the column allows NULL values. */
  readonly nullable: boolean;
  /** If true, this field references another entity. */
  readonly isRelation: boolean;
  /** If true, this is the primary key. */
  readonly isPrimary: boolean;
  /** If true, a UNIQUE constraint is applied. */
  readonly isUnique: boolean;
  /** Foreign key reference details (only when isRelation is true). */
  readonly references?: Readonly<{ entity: string; field: string }>;
  /** Default value expression (e.g. "now()", "gen_random_uuid()"). */
  readonly defaultValue?: string;
  /** Allowed values when type is "enum". */
  readonly enumValues?: readonly string[];
}

/**
 * A relation defined at the entity-template level.
 */
export interface EntityRelation {
  /** Cardinality type. */
  readonly type: RelationType;
  /** The target entity this relation points to. */
  readonly targetEntity: string;
  /** The foreign key column in the owning table. */
  readonly foreignKey: string;
}

/**
 * Complete template for an entity including fields and default relations.
 */
export interface EntityTemplate {
  /** Logical entity name (camelCase singular or snake_case). */
  readonly name: string;
  /** Database table name (snake_case, plural). */
  readonly tableName: string;
  /** Ordered list of fields. */
  readonly fields: readonly EntityFieldTemplate[];
  /** Default relations this entity participates in. */
  readonly defaultRelations: readonly EntityRelation[];
}

/**
 * High-level definition of an application archetype (e.g. CRM, e-commerce).
 */
export interface AppTypeDefinition {
  /** Unique slug (e.g. "crm"). */
  readonly type: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Short description of the app archetype. */
  readonly description: string;
  /** Feature slugs enabled by default. */
  readonly defaultFeatures: readonly string[];
  /** Entity slugs included by default. */
  readonly defaultEntities: readonly string[];
  /** Role slugs available by default. */
  readonly defaultRoles: readonly string[];
}

/**
 * A pair of keywords that conflict when both appear in a prompt.
 */
export interface ConflictPattern {
  /** The two conflicting keywords / phrases. */
  readonly keywords: readonly [string, string];
  /** Machine-readable conflict identifier. */
  readonly conflict: string;
  /** Human-readable explanation of why they conflict. */
  readonly reason: string;
}
