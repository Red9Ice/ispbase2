"use strict";
/**
 * @file: equipment-categories.repository.ts
 * @description: In-memory repository for equipment categories.
 * @dependencies: backend/src/modules/equipment-categories/dto/equipment-category.dto.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentCategoriesRepository = void 0;
class EquipmentCategoriesRepository {
    constructor() {
        this.items = [
            { id: 1, name: 'Свет', description: 'Оборудование для освещения', parentId: null, createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
            { id: 2, name: 'Звук', description: 'Аудио оборудование', parentId: null, createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
            { id: 3, name: 'Ригг', description: 'Конструкции и подвесы', parentId: null, createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
            { id: 4, name: 'Прочее', description: 'Прочее оборудование', parentId: null, createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
        ];
        this.seq = 5;
    }
    list() {
        return [...this.items];
    }
    getById(id) {
        return this.items.find((item) => item.id === id);
    }
    listByParentId(parentId) {
        return this.items.filter((item) => (item.parentId ?? null) === parentId);
    }
    create(payload) {
        const now = new Date().toISOString();
        const parentId = payload.parentId ?? null;
        const record = { id: this.seq++, createdAt: now, updatedAt: now, ...payload, parentId };
        this.items.push(record);
        return record;
    }
    update(id, payload) {
        const item = this.getById(id);
        if (!item) {
            return undefined;
        }
        const updated = { ...item, ...payload, updatedAt: new Date().toISOString() };
        const index = this.items.findIndex((entry) => entry.id === id);
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
exports.EquipmentCategoriesRepository = EquipmentCategoriesRepository;
