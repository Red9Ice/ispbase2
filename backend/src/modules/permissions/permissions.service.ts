/**
 * @file: permissions.service.ts
 * @description: Service for user permissions (by id and email).
 * @dependencies: users, permissions repositories
 * @created: 2026-01-27
 */

import { UsersRepository } from '../users/users.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import {
  UserPermissionsDto,
  UserPermissionsUpdateDto,
  PermissionKey,
  ALL_PERMISSIONS,
} from './dto/permission.dto';

export class PermissionsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly permissions: PermissionsRepository,
  ) {}

  async listUsersWithPermissions(): Promise<UserPermissionsDto[]> {
    const users = await this.users.list();
    return Promise.all(users.map(async (u) => ({
      userId: u.id,
      email: u.email,
      displayName: u.displayName,
      permissions: this.permissions.getByUserId(u.id),
    })));
  }

  async getByUserId(userId: number): Promise<UserPermissionsDto | null> {
    const u = await this.users.getById(userId);
    if (!u) return null;
    return {
      userId: u.id,
      email: u.email,
      displayName: u.displayName,
      permissions: this.permissions.getByUserId(u.id),
    };
  }

  async getByEmail(email: string): Promise<UserPermissionsDto | null> {
    const u = await this.users.getByEmail(email);
    if (!u) return null;
    return this.getByUserId(u.id);
  }

  async update(userId: number, dto: UserPermissionsUpdateDto): Promise<UserPermissionsDto | null> {
    const u = await this.users.getById(userId);
    if (!u) return null;
    const valid = dto.permissions.filter((p): p is PermissionKey =>
      ALL_PERMISSIONS.includes(p as PermissionKey),
    );
    this.permissions.setForUser(userId, valid);
    return this.getByUserId(userId);
  }

  allPermissionKeys(): PermissionKey[] {
    return [...ALL_PERMISSIONS];
  }
}
