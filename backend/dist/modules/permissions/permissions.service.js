"use strict";
/**
 * @file: permissions.service.ts
 * @description: Service for user permissions (by id and email).
 * @dependencies: users, permissions repositories
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const permission_dto_1 = require("./dto/permission.dto");
class PermissionsService {
    constructor(users, permissions) {
        this.users = users;
        this.permissions = permissions;
    }
    async listUsersWithPermissions() {
        const users = await this.users.list();
        return Promise.all(users.map(async (u) => ({
            userId: u.id,
            email: u.email,
            displayName: u.displayName,
            permissions: this.permissions.getByUserId(u.id),
        })));
    }
    async getByUserId(userId) {
        const u = await this.users.getById(userId);
        if (!u)
            return null;
        return {
            userId: u.id,
            email: u.email,
            displayName: u.displayName,
            permissions: this.permissions.getByUserId(u.id),
        };
    }
    async getByEmail(email) {
        const u = await this.users.getByEmail(email);
        if (!u)
            return null;
        return this.getByUserId(u.id);
    }
    async update(userId, dto) {
        const u = await this.users.getById(userId);
        if (!u)
            return null;
        const valid = dto.permissions.filter((p) => permission_dto_1.ALL_PERMISSIONS.includes(p));
        this.permissions.setForUser(userId, valid);
        return this.getByUserId(userId);
    }
    allPermissionKeys() {
        return [...permission_dto_1.ALL_PERMISSIONS];
    }
}
exports.PermissionsService = PermissionsService;
