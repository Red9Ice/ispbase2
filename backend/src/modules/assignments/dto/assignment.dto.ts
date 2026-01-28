/**
 * @file: assignment.dto.ts
 * @description: Draft DTOs for staff assignments.
 * @dependencies: none
 * @created: 2026-01-26
 */

export type AssignmentStatus = 'planned' | 'confirmed' | 'completed' | 'canceled';

export interface AssignmentDto {
  eventId: number;
  staffId: number;
  roleId: number;
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  paymentAmount?: number; // Заработок за это мероприятие (если указан, используется вместо расчета по rate)
}
