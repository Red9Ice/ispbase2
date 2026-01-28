/**
 * @file: role.dto.ts
 * @description: DTOs for built-in roles (quick presets).
 * @dependencies: permission.dto
 * @created: 2026-01-27
 */

import type { PermissionKey } from '../../permissions/dto/permission.dto';
import { ALL_PERMISSIONS } from '../../permissions/dto/permission.dto';

export type RoleId = 'admin' | 'manager' | 'editor' | 'viewer' | 'accountant';

export interface RoleDto {
  id: RoleId;
  name: string;
  description: string;
  permissions: PermissionKey[];
}

export const BUILTIN_ROLES: RoleDto[] = [
  {
    id: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем разделам и управлению правами',
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: 'manager',
    name: 'Менеджер',
    description: 'Мероприятия, персонал, дашборд, календарь. Без управления доступом',
    permissions: [
      'events:read',
      'events:write',
      'staff:read',
      'staff:write',
      'dashboard:read',
      'calendar:read',
    ],
  },
  {
    id: 'editor',
    name: 'Редактор',
    description: 'Чтение и редактирование мероприятий и персонала',
    permissions: [
      'events:read',
      'events:write',
      'staff:read',
      'staff:write',
      'dashboard:read',
      'calendar:read',
    ],
  },
  {
    id: 'viewer',
    name: 'Просмотр',
    description: 'Только просмотр мероприятий, персонала, дашборда и календаря',
    permissions: ['events:read', 'staff:read', 'dashboard:read', 'calendar:read'],
  },
  {
    id: 'accountant',
    name: 'Бухгалтер',
    description: 'Доступ к дашборду и отчётам (расширяемо)',
    permissions: ['dashboard:read', 'events:read', 'staff:read'],
  },
];
