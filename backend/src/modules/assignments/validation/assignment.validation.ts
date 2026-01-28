/**
 * @file: assignment.validation.ts
 * @description: Draft validation rules for assignments.
 * @dependencies: backend/src/modules/assignments/dto/assignment.dto.ts
 * @created: 2026-01-26
 */

import { AssignmentDto } from '../dto/assignment.dto';

export const assignmentValidationRules = {
  eventId: { positive: true },
  staffId: { positive: true },
  roleId: { positive: true },
  timeRange: { compare: 'startTime<endTime' },
  status: { enum: ['planned', 'confirmed', 'completed', 'canceled'] }
} as const;

export type AssignmentValidationRules = typeof assignmentValidationRules;

export const validateAssignmentDraft = (_payload: AssignmentDto): boolean => {
  return true;
};
