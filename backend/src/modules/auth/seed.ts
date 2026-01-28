/**
 * @file: seed.ts
 * @description: Seed default admin user and permissions.
 * @dependencies: users, permissions repositories, bcryptjs
 * @created: 2026-01-27
 */

import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { ALL_PERMISSIONS } from '../permissions/dto/permission.dto';

const ADMIN_EMAIL = 'admin@imlight.local';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_DISPLAY = 'Administrator';

export async function seedAuth(
  users: UsersRepository,
  permissions: PermissionsRepository,
): Promise<void> {
  const existing = await users.getByEmail(ADMIN_EMAIL);
  if (existing) return;
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await users.add({
    email: ADMIN_EMAIL,
    passwordHash: hash,
    displayName: ADMIN_DISPLAY,
  });
  permissions.setForUser(admin.id, [...ALL_PERMISSIONS]);
}
