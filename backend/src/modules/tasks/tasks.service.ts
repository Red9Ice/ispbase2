/**
 * @file: tasks.service.ts
 * @description: Tasks service contract.
 * @dependencies: backend/src/modules/tasks/dto/task.dto.ts
 * @created: 2026-01-27
 */

import { TaskDto, TaskStatus } from './dto/task.dto';

export interface TaskFilters {
  status?: TaskStatus;
  responsibleId?: number;
  problemId?: number;
  q?: string;
  trackedOnly?: boolean;
}

export interface TasksService {
  list(filters?: TaskFilters): Promise<TaskDto[]>;
  getById(id: number): Promise<TaskDto | null>;
  create(payload: Omit<TaskDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskDto>;
  update(id: number, payload: Partial<TaskDto>): Promise<TaskDto>;
  remove(id: number): Promise<void>;
}
