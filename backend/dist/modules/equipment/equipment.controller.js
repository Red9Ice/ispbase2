"use strict";
/**
 * @file: equipment.controller.ts
 * @description: Equipment controller.
 * @dependencies: backend/src/modules/equipment/dto/equipment.dto.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentController = void 0;
class EquipmentController {
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
    async delete(id) {
        return this.service.delete(id);
    }
}
exports.EquipmentController = EquipmentController;
