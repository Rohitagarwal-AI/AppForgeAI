/**
 * @module lib/validation/types
 * @description Core type definitions for the validation engine.
 * Provides the structural contracts for validation results, rules, and context.
 */

import type { ValidationError } from '@/types/pipeline';

/**
 * ValidationResult — the structured output of running one or more validation rules.
 * Contains separated errors (blocking) and warnings (non-blocking).
 */
export interface ValidationResult {
  /** Whether validation passed with no critical errors. */
  valid: boolean;

  /** Critical errors that must be resolved before proceeding. */
  errors: ValidationError[];

  /** Non-blocking warnings that should be reviewed but do not block the pipeline. */
  warnings: ValidationError[];
}

/**
 * ValidationRule — a single, self-contained validation check.
 * Rules are composable and can be grouped by domain (structural, schema, etc.).
 */
export interface ValidationRule {
  /** Machine-readable rule code (e.g. "SCHEMA_MISSING_PK"). */
  code: string;

  /** Human-readable description of what this rule checks. */
  description: string;

  /** Execute the validation logic against supplied data. */
  validate(data: unknown, context?: ValidationContext): ValidationError[];
}

/**
 * ValidationContext — optional ambient context passed to rules
 * so they can perform cross-referencing checks.
 */
export interface ValidationContext {
  /** Pipeline stage name that produced the data being validated. */
  stage: string;

  /** Entity names that are already known to exist (for cross-reference checks). */
  existingEntities?: string[];

  /** Integration IDs that are already registered (for cross-reference checks). */
  existingIntegrations?: string[];
}
