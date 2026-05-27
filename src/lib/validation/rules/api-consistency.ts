/**
 * @module lib/validation/rules/api-consistency
 * @description API consistency validation rules for AppSpec (Stage 3 output).
 * Ensures pages and API endpoints are consistent with the data schema,
 * validates HTTP methods, path formats, and detects duplicates.
 */

import type { ValidationError } from '@/types/pipeline';
import type { AppSpec, HttpMethod } from '@/types/appspec';

/** Exhaustive set of valid HTTP methods. */
const VALID_HTTP_METHODS: readonly HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
] as const;

/**
 * Validates that every page's boundEntity exists in dataSchema.entities.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for pages referencing non-existent entities.
 */
export function validatePageBoundEntities(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set(
    appSpec.dataSchema.entities.map((e) => e.name),
  );

  for (let i = 0; i < appSpec.pages.length; i++) {
    const page = appSpec.pages[i];
    if (page.boundEntity && !entityNames.has(page.boundEntity)) {
      errors.push({
        code: 'API_PAGE_INVALID_ENTITY',
        stage: 'appspec_generation',
        path: `pages[${i}].boundEntity`,
        message: `Page "${page.name}" references entity "${page.boundEntity}" which does not exist in the data schema`,
        severity: 'critical',
        suggestedFix: `Add entity "${page.boundEntity}" to the data schema or update the page's boundEntity.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that every API endpoint's boundEntity exists in dataSchema.entities.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for endpoints referencing non-existent entities.
 */
export function validateEndpointBoundEntities(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set(
    appSpec.dataSchema.entities.map((e) => e.name),
  );

  for (let i = 0; i < appSpec.apiEndpoints.length; i++) {
    const endpoint = appSpec.apiEndpoints[i];
    if (!entityNames.has(endpoint.boundEntity)) {
      errors.push({
        code: 'API_ENDPOINT_INVALID_ENTITY',
        stage: 'appspec_generation',
        path: `apiEndpoints[${i}].boundEntity`,
        message: `API endpoint "${endpoint.method} ${endpoint.path}" references entity "${endpoint.boundEntity}" which does not exist in the data schema`,
        severity: 'critical',
        suggestedFix: `Add entity "${endpoint.boundEntity}" to the data schema or fix the endpoint's boundEntity.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that every page with a boundEntity has at least one
 * corresponding API endpoint for that entity.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for pages missing corresponding endpoints.
 */
export function validatePageHasEndpoints(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const endpointEntities = new Set(
    appSpec.apiEndpoints.map((e) => e.boundEntity),
  );

  for (let i = 0; i < appSpec.pages.length; i++) {
    const page = appSpec.pages[i];
    if (page.boundEntity && !endpointEntities.has(page.boundEntity)) {
      errors.push({
        code: 'API_PAGE_NO_ENDPOINT',
        stage: 'appspec_generation',
        path: `pages[${i}]`,
        message: `Page "${page.name}" (entity: "${page.boundEntity}") has no corresponding API endpoint`,
        severity: 'warning',
        suggestedFix: `Add CRUD API endpoints for entity "${page.boundEntity}".`,
      });
    }
  }

  return errors;
}

/**
 * Validates that there are no duplicate API paths (same method + path combination).
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for duplicate API paths.
 */
export function validateNoDuplicateApiPaths(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number>();

  for (let i = 0; i < appSpec.apiEndpoints.length; i++) {
    const endpoint = appSpec.apiEndpoints[i];
    const key = `${endpoint.method}:${endpoint.path}`;
    const previousIndex = seen.get(key);

    if (previousIndex !== undefined) {
      errors.push({
        code: 'API_DUPLICATE_PATH',
        stage: 'appspec_generation',
        path: `apiEndpoints[${i}]`,
        message: `Duplicate API path "${endpoint.method} ${endpoint.path}" at indices ${previousIndex} and ${i}`,
        severity: 'critical',
        suggestedFix: `Remove or differentiate one of the duplicate "${endpoint.method} ${endpoint.path}" endpoints.`,
      });
    } else {
      seen.set(key, i);
    }
  }

  return errors;
}

/**
 * Validates that all API endpoint methods are valid HTTP methods.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for invalid HTTP methods.
 */
export function validateHttpMethods(appSpec: AppSpec): ValidationError[] {
  const errors: ValidationError[] = [];
  const validSet = new Set<string>(VALID_HTTP_METHODS);

  for (let i = 0; i < appSpec.apiEndpoints.length; i++) {
    const endpoint = appSpec.apiEndpoints[i];
    if (!validSet.has(endpoint.method)) {
      errors.push({
        code: 'API_INVALID_METHOD',
        stage: 'appspec_generation',
        path: `apiEndpoints[${i}].method`,
        message: `API endpoint has invalid HTTP method "${endpoint.method}"`,
        severity: 'critical',
        suggestedFix: `Change method to one of: ${VALID_HTTP_METHODS.join(', ')}.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that all API endpoint paths start with '/api/'.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for endpoints with invalid path prefixes.
 */
export function validateApiPathPrefix(appSpec: AppSpec): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < appSpec.apiEndpoints.length; i++) {
    const endpoint = appSpec.apiEndpoints[i];
    if (!endpoint.path.startsWith('/api/')) {
      errors.push({
        code: 'API_INVALID_PATH_PREFIX',
        stage: 'appspec_generation',
        path: `apiEndpoints[${i}].path`,
        message: `API endpoint path "${endpoint.path}" does not start with "/api/"`,
        severity: 'warning',
        suggestedFix: `Prefix the path with "/api/" (e.g. "/api${endpoint.path.startsWith('/') ? '' : '/'}${endpoint.path}").`,
      });
    }
  }

  return errors;
}

/**
 * Runs all API consistency validation rules against the given AppSpec.
 *
 * @param appSpec - The full application specification.
 * @returns Aggregated array of all API consistency validation errors.
 */
export function runAllApiConsistencyValidations(
  appSpec: AppSpec,
): ValidationError[] {
  return [
    ...validatePageBoundEntities(appSpec),
    ...validateEndpointBoundEntities(appSpec),
    ...validatePageHasEndpoints(appSpec),
    ...validateNoDuplicateApiPaths(appSpec),
    ...validateHttpMethods(appSpec),
    ...validateApiPathPrefix(appSpec),
  ];
}
