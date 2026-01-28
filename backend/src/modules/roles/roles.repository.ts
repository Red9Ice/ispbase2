/**
 * @file: roles.repository.ts
 * @description: Read-only repository for built-in roles.
 * @dependencies: role.dto
 * @created: 2026-01-27
 */

import type { RoleDto, RoleId } from './dto/role.dto';
import { BUILTIN_ROLES } from './dto/role.dto';

export class RolesRepository {
  list(): RoleDto[] {
    return [...BUILTIN_ROLES];
  }

  getById(id: RoleId): RoleDto | undefined {
    return BUILTIN_ROLES.find((r) => r.id === id);
  }
}
