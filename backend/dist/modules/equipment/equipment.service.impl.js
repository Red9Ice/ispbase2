"use strict";
/**
 * @file: equipment.service.impl.ts
 * @description: In-memory equipment service implementation.
 * @dependencies: backend/src/modules/equipment/equipment.repository.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentServiceImpl = void 0;
const isNonEmptyString = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const validateEquipmentPayload = (payload) => {
    if (!isNonEmptyString(payload.name, 1, 200)) {
        throw new Error('Invalid equipment name');
    }
    const validStatuses = ['available', 'in_use', 'maintenance', 'retired'];
    if (!validStatuses.includes(payload.status)) {
        throw new Error('Invalid status');
    }
};
class EquipmentServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async list() {
        return this.repository.list();
    }
    async create(payload) {
        validateEquipmentPayload(payload);
        // Проверка уникальности серийного номера, если указан
        if (payload.serialNumber) {
            const existing = this.repository.findBySerialNumber(payload.serialNumber);
            if (existing) {
                throw new Error('Equipment with this serial number already exists');
            }
        }
        return this.repository.create(payload);
    }
    async getById(id) {
        return this.repository.getById(id) ?? null;
    }
    async update(id, payload) {
        const existing = this.repository.getById(id);
        if (!existing) {
            throw new Error('Equipment not found');
        }
        // Проверка уникальности серийного номера при обновлении
        if (payload.serialNumber && payload.serialNumber !== existing.serialNumber) {
            const existingBySerial = this.repository.findBySerialNumber(payload.serialNumber);
            if (existingBySerial && existingBySerial.id !== id) {
                throw new Error('Equipment with this serial number already exists');
            }
        }
        const merged = { ...existing, ...payload };
        validateEquipmentPayload(merged);
        const updated = this.repository.update(id, payload);
        if (!updated) {
            throw new Error('Equipment not found');
        }
        return updated;
    }
    async delete(id) {
        const deleted = this.repository.delete(id);
        if (!deleted) {
            throw new Error('Equipment not found');
        }
    }
}
exports.EquipmentServiceImpl = EquipmentServiceImpl;
