/**
 * @module lib/schemas/intent
 * @description Zod validation schema for Stage 1 — Intent Extraction.
 * Mirrors the AppIntent interface from @/types/intent.
 */

import { z } from 'zod';

/** Zod schema for supported application archetypes. */
export const appTypeSchema = z.union([
  z.literal('crm'),
  z.literal('project_management'),
  z.literal('inventory'),
  z.literal('analytics'),
  z.literal('content_platform'),
  z.literal('hr_tool'),
  z.literal('ecommerce'),
  z.literal('custom'),
  z.literal('booking'),
  z.literal('support_desk'),
  z.literal('finance'),
  z.literal('healthcare'),
  z.literal('learning'),
]);

/**
 * Zod schema for AppIntent — the structured output of Stage 1.
 *
 * Validates the AI-parsed understanding of a user's natural-language
 * application description, including features, entities, integration
 * requests, and detected ambiguities or conflicts.
 */
export const appIntentSchema = z.object({
  /** Human-readable name for the application. */
  appName: z.string().min(1, 'App name must not be empty'),

  /** Classified archetype of the application. */
  appType: appTypeSchema,

  /** List of feature descriptions extracted from user input. */
  features: z.array(z.string()).min(1, 'At least one feature is required'),

  /** Domain entities identified (e.g. "User", "Order", "Product"). */
  entities: z.array(z.string()).min(1, 'At least one entity is required'),

  /** Third-party integrations the user mentioned or implied. */
  integrationsRequested: z.array(z.string()),

  /** Assumptions made by the AI when user input was under-specified. */
  assumptions: z.array(z.string()),

  /** Whether the AI needs further clarification before proceeding. */
  clarificationRequired: z.boolean(),

  /** Optional question to surface when clarification is required. */
  clarificationQuestion: z.string().optional(),

  /**
   * Ambiguity score from 0 to 10.
   * 0 = perfectly clear input, 10 = highly ambiguous.
   */
  ambiguityScore: z
    .number()
    .min(0, 'Ambiguity score must be at least 0')
    .max(10, 'Ambiguity score must be at most 10'),

  /** Detected conflicts between requested features or constraints. */
  conflicts: z.array(z.string()),
});

/** Inferred TypeScript type from the Zod schema. */
export type ValidatedAppIntent = z.infer<typeof appIntentSchema>;
