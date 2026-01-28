/**
 * @file: permissions.repository.ts
 * @description: In-memory repository for user permissions (by id and email).
 * @dependencies: permission.dto
 * @created: 2026-01-27
 */

import { PermissionKey } from './dto/permission.dto';

export class PermissionsRepository {
  private readonly byUserId = new Map<number, Set<PermissionKey>>();

  setForUser(userId: number, permissions: PermissionKey[]): void {
    this.byUserId.set(userId, new Set(permissions));
  }

  getByUserId(userId: number): PermissionKey[] {
    const set = this.byUserId.get(userId);
    return set ? Array.from(set) : [];
  }

  has(userId: number, permission: PermissionKey): boolean {
    const set = this.byUserId.get(userId);
    return set ? set.has(permission) : false;
  }

  hasAny(userId: number, permissions: PermissionKey[]): boolean {
    return permissions.some((p) => this.has(userId, p));
  }
}
