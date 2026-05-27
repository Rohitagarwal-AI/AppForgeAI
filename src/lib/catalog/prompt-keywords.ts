/**
 * @module catalog/prompt-keywords
 * @description Keyword dictionaries used during intent extraction to classify
 * user prompts into app types, features, entities, and integrations.
 * Also includes vague-term detection and conflict-pattern matching.
 */

import type { ConflictPattern } from '@/types/catalog';

/* ====================================================================
 * Domain keywords — map an app-type slug to terms that indicate it.
 * ==================================================================== */

/** Keywords that signal a particular application domain / archetype. */
export const DOMAIN_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  crm: ['crm', 'customer relationship', 'customer management', 'lead', 'pipeline', 'deal', 'sales', 'prospect', 'account management', 'salesforce'],
  ecommerce: ['ecommerce', 'e-commerce', 'store', 'shop', 'product', 'cart', 'checkout', 'order', 'payment', 'marketplace', 'storefront', 'shopify'],
  project_management: ['project management', 'task management', 'kanban', 'sprint', 'scrum', 'agile', 'backlog', 'milestone', 'jira', 'trello', 'asana'],
  inventory: ['inventory', 'warehouse', 'stock', 'supply chain', 'purchase order', 'supplier', 'sku', 'barcode', 'stock management'],
  analytics: ['analytics', 'dashboard', 'business intelligence', 'bi', 'data visualization', 'reporting', 'kpi', 'metrics', 'charts'],
  content_platform: ['cms', 'content management', 'blog', 'publishing', 'articles', 'knowledge base', 'wiki', 'editorial', 'wordpress'],
  hr_tool: ['hr', 'human resources', 'employee', 'payroll', 'leave management', 'recruitment', 'hiring', 'onboarding', 'attendance', 'talent'],
  booking: ['booking', 'reservation', 'appointment', 'scheduling', 'calendar booking', 'slot', 'availability', 'time slot'],
  support_desk: ['support', 'help desk', 'helpdesk', 'ticketing', 'ticket', 'customer support', 'service desk', 'zendesk', 'freshdesk', 'sla'],
  finance: ['finance', 'accounting', 'invoice', 'billing', 'expense', 'budget', 'ledger', 'tax', 'financial', 'quickbooks', 'xero'],
  healthcare: ['healthcare', 'clinic', 'hospital', 'patient', 'medical', 'ehr', 'emr', 'prescription', 'doctor', 'appointment', 'health record', 'telemedicine'],
  learning: ['lms', 'learning', 'course', 'online learning', 'e-learning', 'elearning', 'training', 'lesson', 'quiz', 'student', 'instructor', 'udemy', 'coursera'],
  custom: ['custom', 'bespoke', 'general purpose'],
} as const;

/* ====================================================================
 * Feature keywords — map a feature slug to user-facing terms.
 * ==================================================================== */

/** Keywords that indicate a particular feature should be enabled. */
export const FEATURE_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  auth: ['login', 'signup', 'sign up', 'sign in', 'authentication', 'auth', 'password', 'register', 'sso', 'oauth', 'magic link'],
  rbac: ['rbac', 'role', 'permission', 'access control', 'role based', 'authorization', 'privilege'],
  dashboard: ['dashboard', 'overview', 'home page', 'admin panel', 'control panel', 'summary page'],
  search: ['search', 'filter', 'find', 'lookup', 'full text search', 'autocomplete', 'query'],
  notifications: ['notification', 'alert', 'notify', 'email notification', 'push notification', 'in-app notification', 'reminder'],
  analytics: ['analytics', 'metrics', 'chart', 'graph', 'report', 'statistics', 'kpi', 'data analysis', 'insights'],
  payments: ['payment', 'pay', 'checkout', 'billing', 'subscription', 'invoice', 'charge', 'stripe', 'paypal', 'credit card'],
  import_export: ['import', 'export', 'csv', 'excel', 'bulk upload', 'data import', 'data export', 'spreadsheet'],
  file_upload: ['file upload', 'upload', 'attachment', 'image upload', 'document', 'media', 'file storage'],
  comments: ['comment', 'reply', 'discussion', 'thread', 'feedback', 'mention'],
  audit_log: ['audit', 'audit log', 'activity log', 'history', 'changelog', 'tracking'],
  calendar: ['calendar', 'scheduling', 'date picker', 'event', 'agenda', 'timeline'],
  kanban: ['kanban', 'board', 'drag and drop', 'column', 'card view', 'board view'],
  rich_text_editor: ['rich text', 'wysiwyg', 'editor', 'markdown', 'text editor', 'formatting'],
  seo: ['seo', 'meta tags', 'sitemap', 'open graph', 'search engine', 'structured data'],
  reviews: ['review', 'rating', 'star rating', 'testimonial', 'feedback form'],
  export_pdf: ['pdf', 'pdf export', 'print', 'generate pdf', 'download pdf'],
  sla_tracking: ['sla', 'service level', 'response time', 'resolution time', 'escalation'],
  knowledge_base: ['knowledge base', 'kb', 'faq', 'help center', 'self service', 'documentation'],
  certificates: ['certificate', 'certification', 'badge', 'credential', 'completion certificate'],
  barcode: ['barcode', 'qr code', 'scanner', 'label', 'barcode scan'],
  scheduling: ['schedule', 'cron', 'scheduled task', 'recurring', 'automation'],
  multi_language: ['multi language', 'i18n', 'internationalization', 'translation', 'localization', 'multilingual'],
  dark_mode: ['dark mode', 'theme', 'light mode', 'color scheme', 'appearance'],
  two_factor: ['2fa', 'two factor', 'mfa', 'multi factor', 'totp', 'authenticator'],
} as const;

