/**
 * @file: permission.dto.ts
 * @description: DTOs for permissions (RBAC by userId/email).
 * @dependencies: none
 * @created: 2026-01-27
 */

export type PermissionKey =
  | 'events:read'
  | 'events:write'
  | 'staff:read'
  | 'staff:write'
  | 'dashboard:read'
  | 'calendar:read'
  | 'access:manage';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'events:read',
  'events:write',
  'staff:read',
  'staff:write',
  'dashboard:read',
  'calendar:read',
  'access:manage',
];

export interface UserPermissionsDto {
  userId: number;
  email: string;
  displayName?: string;
  permissions: PermissionKey[];
}

export interface UserPermissionsUpdateDto {
  permissions: PermissionKey[];
}
