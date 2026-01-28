"use strict";
/**
 * @file: history.service.impl.ts
 * @description: Entity change history service implementation.
 * @dependencies: history.repository, history.dto
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryServiceImpl = void 0;
function cloneForHistory(val) {
    if (val == null)
        return null;
    try {
        return JSON.parse(JSON.stringify(val));
    }
    catch {
        return null;
    }
}
class HistoryServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async record(input) {
        const cloned = {
            ...input,
            oldValues: cloneForHistory(input.oldValues),
            newValues: cloneForHistory(input.newValues),
        };
        return this.repository.add(cloned);
    }
    async list(filters) {
        return this.repository.list(filters);
    }
    async cleanupExpired() {
        return this.repository.deleteOlderThanOneYear();
    }
}
exports.HistoryServiceImpl = HistoryServiceImpl;
