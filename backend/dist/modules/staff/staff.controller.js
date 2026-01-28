"use strict";
/**
 * @file: staff.controller.ts
 * @description: Staff controller placeholder.
 * @dependencies: backend/src/modules/staff/dto/staff.dto.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
class StaffController {
    constructor(service) {
        this.service = service;
    }
    async list() {
        return this.service.list();
    }
    async create(payload) {
        return this.service.create(payload);
    }
    async getById(id) {
        return this.service.getById(id);
    }
    async update(id, payload) {
        return this.service.update(id, payload);
    }
    async deactivate(id) {
        return this.service.deactivate(id);
    }
}
exports.StaffController = StaffController;
