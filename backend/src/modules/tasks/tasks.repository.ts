/**
 * @file: tasks.repository.ts
 * @description: In-memory repository for tasks.
 * @dependencies: backend/src/modules/tasks/dto/task.dto.ts
 * @created: 2026-01-27
 */

import { TaskDto } from './dto/task.dto';
import { TaskFilters } from './tasks.service';

export interface TaskRecord extends TaskDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export class TasksRepository {
  private readonly items: TaskRecord[] = [
    {
      id: 1,
      title: 'Создать шаблоны пультовых с наименованиями для списка погрузки',
      description: 'Необходимо подготовить шаблоны для пультовых с указанием наименований оборудования',
      status: 'draft',
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-01-20T10:00:00Z',
    },
    {
      id: 2,
      title: 'КП Астрахань Война и мир',
      description: 'Подготовить коммерческое предложение для мероприятия в Астрахани',
      status: 'todo',
      dueDate: '2026-01-31T23:59:59Z',
      createdAt: '2026-01-15T09:00:00Z',
      updatedAt: '2026-01-15T09:00:00Z',
    },
    {
      id: 3,
      title: 'Закрывающие документы гостиница Волга Самара, Закрывающие документы Глазов продление проживания',
      description: 'Подготовить закрывающие документы для двух мероприятий',
      status: 'todo',
      dueDate: '2026-07-31T23:59:59Z',
      responsibleId: 1,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 4,
      title: 'не забыть ВСЁ И ВЕЗДЕ',
      description: 'Важная задача',
      status: 'cancelled',
      dueDate: '2026-06-06T23:59:59Z',
      responsibleId: 1,
      createdAt: '2026-01-05T07:00:00Z',
      updatedAt: '2026-01-06T10:00:00Z',
    },
    {
      id: 6,
      title: 'КП Астрахань Война и мир',
      description: 'Подготовить коммерческое предложение',
      status: 'done',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-15T14:00:00Z',
    },
    {
      id: 12,
      title: 'Проживание Сабантуй',
      description: 'Организовать проживание для команды на мероприятии Сабантуй',
      status: 'done',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-10T12:00:00Z',
    },
    {
      id: 18,
      title: 'Создать шаблоны пультовых с наименованиями для списка погрузки',
      description: 'Подготовить шаблоны',
      status: 'draft',
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-01-20T10:00:00Z',
    },
    {
      id: 20,
      title: 'Сделать авансовый отчет за Уфу (Китап Байрам)',
      description: 'Подготовить авансовый отчет',
      status: 'done',
      dueDate: '2026-06-16T23:59:59Z',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-15T16:00:00Z',
    },
    {
      id: 21,
      title: 'Заказать кран для закидывания балок Сабантуй.',
      description: 'Организовать аренду крана',
      status: 'done',
      dueDate: '2026-06-17T23:59:59Z',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-12T11:00:00Z',
    },
    {
      id: 22,
      title: 'Закрывающие документы гостиница Волга Самара, Закрывающие документы Глазов продление проживания',
      description: 'Подготовить документы',
      status: 'todo',
      dueDate: '2026-07-31T23:59:59Z',
      responsibleId: 1,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 24,
      title: 'Сделать отчет по мероприятию НЛК',
      description: 'Подготовить итоговый отчет',
      status: 'done',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-14T13:00:00Z',
    },
    {
      id: 26,
      title: 'Занести все конструкции выставки в РР',
      description: 'Внести данные о конструкциях в систему',
      status: 'done',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-13T15:00:00Z',
    },
    {
      id: 27,
      title: 'Занести проект Звери по механике и подвесу',
      description: 'Внести данные проекта',
      status: 'done',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-12T14:00:00Z',
    },
  ];

  private nextId = 28;

  list(filters?: TaskFilters): TaskRecord[] {
    let result = [...this.items];

    if (filters?.status) {
      result = result.filter((item) => item.status === filters.status);
    }

    if (filters?.responsibleId !== undefined) {
      result = result.filter((item) => item.responsibleId === filters.responsibleId);
    }

    if (filters?.problemId !== undefined) {
      result = result.filter((item) => item.problemId === filters.problemId);
    }

    if (filters?.q) {
      const query = filters.q.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)),
      );
    }

    return result;
  }

  getById(id: number): TaskRecord | null {
    return this.items.find((item) => item.id === id) || null;
  }

  create(payload: Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'>): TaskRecord {
    const now = new Date().toISOString();
    const newItem: TaskRecord = {
      ...payload,
      id: this.nextId++,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(newItem);
    return newItem;
  }

  update(id: number, payload: Partial<TaskRecord>): TaskRecord {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    const updated = {
      ...this.items[index],
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.items[index] = updated;
    return updated;
  }

  remove(id: number): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    this.items.splice(index, 1);
  }
}
