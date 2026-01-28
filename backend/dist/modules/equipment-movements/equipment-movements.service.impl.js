"use strict";
/**
 * @file: equipment-movements.service.impl.ts
 * @description: In-memory equipment movements service implementation.
 * @dependencies: backend/src/modules/equipment-movements/equipment-movements.repository.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentMovementsServiceImpl = void 0;
const validateMovementPayload = (payload) => {
    const validTypes = ['in', 'out', 'transfer', 'maintenance'];
    if (!validTypes.includes(payload.movementType)) {
        throw new Error('Invalid movement type');
    }
    if (!payload.movedAt) {
        throw new Error('Moved at date is required');
    }
};
class EquipmentMovementsServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async list() {
        return this.repository.list();
    }
    async getById(id) {
        return this.repository.getById(id) ?? null;
    }
    async findByEquipmentId(equipmentId) {
        return this.repository.findByEquipmentId(equipmentId);
    }
    async findByEventId(eventId) {
        return this.repository.findByEventId(eventId);
    }
    async create(payload) {
        validateMovementPayload(payload);
        return this.repository.create(payload);
    }
}
exports.EquipmentMovementsServiceImpl = EquipmentMovementsServiceImpl;
