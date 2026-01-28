"use strict";
/**
 * @file: permissions.repository.ts
 * @description: In-memory repository for user permissions (by id and email).
 * @dependencies: permission.dto
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsRepository = void 0;
class PermissionsRepository {
    constructor() {
        this.byUserId = new Map();
    }
    setForUser(userId, permissions) {
        this.byUserId.set(userId, new Set(permissions));
    }
    getByUserId(userId) {
        const set = this.byUserId.get(userId);
        return set ? Array.from(set) : [];
    }
    has(userId, permission) {
        const set = this.byUserId.get(userId);
        return set ? set.has(permission) : false;
    }
    hasAny(userId, permissions) {
        return permissions.some((p) => this.has(userId, p));
    }
}
exports.PermissionsRepository = PermissionsRepository;
