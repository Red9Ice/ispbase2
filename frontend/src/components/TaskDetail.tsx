/**
 * @file: TaskDetail.tsx
 * @description: Детальный просмотр задачи.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TaskDto, TaskStatus } from '../services/api';
import { DraggableModal } from './DraggableModal';
import { ConfirmDialog } from './ConfirmDialog';
import { formatDate, getTimeRemaining, formatTimeRemaining } from '../utils/format';

const STATUS_LABELS: Record<TaskStatus, string> = {
  draft: 'Черновик',
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнена',
  closed: 'Закрыта',
  cancelled: 'Отменена',
};

interface TaskDetailProps {
  taskId: number;
  onClose: () => void;
  onEdit: (task: TaskDto) => void;
  onDelete?: () => void;
}

export function TaskDetail({ taskId, onClose, onEdit, onDelete }: TaskDetailProps) {
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const taskData = await api.tasks.getById(taskId);
        setTask(taskData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить задачу');
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [taskId]);

  const handleDelete = async () => {
    if (!task) {
      return;
    }

    setDeleting(true);
    try {
      await api.tasks.delete(task.id!);
      // Анимация удаления элемента из списка
      const cardElement = document.querySelector(`[data-task-id="${task.id}"]`);
      if (cardElement) {
        cardElement.classList.add('card-deleting');
      }
      // Анимация удаления модального окна
      const modalElement = document.querySelector('.modal');
      if (modalElement) {
        modalElement.classList.add('modal-deleting');
        setTimeout(() => {
          if (onDelete) {
            onDelete();
          }
          onClose();
        }, 400);
      } else {
        setTimeout(() => {
          if (onDelete) {
            onDelete();
          }
          onClose();
        }, cardElement ? 500 : 0);
      }
    } catch (err: unknown) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : 'Ошибка при удалении');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <DraggableModal title="Загрузка..." onClose={onClose}>
        <div>Загрузка...</div>
      </DraggableModal>
    );
  }

  if (error || !task) {
    return (
      <DraggableModal title="Ошибка" onClose={onClose}>
        <p>{error || 'Задача не найдена'}</p>
      </DraggableModal>
    );
  }

  return (
    <DraggableModal title={`Задача #${task.id}`} onClose={onClose}>
      <div className="task-detail">
        <div className="task-detail-header">
          <h2 className="task-detail-title">{task.title}</h2>
          <span className={`tag ${task.status}`}>{STATUS_LABELS[task.status]}</span>
        </div>

        {task.description && (
          <div className="task-detail-section">
            <h3 className="task-detail-section-title">Описание</h3>
            <p className="task-detail-description">{task.description}</p>
          </div>
        )}

        <div className="task-detail-section">
          <h3 className="task-detail-section-title">Информация</h3>
          <div className="task-detail-info">
            <div className="task-detail-info-row">
              <span className="task-detail-info-label">Статус:</span>
              <span className={`tag ${task.status}`}>{STATUS_LABELS[task.status]}</span>
            </div>
            
            {/* Статус-бар выполнения задачи */}
            <div className="task-detail-statusbar-container">
              <div className="task-detail-statusbar-header">
                <span className="task-detail-info-label">Выполнение:</span>
                <span className="task-detail-statusbar-value">
                  {task.completionPercentage !== undefined ? `${task.completionPercentage}%` : '0%'}
                </span>
              </div>
              <div className="task-detail-statusbar">
                <div
                  className="task-detail-statusbar-fill"
                  style={{
                    width: `${Math.min(Math.max(task.completionPercentage || 0, 0), 100)}%`,
                    backgroundColor: (task.completionPercentage || 0) >= 100 
                      ? 'var(--color-success, #10b981)' 
                      : (task.completionPercentage || 0) >= 50 
                        ? 'var(--color-accent, #3b82f6)' 
                        : 'var(--color-warning, #f59e0b)',
                  }}
                />
              </div>
            </div>

            {/* Статус-бар оставшегося времени */}
            {task.dueDate && (
              <div className="task-detail-statusbar-container">
                <div className="task-detail-statusbar-header">
                  <span className="task-detail-info-label">Срок выполнения:</span>
                  <span className="task-detail-statusbar-value">
                    {formatTimeRemaining(task.dueDate)}
                  </span>
                </div>
                <div className="task-detail-statusbar">
                  <div
                    className="task-detail-statusbar-fill"
                    style={{
                      width: `${Math.min(Math.max(getTimeRemaining(task.dueDate, task.createdAt).percentage, 0), 100)}%`,
                      backgroundColor: getTimeRemaining(task.dueDate, task.createdAt).isOverdue
                        ? 'var(--color-danger, #ef4444)'
                        : getTimeRemaining(task.dueDate, task.createdAt).days <= 3
                          ? 'var(--color-warning, #f59e0b)'
                          : 'var(--color-success, #10b981)',
                    }}
                  />
                </div>
                <div className="task-detail-statusbar-footer">
                  <span className="task-detail-statusbar-date">{formatDate(task.dueDate)}</span>
                </div>
              </div>
            )}

            {task.createdAt && (
              <div className="task-detail-info-row">
                <span className="task-detail-info-label">Создана:</span>
                <span>{formatDate(task.createdAt)}</span>
              </div>
            )}
            {task.updatedAt && (
              <div className="task-detail-info-row">
                <span className="task-detail-info-label">Обновлена:</span>
                <span>{formatDate(task.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="task-detail-actions">
          <button onClick={() => onEdit(task)} className="button-secondary">
            Редактировать
          </button>
          {onDelete && (
            <button onClick={handleDeleteClick} className="button-danger" disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </button>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удаление задачи"
        message={`Вы уверены, что хотите удалить задачу "${task?.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </DraggableModal>
  );
}
