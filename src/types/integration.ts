/**
 * @module types/integration
 * @description Type definitions for the integration registry.
 * Defines available third-party integrations, their auth requirements,
 * triggers, and actions that can be wired into generated applications.
 */

/** Authentication method required by an integration. */
export type AuthType = 'oauth2' | 'api_key' | 'webhook_secret' | 'none';

/**
 * TriggerDefinition — an event that can fire an integration action.
 */
export interface TriggerDefinition {
  /** Unique trigger identifier within the integration. */
  id: string;

  /** Human-readable trigger name. */
  name: string;

  /** Description of when this trigger fires. */
  description: string;

  /** Optional entity event this trigger listens on (e.g. "Order.created"). */
  entityEvent?: string;
}

/**
 * ActionDefinition — an operation an integration can perform.
 */
export interface ActionDefinition {
  /** Unique action identifier within the integration. */
  id: string;

  /** Human-readable action name. */
  name: string;

  /** Description of what this action does. */
  description: string;

  /** Parameters that must be supplied when invoking this action. */
  requiredParams: string[];

  /** Parameters that may optionally be supplied. */
  optionalParams?: string[];
}

/**
 * IntegrationDefinition — a registered third-party integration
 * available for use in generated applications.
 */
export interface IntegrationDefinition {
  /** Unique integration identifier (e.g. "stripe", "sendgrid"). */
  id: string;

  /** Human-readable display name. */
  displayName: string;

  /** Description of the integration's capabilities. */
  description: string;

  /** Authentication method required to connect. */
  authType: AuthType;

  /** Events this integration can trigger on. */
  triggers: TriggerDefinition[];

  /** Actions this integration can perform. */
  actions: ActionDefinition[];

  /** Optional URL for the integration's icon. */
  iconUrl?: string;
}
