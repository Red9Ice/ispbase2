"use strict";
/**
 * @file: settings.controller.ts
 * @description: Settings controller.
 * @dependencies: settings.service.ts, settings.dto.ts
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
class SettingsController {
    constructor(service) {
        this.service = service;
    }
    async get() {
        return this.service.get();
    }
    async update(settings) {
        return this.service.update(settings);
    }
    async reset() {
        return this.service.reset();
    }
}
exports.SettingsController = SettingsController;
