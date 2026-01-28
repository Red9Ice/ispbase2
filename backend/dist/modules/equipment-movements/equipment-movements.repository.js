"use strict";
/**
 * @file: equipment-movements.repository.ts
 * @description: In-memory repository for equipment movements.
 * @dependencies: backend/src/modules/equipment-movements/dto/equipment-movement.dto.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentMovementsRepository = void 0;
class EquipmentMovementsRepository {
    constructor() {
        this.items = [];
        this.seq = 1;
    }
    list() {
        return [...this.items];
    }
    getById(id) {
        return this.items.find((item) => item.id === id);
    }
    findByEquipmentId(equipmentId) {
        return this.items.filter((item) => item.equipmentId === equipmentId);
    }
    findByEventId(eventId) {
        return this.items.filter((item) => item.eventId === eventId);
    }
    create(payload) {
        const now = new Date().toISOString();
        const record = {
            id: this.seq++,
            createdAt: now,
            ...payload
        };
        this.items.push(record);
        return record;
    }
}
exports.EquipmentMovementsRepository = EquipmentMovementsRepository;
