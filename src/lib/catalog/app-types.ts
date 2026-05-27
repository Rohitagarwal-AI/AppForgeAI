/**
 * @module catalog/app-types
 * @description Map of application archetypes to their default features,
 * entities, and roles. Used during intent extraction and blueprint generation
 * to bootstrap a new project from a recognized domain.
 */

import type { AppTypeDefinition } from '@/types/catalog';

/**
 * Complete registry of supported application archetypes.
 *
 * Each entry describes a vertical / domain and provides sensible defaults so
 * the pipeline can immediately scaffold a working app when the user's prompt
 * matches one of these types.
 */
export const APP_TYPE_DEFINITIONS: Readonly<Record<string, AppTypeDefinition>> = {
  /* ------------------------------------------------------------------ */
  crm: {
    type: 'crm',
    displayName: 'CRM',
    description: 'Customer Relationship Management — track contacts, companies, deals, and sales pipelines',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'import_export', 'audit_log'],
    defaultEntities: ['users', 'contacts', 'companies', 'deals', 'activities', 'notes', 'pipelines'],
    defaultRoles: ['admin', 'manager', 'agent'],
  },

  /* ------------------------------------------------------------------ */
  ecommerce: {
    type: 'ecommerce',
    displayName: 'E-Commerce',
    description: 'Online storefront with product catalog, cart, checkout, and order management',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'payments', 'analytics', 'reviews', 'file_upload'],
    defaultEntities: ['users', 'products', 'categories', 'orders', 'order_items', 'carts', 'reviews', 'coupons', 'addresses'],
    defaultRoles: ['admin', 'vendor', 'customer'],
  },

  /* ------------------------------------------------------------------ */
  project_management: {
    type: 'project_management',
    displayName: 'Project Management',
    description: 'Plan, track, and deliver projects with tasks, sprints, and team collaboration',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'comments', 'file_upload', 'kanban'],
    defaultEntities: ['users', 'projects', 'tasks', 'sprints', 'comments', 'labels', 'attachments', 'milestones'],
    defaultRoles: ['admin', 'project_manager', 'developer', 'viewer'],
  },

  /* ------------------------------------------------------------------ */
  inventory: {
    type: 'inventory',
    displayName: 'Inventory Management',
    description: 'Warehouse and stock management with real-time tracking, purchase orders, and supplier management',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'import_export', 'barcode'],
    defaultEntities: ['users', 'products', 'warehouses', 'inventory_items', 'purchase_orders', 'suppliers', 'stock_movements', 'categories'],
    defaultRoles: ['admin', 'warehouse_manager', 'clerk'],
  },

  /* ------------------------------------------------------------------ */
  analytics: {
    type: 'analytics',
    displayName: 'Analytics Dashboard',
    description: 'Data visualization and business intelligence platform with customizable dashboards and reports',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'analytics', 'import_export', 'export_pdf', 'scheduling'],
    defaultEntities: ['users', 'dashboards', 'widgets', 'data_sources', 'reports', 'scheduled_reports', 'filters'],
    defaultRoles: ['admin', 'analyst', 'viewer'],
  },

  /* ------------------------------------------------------------------ */
  content_platform: {
    type: 'content_platform',
    displayName: 'Content Platform',
    description: 'CMS / blog / knowledge-base for creating, publishing, and managing written content',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'comments', 'file_upload', 'rich_text_editor', 'seo'],
    defaultEntities: ['users', 'articles', 'categories', 'tags', 'comments', 'media', 'pages'],
    defaultRoles: ['admin', 'editor', 'author', 'subscriber'],
  },

  /* ------------------------------------------------------------------ */
  hr_tool: {
    type: 'hr_tool',
    displayName: 'HR Management',
    description: 'Human Resources tool for employee records, leave management, payroll, and recruitment',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'import_export', 'calendar'],
    defaultEntities: ['users', 'employees', 'departments', 'leave_requests', 'payroll_records', 'job_postings', 'applicants', 'attendance'],
    defaultRoles: ['admin', 'hr_manager', 'employee'],
  },

  /* ------------------------------------------------------------------ */
  booking: {
    type: 'booking',
    displayName: 'Booking / Reservation',
    description: 'Appointment scheduling and reservation platform for services, venues, or resources',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'payments', 'calendar', 'analytics'],
    defaultEntities: ['users', 'services', 'bookings', 'time_slots', 'payments', 'reviews', 'locations'],
    defaultRoles: ['admin', 'provider', 'customer'],
  },

  /* ------------------------------------------------------------------ */
  support_desk: {
    type: 'support_desk',
    displayName: 'Support / Help Desk',
    description: 'Customer support system with ticketing, knowledge base, and SLA tracking',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'comments', 'sla_tracking', 'knowledge_base'],
    defaultEntities: ['users', 'tickets', 'ticket_comments', 'knowledge_articles', 'teams', 'sla_policies', 'canned_responses', 'tags'],
    defaultRoles: ['admin', 'agent', 'customer'],
  },

  /* ------------------------------------------------------------------ */
  finance: {
    type: 'finance',
    displayName: 'Finance / Accounting',
    description: 'Financial management with invoicing, expense tracking, and reporting',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'import_export', 'audit_log', 'payments'],
    defaultEntities: ['users', 'accounts', 'transactions', 'invoices', 'invoice_items', 'expenses', 'budgets', 'tax_rates', 'payment_methods'],
    defaultRoles: ['admin', 'accountant', 'auditor', 'viewer'],
  },

  /* ------------------------------------------------------------------ */
  healthcare: {
    type: 'healthcare',
    displayName: 'Healthcare / Clinic',
    description: 'Patient management system with appointments, medical records, and prescriptions',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'calendar', 'audit_log', 'file_upload'],
    defaultEntities: ['users', 'patients', 'appointments', 'medical_records', 'prescriptions', 'doctors', 'departments', 'vitals'],
    defaultRoles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient'],
  },

  /* ------------------------------------------------------------------ */
  learning: {
    type: 'learning',
    displayName: 'Learning Management (LMS)',
    description: 'Online learning platform with courses, lessons, quizzes, and progress tracking',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search', 'notifications', 'analytics', 'file_upload', 'comments', 'payments', 'certificates'],
    defaultEntities: ['users', 'courses', 'lessons', 'quizzes', 'quiz_questions', 'enrollments', 'progress_records', 'certificates', 'categories'],
    defaultRoles: ['admin', 'instructor', 'student'],
  },

  /* ------------------------------------------------------------------ */
  custom: {
    type: 'custom',
    displayName: 'Custom Application',
    description: 'Fully custom application — features, entities, and roles are inferred from the user prompt',
    defaultFeatures: ['auth', 'rbac', 'dashboard', 'search'],
    defaultEntities: ['users'],
    defaultRoles: ['admin', 'user'],
  },
} as const;

/**
 * Returns the definition for a given app type slug, or `undefined`
 * if the slug is not recognized.
 *
 * @param type - App type slug (e.g. "crm", "ecommerce").
 */
export function getAppTypeDefinition(type: string): AppTypeDefinition | undefined {
  return APP_TYPE_DEFINITIONS[type];
}

/**
 * Returns all registered app type slugs.
 */
export function getAppTypeSlugs(): readonly string[] {
  return Object.keys(APP_TYPE_DEFINITIONS);
}

/**
 * Returns all registered app type definitions as an array.
 */
export function getAllAppTypeDefinitions(): readonly AppTypeDefinition[] {
  return Object.values(APP_TYPE_DEFINITIONS);
}
