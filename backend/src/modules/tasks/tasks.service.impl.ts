/**
 * @file: tasks.service.impl.ts
 * @description: Tasks service implementation.
 * @dependencies: backend/src/modules/tasks/tasks.service.ts, backend/src/modules/tasks/tasks.repository.ts
 * @created: 2026-01-27
 */

import { TaskDto, TaskStatus } from './dto/task.dto';
import { TasksService, TaskFilters } from './tasks.service';
import { TasksRepository } from './tasks.repository';

const isNonEmptyString = (value: string | undefined, min: number, max: number): boolean =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

const isValidStatus = (status: string): status is TaskStatus => {
  const validStatuses: TaskStatus[] = ['draft', 'todo', 'in_progress', 'done', 'closed', 'cancelled'];
  return validStatuses.includes(status as TaskStatus);
};

const validateTaskPayload = (payload: Partial<TaskDto>): void => {
  if (payload.title !== undefined && !isNonEmptyString(payload.title, 1, 500)) {
    throw new Error('Invalid task title');
  }
  if (payload.description !== undefined && payload.description !== null && !isNonEmptyString(payload.description, 0, 5000)) {
    throw new Error('Invalid task description');
  }
  if (payload.status !== undefined && !isValidStatus(payload.status)) {
    throw new Error('Invalid task status');
  }
  if (payload.completionPercentage !== undefined) {
    if (typeof payload.completionPercentage !== 'number' || payload.completionPercentage < 0 || payload.completionPercentage > 100) {
      throw new Error('Invalid completion percentage');
    }
  }
};

export class TasksServiceImpl implements TasksService {
  constructor(private readonly repository: TasksRepository) {}

  async list(filters?: TaskFilters): Promise<TaskDto[]> {
    return this.repository.list(filters);
  }

  async getById(id: number): Promise<TaskDto | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid task id');
    }
    return this.repository.getById(id);
  }

  async create(payload: Omit<TaskDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskDto> {
    if (!payload.title || !payload.status) {
      throw new Error('Title and status are required');
    }
    validateTaskPayload(payload);
    return this.repository.create(payload);
  }

  async update(id: number, payload: Partial<TaskDto>): Promise<TaskDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid task id');
    }
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error('Task not found');
    }
    validateTaskPayload(payload);
    const merged = { ...existing, ...payload };
    validateTaskPayload(merged);
    return this.repository.update(id, payload);
  }

  async remove(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid task id');
    }
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error('Task not found');
    }
    return this.repository.remove(id);
  }
}