/* ====================================================================
 * Entity keywords — map an entity slug to natural-language terms.
 * ==================================================================== */

/** Keywords that indicate a particular entity should be created. */
export const ENTITY_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  contacts: ['contact', 'client', 'customer', 'person', 'lead'],
  companies: ['company', 'organization', 'business', 'firm', 'account'],
  deals: ['deal', 'opportunity', 'sale', 'pipeline item', 'negotiation'],
  activities: ['activity', 'interaction', 'call', 'meeting', 'follow up'],
  users: ['user', 'member', 'account', 'profile', 'login'],
  products: ['product', 'item', 'good', 'merchandise', 'listing'],
  categories: ['category', 'group', 'type', 'classification', 'tag'],
  orders: ['order', 'purchase', 'transaction', 'checkout'],
  order_items: ['order item', 'line item', 'order line', 'cart item'],
  carts: ['cart', 'shopping cart', 'basket'],
  tasks: ['task', 'to-do', 'todo', 'action item', 'work item', 'issue'],
  projects: ['project', 'workspace', 'initiative', 'program'],
  sprints: ['sprint', 'iteration', 'cycle', 'phase'],
  tickets: ['ticket', 'support ticket', 'case', 'request', 'incident'],
  employees: ['employee', 'staff', 'worker', 'team member', 'personnel'],
  departments: ['department', 'division', 'team', 'unit', 'group'],
  invoices: ['invoice', 'bill', 'receipt', 'statement'],
  payments: ['payment', 'charge', 'refund', 'payout', 'disbursement'],
  articles: ['article', 'post', 'blog post', 'content', 'entry', 'page'],
  comments: ['comment', 'reply', 'response', 'note'],
  bookings: ['booking', 'reservation', 'appointment', 'slot'],
  services: ['service', 'offering', 'service item', 'service type'],
  patients: ['patient', 'medical patient', 'client'],
  appointments: ['appointment', 'visit', 'consultation', 'session'],
  courses: ['course', 'class', 'program', 'curriculum', 'training'],
  lessons: ['lesson', 'module', 'chapter', 'lecture', 'unit'],
  enrollments: ['enrollment', 'registration', 'subscription', 'sign up'],
  reviews: ['review', 'rating', 'testimonial', 'evaluation'],
  notes: ['note', 'memo', 'annotation', 'remark'],
  pipelines: ['pipeline', 'funnel', 'workflow', 'process'],
} as const;

/* ====================================================================
 * Integration keywords — map an integration slug to natural-language terms.
 * ==================================================================== */

/** Keywords that indicate a particular third-party integration. */
export const INTEGRATION_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  slack: ['slack', 'slack notification', 'slack message', 'slack channel', 'slack bot'],
  whatsapp: ['whatsapp', 'wa notification', 'whatsapp message', 'wa message', 'whatsapp bot'],
  gmail: ['gmail', 'email', 'mail', 'send email', 'email notification', 'smtp', 'inbox'],
  stripe: ['stripe', 'payment gateway', 'payment processing', 'billing system', 'credit card processing', 'subscription billing'],
  jira: ['jira', 'issue tracker', 'jira integration', 'jira ticket', 'atlassian'],
  google_sheets: ['sheets', 'spreadsheet', 'google sheets', 'google spreadsheet', 'sheet sync', 'excel online'],
  webhook: ['webhook', 'api hook', 'http callback', 'web hook', 'outgoing webhook', 'incoming webhook'],
} as const;

/* ====================================================================
 * Vague / ambiguous terms
 * ==================================================================== */

/**
 * Terms that are too generic to infer a concrete app type from.
 * When a prompt *only* contains these words (no domain keywords),
 * the system should ask clarifying questions.
 */
export const VAGUE_TERMS: readonly string[] = [
  'app',
  'application',
  'platform',
  'tool',
  'system',
  'website',
  'web app',
  'thing',
  'something',
  'software',
  'solution',
  'portal',
  'service',
  'site',
  'program',
] as const;

/* ====================================================================
 * Conflict patterns — mutually exclusive requirements
 * ==================================================================== */

/**
 * Pairs of requirements that contradict each other. Used during intent
 * validation to surface ambiguity early rather than generating an
 * impossible blueprint.
 */
