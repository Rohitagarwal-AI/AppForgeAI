import { appIntentSchema, AppIntentContract } from '../schemas/appIntent.schema.js';

export interface GenerationInput {
  prompt: string;
  projectName?: string;
  appType?: string;
  techStack?: string[] | string;
  features?: string[];
}

const APP_TYPE_LABELS: Record<string, string> = {
  SaaS: 'Business Management SaaS',
  CRM: 'Customer Relationship CRM',
  'E-commerce': 'E-commerce Storefront',
  Dashboard: 'Operations Dashboard',
  Portfolio: 'Portfolio Website',
  'AI Tool': 'AI Productivity Tool',
};

export function extractIntent(input: GenerationInput): AppIntentContract {
  const prompt = input.prompt.trim();
  const lower = prompt.toLowerCase();
  const features = Array.from(new Set(input.features || []));
  const appName = sanitizeAppName(input.projectName || inferNameFromPrompt(prompt));
  const appType = APP_TYPE_LABELS[input.appType || ''] || input.appType || inferAppType(lower);
  const authRequired = features.includes('Authentication') || /login|auth|user account|admin/.test(lower);
  const integrations = inferIntegrations(features, lower);
  const entities = inferEntities(lower, input.appType);

  return appIntentSchema.parse({
    appName,
    appType,
    targetUsers: inferTargetUsers(lower, input.appType),
    features: Array.from(new Set([...inferFeatures(lower), ...features])),
    entities,
    authRequired,
    integrations,
    assumptions: buildAssumptions(authRequired, integrations),
    missingInfo: buildMissingInfo(features, integrations),
    warnings: buildWarnings(input),
  });
}

function sanitizeAppName(value: string) {
  return value
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48) || 'AppForge Project';
}

function inferNameFromPrompt(prompt: string) {
  const match = prompt.match(/(?:called|named|for)\s+([A-Z][A-Za-z0-9\s]{2,24})/);
  if (match?.[1]) return match[1].trim();
  const words = prompt.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 2);
  return words.length ? words.map(capitalize).join(' ') : 'AppForge Project';
}

function inferAppType(lower: string) {
  if (/crm|lead|customer relationship/.test(lower)) return 'Customer Relationship CRM';
  if (/store|shop|ecommerce|checkout|cart|product/.test(lower)) return 'E-commerce Storefront';
  if (/portfolio|personal site|case study/.test(lower)) return 'Portfolio Website';
  if (/ai|assistant|agent|copilot/.test(lower)) return 'AI Productivity Tool';
  if (/dashboard|analytics|metrics|report/.test(lower)) return 'Operations Dashboard';
  return 'Business Management SaaS';
}

function inferTargetUsers(lower: string, appType?: string) {
  if (/shop|store|inventory|retail/.test(lower)) return ['shop owner', 'staff'];
  if (/crm|lead/.test(lower)) return ['sales manager', 'sales representative'];
  if (/portfolio/.test(lower)) return ['visitor', 'site owner'];
  if (appType === 'AI Tool') return ['operator', 'team member'];
  return ['workspace owner', 'staff'];
}

function inferFeatures(lower: string) {
  const features = new Set<string>();
  if (/inventory|stock|product/.test(lower)) features.add('inventory');
  if (/order|checkout|cart/.test(lower)) features.add('orders');
  if (/customer|client|lead|crm/.test(lower)) features.add('customers');
  if (/payment|stripe|billing|invoice/.test(lower)) features.add('payments');
  if (/dashboard|analytics|metric|report/.test(lower)) features.add('dashboard');
  if (/admin/.test(lower)) features.add('admin panel');
  if (/file|upload|document/.test(lower)) features.add('file uploads');
  return Array.from(features.size ? features : new Set(['dashboard', 'records', 'settings']));
}

function inferEntities(lower: string, appType?: string) {
  if (/store|shop|ecommerce|checkout|inventory|product|retail/.test(lower) || appType === 'E-commerce') {
    return ['Product', 'Customer', 'Order', 'Payment'];
  }
  if (/crm|lead|pipeline|deal/.test(lower) || appType === 'CRM') {
    return ['Lead', 'Customer', 'Deal', 'Activity'];
  }
  if (/portfolio/.test(lower) || appType === 'Portfolio') {
    return ['Project', 'CaseStudy', 'ContactMessage'];
  }
  if (/ai|assistant|agent|copilot/.test(lower) || appType === 'AI Tool') {
    return ['Conversation', 'PromptRun', 'KnowledgeSource'];
  }
  return ['Project', 'Task', 'User', 'ActivityLog'];
}

function inferIntegrations(features: string[], lower: string) {
  const integrations = new Set<string>();
  if (features.includes('Email Notifications') || /email|gmail/.test(lower)) integrations.add('Email');
  if (features.includes('Payments') || /stripe|payment|checkout|billing/.test(lower)) integrations.add('Stripe');
  if (/slack/.test(lower)) integrations.add('Slack');
  if (/firebase/.test(lower)) integrations.add('Firebase');
  if (/supabase/.test(lower)) integrations.add('Supabase');
  return Array.from(integrations);
}

function buildAssumptions(authRequired: boolean, integrations: string[]) {
  const assumptions = ['Responsive desktop-first workspace is required'];
  if (authRequired) assumptions.push('Email/password authentication is required');
  if (integrations.includes('Email')) assumptions.push('Email provider credentials will be configured server-side');
  return assumptions;
}

function buildMissingInfo(features: string[], integrations: string[]) {
  const missing: string[] = [];
  if (features.includes('Payments') && !integrations.includes('Stripe')) missing.push('Payment provider not specified');
  if (features.includes('AI Assistant')) missing.push('Preferred AI model not specified');
  return missing;
}

function buildWarnings(input: GenerationInput) {
  const warnings: string[] = [];
  if (!input.techStack || (Array.isArray(input.techStack) && input.techStack.length === 0)) {
    warnings.push('No deployment target selected');
  }
  return warnings;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
