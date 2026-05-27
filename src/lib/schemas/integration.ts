/**
 * @module lib/schemas/integration
 * @description Zod validation schemas for the integration registry.
 * Mirrors the IntegrationDefinition, TriggerDefinition, ActionDefinition,
 * and AuthType types from @/types/integration.
 */

import { z } from 'zod';

/** Zod schema for authentication method required by an integration. */
export const authTypeSchema = z.union([
  z.literal('oauth2'),
  z.literal('api_key'),
  z.literal('webhook_secret'),
  z.literal('none'),
]);

/**
 * Zod schema for TriggerDefinition — an event that can fire an integration action.
 */
export const triggerDefinitionSchema = z.object({
  /** Unique trigger identifier within the integration. */
  id: z.string().min(1, 'Trigger ID must not be empty'),

  /** Human-readable trigger name. */
  name: z.string().min(1, 'Trigger name must not be empty'),

  /** Description of when this trigger fires. */
  description: z.string().min(1, 'Trigger description must not be empty'),

  /** Optional entity event this trigger listens on (e.g. "Order.created"). */
  entityEvent: z.string().optional(),
});

/**
 * Zod schema for ActionDefinition — an operation an integration can perform.
 */
export const actionDefinitionSchema = z.object({
  /** Unique action identifier within the integration. */
  id: z.string().min(1, 'Action ID must not be empty'),

  /** Human-readable action name. */
  name: z.string().min(1, 'Action name must not be empty'),

  /** Description of what this action does. */
  description: z.string().min(1, 'Action description must not be empty'),

  /** Parameters that must be supplied when invoking this action. */
  requiredParams: z.array(z.string()),

  /** Parameters that may optionally be supplied. */
  optionalParams: z.array(z.string()).optional(),
});

/**
 * Zod schema for IntegrationDefinition — a registered third-party integration
 * available for use in generated applications.
 */
export const integrationDefinitionSchema = z.object({
  /** Unique integration identifier (e.g. "stripe", "sendgrid"). */
  id: z.string().min(1, 'Integration ID must not be empty'),

  /** Human-readable display name. */
  displayName: z.string().min(1, 'Display name must not be empty'),

  /** Description of the integration's capabilities. */
  description: z.string().min(1, 'Description must not be empty'),

  /** Authentication method required to connect. */
  authType: authTypeSchema,

  /** Events this integration can trigger on. */
  triggers: z.array(triggerDefinitionSchema),

  /** Actions this integration can perform. */
  actions: z.array(actionDefinitionSchema),

  /** Optional URL for the integration's icon. */
  iconUrl: z.string().url('Icon URL must be a valid URL').optional(),
});

/** Inferred TypeScript types from the Zod schemas. */
export type ValidatedTriggerDefinition = z.infer<typeof triggerDefinitionSchema>;
export type ValidatedActionDefinition = z.infer<typeof actionDefinitionSchema>;
export type ValidatedIntegrationDefinition = z.infer<typeof integrationDefinitionSchema>;