export const CONFLICT_PATTERNS: readonly ConflictPattern[] = [
  {
    keywords: ['no login', 'admin'],
    conflict: 'no_login_with_admin_roles',
    reason: 'Admin roles require an authentication system, but the prompt requests no login.',
  },
  {
    keywords: ['free only', 'premium'],
    conflict: 'free_only_with_premium',
    reason: 'A free-only app cannot have premium / paid tiers.',
  },
  {
    keywords: ['no database', 'crud'],
    conflict: 'no_database_with_crud',
    reason: 'CRUD operations require a database, but the prompt requests no database.',
  },
  {
    keywords: ['single user', 'multi-tenant'],
    conflict: 'single_user_with_multi_tenant',
    reason: 'A single-user app cannot be multi-tenant.',
  },
  {
    keywords: ['offline only', 'real-time'],
    conflict: 'offline_only_with_realtime',
    reason: 'Offline-only mode conflicts with real-time sync requirements.',
  },
  {
    keywords: ['no email', 'email verification'],
    conflict: 'no_email_with_verification',
    reason: 'Email verification requires email functionality.',
  },
  {
    keywords: ['static site', 'user accounts'],
    conflict: 'static_site_with_user_accounts',
    reason: 'A static site cannot manage user accounts without a backend.',
  },
  {
    keywords: ['public only', 'rbac'],
    conflict: 'public_only_with_rbac',
    reason: 'Role-based access control requires user authentication, conflicting with a public-only app.',
  },
  {
    keywords: ['no api', 'webhook'],
    conflict: 'no_api_with_webhook',
    reason: 'Webhooks require an API endpoint to receive or send payloads.',
  },
  {
    keywords: ['no payments', 'subscription'],
    conflict: 'no_payments_with_subscription',
    reason: 'Subscription management requires payment processing.',
  },
  {
    keywords: ['read only', 'create'],
    conflict: 'read_only_with_create',
    reason: 'A read-only app cannot allow creating new records.',
  },
  {
    keywords: ['anonymous', 'audit log'],
    conflict: 'anonymous_with_audit_log',
    reason: 'Audit logs track user actions, but anonymous access has no user identity to log.',
  },
] as const;

/* ====================================================================
 * Lookup helpers
 * ==================================================================== */

/**
 * Given a lowercased prompt string, returns all matching domain slugs.
 *
 * @param prompt - Lowercased user prompt.
 * @returns Array of matching app-type slugs sorted by match count (desc).
 */
export function matchDomainKeywords(prompt: string): string[] {
  const scores: Array<{ slug: string; count: number }> = [];

  for (const [slug, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (prompt.includes(kw)) {
        count++;
      }
    }
    if (count > 0) {
      scores.push({ slug, count });
    }
  }

  return scores.sort((a, b) => b.count - a.count).map((s) => s.slug);
}

/**
 * Given a lowercased prompt string, returns all matching feature slugs.
 *
 * @param prompt - Lowercased user prompt.
 * @returns Array of matching feature slugs.
 */
export function matchFeatureKeywords(prompt: string): string[] {
  const matched: string[] = [];
  for (const [slug, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    for (const kw of keywords) {
      if (prompt.includes(kw)) {
        matched.push(slug);
        break;
      }
    }
  }
  return matched;
}

/**
 * Given a lowercased prompt string, returns all matching entity slugs.
 *
 * @param prompt - Lowercased user prompt.
 * @returns Array of matching entity slugs.
 */
export function matchEntityKeywords(prompt: string): string[] {
  const matched: string[] = [];
  for (const [slug, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    for (const kw of keywords) {
      if (prompt.includes(kw)) {
        matched.push(slug);
        break;
      }
    }
  }
  return matched;
}

/**
 * Given a lowercased prompt string, returns all matching integration slugs.
 *
 * @param prompt - Lowercased user prompt.
 * @returns Array of matching integration slugs.
 */
export function matchIntegrationKeywords(prompt: string): string[] {
  const matched: string[] = [];
  for (const [slug, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
    for (const kw of keywords) {
      if (prompt.includes(kw)) {
        matched.push(slug);
        break;
      }
    }
  }
  return matched;
}

/**
 * Returns true if the prompt consists *only* of vague terms (plus common
 * stop-words like "a", "the", "build", "make", "create", "me").
 *
 * @param prompt - Lowercased user prompt.
 */
export function isVaguePrompt(prompt: string): boolean {
  const stopWords = new Set([
    'a', 'an', 'the', 'build', 'make', 'create', 'i', 'want', 'need',
    'me', 'my', 'for', 'to', 'with', 'that', 'this', 'please', 'can',
    'you', 'should', 'would', 'like', 'just', 'simple', 'basic', 'new',
  ]);
  const vagueSet = new Set(VAGUE_TERMS);

  const words = prompt.split(/\s+/).filter((w) => w.length > 0);
  return words.every((word) => stopWords.has(word) || vagueSet.has(word));
}

/**
 * Scans a lowercased prompt for conflicting requirement pairs.
 *
 * @param prompt - Lowercased user prompt.
 * @returns Array of detected conflict patterns.
 */
export function detectConflicts(prompt: string): readonly ConflictPattern[] {
  return CONFLICT_PATTERNS.filter(
    (cp) => cp.keywords.every((kw) => prompt.includes(kw)),
  );
}
