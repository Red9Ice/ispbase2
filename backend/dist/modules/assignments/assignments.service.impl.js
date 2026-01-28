"use strict";
/**
 * @file: assignments.service.impl.ts
 * @description: In-memory assignments service implementation.
 * @dependencies: backend/src/modules/assignments/assignments.repository.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsServiceImpl = void 0;
const assignment_validation_1 = require("./validation/assignment.validation");
const isPositive = (value) => typeof value === 'number' && value > 0;
const validateAssignmentPayload = (payload) => {
    if (!isPositive(payload.eventId) || !isPositive(payload.staffId) || !isPositive(payload.roleId)) {
        throw new Error('Invalid references');
    }
    if (!payload.startTime || !payload.endTime) {
        throw new Error('Invalid time range');
    }
    if (new Date(payload.startTime) >= new Date(payload.endTime)) {
        throw new Error('Invalid time range');
    }
    if (!assignment_validation_1.assignmentValidationRules.status.enum.includes(payload.status)) {
        throw new Error('Invalid status');
    }
};
const validateFilters = (filters) => {
    if (!filters) {
        return;
    }
    if (filters.status && !assignment_validation_1.assignmentValidationRules.status.enum.includes(filters.status)) {
        throw new Error('Invalid status filter');
    }
    if (filters.startFrom && filters.endTo && new Date(filters.startFrom) > new Date(filters.endTo)) {
        throw new Error('Invalid filter range');
    }
};
class AssignmentsServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async listByEvent(eventId, filters) {
        if (!isPositive(eventId)) {
            throw new Error('Invalid event');
        }
        validateFilters(filters);
        return this.repository.listByEvent(eventId, filters);
    }
    async create(payload) {
        validateAssignmentPayload(payload);
        return this.repository.create(payload);
    }
    async getById(id) {
        return this.repository.getById(id) ?? null;
    }
    async update(id, payload) {
        const existing = this.repository.getById(id);
        if (!existing) {
            throw new Error('Assignment not found');
        }
        const merged = { ...existing, ...payload };
        validateAssignmentPayload(merged);
        const updated = this.repository.update(id, payload);
        if (!updated) {
            throw new Error('Assignment not found');
        }
        return updated;
    }
    async remove(id) {
        const removed = this.repository.remove(id);
        if (!removed) {
            throw new Error('Assignment not found');
        }
    }
}
exports.AssignmentsServiceImpl = AssignmentsServiceImpl;
