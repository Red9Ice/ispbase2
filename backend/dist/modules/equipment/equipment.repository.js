"use strict";
/**
 * @file: equipment.repository.ts
 * @description: In-memory repository for equipment.
 * @dependencies: backend/src/modules/equipment/dto/equipment.dto.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentRepository = void 0;
class EquipmentRepository {
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
    findBySerialNumber(serialNumber) {
        return this.items.find((item) => item.serialNumber === serialNumber);
    }
    create(payload) {
        const now = new Date().toISOString();
        const record = { id: this.seq++, createdAt: now, updatedAt: now, ...payload };
        this.items.push(record);
        return record;
    }
    update(id, payload) {
        const index = this.items.findIndex((entry) => entry.id === id);
        if (index < 0)
            return undefined;
        const updated = { ...this.items[index], ...payload, updatedAt: new Date().toISOString() };
        this.items[index] = updated;
        return updated;
    }
    delete(id) {
        const index = this.items.findIndex((entry) => entry.id === id);
        if (index === -1) {
            return false;
        }
        this.items.splice(index, 1);
        return true;
    }
}
exports.EquipmentRepository = EquipmentRepository;
