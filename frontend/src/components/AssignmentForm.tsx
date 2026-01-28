/**
 * @file: AssignmentForm.tsx
 * @description: Форма для создания и редактирования назначений персонала на мероприятие.
 * @dependencies: services/api.ts, DraggableModal.tsx
 * @created: 2026-01-27
 */

import { useState } from 'react';
import { api } from '../services/api';
import type { AssignmentDto, StaffDto } from '../services/api';
import { DraggableModal } from './DraggableModal';

interface AssignmentFormProps {
  assignment?: AssignmentDto;
  eventId: number;
  eventStartDate: string;
  eventEndDate: string;
  staffList: StaffDto[];
  onSave: () => void;
  onCancel: () => void;
}

export function AssignmentForm({
  assignment,
  eventId,
  eventStartDate,
  eventEndDate,
  staffList,
  onSave,
  onCancel,
}: AssignmentFormProps) {
  const getInitialFormData = () => {
    if (assignment) {
      return {
        staffId: assignment.staffId,
        roleId: assignment.roleId,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        status: assignment.status,
        paymentAmount: assignment.paymentAmount?.toString() || '',
      };
    }
    return {
      staffId: 0,
      roleId: 1,
      startTime: eventStartDate,
      endTime: eventEndDate,
      status: 'planned' as AssignmentDto['status'],
      paymentAmount: '',
    };
  };

  const [initialFormData] = useState(() => getInitialFormData());
  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Проверяем, есть ли изменения в форме
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.staffId || formData.staffId <= 0) {
      newErrors.staffId = 'Выберите сотрудника';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Укажите время начала работы';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'Укажите время окончания работы';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'Время окончания должно быть позже времени начала';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        staffId: formData.staffId,
        roleId: formData.roleId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status,
        paymentAmount: formData.paymentAmount ? Number(formData.paymentAmount) : undefined,
      };

      if (assignment?.id) {
        await api.assignments.update(assignment.id, payload);
      } else {
        await api.assignments.create(eventId, payload);
      }
      
      onSave();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка при сохранении назначения' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableModal
      title={assignment ? 'Редактировать назначение' : 'Добавить персонал'}
      onClose={onCancel}
      hasChanges={hasChanges}
    >
      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <div className="form-group">
            <label>
              Сотрудник *
            </label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: Number(e.target.value) })}
              className={errors.staffId ? 'input-error' : ''}
            >
              <option value="0">Выберите сотрудника</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.firstName} {staff.lastName} {staff.email}
                </option>
              ))}
            </select>
            {errors.staffId && <span className="error-text">{errors.staffId}</span>}
          </div>

          <div className="form-group">
            <label>Роль</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
            >
              <option value={1}>Техник</option>
              <option value={2}>Звукорежиссер</option>
              <option value={3}>Светорежиссер</option>
              <option value={4}>Менеджер</option>
              <option value={5}>Координатор</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Начало работы *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })}
                className={errors.startTime ? 'input-error' : ''}
              />
              {errors.startTime && <span className="error-text">{errors.startTime}</span>}
            </div>

            <div className="form-group">
              <label>
                Окончание работы *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime ? new Date(formData.endTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })}
                className={errors.endTime ? 'input-error' : ''}
              />
              {errors.endTime && <span className="error-text">{errors.endTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Статус</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AssignmentDto['status'] })}
            >
              <option value="planned">Запланировано</option>
              <option value="confirmed">Подтверждено</option>
              <option value="completed">Завершено</option>
              <option value="canceled">Отменено</option>
            </select>
          </div>

          <div className="form-group">
            <label>Заработок (₽)</label>
            <input
              type="number"
              placeholder="Оставьте пустым для расчета по ставке"
              value={formData.paymentAmount}
              onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
              min="0"
              step="0.01"
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
              Если не указано, будет рассчитано автоматически на основе ставки сотрудника и времени работы
            </small>
          </div>
        </div>

        {errors.submit && (
          <div style={{ padding: '0 1.5rem' }}>
            <div className="error-text">{errors.submit}</div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="button-secondary">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </DraggableModal>
  );
}
