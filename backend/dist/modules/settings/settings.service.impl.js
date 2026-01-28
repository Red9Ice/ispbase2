"use strict";
/**
 * @file: settings.service.impl.ts
 * @description: Settings service implementation.
 * @dependencies: settings.service.ts, settings.repository.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsServiceImpl = void 0;
class SettingsServiceImpl {
    constructor(repository) {
        this.repository = repository;
    }
    async get() {
        return this.repository.get();
    }
    async update(settings) {
        return this.repository.update(settings);
    }
    async reset() {
        return this.repository.reset();
    }
}
exports.SettingsServiceImpl = SettingsServiceImpl;
