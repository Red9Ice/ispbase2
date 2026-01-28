/**
 * @file: TaskDetailPage.tsx
 * @description: Полноценная страница просмотра задачи.
 * @dependencies: services/api, EventPages.css, format
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { TaskDto, TaskStatus } from '../services/api';
import { formatDate, getTimeRemaining, formatTimeRemaining } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import './EventPages.css';

const STATUS_LABELS: Record<TaskStatus, string> = {
  draft: 'Черновик',
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнена',
  closed: 'Закрыта',
  cancelled: 'Отменена',
};

export function TaskDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Определяем, откуда пришли, чтобы правильно вернуться назад
  const fromPage = (location.state as { from?: string })?.from || 'dashboard';
  const backPath = '/dashboard';
  
  // Извлекаем ID из URL, если useParams не сработал (из-за условного рендеринга в App.tsx)
  const pathMatch = location.pathname.match(/^\/tasks\/(\d+)$/);
  const id = paramId || pathMatch?.[1] || null;
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID задачи не указан');
      setLoading(false);
      return;
    }
    
    const loadTask = async () => {
      try {
        setLoading(true);
        setError(null);
        const taskId = Number(id);
        if (isNaN(taskId)) {
          throw new Error('Неверный ID задачи');
        }
        const taskData = await api.tasks.getById(taskId);
        setTask(taskData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить задачу');
      } finally {
        setLoading(false);
      }
    };
    
    loadTask();
  }, [id]);

  const handleDelete = async () => {
    if (!task) return;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await api.tasks.delete(task.id!);
      // Анимация удаления
      const pageElement = document.querySelector('.event-page');
      if (pageElement) {
        pageElement.classList.add('item-deleting');
        setTimeout(() => {
          navigate(backPath, { replace: true });
        }, 400);
      } else {
        navigate(backPath, { replace: true });
      }
    } catch (err: unknown) {
      setIsDeleting(false);
      alert(err instanceof Error ? err.message : 'Ошибка при удалении');
    }
  };

  const handleEdit = () => {
    if (task?.id) {
      navigate(`/tasks/${task.id}/edit`);
    }
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="event-page-loading">Загрузка…</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="event-page">
        <div className="event-page-header">
          <nav className="event-page-breadcrumb">
            <Link to={backPath}>Дашборд</Link>
            <span> / </span>
            <span>Ошибка</span>
          </nav>
        </div>
        <div className="event-page-error">{error || 'Задача не найдена'}</div>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(backPath)}>
            К списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-page">
      <header className="event-page-header">
        <nav className="event-page-breadcrumb">
          <Link to={backPath}>Дашборд</Link>
          <span> / </span>
          <span>Задача #{task.id}</span>
        </nav>
        <h1 className="event-page-title">{task.title}</h1>
        <p className="event-page-subtitle">
          <span className={`tag ${task.status}`}>{STATUS_LABELS[task.status]}</span>
        </p>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(backPath)}>
            ← К списку
          </button>
          <button type="button" className="button-primary" onClick={handleEdit}>
            Редактировать
          </button>
          <button 
            type="button" 
            className="button-danger" 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </header>

      {task.description && (
        <section className="event-section">
          <h2 className="event-section-title">Описание</h2>
          <div className="event-section-body">
            <div className="event-detail-row">
              <div className="event-detail-value">{task.description}</div>
            </div>
          </div>
        </section>
      )}

      <section className="event-section">
        <h2 className="event-section-title">Информация</h2>
        <div className="event-section-body">
          <div className="event-detail-row">
            <div className="event-detail-label">Статус</div>
            <div className="event-detail-value">
              <span className={`tag ${task.status}`}>{STATUS_LABELS[task.status]}</span>
            </div>
          </div>
          
          {/* Статус-бар выполнения задачи */}
          <div className="event-detail-row">
            <div className="event-detail-label">Выполнение</div>
            <div className="event-detail-value" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>{task.completionPercentage !== undefined ? `${task.completionPercentage}%` : '0%'}</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    width: `${Math.min(Math.max(task.completionPercentage || 0, 0), 100)}%`,
                    height: '100%',
                    backgroundColor: (task.completionPercentage || 0) >= 100 
                      ? 'var(--color-success, #10b981)' 
                      : (task.completionPercentage || 0) >= 50 
                        ? 'var(--color-accent, #3b82f6)' 
                        : 'var(--color-warning, #f59e0b)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Статус-бар оставшегося времени */}
          {task.dueDate && (
            <div className="event-detail-row">
              <div className="event-detail-label">Срок выполнения</div>
              <div className="event-detail-value" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span>{formatTimeRemaining(task.dueDate)}</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '0.25rem'
                }}>
                  <div
                    style={{
                      width: `${Math.min(Math.max(getTimeRemaining(task.dueDate, task.createdAt).percentage, 0), 100)}%`,
                      height: '100%',
                      backgroundColor: getTimeRemaining(task.dueDate, task.createdAt).isOverdue
                        ? 'var(--color-danger, #ef4444)'
                        : getTimeRemaining(task.dueDate, task.createdAt).days <= 3
                          ? 'var(--color-warning, #f59e0b)'
                          : 'var(--color-success, #10b981)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {formatDate(task.dueDate)}
                </div>
              </div>
            </div>
          )}

          {task.createdAt && (
            <div className="event-detail-row">
              <div className="event-detail-label">Создана</div>
              <div className="event-detail-value">{formatDate(task.createdAt)}</div>
            </div>
          )}
          {task.updatedAt && (
            <div className="event-detail-row">
              <div className="event-detail-label">Обновлена</div>
              <div className="event-detail-value">{formatDate(task.updatedAt)}</div>
            </div>
          )}
        </div>
      </section>

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Удаление задачи"
          message={`Вы уверены, что хотите удалить задачу "${task.title}"? Это действие нельзя отменить.`}
          confirmText="Удалить"
          cancelText="Отмена"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
