"use strict";
/**
 * @file: roles.repository.ts
 * @description: Read-only repository for built-in roles.
 * @dependencies: role.dto
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesRepository = void 0;
const role_dto_1 = require("./dto/role.dto");
class RolesRepository {
    list() {
        return [...role_dto_1.BUILTIN_ROLES];
    }
    getById(id) {
        return role_dto_1.BUILTIN_ROLES.find((r) => r.id === id);
    }
}
exports.RolesRepository = RolesRepository;
