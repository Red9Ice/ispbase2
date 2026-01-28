/**
 * @file: tasks.controller.ts
 * @description: Tasks controller.
 * @dependencies: backend/src/modules/tasks/tasks.service.ts
 * @created: 2026-01-27
 */

import { TaskDto } from './dto/task.dto';
import { TaskFilters, TasksService } from './tasks.service';

export class TasksController {
  constructor(private readonly service: TasksService) {}

  async list(filters?: TaskFilters): Promise<TaskDto[]> {
    return this.service.list(filters);
  }

  async getById(id: number): Promise<TaskDto | null> {
    return this.service.getById(id);
  }

  async create(payload: Omit<TaskDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskDto> {
    return this.service.create(payload);
  }

  async update(id: number, payload: Partial<TaskDto>): Promise<TaskDto> {
    return this.service.update(id, payload);
  }

  async remove(id: number): Promise<void> {
    return this.service.remove(id);
  }
}
