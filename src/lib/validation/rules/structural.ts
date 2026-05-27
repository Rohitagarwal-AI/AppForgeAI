/**
 * @module lib/validation/rules/structural
 * @description Structural validation rules that verify basic data shape,
 * JSON parseability, and non-emptiness of required fields.
 * These are the first-pass checks run before any domain-specific validation.
 */

import type { ValidationError } from '@/types/pipeline';

/**
 * Validates that all required top-level keys exist on the given data object.
 *
 * @param data  - The object to inspect.
 * @param requiredKeys - Array of key names that must be present.
 * @param stage - Pipeline stage name for error attribution.
 * @returns Array of validation errors for each missing key.
 */
export function validateRequiredFields(
  data: unknown,
  requiredKeys: readonly string[],
  stage: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data === null || data === undefined || typeof data !== 'object') {
    errors.push({
      code: 'STRUCTURAL_NOT_OBJECT',
      stage,
      path: '',
      message: `Expected an object but received ${data === null ? 'null' : typeof data}`,
      severity: 'critical',
      suggestedFix: 'Ensure the output is a valid JSON object.',
    });
    return errors;
  }

  const record = data as Record<string, unknown>;

  for (const key of requiredKeys) {
    if (!(key in record) || record[key] === undefined) {
      errors.push({
        code: 'STRUCTURAL_MISSING_KEY',
        stage,
        path: key,
        message: `Required key "${key}" is missing from the output`,
        severity: 'critical',
        suggestedFix: `Add the "${key}" field to the output object.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that a raw string is valid JSON.
 *
 * @param raw   - The raw string to parse.
 * @param stage - Pipeline stage name for error attribution.
 * @returns Array of validation errors if the string is not parseable JSON.
 */
export function validateJsonParseable(
  raw: string,
  stage: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    errors.push({
      code: 'STRUCTURAL_EMPTY_INPUT',
      stage,
      path: '',
      message: 'Input is empty or not a string',
      severity: 'critical',
      suggestedFix: 'Provide a non-empty JSON string.',
    });
    return errors;
  }

  try {
    JSON.parse(raw);
  } catch (parseError: unknown) {
    const errorMessage =
      parseError instanceof Error ? parseError.message : 'Unknown parse error';
    errors.push({
      code: 'STRUCTURAL_INVALID_JSON',
      stage,
      path: '',
      message: `JSON parse failed: ${errorMessage}`,
      severity: 'critical',
      suggestedFix:
        'Fix JSON syntax errors such as trailing commas, unbalanced brackets, or unquoted keys.',
    });
  }

  return errors;
}

/**
 * Validates that a specific field on the data is non-empty.
 * Works for arrays (length > 0) and strings (trimmed length > 0).
 *
 * @param data  - The object containing the field.
 * @param field - The field name to check.
 * @param stage - Pipeline stage name for error attribution.
 * @returns Array of validation errors if the field is empty.
 */
export function validateNonEmpty(
  data: unknown,
  field: string,
  stage: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data === null || data === undefined || typeof data !== 'object') {
    return errors;
  }

  const record = data as Record<string, unknown>;
  const value = record[field];

  if (value === undefined || value === null) {
    errors.push({
      code: 'STRUCTURAL_EMPTY_FIELD',
      stage,
      path: field,
      message: `Field "${field}" is null or undefined`,
      severity: 'critical',
      suggestedFix: `Provide a non-empty value for "${field}".`,
    });
    return errors;
  }

  if (Array.isArray(value) && value.length === 0) {
    errors.push({
      code: 'STRUCTURAL_EMPTY_ARRAY',
      stage,
      path: field,
      message: `Array field "${field}" must contain at least one element`,
      severity: 'warning',
      suggestedFix: `Add at least one item to "${field}".`,
    });
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    errors.push({
      code: 'STRUCTURAL_EMPTY_STRING',
      stage,
      path: field,
      message: `String field "${field}" must not be blank`,
      severity: 'critical',
      suggestedFix: `Provide a non-empty string for "${field}".`,
    });
  }

  return errors;
}

/** All structural validation functions exported as an array for batch execution. */
export const structuralValidationFunctions = [
  validateRequiredFields,
  validateJsonParseable,
  validateNonEmpty,
] as const;
