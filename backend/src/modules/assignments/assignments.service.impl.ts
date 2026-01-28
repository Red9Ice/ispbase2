/**
 * @file: assignments.service.impl.ts
 * @description: In-memory assignments service implementation.
 * @dependencies: backend/src/modules/assignments/assignments.repository.ts
 * @created: 2026-01-26
 */

import { AssignmentDto } from './dto/assignment.dto';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentFilters, AssignmentsService } from './assignments.service';
import { assignmentValidationRules } from './validation/assignment.validation';

const isPositive = (value: number | undefined): boolean => typeof value === 'number' && value > 0;

const validateAssignmentPayload = (payload: AssignmentDto): void => {
  if (!isPositive(payload.eventId) || !isPositive(payload.staffId) || !isPositive(payload.roleId)) {
    throw new Error('Invalid references');
  }
  if (!payload.startTime || !payload.endTime) {
    throw new Error('Invalid time range');
  }
  if (new Date(payload.startTime) >= new Date(payload.endTime)) {
    throw new Error('Invalid time range');
  }
  if (!assignmentValidationRules.status.enum.includes(payload.status)) {
    throw new Error('Invalid status');
  }
};

const validateFilters = (filters?: AssignmentFilters): void => {
  if (!filters) {
    return;
  }
  if (filters.status && !assignmentValidationRules.status.enum.includes(filters.status)) {
    throw new Error('Invalid status filter');
  }
  if (filters.startFrom && filters.endTo && new Date(filters.startFrom) > new Date(filters.endTo)) {
    throw new Error('Invalid filter range');
  }
};

export class AssignmentsServiceImpl implements AssignmentsService {
  constructor(private readonly repository: AssignmentsRepository) {}

  async listByEvent(eventId: number, filters?: AssignmentFilters): Promise<AssignmentDto[]> {
    if (!isPositive(eventId)) {
      throw new Error('Invalid event');
    }
    validateFilters(filters);
    return this.repository.listByEvent(eventId, filters);
  }

  async create(payload: AssignmentDto): Promise<AssignmentDto> {
    validateAssignmentPayload(payload);
    return this.repository.create(payload);
  }

  async getById(id: number): Promise<AssignmentDto | null> {
    return this.repository.getById(id) ?? null;
  }

  async update(id: number, payload: Partial<AssignmentDto>): Promise<AssignmentDto> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error('Assignment not found');
    }
    const merged = { ...existing, ...payload };
    validateAssignmentPayload(merged);
    const updated = this.repository.update(id, payload);
    if (!updated) {
      throw new Error('Assignment not found');
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const removed = this.repository.remove(id);
    if (!removed) {
      throw new Error('Assignment not found');
    }
  }
}
