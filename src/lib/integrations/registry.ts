/**
 * @module lib/integrations/registry
 * @description Source-of-truth integration registry used by validation,
 * AppSpec generation, repair, API routes, and the dashboard.
 */

import type {
  ActionDefinition,
  IntegrationDefinition,
  TriggerDefinition,
} from '@/types/integration';
import { integrationDefinitionSchema } from '@/lib/schemas/integration';

const RECORD_TRIGGERS: readonly TriggerDefinition[] = [
  {
    id: 'record_created',
    name: 'Record Created',
    description: 'Fires when a configured entity record is created.',
  },
  {
    id: 'record_updated',
    name: 'Record Updated',
    description: 'Fires when a configured entity record changes.',
  },
  {
    id: 'status_changed',
    name: 'Status Changed',
    description: 'Fires when an entity status or stage field changes.',
  },
];

function recordTriggers(): TriggerDefinition[] {
  return RECORD_TRIGGERS.map((trigger) => ({ ...trigger }));
}

export const INTEGRATION_REGISTRY: readonly IntegrationDefinition[] = [
  {
    id: 'slack',
    displayName: 'Slack',
    description: 'Team notifications for operational events and workflow alerts.',
    authType: 'oauth2',
    triggers: recordTriggers(),
    actions: [
      {
        id: 'send_channel_message',
        name: 'Send Channel Message',
        description: 'Post a formatted message to a Slack channel.',
        requiredParams: ['channel', 'message'],
        optionalParams: ['threadTs', 'blocks'],
      },
      {
        id: 'send_dm',
        name: 'Send Direct Message',
        description: 'Send a direct Slack message to a user.',
        requiredParams: ['userId', 'message'],
        optionalParams: ['blocks'],
      },
    ],
  },
  {
    id: 'whatsapp',
    displayName: 'WhatsApp',
    description: 'Template-based WhatsApp notifications for customer and internal workflows.',
    authType: 'api_key',
    triggers: recordTriggers(),
    actions: [
      {
        id: 'send_template_message',
        name: 'Send Template Message',
        description: 'Send an approved WhatsApp template message.',
        requiredParams: ['to', 'templateName'],
        optionalParams: ['locale', 'variables'],
      },
      {
        id: 'send_notification',
        name: 'Send Notification',
        description: 'Send a concise WhatsApp notification.',
        requiredParams: ['to', 'message'],
        optionalParams: ['mediaUrl'],
      },
    ],
  },
  {
    id: 'gmail',
    displayName: 'Gmail',
    description: 'Transactional email and lightweight inbox workflows through Google Workspace.',
    authType: 'oauth2',
    triggers: [
      {
        id: 'email_received',
        name: 'Email Received',
        description: 'Fires when a message matching a configured filter is received.',
      },
      ...recordTriggers(),
    ],
    actions: [
      {
        id: 'send_email',
        name: 'Send Email',
        description: 'Send a transactional email.',
        requiredParams: ['to', 'subject', 'body'],
        optionalParams: ['cc', 'bcc', 'threadId'],
      },
      {
        id: 'create_draft',
        name: 'Create Draft',
        description: 'Create an email draft for review.',
        requiredParams: ['to', 'subject', 'body'],
        optionalParams: ['cc', 'bcc'],
      },
    ],
  },
  {
    id: 'google_sheets',
    displayName: 'Google Sheets',
    description: 'Spreadsheet synchronization for reporting, exports, and operational handoffs.',
    authType: 'oauth2',
    triggers: [
      {
        id: 'row_added',
        name: 'Row Added',
        description: 'Fires when a row is appended to a configured sheet.',
      },
      ...recordTriggers(),
    ],
    actions: [
      {
        id: 'append_row',
        name: 'Append Row',
        description: 'Append a row to a configured worksheet.',
        requiredParams: ['spreadsheetId', 'sheetName', 'values'],
        optionalParams: ['valueInputOption'],
      },
      {
        id: 'update_cell',
        name: 'Update Cell',
        description: 'Update a single cell or range.',
        requiredParams: ['spreadsheetId', 'range', 'values'],
        optionalParams: ['valueInputOption'],
      },
    ],
  },
  {
    id: 'stripe',
    displayName: 'Stripe',
    description: 'Payment, checkout, invoice, and subscription workflows.',
    authType: 'api_key',
    triggers: [
      {
        id: 'payment_completed',
        name: 'Payment Completed',
        description: 'Fires when a payment successfully completes.',
        entityEvent: 'Payment.completed',
      },
      {
        id: 'subscription_created',
        name: 'Subscription Created',
        description: 'Fires when a subscription is created.',
        entityEvent: 'Subscription.created',
      },
      ...recordTriggers(),
    ],
    actions: [
      {
        id: 'create_customer',
        name: 'Create Customer',
        description: 'Create a Stripe customer profile.',
        requiredParams: ['email'],
        optionalParams: ['name', 'metadata'],
      },
      {
        id: 'create_payment',
        name: 'Create Payment',
        description: 'Create a payment intent.',
        requiredParams: ['amount', 'currency'],
        optionalParams: ['customerId', 'metadata'],
      },
    ],
  },
  {
    id: 'jira',
    displayName: 'Jira',
    description: 'Issue creation and updates for product and engineering workflows.',
    authType: 'oauth2',
    triggers: recordTriggers(),
    actions: [
      {
        id: 'create_issue',
        name: 'Create Issue',
        description: 'Create a Jira issue.',
        requiredParams: ['projectKey', 'summary', 'issueType'],
        optionalParams: ['description', 'labels'],
      },
      {
        id: 'update_issue',
        name: 'Update Issue',
        description: 'Update fields on an existing Jira issue.',
        requiredParams: ['issueKey', 'fields'],
      },
    ],
  },
  {
    id: 'webhook',
    displayName: 'Webhook',
    description: 'Generic inbound or outbound HTTP event integration.',
    authType: 'webhook_secret',
    triggers: [
      {
        id: 'webhook_received',
        name: 'Webhook Received',
        description: 'Fires when an inbound webhook payload is accepted.',
      },
      ...recordTriggers(),
    ],
    actions: [
      {
        id: 'post_payload',
        name: 'Post Payload',
        description: 'Send a JSON payload to an external HTTP endpoint.',
        requiredParams: ['url', 'payload'],
        optionalParams: ['headers', 'method'],
      },
    ],
  },
];

