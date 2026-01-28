/**
 * @file: TasksBoard.tsx
 * @description: Канбан-доска для управления задачами.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { TaskDto, TaskStatus, TaskFilters } from '../services/api';
import { formatDate } from '../utils/format';
import './TasksBoard.css';

const STATUS_LABELS: Record<TaskStatus, string> = {
  draft: 'Черновик',
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнена',
  closed: 'Закрыта',
  cancelled: 'Отменена',
};

const STATUS_ORDER: TaskStatus[] = ['draft', 'todo', 'in_progress', 'done', 'closed', 'cancelled'];

interface TasksBoardProps {
  onTaskClick: (taskId: number) => void;
  onCreateTask: (status: TaskStatus) => void;
  refreshTrigger?: number;
}

export function TasksBoard({ onTaskClick, onCreateTask, refreshTrigger }: TasksBoardProps) {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      const taskFilters: TaskFilters = {
        ...filters,
        q: searchQuery || undefined,
      };
      const data = await api.tasks.list(taskFilters);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshTrigger]);

  const getTasksByStatus = (status: TaskStatus): TaskDto[] => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="tasks-board-container">
      <div className="tasks-board-header">
        <div className="tasks-board-filters">
          <div className="tasks-search">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tasks-search-input"
            />
          </div>
          <div className="tasks-filters">
            <select
              value={filters.responsibleId || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  responsibleId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="tasks-filter-select"
            >
              <option value="">Ответственный: Не выбрано</option>
              {/* Здесь можно добавить список ответственных */}
            </select>
            <select
              value={filters.problemId || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  problemId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="tasks-filter-select"
            >
              <option value="">Проблема: Не выбрано</option>
              {/* Здесь можно добавить список проблем */}
            </select>
          </div>
        </div>
        <div className="tasks-board-info">
          <span className="tasks-count">
            Отображаются 1-{tasks.length} из {tasks.length}
          </span>
          <div className="tasks-board-actions">
            <label className="tasks-tracked-toggle">
              <input
                type="checkbox"
                checked={filters.trackedOnly || false}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    trackedOnly: e.target.checked || undefined,
                  })
                }
              />
              <span>Только отслеживаемые</span>
              <span className="tasks-help-icon">?</span>
            </label>
            <button className="tasks-export-button" title="Выгрузка">
              ⬇
            </button>
            <button className="tasks-view-button" title="Изменить вид">
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="tasks-kanban-board">
        {STATUS_ORDER.map((status) => {
          const statusTasks = getTasksByStatus(status);
          return (
            <div key={status} className="tasks-column">
              <div className="tasks-column-header">
                <h3 className="tasks-column-title">
                  {STATUS_LABELS[status]} ({statusTasks.length})
                </h3>
                <button
                  className="tasks-add-button"
                  onClick={() => onCreateTask(status)}
                  title={`Добавить задачу в ${STATUS_LABELS[status]}`}
                >
                  +
                </button>
              </div>
              <div className="tasks-column-content">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    data-task-id={task.id}
                    className="tasks-card"
                    onClick={() => task.id && onTaskClick(task.id)}
                  >
                    <div className="tasks-card-title">{task.title}</div>
                    {task.dueDate && (
                      <div className="tasks-card-date">
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                    {task.responsibleId && (
                      <div className="tasks-card-responsible">👤</div>
                    )}
                  </div>
                ))}
                {statusTasks.length === 0 && (
                  <div className="tasks-empty-column">Нет задач</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
