/**
 * @module lib/validation/rules/auth-consistency
 * @description Authentication and authorization validation rules for AppSpec.
 * Ensures role definitions, permission matrices, and default role assignments
 * are internally consistent and complete.
 */

import type { ValidationError } from '@/types/pipeline';
import type { AppSpec, Permission } from '@/types/appspec';

/** Exhaustive set of valid permissions from the Permission union. */
const VALID_PERMISSIONS: readonly Permission[] = [
  'read',
  'write',
  'delete',
] as const;

/**
 * Validates that all roles referenced in authRules.roles exist
 * and the default role is one of the defined roles.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for role consistency issues.
 */
export function validateRolesExist(appSpec: AppSpec): ValidationError[] {
  const errors: ValidationError[] = [];
  const definedRoles = new Set(appSpec.authRules.roles.map((r) => r.role));

  if (!definedRoles.has(appSpec.authRules.defaultRole)) {
    errors.push({
      code: 'AUTH_DEFAULT_ROLE_NOT_DEFINED',
      stage: 'appspec_generation',
      path: 'authRules.defaultRole',
      message: `Default role "${appSpec.authRules.defaultRole}" is not one of the defined roles: [${Array.from(definedRoles).join(', ')}]`,
      severity: 'critical',
      suggestedFix: `Set defaultRole to one of: ${Array.from(definedRoles).join(', ')}, or add a role definition for "${appSpec.authRules.defaultRole}".`,
    });
  }

  return errors;
}

/**
 * Validates that the permission matrix only uses valid Permission types.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for invalid permission values.
 */
export function validatePermissionTypes(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const validSet = new Set<string>(VALID_PERMISSIONS);

  for (let i = 0; i < appSpec.authRules.roles.length; i++) {
    const rolePermission = appSpec.authRules.roles[i];

    for (let j = 0; j < rolePermission.permissions.length; j++) {
      const permission = rolePermission.permissions[j];
      if (!validSet.has(permission)) {
        errors.push({
          code: 'AUTH_INVALID_PERMISSION',
          stage: 'appspec_generation',
          path: `authRules.roles[${i}].permissions[${j}]`,
          message: `Role "${rolePermission.role}" has invalid permission "${permission}"`,
          severity: 'critical',
          suggestedFix: `Replace "${permission}" with one of: ${VALID_PERMISSIONS.join(', ')}.`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates that every role has at least 'read' permission.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors for roles missing 'read' permission.
 */
export function validateMinimumReadPermission(
  appSpec: AppSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < appSpec.authRules.roles.length; i++) {
    const rolePermission = appSpec.authRules.roles[i];
    const hasRead = rolePermission.permissions.includes('read');

    if (!hasRead) {
      errors.push({
        code: 'AUTH_ROLE_MISSING_READ',
        stage: 'appspec_generation',
        path: `authRules.roles[${i}].permissions`,
        message: `Role "${rolePermission.role}" does not have 'read' permission`,
        severity: 'warning',
        suggestedFix: `Add 'read' to the permissions array for role "${rolePermission.role}".`,
      });
    }
  }

  return errors;
}

/**
 * Validates that an 'admin' role exists and has all available permissions.
 *
 * @param appSpec - The full application specification.
 * @returns Array of validation errors if the admin role is missing or incomplete.
 */
export function validateAdminRole(appSpec: AppSpec): ValidationError[] {
  const errors: ValidationError[] = [];
  const adminRole = appSpec.authRules.roles.find((r) => r.role === 'admin');

  if (!adminRole) {
    errors.push({
      code: 'AUTH_MISSING_ADMIN_ROLE',
      stage: 'appspec_generation',
      path: 'authRules.roles',
      message: 'No "admin" role is defined in the auth rules',
      severity: 'critical',
      suggestedFix: 'Add an "admin" role with all permissions: read, write, delete.',
    });
    return errors;
  }

  const missingPermissions = VALID_PERMISSIONS.filter(
    (p) => !adminRole.permissions.includes(p),
  );

  if (missingPermissions.length > 0) {
    errors.push({
      code: 'AUTH_ADMIN_MISSING_PERMISSIONS',
      stage: 'appspec_generation',
      path: 'authRules.roles',
      message: `Admin role is missing permissions: ${missingPermissions.join(', ')}`,
      severity: 'warning',
      suggestedFix: `Add the following permissions to admin: ${missingPermissions.join(', ')}.`,
    });
  }

  return errors;
}

/**
 * Runs all auth consistency validation rules against the given AppSpec.
 *
 * @param appSpec - The full application specification.
 * @returns Aggregated array of all auth consistency validation errors.
 */
export function runAllAuthValidations(appSpec: AppSpec): ValidationError[] {
  return [
    ...validateRolesExist(appSpec),
    ...validatePermissionTypes(appSpec),
    ...validateMinimumReadPermission(appSpec),
    ...validateAdminRole(appSpec),
  ];
}
