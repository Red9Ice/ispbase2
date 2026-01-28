"use strict";
/**
 * @file: equipment-categories.service.impl.ts
 * @description: In-memory equipment categories service implementation.
 * @dependencies: backend/src/modules/equipment-categories/equipment-categories.repository.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentCategoriesServiceImpl = void 0;
const isNonEmptyString = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const validateCategoryPayload = (payload) => {
    if (!isNonEmptyString(payload.name, 1, 100)) {
        throw new Error('Invalid category name');
    }
};
class EquipmentCategoriesServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async list() {
        return this.repository.list();
    }
    async create(payload) {
        validateCategoryPayload(payload);
        return this.repository.create(payload);
    }
    async getById(id) {
        return this.repository.getById(id) ?? null;
    }
    async update(id, payload) {
        const existing = this.repository.getById(id);
        if (!existing) {
            throw new Error('Category not found');
        }
        const merged = { ...existing, ...payload };
        validateCategoryPayload(merged);
        const updated = this.repository.update(id, payload);
        if (!updated) {
            throw new Error('Category not found');
        }
        return updated;
    }
    async delete(id) {
        const deleted = this.repository.delete(id);
        if (!deleted) {
            throw new Error('Category not found');
        }
    }
}
exports.EquipmentCategoriesServiceImpl = EquipmentCategoriesServiceImpl;
