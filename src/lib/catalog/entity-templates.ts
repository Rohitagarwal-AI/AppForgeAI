/**
 * @module catalog/entity-templates
 * @description Predefined entity field templates for common domain objects.
 * Every template includes the standard base columns (id, tenant_id,
 * created_at, updated_at) plus domain-specific fields and relations.
 *
 * Templates are referenced by the blueprint generator when the user's
 * app type or prompt maps to one of these well-known entities.
 */

import type { EntityFieldTemplate, EntityTemplate } from '@/types/catalog';

/* ====================================================================
 * Helper: common base fields shared by every entity
 * ==================================================================== */

/** Standard columns present on every table. */
const BASE_FIELDS: readonly EntityFieldTemplate[] = [
  { name: 'id', type: 'uuid', nullable: false, isRelation: false, isPrimary: true, isUnique: true, defaultValue: 'gen_random_uuid()' },
  { name: 'tenant_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'tenants', field: 'id' } },
  { name: 'created_at', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'now()' },
  { name: 'updated_at', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'now()' },
] as const;

/**
 * Builds a complete field list by prepending the base fields.
 */
function withBase(extra: readonly EntityFieldTemplate[]): readonly EntityFieldTemplate[] {
  return [...BASE_FIELDS, ...extra];
}

/* ====================================================================
 * Entity Templates
 * ==================================================================== */

export const ENTITY_TEMPLATES: Readonly<Record<string, EntityTemplate>> = {
  /* ------------------------------------------------------------------ */
  users: {
    name: 'users',
    tableName: 'users',
    fields: withBase([
      { name: 'email', type: 'email', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'password_hash', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'first_name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'last_name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'avatar_url', type: 'url', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'role', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['admin', 'manager', 'user'], defaultValue: 'user' },
      { name: 'is_active', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'true' },
      { name: 'last_login_at', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [],
  },

  /* ------------------------------------------------------------------ */
  contacts: {
    name: 'contacts',
    tableName: 'contacts',
    fields: withBase([
      { name: 'first_name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'last_name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'email', type: 'email', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'phone', type: 'phone', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'company_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'companies', field: 'id' } },
      { name: 'job_title', type: 'string', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'source', type: 'enum', nullable: true, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['web', 'referral', 'social', 'cold_call', 'event', 'other'] },
      { name: 'owner_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'companies', foreignKey: 'company_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'owner_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  companies: {
    name: 'companies',
    tableName: 'companies',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'domain', type: 'string', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'industry', type: 'string', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'size', type: 'enum', nullable: true, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      { name: 'website', type: 'url', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'phone', type: 'phone', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'address', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'owner_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
    ]),
    defaultRelations: [
      { type: 'one_to_many', targetEntity: 'contacts', foreignKey: 'company_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'owner_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  deals: {
    name: 'deals',
    tableName: 'deals',
    fields: withBase([
      { name: 'title', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'value', type: 'decimal', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'stage', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
      { name: 'probability', type: 'integer', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'contact_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'contacts', field: 'id' } },
      { name: 'company_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'companies', field: 'id' } },
      { name: 'owner_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'expected_close_date', type: 'date', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'contacts', foreignKey: 'contact_id' },
      { type: 'many_to_one', targetEntity: 'companies', foreignKey: 'company_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'owner_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  products: {
    name: 'products',
    tableName: 'products',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'slug', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'sku', type: 'string', nullable: true, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'compare_at_price', type: 'decimal', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'cost_price', type: 'decimal', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'category_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'categories', field: 'id' } },
      { name: 'stock_quantity', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
      { name: 'is_published', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
      { name: 'image_url', type: 'url', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'categories', foreignKey: 'category_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  categories: {
    name: 'categories',
    tableName: 'categories',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'slug', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'parent_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'categories', field: 'id' } },
      { name: 'sort_order', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'categories', foreignKey: 'parent_id' },
      { type: 'one_to_many', targetEntity: 'products', foreignKey: 'category_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  orders: {
    name: 'orders',
    tableName: 'orders',
    fields: withBase([
      { name: 'order_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'customer_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] },
      { name: 'subtotal', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'tax', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
      { name: 'discount', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
      { name: 'total', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'shipping_address', type: 'json', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'billing_address', type: 'json', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'customer_id' },
      { type: 'one_to_many', targetEntity: 'order_items', foreignKey: 'order_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  order_items: {
    name: 'order_items',
    tableName: 'order_items',
    fields: withBase([
      { name: 'order_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'orders', field: 'id' } },
      { name: 'product_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'products', field: 'id' } },
      { name: 'quantity', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'unit_price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'total_price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'orders', foreignKey: 'order_id' },
      { type: 'many_to_one', targetEntity: 'products', foreignKey: 'product_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  tasks: {
    name: 'tasks',
    tableName: 'tasks',
    fields: withBase([
      { name: 'title', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['todo', 'in_progress', 'in_review', 'done', 'cancelled'] },
      { name: 'priority', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['low', 'medium', 'high', 'urgent'], defaultValue: 'medium' },
      { name: 'project_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'projects', field: 'id' } },
      { name: 'assignee_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'reporter_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'due_date', type: 'date', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'estimated_hours', type: 'float', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'sort_order', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'projects', foreignKey: 'project_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'assignee_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'reporter_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  projects: {
    name: 'projects',
    tableName: 'projects',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'key', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['planning', 'active', 'on_hold', 'completed', 'archived'] },
      { name: 'owner_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'start_date', type: 'date', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'target_end_date', type: 'date', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'owner_id' },
      { type: 'one_to_many', targetEntity: 'tasks', foreignKey: 'project_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  activities: {
    name: 'activities',
    tableName: 'activities',
    fields: withBase([
      { name: 'type', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['call', 'email', 'meeting', 'note', 'task'] },
      { name: 'subject', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'contact_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'contacts', field: 'id' } },
      { name: 'deal_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'deals', field: 'id' } },
      { name: 'owner_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'due_date', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'is_completed', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'contacts', foreignKey: 'contact_id' },
      { type: 'many_to_one', targetEntity: 'deals', foreignKey: 'deal_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'owner_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  notes: {
    name: 'notes',
    tableName: 'notes',
    fields: withBase([
      { name: 'content', type: 'text', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'entity_type', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'entity_id', type: 'uuid', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'author_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'is_pinned', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'author_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  pipelines: {
    name: 'pipelines',
    tableName: 'pipelines',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'is_default', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
      { name: 'stages', type: 'json', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [],
  },

  /* ------------------------------------------------------------------ */
  tickets: {
    name: 'tickets',
    tableName: 'tickets',
    fields: withBase([
      { name: 'ticket_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'subject', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'description', type: 'text', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] },
      { name: 'priority', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['low', 'medium', 'high', 'critical'], defaultValue: 'medium' },
      { name: 'channel', type: 'enum', nullable: true, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['email', 'chat', 'phone', 'web', 'social'] },
      { name: 'requester_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'assignee_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'due_date', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'resolved_at', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'requester_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'assignee_id' },
      { type: 'one_to_many', targetEntity: 'ticket_comments', foreignKey: 'ticket_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  ticket_comments: {
    name: 'ticket_comments',
    tableName: 'ticket_comments',
    fields: withBase([
      { name: 'ticket_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'tickets', field: 'id' } },
      { name: 'author_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'content', type: 'text', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'is_internal', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'tickets', foreignKey: 'ticket_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'author_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  employees: {
    name: 'employees',
    tableName: 'employees',
    fields: withBase([
      { name: 'employee_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'user_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: true, references: { entity: 'users', field: 'id' } },
      { name: 'department_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'departments', field: 'id' } },
      { name: 'job_title', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'hire_date', type: 'date', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'employment_type', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['full_time', 'part_time', 'contract', 'intern'] },
      { name: 'salary', type: 'decimal', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'manager_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'employees', field: 'id' } },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['active', 'on_leave', 'terminated'], defaultValue: 'active' },
    ]),
    defaultRelations: [
      { type: 'one_to_one', targetEntity: 'users', foreignKey: 'user_id' },
      { type: 'many_to_one', targetEntity: 'departments', foreignKey: 'department_id' },
      { type: 'many_to_one', targetEntity: 'employees', foreignKey: 'manager_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  departments: {
    name: 'departments',
    tableName: 'departments',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'code', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'head_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'employees', field: 'id' } },
      { name: 'parent_department_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'departments', field: 'id' } },
    ]),
    defaultRelations: [
      { type: 'one_to_many', targetEntity: 'employees', foreignKey: 'department_id' },
      { type: 'many_to_one', targetEntity: 'employees', foreignKey: 'head_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  invoices: {
    name: 'invoices',
    tableName: 'invoices',
    fields: withBase([
      { name: 'invoice_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'customer_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'contacts', field: 'id' } },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'void'] },
      { name: 'issue_date', type: 'date', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'due_date', type: 'date', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'subtotal', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'tax', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
      { name: 'total', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'contacts', foreignKey: 'customer_id' },
      { type: 'one_to_many', targetEntity: 'invoice_items', foreignKey: 'invoice_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  invoice_items: {
    name: 'invoice_items',
    tableName: 'invoice_items',
    fields: withBase([
      { name: 'invoice_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'invoices', field: 'id' } },
      { name: 'description', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'quantity', type: 'float', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'unit_price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'total_price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'invoices', foreignKey: 'invoice_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  articles: {
    name: 'articles',
    tableName: 'articles',
    fields: withBase([
      { name: 'title', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'slug', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'content', type: 'text', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'excerpt', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['draft', 'review', 'published', 'archived'] },
      { name: 'author_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'category_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'categories', field: 'id' } },
      { name: 'featured_image_url', type: 'url', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'published_at', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'view_count', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'author_id' },
      { type: 'many_to_one', targetEntity: 'categories', foreignKey: 'category_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  comments: {
    name: 'comments',
    tableName: 'comments',
    fields: withBase([
      { name: 'content', type: 'text', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'entity_type', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'entity_id', type: 'uuid', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'author_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'parent_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'comments', field: 'id' } },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'author_id' },
      { type: 'many_to_one', targetEntity: 'comments', foreignKey: 'parent_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  bookings: {
    name: 'bookings',
    tableName: 'bookings',
    fields: withBase([
      { name: 'booking_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'customer_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'service_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'services', field: 'id' } },
      { name: 'provider_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'start_time', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'end_time', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] },
      { name: 'total_price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'customer_id' },
      { type: 'many_to_one', targetEntity: 'services', foreignKey: 'service_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'provider_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  services: {
    name: 'services',
    tableName: 'services',
    fields: withBase([
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'duration_minutes', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'is_active', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'true' },
      { name: 'category_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'categories', field: 'id' } },
    ]),
    defaultRelations: [
      { type: 'one_to_many', targetEntity: 'bookings', foreignKey: 'service_id' },
      { type: 'many_to_one', targetEntity: 'categories', foreignKey: 'category_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  patients: {
    name: 'patients',
    tableName: 'patients',
    fields: withBase([
      { name: 'patient_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'user_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: true, references: { entity: 'users', field: 'id' } },
      { name: 'first_name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'last_name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'date_of_birth', type: 'date', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'gender', type: 'enum', nullable: true, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['male', 'female', 'other', 'prefer_not_to_say'] },
      { name: 'phone', type: 'phone', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'email', type: 'email', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'blood_type', type: 'enum', nullable: true, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { name: 'allergies', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'emergency_contact', type: 'json', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'one_to_one', targetEntity: 'users', foreignKey: 'user_id' },
      { type: 'one_to_many', targetEntity: 'appointments', foreignKey: 'patient_id' },
      { type: 'one_to_many', targetEntity: 'medical_records', foreignKey: 'patient_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  appointments: {
    name: 'appointments',
    tableName: 'appointments',
    fields: withBase([
      { name: 'patient_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'patients', field: 'id' } },
      { name: 'doctor_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'start_time', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'end_time', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'] },
      { name: 'type', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['consultation', 'follow_up', 'emergency', 'routine_checkup'] },
      { name: 'reason', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'patients', foreignKey: 'patient_id' },
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'doctor_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  courses: {
    name: 'courses',
    tableName: 'courses',
    fields: withBase([
      { name: 'title', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'slug', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'description', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'instructor_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'category_id', type: 'uuid', nullable: true, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'categories', field: 'id' } },
      { name: 'price', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'level', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['beginner', 'intermediate', 'advanced'] },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['draft', 'published', 'archived'] },
      { name: 'thumbnail_url', type: 'url', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'duration_hours', type: 'float', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'instructor_id' },
      { type: 'many_to_one', targetEntity: 'categories', foreignKey: 'category_id' },
      { type: 'one_to_many', targetEntity: 'lessons', foreignKey: 'course_id' },
      { type: 'one_to_many', targetEntity: 'enrollments', foreignKey: 'course_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  lessons: {
    name: 'lessons',
    tableName: 'lessons',
    fields: withBase([
      { name: 'title', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'content', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'course_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'courses', field: 'id' } },
      { name: 'sort_order', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
      { name: 'duration_minutes', type: 'integer', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'video_url', type: 'url', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'is_free', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'courses', foreignKey: 'course_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  enrollments: {
    name: 'enrollments',
    tableName: 'enrollments',
    fields: withBase([
      { name: 'student_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'course_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'courses', field: 'id' } },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['active', 'completed', 'dropped', 'expired'] },
      { name: 'enrolled_at', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'now()' },
      { name: 'completed_at', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'progress_percent', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: '0' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'student_id' },
      { type: 'many_to_one', targetEntity: 'courses', foreignKey: 'course_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  reviews: {
    name: 'reviews',
    tableName: 'reviews',
    fields: withBase([
      { name: 'entity_type', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'entity_id', type: 'uuid', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'author_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'rating', type: 'integer', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'title', type: 'string', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'content', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'is_verified', type: 'boolean', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'false' },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'author_id' },
    ],
  },

  /* ------------------------------------------------------------------ */
  payments: {
    name: 'payments',
    tableName: 'payments',
    fields: withBase([
      { name: 'payment_number', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: true },
      { name: 'payer_id', type: 'uuid', nullable: false, isRelation: true, isPrimary: false, isUnique: false, references: { entity: 'users', field: 'id' } },
      { name: 'amount', type: 'decimal', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'currency', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false, defaultValue: 'USD' },
      { name: 'method', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'wallet', 'other'] },
      { name: 'status', type: 'enum', nullable: false, isRelation: false, isPrimary: false, isUnique: false, enumValues: ['pending', 'completed', 'failed', 'refunded', 'cancelled'] },
      { name: 'external_reference', type: 'string', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'paid_at', type: 'datetime', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'notes', type: 'text', nullable: true, isRelation: false, isPrimary: false, isUnique: false },
    ]),
    defaultRelations: [
      { type: 'many_to_one', targetEntity: 'users', foreignKey: 'payer_id' },
    ],
  },
} as const;

/**
 * Returns the template for a given entity slug, or `undefined`
 * if the slug is not recognized.
 *
 * @param name - Entity template slug (e.g. "users", "contacts").
 */
export function getEntityTemplate(name: string): EntityTemplate | undefined {
  return ENTITY_TEMPLATES[name];
}

/**
 * Returns all registered entity template slugs.
 */
export function getEntityTemplateSlugs(): readonly string[] {
  return Object.keys(ENTITY_TEMPLATES);
}

/**
 * Returns all registered entity templates as an array.
 */
export function getAllEntityTemplates(): readonly EntityTemplate[] {
  return Object.values(ENTITY_TEMPLATES);
}
