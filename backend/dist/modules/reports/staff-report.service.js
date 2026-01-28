"use strict";
/**
 * @file: staff-report.service.ts
 * @description: In-memory staff utilization report service.
 * @dependencies: backend/src/modules/assignments/assignments.repository.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffReportService = void 0;
const hoursBetween = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return diff > 0 ? diff / (1000 * 60 * 60) : 0;
};
class StaffReportService {
    constructor(assignmentsRepository) {
        this.assignmentsRepository = assignmentsRepository;
    }
    buildUtilization() {
        const assignments = this.assignmentsRepository.listAll();
        const grouped = new Map();
        assignments.forEach((assignment) => {
            const hours = hoursBetween(assignment.startTime, assignment.endTime);
            const existing = grouped.get(assignment.staffId) ?? {
                staffId: assignment.staffId,
                assignmentsCount: 0,
                totalHours: 0
            };
            existing.assignmentsCount += 1;
            existing.totalHours += hours;
            grouped.set(assignment.staffId, existing);
        });
        return Array.from(grouped.values());
    }
}
exports.StaffReportService = StaffReportService;
