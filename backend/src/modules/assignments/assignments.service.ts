/**
 * @file: assignments.service.ts
 * @description: Assignments service contract.
 * @dependencies: backend/src/modules/assignments/dto/assignment.dto.ts
 * @created: 2026-01-26
 */

import { AssignmentDto, AssignmentStatus } from './dto/assignment.dto';

export interface AssignmentFilters {
  status?: AssignmentStatus;
  startFrom?: string;
  endTo?: string;
}

export interface AssignmentsService {
  listByEvent(eventId: number, filters?: AssignmentFilters): Promise<AssignmentDto[]>;
  create(payload: AssignmentDto): Promise<AssignmentDto>;
  getById(id: number): Promise<AssignmentDto | null>;
  update(id: number, payload: Partial<AssignmentDto>): Promise<AssignmentDto>;
  remove(id: number): Promise<void>;
}
