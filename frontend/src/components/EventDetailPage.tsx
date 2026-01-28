/**
 * @file: EventDetailPage.tsx
 * @description: Полноценная страница просмотра мероприятия.
 * @dependencies: services/api, EventPages.css, format
 * @created: 2026-01-27
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { EventDto, Client, Venue, EquipmentDto, EquipmentMovementDto, AssignmentDto, StaffDto, WeatherDto, DistanceDto } from '../services/api';
import { formatDateTime } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import { AssignmentForm } from './AssignmentForm';
import './EventPages.css';

// Утилита для извлечения города из площадки
function extractCityFromVenue(address?: string, name?: string): string | null {
  if (address) {
    const match = address.match(/^([^,]+),/);
    if (match) {
      const city = match[1].trim();
      if (city) return city;
    }
  }
  if (name) {
    const match = name.match(/^([^,]+),/);
    if (match) {
      const city = match[1].trim();
      if (city) return city;
    }
  }
  return null;
}

// Функция для загрузки погоды через backend API
async function loadWeather(city: string, date: string): Promise<WeatherDto | null> {
  try {
    return await api.weather.getByCity(city, date);
  } catch (error) {
    console.warn('Failed to load weather:', error);
    return null;
  }
}

// Функция для загрузки расстояния через backend API
async function loadDistance(city: string): Promise<DistanceDto | null> {
  try {
    return await api.distance.getByCity(city);
  } catch (error) {
    console.warn('Failed to load distance:', error);
    return null;
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

export function EventDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Определяем, откуда пришли, чтобы правильно вернуться назад
  const fromPage = (location.state as { from?: string })?.from || 'events';
  const backPath = fromPage === 'profile' ? '/profile' : '/events';
  
  // Извлекаем ID из URL, если useParams не сработал (из-за условного рендеринга в App.tsx)
  const pathMatch = location.pathname.match(/^\/events\/(\d+)$/);
  const id = paramId || pathMatch?.[1] || null;
  const [event, setEvent] = useState<EventDto | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [movements, setMovements] = useState<EquipmentMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);

  // Staff assignments state
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDto | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<number | null>(null);
  const [showDeleteAssignmentConfirm, setShowDeleteAssignmentConfirm] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!id) return;
    try {
      const eventId = Number(id);
      const data = await api.assignments.listByEvent(eventId);
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }, [id]);

  // Загружаем персонал только для нужных сотрудников (назначенных + менеджер + бригадир)
  const loadStaffForEvent = useCallback(async () => {
    if (!event) return;
    
    const neededIds = new Set<number>();
    
    // Добавляем ID из назначений
    assignments.forEach(a => {
      if (a.staffId) neededIds.add(a.staffId);
    });
    
    // Добавляем менеджера и бригадира
    if (event.managerId) neededIds.add(event.managerId);
    if (event.foremanId) neededIds.add(event.foremanId);
    
    if (neededIds.size === 0) {
      setStaffList([]);
      return;
    }
    
    try {
      const allStaff = await api.staff.list();
      const filteredStaff = allStaff.filter(s => s.status === 'active' && s.id && neededIds.has(s.id));
      setStaffList(filteredStaff);
    } catch (error) {
      console.error('Failed to load staff:', error);
      // Fallback: загружаем весь список
      try {
        const data = await api.staff.list();
        setStaffList(data.filter(s => s.status === 'active'));
      } catch (fallbackError) {
        console.error('Failed to load staff fallback:', fallbackError);
      }
    }
  }, [event, assignments]);

  useEffect(() => {
    console.log('EventDetailPage: paramId =', paramId, 'pathname =', location.pathname, 'extracted id =', id);
    
    if (!id) {
      console.error('EventDetailPage: ID мероприятия не найден в URL. pathname =', location.pathname);
      setError('ID мероприятия не указан');
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventId = Number(id);
        if (isNaN(eventId)) {
          throw new Error('Неверный ID мероприятия');
        }
        
        // Шаг 1: Загружаем мероприятие быстро (без блокирующих внешних API)
        const data = await api.events.getById(eventId);
        
        if (cancelled) {
          return;
        }
        
        if (!data) {
          throw new Error('Мероприятие не найдено');
        }
        
        // Сразу показываем основную информацию
        setEvent(data);
        setLoading(false); // Убираем индикатор загрузки, показываем основную информацию
        
        // Шаг 2: Загружаем все остальные данные параллельно в фоне
        const [
          clientResult,
          venueResult,
          movementsResult,
          assignmentsResult,
          equipmentListResult
        ] = await Promise.allSettled([
          data.clientId ? api.clients.getById(data.clientId) : Promise.resolve(null),
          data.venueId ? api.venues.getById(data.venueId) : Promise.resolve(null),
          api.equipmentMovements.findByEventId(eventId),
          api.assignments.listByEvent(eventId),
          api.equipment.list(),
        ]);
        
        if (cancelled) {
          return;
        }
        
        // Обновляем данные по мере их загрузки
        if (clientResult.status === 'fulfilled') {
          setClient(clientResult.value);
        } else if (clientResult.status === 'rejected') {
          console.warn('Не удалось загрузить клиента:', clientResult.reason);
        }
        
        if (venueResult.status === 'fulfilled') {
          setVenue(venueResult.value);
          
          // Загружаем погоду и расстояние в фоне после загрузки площадки
          if (venueResult.value && data) {
            const city = extractCityFromVenue(venueResult.value.address, venueResult.value.name);
            if (city) {
              setWeatherLoading(true);
              setDistanceLoading(true);
              
              // Таймаут для автоматического скрытия индикаторов загрузки (15 секунд)
              const loadingTimeout = setTimeout(() => {
                if (!cancelled) {
                  setWeatherLoading(false);
                  setDistanceLoading(false);
                }
              }, 15000);
              
              // Загружаем погоду и расстояние параллельно в фоне, не блокируя интерфейс
              Promise.allSettled([
                loadWeather(city, data.startDate),
                loadDistance(city),
              ]).then(([weatherResult, distanceResult]) => {
                clearTimeout(loadingTimeout);
                if (cancelled) return;
                
                // Обновляем event с погодой и расстоянием с небольшой задержкой для анимации
                setTimeout(() => {
                  if (cancelled) return;
                  
                  setEvent((prevEvent) => {
                    if (!prevEvent) return prevEvent;
                    const updated = { ...prevEvent };
                    if (weatherResult.status === 'fulfilled' && weatherResult.value) {
                      updated.weather = weatherResult.value;
                    }
                    if (distanceResult.status === 'fulfilled' && distanceResult.value) {
                      updated.distance = distanceResult.value;
                    }
                    return updated;
                  });
                  
                  setWeatherLoading(false);
                  setDistanceLoading(false);
                }, 100); // Небольшая задержка для плавной анимации
              }).catch((error) => {
                clearTimeout(loadingTimeout);
                console.warn('Failed to load weather/distance:', error);
                setWeatherLoading(false);
                setDistanceLoading(false);
              });
            } else {
              setWeatherLoading(false);
              setDistanceLoading(false);
            }
          } else {
            setWeatherLoading(false);
            setDistanceLoading(false);
          }
        } else if (venueResult.status === 'rejected') {
          console.warn('Не удалось загрузить площадку:', venueResult.reason);
          setWeatherLoading(false);
          setDistanceLoading(false);
        }
        
        if (movementsResult.status === 'fulfilled' && movementsResult.value) {
          setMovements(movementsResult.value);
          
          // Фильтруем оборудование из уже загруженного списка
          if (equipmentListResult.status === 'fulfilled' && equipmentListResult.value) {
            const equipmentIds = new Set(movementsResult.value.map(m => m.equipmentId));
            const filteredEquipment = equipmentListResult.value.filter(e => e.id && equipmentIds.has(e.id));
            setEquipment(filteredEquipment);
          }
        } else if (movementsResult.status === 'rejected') {
          console.warn('Не удалось загрузить перемещения оборудования:', movementsResult.reason);
        }
        
        if (assignmentsResult.status === 'fulfilled' && assignmentsResult.value) {
          setAssignments(assignmentsResult.value);
        } else if (assignmentsResult.status === 'rejected') {
          console.warn('Не удалось загрузить назначения:', assignmentsResult.reason);
        }
        
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        console.error('Ошибка загрузки мероприятия:', e);
        setError(e instanceof Error ? e.message : 'Не удалось загрузить мероприятие');
        setLoading(false);
      }
    };
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Загружаем персонал после загрузки назначений и мероприятия
  useEffect(() => {
    if (event && assignments.length >= 0) { // >= 0 чтобы сработало даже если назначений нет
      loadStaffForEvent();
    }
  }, [event, assignments, loadStaffForEvent]);

  const handleDelete = async () => {
    console.log('handleDelete called, event:', event);
    if (!event) {
      console.error('handleDelete: event is null');
      return;
    }
    setIsDeleting(true);
    setShowDeleteConfirm(false); // Закрываем диалог сразу после подтверждения
    try {
      console.log('Deleting event with id:', event.id);
      await api.events.delete(event.id!);
      console.log('Event deleted successfully, starting animation');
      // Добавляем класс для анимации перед удалением
      const pageElement = document.querySelector('.event-page');
      if (pageElement) {
        pageElement.classList.add('item-deleting');
        setTimeout(() => {
          console.log('Animation complete, navigating away');
          navigate(backPath, { replace: true });
        }, 400);
      } else {
        console.log('Page element not found, navigating immediately');
        navigate(backPath, { replace: true });
      }
    } catch (e: unknown) {
      console.error('Error deleting event:', e);
      setIsDeleting(false);
      alert(e instanceof Error ? e.message : 'Ошибка при удалении');
    }
  };

  const handleDeleteClick = () => {
    console.log('handleDeleteClick called, event:', event, 'setting showDeleteConfirm to true');
    if (!event) {
      console.error('Cannot delete: event is null');
      return;
    }
    setShowDeleteConfirm(true);
    console.log('showDeleteConfirm set to true');
  };

  const handleEdit = () => {
    if (event?.id) navigate(`/events/${event.id}/edit`);
  };

  const handleAddAssignment = () => {
    if (!event) return;
    setEditingAssignment(null);
    setShowAssignmentForm(true);
  };

  const handleEditAssignment = (assignment: AssignmentDto) => {
    setEditingAssignment(assignment);
    setShowAssignmentForm(true);
  };

  const handleSaveAssignment = () => {
    setShowAssignmentForm(false);
    setEditingAssignment(null);
    loadAssignments();
  };

  const handleDeleteAssignmentClick = (assignmentId: number) => {
    setDeletingAssignmentId(assignmentId);
    setShowDeleteAssignmentConfirm(true);
  };

  const handleDeleteAssignment = async () => {
    if (!deletingAssignmentId) return;
    try {
      await api.assignments.delete(deletingAssignmentId);
      setShowDeleteAssignmentConfirm(false);
      setDeletingAssignmentId(null);
      loadAssignments();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка при удалении назначения');
      setShowDeleteAssignmentConfirm(false);
      setDeletingAssignmentId(null);
    }
  };

  const getStaffName = (staffId: number) => {
    const staff = staffList.find(s => s.id === staffId);
    return staff ? `${staff.firstName} ${staff.lastName}` : `ID: ${staffId}`;
  };

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Техник',
      2: 'Звукорежиссер',
      3: 'Светорежиссер',
      4: 'Менеджер',
      5: 'Координатор',
    };
    return roles[roleId] || `Роль #${roleId}`;
  };

  const getStatusLabel = (status: AssignmentDto['status']) => {
    const labels: Record<AssignmentDto['status'], string> = {
      planned: 'Запланировано',
      confirmed: 'Подтверждено',
      completed: 'Завершено',
      canceled: 'Отменено',
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="event-page-loading">Загрузка…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-page">
        <div className="event-page-header">
          <div className="event-page-breadcrumb">
            <Link to={backPath}>{fromPage === 'profile' ? 'Профиль' : 'Мероприятия'}</Link>
            <span> / </span>
            <span>Ошибка</span>
          </div>
        </div>
        <div className="event-page-error">{error || 'Мероприятие не найдено'}</div>
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
        <div className="event-page-header-content">
          <div className="event-page-header-main">
            <nav className="event-page-breadcrumb">
              <Link to={backPath}>{fromPage === 'profile' ? 'Профиль' : 'Мероприятия'}</Link>
              <span> / </span>
              <span>{event.title}</span>
            </nav>
            <h1 className="event-page-title">{event.title}</h1>
            <p className="event-page-subtitle">
              <span className={`tag ${event.status}`}>{STATUS_LABELS[event.status] ?? event.status}</span>
              {' · '}
              {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Delete button clicked, event:', event, 'isDeleting:', isDeleting, 'showDeleteConfirm:', showDeleteConfirm);
                  if (!isDeleting && event) {
                    handleDeleteClick();
                  } else {
                    console.warn('Cannot delete: isDeleting =', isDeleting, 'event =', event);
                  }
                }} 
                disabled={isDeleting || !event}
              >
                {isDeleting ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          </div>
          <div className="event-header-widgets">
            {/* Виджет расстояния - показываем всегда, если есть площадка */}
            {venue && (
              <div className={`event-distance-widget ${event.distance ? 'widget-loaded' : 'widget-loading'}`}>
                <div className="event-distance-widget-header">
                  {event.distance ? (
                    <span className="event-distance-route widget-content-fade-in">
                      {event.distance.fromCity} → {event.distance.toCity}
                    </span>
                  ) : (
                    <span className="event-distance-route widget-skeleton">Загрузка маршрута...</span>
                  )}
                </div>
                <div className="event-distance-widget-main">
                  <div className="event-distance-icon">🚗</div>
                  <div className="event-distance-info">
                    {event.distance ? (
                      <>
                        <div className="event-distance-value widget-content-fade-in">{event.distance.distanceFormatted}</div>
                        <div className="event-distance-time widget-content-fade-in">{event.distance.timeFormatted}</div>
                      </>
                    ) : (
                      <>
                        <div className="event-distance-value widget-skeleton">—</div>
                        <div className="event-distance-time widget-skeleton">—</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="event-distance-widget-footer">
                  <span className="event-distance-label">Расстояние и время поездки</span>
                  {distanceLoading && <span className="widget-loading-indicator">⏳</span>}
                </div>
              </div>
            )}
            {/* Виджет погоды - показываем всегда, если есть площадка */}
            {venue && (
              <div className={`event-weather-widget ${event.weather ? 'widget-loaded' : 'widget-loading'}`}>
                <div className="event-weather-widget-header">
                  {event.weather ? (
                    <span className="event-weather-location widget-content-fade-in">{event.weather.location}</span>
                  ) : (
                    <span className="event-weather-location widget-skeleton">Загрузка погоды...</span>
                  )}
                </div>
                <div className="event-weather-widget-main">
                  {event.weather ? (
                    <>
                      <span className="event-weather-icon widget-content-fade-in">{event.weather.icon}</span>
                      <div className="event-weather-temp-wrapper">
                        <span className="event-weather-temp widget-content-fade-in">{event.weather.temperature}°</span>
                        <span className="event-weather-desc widget-content-fade-in">{event.weather.description}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="event-weather-icon widget-skeleton">☁️</span>
                      <div className="event-weather-temp-wrapper">
                        <span className="event-weather-temp widget-skeleton">—°</span>
                        <span className="event-weather-desc widget-skeleton">Загрузка...</span>
                      </div>
                    </>
                  )}
                </div>
                {event.weather && (event.weather.humidity !== undefined || event.weather.windSpeed !== undefined) && (
                  <div className="event-weather-widget-details widget-content-fade-in">
                    {event.weather.humidity !== undefined && (
                      <div className="event-weather-detail">
                        <span className="event-weather-detail-label">Влажность</span>
                        <span className="event-weather-detail-value">{event.weather.humidity}%</span>
                      </div>
                    )}
                    {event.weather.windSpeed !== undefined && (
                      <div className="event-weather-detail">
                        <span className="event-weather-detail-label">Ветер</span>
                        <span className="event-weather-detail-value">{event.weather.windSpeed} м/с</span>
                      </div>
                    )}
                  </div>
                )}
                {weatherLoading && !event.weather && (
                  <div className="widget-loading-indicator">⏳</div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="event-section">
        <h2 className="event-section-title">Основная информация</h2>
        <div className="event-section-body">
          <div className="event-detail-row">
            <div className="event-detail-label">Статус</div>
            <div className="event-detail-value">
              <span className={`tag ${event.status}`}>{STATUS_LABELS[event.status] ?? event.status}</span>
            </div>
          </div>
          <div className="event-detail-row">
            <div className="event-detail-label">Дата начала</div>
            <div className="event-detail-value">{formatDateTime(event.startDate)}</div>
          </div>
          <div className="event-detail-row">
            <div className="event-detail-label">Дата окончания</div>
            <div className="event-detail-value">{formatDateTime(event.endDate)}</div>
          </div>
          {event.description && (
            <div className="event-detail-row">
              <div className="event-detail-label">Описание</div>
              <div className="event-detail-value">{event.description}</div>
            </div>
          )}
          {event.managerId && (
            <div className="event-detail-row">
              <div className="event-detail-label">Менеджер</div>
              <div className="event-detail-value">
                {staffList.find(s => s.id === event.managerId)?.lastName && staffList.find(s => s.id === event.managerId)?.firstName
                  ? `${staffList.find(s => s.id === event.managerId)?.lastName} ${staffList.find(s => s.id === event.managerId)?.firstName}`
                  : `ID: ${event.managerId}`}
              </div>
            </div>
          )}
          {event.foremanId && (
            <div className="event-detail-row">
              <div className="event-detail-label">Бригадир</div>
              <div className="event-detail-value">
                {staffList.find(s => s.id === event.foremanId)?.lastName && staffList.find(s => s.id === event.foremanId)?.firstName
                  ? `${staffList.find(s => s.id === event.foremanId)?.lastName} ${staffList.find(s => s.id === event.foremanId)?.firstName}`
                  : `ID: ${event.foremanId}`}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title">Клиент и площадка</h2>
        <div className="event-section-body">
          <div className="event-detail-row">
            <div className="event-detail-label">Клиент</div>
            <div className="event-detail-value">
              {client ? (
                <>
                  <div>{client.name}</div>
                  {client.contactName && <span className="event-detail-sub">Контакт: {client.contactName}</span>}
                  {client.email && <span className="event-detail-sub">Email: {client.email}</span>}
                  {client.phone && <span className="event-detail-sub">Телефон: {client.phone}</span>}
                </>
              ) : (
                <span className="event-detail-sub">Не найден</span>
              )}
            </div>
          </div>
          <div className="event-detail-row">
            <div className="event-detail-label">Площадка</div>
            <div className="event-detail-value">
              {venue ? (
                <>
                  <div>{venue.name}</div>
                  {venue.address && <span className="event-detail-sub">Адрес: {venue.address}</span>}
                  {venue.capacity && <span className="event-detail-sub">Вместимость: {venue.capacity}</span>}
                  {venue.contactName && <span className="event-detail-sub">Контакт: {venue.contactName}</span>}
                  {venue.phone && <span className="event-detail-sub">Телефон: {venue.phone}</span>}
                </>
              ) : (
                <span className="event-detail-sub">Не найдена</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title">Бюджет</h2>
        <div className="event-section-body">
          <div className="event-detail-row">
            <div className="event-detail-label">Цена контракта</div>
            <div className="event-detail-value">{event.contractPrice?.toLocaleString('ru-RU') || '0'} ₽</div>
          </div>
          <div className="event-detail-row">
            <div className="event-detail-label">Фактический</div>
            <div className="event-detail-value">{(event.budgetActual || 0).toLocaleString('ru-RU')} ₽</div>
          </div>
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title">Дополнительная информация</h2>
        <div className="event-section-body">
          {event.commercialProposal && (
            <div className="event-detail-row">
              <div className="event-detail-label">КП</div>
              <div className="event-detail-value">{event.commercialProposal}</div>
            </div>
          )}
          {event.opm && (
            <div className="event-detail-row">
              <div className="event-detail-label">ОПМ</div>
              <div className="event-detail-value">{event.opm}</div>
            </div>
          )}
          {event.transport && (
            <div className="event-detail-row">
              <div className="event-detail-label">Транспорт</div>
              <div className="event-detail-value">{event.transport}</div>
            </div>
          )}
          {(event.margin !== undefined && event.margin !== null) && (
            <div className="event-detail-row">
              <div className="event-detail-label">Маржинальность</div>
              <div className="event-detail-value">{event.margin.toFixed(2)}%</div>
            </div>
          )}
          {(event.profitability !== undefined && event.profitability !== null) && (
            <div className="event-detail-row">
              <div className="event-detail-label">Рентабельность</div>
              <div className="event-detail-value">{event.profitability.toFixed(2)}%</div>
            </div>
          )}
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title">Оборудование</h2>
        <div className="event-section-body">
          {equipment.length === 0 ? (
            <div className="event-detail-row">
              <div className="event-detail-value">Оборудование не отправлено на мероприятие</div>
            </div>
          ) : (
            <div className="equipment-list">
              {equipment.map((equip) => {
                const movement = movements.find(m => m.equipmentId === equip.id);
                return (
                  <div key={equip.id} className="equipment-item">
                    <div className="equipment-item-header">
                      <div className="equipment-item-name">{equip.name}</div>
                      {equip.model && <div className="equipment-item-model">{equip.model}</div>}
                    </div>
                    <div className="equipment-item-details">
                      {equip.manufacturer && (
                        <span className="equipment-item-detail">Производитель: {equip.manufacturer}</span>
                      )}
                      {equip.serialNumber && (
                        <span className="equipment-item-detail">Серийный номер: {equip.serialNumber}</span>
                      )}
                      {movement && (
                        <span className="equipment-item-detail">
                          Отправлено: {formatDateTime(movement.movedAt)}
                        </span>
                      )}
                      {movement?.fromLocation && (
                        <span className="equipment-item-detail">Откуда: {movement.fromLocation}</span>
                      )}
                      {movement?.toLocation && (
                        <span className="equipment-item-detail">Куда: {movement.toLocation}</span>
                      )}
                      {movement?.notes && (
                        <span className="equipment-item-detail">Примечание: {movement.notes}</span>
                      )}
                    </div>
                    <div className="equipment-item-status">
                      <span className={`tag ${equip.status}`}>
                        {equip.status === 'available' && 'Доступно'}
                        {equip.status === 'in_use' && 'В использовании'}
                        {equip.status === 'maintenance' && 'На обслуживании'}
                        {equip.status === 'retired' && 'Списано'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title" style={{ justifyContent: 'space-between' }}>
          <span>Персонал</span>
          <button type="button" className="button-primary" onClick={handleAddAssignment} style={{ marginLeft: 'auto' }}>
            Добавить персонал
          </button>
        </h2>
        <div className="event-section-body">
          {assignments.length === 0 ? (
            <div className="event-detail-row">
              <div className="event-detail-value">Персонал не назначен</div>
            </div>
          ) : (
            <div className="assignments-list">
              {assignments.map((assignment) => {
                const staff = staffList.find(s => s.id === assignment.staffId);
                const hours = assignment.endTime && assignment.startTime
                  ? Math.round(((new Date(assignment.endTime).getTime() - new Date(assignment.startTime).getTime()) / (1000 * 60 * 60)) * 100) / 100
                  : 0;
                const calculatedAmount = staff?.rate && hours ? hours * staff.rate : 0;
                const amount = assignment.paymentAmount !== undefined && assignment.paymentAmount !== null
                  ? assignment.paymentAmount
                  : calculatedAmount;

                return (
                  <div key={assignment.id} className="assignment-item">
                    <div className="assignment-item-header">
                      <div>
                        <div className="assignment-item-name">{getStaffName(assignment.staffId)}</div>
                        <div className="assignment-item-role">{getRoleName(assignment.roleId)}</div>
                      </div>
                      <span className={`tag assignment-status-${assignment.status}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>
                    <div className="assignment-item-details">
                      <div className="assignment-item-time">
                        <span>Начало: {formatDateTime(assignment.startTime)}</span>
                        <span>Окончание: {formatDateTime(assignment.endTime)}</span>
                        {hours > 0 && <span>Часов: {hours}</span>}
                      </div>
                      <div className="assignment-item-payment">
                        <span className="assignment-payment-label">Заработок:</span>
                        <span className="assignment-payment-amount">
                          {amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                        </span>
                        {assignment.paymentAmount !== undefined && assignment.paymentAmount !== null && (
                          <span className="assignment-payment-note">(указан вручную)</span>
                        )}
                      </div>
                    </div>
                    <div className="assignment-item-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => assignment.id && handleEditAssignment(assignment)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => assignment.id && handleDeleteAssignmentClick(assignment.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {showAssignmentForm && event && event.id && (
        <AssignmentForm
          assignment={editingAssignment || undefined}
          eventId={event.id}
          eventStartDate={event.startDate}
          eventEndDate={event.endDate}
          staffList={staffList}
          onSave={handleSaveAssignment}
          onCancel={() => {
            setShowAssignmentForm(false);
            setEditingAssignment(null);
          }}
        />
      )}

      {(event.createdAt || event.updatedAt) && (
        <section className="event-section">
          <h2 className="event-section-title">Метаданные</h2>
          <div className="event-section-body">
            {event.createdAt && (
              <div className="event-detail-row">
                <div className="event-detail-label">Создано</div>
                <div className="event-detail-value">{formatDateTime(event.createdAt)}</div>
              </div>
            )}
            {event.updatedAt && (
              <div className="event-detail-row">
                <div className="event-detail-label">Обновлено</div>
                <div className="event-detail-value">{formatDateTime(event.updatedAt)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Удаление мероприятия"
          message={event ? `Вы уверены, что хотите удалить мероприятие "${event.title}"? Это действие нельзя отменить.` : 'Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.'}
          confirmText="Удалить"
          cancelText="Отмена"
          type="danger"
          onConfirm={() => {
            console.log('ConfirmDialog: onConfirm called');
            handleDelete();
          }}
          onCancel={() => {
            console.log('ConfirmDialog: Cancel clicked, closing dialog');
            setShowDeleteConfirm(false);
          }}
        />
      )}

      {showDeleteAssignmentConfirm && deletingAssignmentId && (
        <ConfirmDialog
          isOpen={true}
          title="Удаление назначения"
          message="Вы уверены, что хотите удалить это назначение? Это действие нельзя отменить."
          confirmText="Удалить"
          cancelText="Отмена"
          type="danger"
          onConfirm={handleDeleteAssignment}
          onCancel={() => {
            setShowDeleteAssignmentConfirm(false);
            setDeletingAssignmentId(null);
          }}
        />
      )}
    </div>
  );
}
