"use strict";
/**
 * @file: assignments.repository.ts
 * @description: In-memory repository for assignments.
 * @dependencies: backend/src/modules/assignments/dto/assignment.dto.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsRepository = void 0;
class AssignmentsRepository {
    constructor() {
        this.items = [];
        this.seq = 1;
    }
    listByEvent(eventId, filters) {
        const byEvent = this.items.filter((item) => item.eventId === eventId);
        if (!filters) {
            return byEvent;
        }
        return byEvent.filter((item) => {
            const statusMatch = filters.status ? item.status === filters.status : true;
            const startMatch = filters.startFrom ? item.startTime >= filters.startFrom : true;
            const endMatch = filters.endTo ? item.endTime <= filters.endTo : true;
            return statusMatch && startMatch && endMatch;
        });
    }
    listAll() {
        return [...this.items];
    }
    getById(id) {
        return this.items.find((item) => item.id === id);
    }
    create(payload) {
        const now = new Date().toISOString();
        const record = { id: this.seq++, createdAt: now, updatedAt: now, ...payload };
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
    remove(id) {
        const index = this.items.findIndex((entry) => entry.id === id);
        if (index < 0) {
            return false;
        }
        this.items.splice(index, 1);
        return true;
    }
}
exports.AssignmentsRepository = AssignmentsRepository;