export function getIntegrationRegistry(): IntegrationDefinition[] {
  return INTEGRATION_REGISTRY.map((integration) => ({
    ...integration,
    triggers: integration.triggers.map((trigger) => ({ ...trigger })),
    actions: integration.actions.map((action) => ({
      ...action,
      optionalParams: action.optionalParams ? [...action.optionalParams] : undefined,
    })),
  }));
}

export function validateIntegrationRegistry(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const integration of INTEGRATION_REGISTRY) {
    const parsed = integrationDefinitionSchema.safeParse(integration);
    if (!parsed.success) {
      errors.push(
        `${integration.id}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`,
      );
    }

    if (seen.has(integration.id)) {
      errors.push(`Duplicate integration id "${integration.id}"`);
    }
    seen.add(integration.id);
  }

  return { valid: errors.length === 0, errors };
}

export function getIntegrationById(
  integrationId: string,
): IntegrationDefinition | undefined {
  return INTEGRATION_REGISTRY.find((integration) => integration.id === integrationId);
}

export function getKnownIntegrationIds(): ReadonlySet<string> {
  return new Set(INTEGRATION_REGISTRY.map((integration) => integration.id));
}

export function getIntegrationActions(integrationId: string): readonly ActionDefinition[] {
  return getIntegrationById(integrationId)?.actions ?? [];
}

export function getIntegrationTriggers(integrationId: string): readonly TriggerDefinition[] {
  return getIntegrationById(integrationId)?.triggers ?? [];
}

export function getDefaultIntegrationAction(integrationId: string): string | undefined {
  return getIntegrationActions(integrationId)[0]?.id;
}

export function getDefaultIntegrationTrigger(integrationId: string): string | undefined {
  return getIntegrationTriggers(integrationId)[0]?.id;
}
