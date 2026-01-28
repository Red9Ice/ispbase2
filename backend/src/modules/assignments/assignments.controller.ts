/**
 * @file: assignments.controller.ts
 * @description: Assignments controller placeholder.
 * @dependencies: backend/src/modules/assignments/assignments.service.ts
 * @created: 2026-01-26
 */

import { AssignmentDto } from './dto/assignment.dto';
import { AssignmentFilters, AssignmentsService } from './assignments.service';

export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  async listByEvent(eventId: number, filters?: AssignmentFilters): Promise<AssignmentDto[]> {
    return this.service.listByEvent(eventId, filters);
  }

  async getById(id: number): Promise<AssignmentDto | null> {
    return this.service.getById(id);
  }

  async create(payload: AssignmentDto): Promise<AssignmentDto> {
    return this.service.create(payload);
  }

  async update(id: number, payload: Partial<AssignmentDto>): Promise<AssignmentDto> {
    return this.service.update(id, payload);
  }

  async remove(id: number): Promise<void> {
    return this.service.remove(id);
  }
}
