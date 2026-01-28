/**
 * @file: staff-report.service.ts
 * @description: In-memory staff utilization report service.
 * @dependencies: backend/src/modules/assignments/assignments.repository.ts
 * @created: 2026-01-26
 */

import { AssignmentsRepository } from '../assignments/assignments.repository';
import { StaffUtilizationDto } from './dto/staff-utilization.dto';

const hoursBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return diff > 0 ? diff / (1000 * 60 * 60) : 0;
};

export class StaffReportService {
  constructor(private readonly assignmentsRepository: AssignmentsRepository) {}

  buildUtilization(): StaffUtilizationDto[] {
    const assignments = this.assignmentsRepository.listAll();
    const grouped = new Map<number, StaffUtilizationDto>();

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
