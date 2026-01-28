/**
 * @file: task.dto.ts
 * @description: DTOs for tasks management.
 * @dependencies: none
 * @created: 2026-01-27
 */

export type TaskStatus = 'draft' | 'todo' | 'in_progress' | 'done' | 'closed' | 'cancelled';

export interface TaskDto {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  responsibleId?: number;
  problemId?: number;
  dueDate?: string;
  completionPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}
