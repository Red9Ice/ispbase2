"use strict";
/**
 * @file: staff.service.impl.ts
 * @description: In-memory staff service implementation.
 * @dependencies: backend/src/modules/staff/staff.repository.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffServiceImpl = void 0;
const staff_validation_1 = require("./validation/staff.validation");
const isNonEmptyString = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const isEmailLike = (value) => typeof value === 'string' && value.includes('@');
const isNonNegative = (value) => typeof value === 'number' && value >= 0;
const validateStaffPayload = (payload) => {
    if (!isNonEmptyString(payload.firstName, staff_validation_1.staffValidationRules.firstName.min, staff_validation_1.staffValidationRules.firstName.max)) {
        throw new Error('Invalid first name');
    }
    if (!isNonEmptyString(payload.lastName, staff_validation_1.staffValidationRules.lastName.min, staff_validation_1.staffValidationRules.lastName.max)) {
        throw new Error('Invalid last name');
    }
    if (!isEmailLike(payload.email)) {
        throw new Error('Invalid email');
    }
    if (payload.rate !== undefined && !isNonNegative(payload.rate)) {
        throw new Error('Invalid rate');
    }
    if (!staff_validation_1.staffValidationRules.currency.enum.includes(payload.currency)) {
        throw new Error('Invalid currency');
    }
    if (!staff_validation_1.staffValidationRules.status.enum.includes(payload.status)) {
        throw new Error('Invalid status');
    }
};
class StaffServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async list() {
        return this.repository.list();
    }
    async create(payload) {
        validateStaffPayload(payload);
        return this.repository.create(payload);
    }
    async getById(id) {
        return this.repository.getById(id) ?? null;
    }
    async update(id, payload) {
        const existing = this.repository.getById(id);
        if (!existing) {
            throw new Error('Staff not found');
        }
        const merged = { ...existing, ...payload };
        validateStaffPayload(merged);
        const updated = this.repository.update(id, payload);
        if (!updated) {
            throw new Error('Staff not found');
        }
        return updated;
    }
    async deactivate(id) {
        const updated = this.repository.deactivate(id);
        if (!updated) {
            throw new Error('Staff not found');
        }
    }
}
exports.StaffServiceImpl = StaffServiceImpl;
