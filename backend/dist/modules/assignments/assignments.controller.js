"use strict";
/**
 * @file: assignments.controller.ts
 * @description: Assignments controller placeholder.
 * @dependencies: backend/src/modules/assignments/assignments.service.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsController = void 0;
class AssignmentsController {
    constructor(service) {
        this.service = service;
    }
    async listByEvent(eventId, filters) {
        return this.service.listByEvent(eventId, filters);
    }
    async getById(id) {
        return this.service.getById(id);
    }
    async create(payload) {
        return this.service.create(payload);
    }
    async update(id, payload) {
        return this.service.update(id, payload);
    }
    async remove(id) {
        return this.service.remove(id);
    }
}
exports.AssignmentsController = AssignmentsController;
