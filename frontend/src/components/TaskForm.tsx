/**
 * @file: TaskForm.tsx
 * @description: Форма создания/редактирования задачи.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState } from 'react';
import { api } from '../services/api';
import type { TaskDto, TaskStatus } from '../services/api';
import { DraggableModal } from './DraggableModal';
import { DatePicker } from './DatePicker';

interface TaskFormProps {
  task?: TaskDto;
  initialStatus?: TaskStatus;
  onSave: () => void;
  onCancel: () => void;
}

export function TaskForm({ task, initialStatus, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || initialStatus || 'draft');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Название задачи обязательно');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Omit<TaskDto, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? `${dueDate}T23:59:59Z` : undefined,
      };

      if (task?.id) {
        await api.tasks.update(task.id, payload);
      } else {
        await api.tasks.create(payload);
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении задачи');
      setSaving(false);
    }
  };

  return (
    <DraggableModal
      title={task ? 'Редактировать задачу' : 'Создать задачу'}
      onClose={onCancel}
    >
      <form onSubmit={handleSubmit} className="task-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="task-title">Название *</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input"
            placeholder="Введите название задачи"
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-description">Описание</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            placeholder="Введите описание задачи"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-status">Статус</label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="form-select"
          >
            <option value="draft">Черновик</option>
            <option value="todo">К выполнению</option>
            <option value="in_progress">В работе</option>
            <option value="done">Выполнена</option>
            <option value="closed">Закрыта</option>
            <option value="cancelled">Отменена</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-due-date">Срок выполнения</label>
          <DatePicker
            value={dueDate}
            onChange={(value) => setDueDate(value)}
            placeholder="Выберите срок выполнения"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="button-secondary" disabled={saving}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Сохранение...' : task ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </DraggableModal>
  );
}
