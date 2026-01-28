/**
 * @file: EventForm.tsx
 * @description: Form for creating and editing events.
 * @dependencies: services/api.ts
 * @created: 2026-01-26
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { EventDto, EventStatus, Client, Venue, AuthUser, StaffDto } from '../services/api';
import { useAuth } from '../contexts/useAuth';
import { DraggableModal } from './DraggableModal';
import { DatePicker } from './DatePicker';

interface EventFormProps {
  event?: EventDto;
  onSave: () => void;
  onCancel: () => void;
}

export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const { hasPermission } = useAuth();
  const getInitialFormData = (): Omit<EventDto, 'id' | 'createdAt' | 'updatedAt'> => {
    if (event) {
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };
      return {
        title: event.title,
        description: event.description || '',
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        status: event.status,
        contractPrice: event.contractPrice || 0,
        budgetActual: event.budgetActual,
        clientId: event.clientId,
        venueId: event.venueId,
        managerId: event.managerId,
        foremanId: event.foremanId,
        commercialProposal: event.commercialProposal,
        opm: event.opm,
        transport: event.transport,
        margin: event.margin,
        profitability: event.profitability,
      };
    }
    return {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'draft',
      contractPrice: 0,
      budgetActual: 0,
      clientId: 0,
      venueId: 0,
      managerId: undefined,
      foremanId: undefined,
      commercialProposal: undefined,
      opm: undefined,
      transport: undefined,
      margin: undefined,
      profitability: undefined,
    };
  };

  const [initialFormData] = useState(() => getInitialFormData());
  const [formData, setFormData] = useState<Omit<EventDto, 'id' | 'createdAt' | 'updatedAt'>>(initialFormData);
  const [clients, setClients] = useState<Client[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const normalizeForComparison = (data: typeof formData) => ({
    ...data,
    description: data.description?.trim() || '',
    title: data.title?.trim() || '',
  });

  const hasChanges = useMemo(
    () =>
      JSON.stringify(normalizeForComparison(formData)) !==
      JSON.stringify(normalizeForComparison(initialFormData)),
    [formData, initialFormData],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем clients, venues и staff параллельно
        const [clientsData, venuesData, staffData] = await Promise.all([
          api.clients.list(),
          api.venues.list(),
          api.staff.list(),
        ]);
        setClients(clientsData);
        setVenues(venuesData);
        setStaffList(staffData.filter(s => s.status === 'active'));
        
        // Загружаем пользователей только если есть права access:manage
        // Это предотвращает ненужные запросы и ошибки 403 в консоли
        if (hasPermission('access:manage')) {
          try {
            const usersData = await api.users.listWithPermissions();
            // Преобразуем UserPermissionsDto в AuthUser для выбора менеджера
            const usersList: AuthUser[] = usersData.map((up) => ({
              id: up.userId,
              email: up.email,
              displayName: up.displayName || up.email,
              firstName: undefined,
              lastName: undefined,
              avatarUrl: undefined,
              createdAt: '',
              updatedAt: '',
            }));
            setUsers(usersList);
          } catch (userError) {
            // Логируем только неожиданные ошибки (не 403)
            const errorMessage = userError instanceof Error ? userError.message : String(userError);
            const isForbidden = errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('forbidden');
            if (!isForbidden) {
              console.warn('Failed to load users:', userError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load clients/venues/staff:', error);
      }
    };
    loadData();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Название должно содержать минимум 3 символа';
    }
    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'Название не должно превышать 200 символов';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Укажите дату начала';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Укажите дату окончания';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Дата окончания должна быть позже даты начала';
    }
    if (formData.contractPrice < 0) {
      newErrors.contractPrice = 'Цена контракта не может быть отрицательной';
    }
    if (formData.budgetActual < 0) {
      newErrors.budgetActual = 'Фактический бюджет не может быть отрицательным';
    }
    if (!formData.clientId || formData.clientId <= 0) {
      newErrors.clientId = 'Выберите клиента';
    }
    if (!formData.venueId || formData.venueId <= 0) {
      newErrors.venueId = 'Выберите площадку';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (event?.id) {
        await api.events.update(event.id, {
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        });
      } else {
        await api.events.create({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        });
      }
      onSave();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableModal
      title={event ? 'Редактировать мероприятие' : 'Создать мероприятие'}
      onClose={onCancel}
      hasChanges={hasChanges}
    >
      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3 className="form-section-title">Основная информация</h3>
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? 'input-error' : ''}
              placeholder="Название мероприятия"
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Описание мероприятия..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Дата начала *</label>
              <DatePicker
                value={formData.startDate}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
                placeholder="Выберите дату начала"
                error={!!errors.startDate}
                max={formData.endDate || undefined}
              />
              {errors.startDate && <span className="error-text">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label>Дата окончания *</label>
              <DatePicker
                value={formData.endDate}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
                placeholder="Выберите дату окончания"
                error={!!errors.endDate}
                min={formData.startDate || undefined}
              />
              {errors.endDate && <span className="error-text">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Статус *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
            >
              <option value="draft">Черновик</option>
              <option value="request">Запрос</option>
              <option value="in_work">В работе</option>
              <option value="completed">Завершено</option>
              <option value="canceled">Отменено</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Менеджер</label>
              <select
                value={formData.managerId || ''}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Не назначен</option>
                {users.map((user) => {
                  const displayName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.displayName || user.email;
                  return (
                    <option key={user.id} value={user.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>Бригадир</label>
              <select
                value={formData.foremanId || ''}
                onChange={(e) => setFormData({ ...formData, foremanId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Не назначен</option>
                {staffList.map((staff) => {
                  const displayName = staff.lastName && staff.firstName
                    ? `${staff.lastName} ${staff.firstName} ${staff.middleName || ''}`
                    : staff.email;
                  return (
                    <option key={staff.id} value={staff.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Клиент и площадка</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Клиент *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: Number(e.target.value) })}
                className={errors.clientId ? 'input-error' : ''}
              >
                <option value="0">Выберите клиента</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <span className="error-text">{errors.clientId}</span>}
            </div>

            <div className="form-group">
              <label>Площадка *</label>
              <select
                value={formData.venueId}
                onChange={(e) => setFormData({ ...formData, venueId: Number(e.target.value) })}
                className={errors.venueId ? 'input-error' : ''}
              >
                <option value="0">Выберите площадку</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {errors.venueId && <span className="error-text">{errors.venueId}</span>}
            </div>
          </div>

        </div>

        <div className="form-section">
          <h3 className="form-section-title">Бюджет</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Цена контракта (₽) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.contractPrice}
                onChange={(e) => setFormData({ ...formData, contractPrice: Number(e.target.value) })}
                className={errors.contractPrice ? 'input-error' : ''}
                placeholder="0.00"
              />
              {errors.contractPrice && <span className="error-text">{errors.contractPrice}</span>}
            </div>

            <div className="form-group">
              <label>Фактический бюджет (₽) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.budgetActual}
                onChange={(e) => setFormData({ ...formData, budgetActual: Number(e.target.value) })}
                className={errors.budgetActual ? 'input-error' : ''}
                placeholder="0.00"
              />
              {errors.budgetActual && <span className="error-text">{errors.budgetActual}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Дополнительная информация</h3>
          <div className="form-row">
            <div className="form-group">
              <label>КП (Коммерческое предложение)</label>
              <input
                type="text"
                value={formData.commercialProposal || ''}
                onChange={(e) => setFormData({ ...formData, commercialProposal: e.target.value || undefined })}
                placeholder="Введите КП"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ОПМ</label>
              <input
                type="text"
                value={formData.opm || ''}
                onChange={(e) => setFormData({ ...formData, opm: e.target.value || undefined })}
                placeholder="Введите ОПМ"
              />
            </div>

            <div className="form-group">
              <label>Транспорт</label>
              <input
                type="text"
                value={formData.transport || ''}
                onChange={(e) => setFormData({ ...formData, transport: e.target.value || undefined })}
                placeholder="Введите информацию о транспорте"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Маржинальность (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.margin ?? ''}
                onChange={(e) => setFormData({ ...formData, margin: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0-100"
              />
            </div>

            <div className="form-group">
              <label>Рентабельность (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.profitability ?? ''}
                onChange={(e) => setFormData({ ...formData, profitability: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0-100"
              />
            </div>
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
