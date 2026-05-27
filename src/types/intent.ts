/**
 * @module types/intent
 * @description Type definitions for Stage 1 — Intent Extraction.
 * Captures the parsed user intent including app type, features, entities,
 * and any ambiguity or conflicts detected during extraction.
 */

/** Supported application archetypes that the pipeline can generate. */
export type AppType =
  | 'crm'
  | 'project_management'
  | 'inventory'
  | 'analytics'
  | 'content_platform'
  | 'hr_tool'
  | 'ecommerce'
  | 'custom'
  | 'booking'
  | 'support_desk'
  | 'finance'
  | 'healthcare'
  | 'learning';

/**
 * AppIntent — the structured output of Stage 1 (Intent Extraction).
 *
 * Represents the AI-parsed understanding of a user's natural-language
 * application description, including extracted features, entities,
 * integration requests, and any detected ambiguities or conflicts.
 */
export interface AppIntent {
  /** Human-readable name for the application. */
  appName: string;

  /** Classified archetype of the application. */
  appType: AppType;

  /** List of feature descriptions extracted from user input. */
  features: string[];

  /** Domain entities identified (e.g. "User", "Order", "Product"). */
  entities: string[];

  /** Third-party integrations the user mentioned or implied. */
  integrationsRequested: string[];

  /** Assumptions made by the AI when user input was under-specified. */
  assumptions: string[];

  /** Whether the AI needs further clarification before proceeding. */
  clarificationRequired: boolean;

  /** Optional question to surface when clarification is required. */
  clarificationQuestion?: string;

  /**
   * Ambiguity score from 0 to 10.
   * 0 = perfectly clear input, 10 = highly ambiguous.
   */
  ambiguityScore: number;

  /** Detected conflicts between requested features or constraints. */
  conflicts: string[];
}
