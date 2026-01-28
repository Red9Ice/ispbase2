/**
 * @file: staff-utilization.dto.ts
 * @description: Staff utilization report DTO.
 * @dependencies: none
 * @created: 2026-01-26
 */

export interface StaffUtilizationDto {
  staffId: number;
  assignmentsCount: number;
  totalHours: number;
}
