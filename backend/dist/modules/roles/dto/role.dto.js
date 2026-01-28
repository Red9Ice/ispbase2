"use strict";
/**
 * @file: role.dto.ts
 * @description: DTOs for built-in roles (quick presets).
 * @dependencies: permission.dto
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILTIN_ROLES = void 0;
const permission_dto_1 = require("../../permissions/dto/permission.dto");
exports.BUILTIN_ROLES = [
    {
        id: 'admin',
        name: 'Администратор',
        description: 'Полный доступ ко всем разделам и управлению правами',
        permissions: [...permission_dto_1.ALL_PERMISSIONS],
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
