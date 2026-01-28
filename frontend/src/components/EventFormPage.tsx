/**
 * @file: EventFormPage.tsx
 * @description: Полноценная страница создания и редактирования мероприятия.
 * @dependencies: services/api, EventPages.css
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { EventDto, EventStatus, Client, Venue, StaffDto, AuthUser } from '../services/api';
import { useAuth } from '../contexts/useAuth';
import { DatePicker } from './DatePicker';
import './EventPages.css';

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]!;
}

export function EventFormPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  // Извлекаем ID из URL, если useParams не сработал (из-за условного рендеринга в App.tsx)
  const pathMatch = location.pathname.match(/^\/events\/(\d+)\/edit$/);
  const id = paramId || pathMatch?.[1] || null;
  const isEdit = Boolean(id);

  const getInitial = (): Omit<EventDto, 'id' | 'createdAt' | 'updatedAt'> => ({
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
  });

  const [initial, setInitial] = useState(getInitial);
  const [formData, setFormData] = useState(getInitial);
  const [clients, setClients] = useState<Client[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const norm = (d: typeof formData) => ({
    ...d,
    description: d.description?.trim() || '',
    title: d.title?.trim() || '',
  });
  const hasChanges = useMemo(
    () => JSON.stringify(norm(formData)) !== JSON.stringify(norm(initial)),
    [formData, initial],
  );

  useEffect(() => {
    (async () => {
      try {
        // Загружаем clients, venues и staff параллельно
        const [c, v, s] = await Promise.all([
          api.clients.list(),
          api.venues.list(),
          api.staff.list(),
        ]);
        setClients(c);
        setVenues(v);
        setStaffList(s.filter(staff => staff.status === 'active'));
        
        // Загружаем пользователей только если есть права access:manage
        // Это предотвращает ненужные запросы и ошибки 403 в консоли
        if (hasPermission('access:manage')) {
          try {
            const u = await api.users.listWithPermissions();
            const usersList: AuthUser[] = u.map((up) => ({
              id: up.userId,
              email: up.email,
              displayName: up.displayName || up.email,
              firstName: undefined,
              lastName: undefined,
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
      } catch (e) {
        console.error('Failed to load clients/venues/staff', e);
      }
    })();
  }, []);

  useEffect(() => {
    console.log('EventFormPage: pathname =', location.pathname, 'paramId =', paramId, 'extracted id =', id, 'isEdit =', isEdit);
    
    if (!isEdit || !id) {
      // Если это не режим редактирования, сбрасываем форму
      const initialData = getInitial();
      setFormData(initialData);
      setInitial(initialData);
      setFetchLoading(false);
      return;
    }
    
    (async () => {
      try {
        setFetchLoading(true);
        setErrors({}); // Очищаем предыдущие ошибки
        console.log('EventFormPage: Загрузка мероприятия с ID:', id);
        const e = await api.events.getById(Number(id));
        console.log('EventFormPage: Мероприятие загружено:', e);
        const data: Omit<EventDto, 'id' | 'createdAt' | 'updatedAt'> = {
          title: e.title,
          description: e.description || '',
          startDate: formatDateForInput(e.startDate),
          endDate: formatDateForInput(e.endDate),
          status: e.status,
          contractPrice: e.contractPrice || 0,
          budgetActual: e.budgetActual,
          clientId: e.clientId,
          venueId: e.venueId,
          managerId: e.managerId,
          foremanId: e.foremanId,
          commercialProposal: e.commercialProposal,
          opm: e.opm,
          transport: e.transport,
          margin: e.margin,
          profitability: e.profitability,
        };
        setFormData(data);
        setInitial(data);
        console.log('EventFormPage: Данные установлены в форму:', data);
      } catch (err) {
        console.error('EventFormPage: Ошибка загрузки мероприятия:', err);
        setErrors({ fetch: err instanceof Error ? err.message : 'Не удалось загрузить мероприятие' });
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [isEdit, id, location.pathname, paramId]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.title || formData.title.trim().length < 3)
      e.title = 'Название должно содержать минимум 3 символа';
    if (formData.title && formData.title.length > 200) e.title = 'Название не должно превышать 200 символов';
    if (!formData.startDate) e.startDate = 'Укажите дату начала';
    if (!formData.endDate) e.endDate = 'Укажите дату окончания';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate)
      e.endDate = 'Дата окончания должна быть позже даты начала';
    if (formData.contractPrice < 0) e.contractPrice = 'Цена контракта не может быть отрицательной';
    if (formData.budgetActual < 0) e.budgetActual = 'Фактический бюджет не может быть отрицательным';
    if (!formData.clientId || formData.clientId <= 0) e.clientId = 'Выберите клиента';
    if (!formData.venueId || formData.venueId <= 0) e.venueId = 'Выберите площадку';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('Несохранённые изменения будут потеряны. Закрыть?')) return;
    if (isEdit && id) navigate(`/events/${id}`);
    else navigate('/events');
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      console.log('EventFormPage: Валидация не прошла');
      return;
    }
    setLoading(true);
    setErrors({}); // Очищаем предыдущие ошибки
    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      let targetId: number;
      
      if (isEdit && id) {
        console.log('EventFormPage: Сохранение мероприятия с ID:', id, 'payload:', payload);
        const updated = await api.events.update(Number(id), payload);
        console.log('EventFormPage: Мероприятие успешно сохранено:', updated);
        targetId = Number(id);
      } else {
        console.log('EventFormPage: Создание нового мероприятия, payload:', payload);
        const created = await api.events.create(payload);
        console.log('EventFormPage: Мероприятие успешно создано:', created);
        if (!created.id) {
          throw new Error('Сервер не вернул ID созданного мероприятия');
        }
        targetId = created.id;
      }
      
      // Навигация происходит после успешного сохранения
      // Используем replace: true, чтобы заменить текущую запись в истории
      console.log('EventFormPage: Выполняю навигацию на /events/' + targetId);
      navigate(`/events/${targetId}`, { replace: true });
      console.log('EventFormPage: Навигация выполнена');
      // Не сбрасываем loading, так как компонент должен размонтироваться
    } catch (err: unknown) {
      console.error('EventFormPage: Ошибка при сохранении:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при сохранении';
      setErrors({ submit: errorMessage });
      setLoading(false); // Сбрасываем loading только при ошибке
    }
  };

  if (fetchLoading) {
    return (
      <div className="event-page">
        <div className="event-page-loading">Загрузка…</div>
      </div>
    );
  }

  const pageTitle = isEdit ? 'Редактировать мероприятие' : 'Создать мероприятие';
  const breadcrumbEdit = isEdit && formData.title ? formData.title : (isEdit ? 'Редактирование' : 'Новое');

  return (
    <div className="event-page event-form-page">
      <header className="event-page-header">
        <nav className="event-page-breadcrumb">
          <Link to="/events">Мероприятия</Link>
          <span> / </span>
          <span>{breadcrumbEdit}</span>
        </nav>
        <h1 className="event-page-title">{pageTitle}</h1>
        <p className="event-page-subtitle">
          {isEdit ? 'Измените данные мероприятия' : 'Заполните данные для нового мероприятия'}
        </p>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={handleCancel}>
            Отмена
          </button>
          <button type="submit" form="event-form" disabled={loading} className="button-primary">
            {loading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </header>

      {errors.fetch && (
        <div className="event-page-error" style={{ marginBottom: '1rem' }}>
          {errors.fetch}
        </div>
      )}

      <form id="event-form" onSubmit={handleSubmit} className="form">
        <section className="event-section">
          <h2 className="event-section-title">Основная информация</h2>
          <div className="event-section-body">
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
        </section>

        <section className="event-section">
          <h2 className="event-section-title">Клиент и площадка</h2>
          <div className="event-section-body">
            <div className="form-row">
              <div className="form-group">
                <label>Клиент *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: Number(e.target.value) })}
                  className={errors.clientId ? 'input-error' : ''}
                >
                  <option value="0">Выберите клиента</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {errors.venueId && <span className="error-text">{errors.venueId}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="event-section">
          <h2 className="event-section-title">Бюджет</h2>
          <div className="event-section-body">
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
                  placeholder="0"
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
                  placeholder="0"
                />
                {errors.budgetActual && <span className="error-text">{errors.budgetActual}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="event-section">
          <h2 className="event-section-title">Дополнительная информация</h2>
          <div className="event-section-body">
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
              <div className="form-group">
                <label>ОПМ</label>
                <input
                  type="text"
                  value={formData.opm || ''}
                  onChange={(e) => setFormData({ ...formData, opm: e.target.value || undefined })}
                  placeholder="Введите ОПМ"
                />
              </div>
            </div>

            <div className="form-row">
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
        </section>

        {errors.submit && (
          <div className="event-page-error" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            {errors.submit}
          </div>
        )}

        <div className="event-form-actions">
          <button type="button" className="button-secondary" onClick={handleCancel}>
            Отмена
          </button>
          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
