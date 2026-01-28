"use strict";
/**
 * @file: staff-report.controller.ts
 * @description: Staff report controller placeholder.
 * @dependencies: backend/src/modules/reports/staff-report.service.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffReportController = void 0;
class StaffReportController {
    constructor(service) {
        this.service = service;
    }
    async getUtilization() {
        return this.service.buildUtilization();
    }
}
exports.StaffReportController = StaffReportController;
