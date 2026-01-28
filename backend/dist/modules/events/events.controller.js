"use strict";
/**
 * @file: events.controller.ts
 * @description: Events controller placeholder.
 * @dependencies: backend/src/modules/events/dto/event.dto.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
class EventsController {
    constructor(service) {
        this.service = service;
    }
    async list(filters) {
        return this.service.list(filters);
    }
    async create(payload) {
        return this.service.create(payload);
    }
    async getById(id) {
        return this.service.getById(id);
    }
    async update(id, payload) {
        return this.service.update(id, payload);
    }
    async remove(id) {
        return this.service.remove(id);
    }
}
exports.EventsController = EventsController;
