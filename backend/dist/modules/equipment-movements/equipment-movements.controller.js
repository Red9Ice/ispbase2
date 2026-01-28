"use strict";
/**
 * @file: equipment-movements.controller.ts
 * @description: Equipment movements controller.
 * @dependencies: backend/src/modules/equipment-movements/dto/equipment-movement.dto.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentMovementsController = void 0;
class EquipmentMovementsController {
    constructor(service) {
        this.service = service;
    }
    async list() {
        return this.service.list();
    }
    async getById(id) {
        return this.service.getById(id);
    }
    async findByEquipmentId(equipmentId) {
        return this.service.findByEquipmentId(equipmentId);
    }
    async findByEventId(eventId) {
        return this.service.findByEventId(eventId);
    }
    async create(payload) {
        return this.service.create(payload);
    }
}
exports.EquipmentMovementsController = EquipmentMovementsController;
