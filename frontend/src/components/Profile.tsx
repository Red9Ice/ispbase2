/**
 * @file: Profile.tsx
 * @description: Компонент профиля пользователя с возможностью редактирования данных и смены пароля.
 * @dependencies: services/api.ts, contexts/useAuth.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/useAuth';
import type { AuthUser, EventDto, SalaryEntry } from '../services/api';
import { formatDateTime } from '../utils/format';
import './Profile.css';

export function Profile() {
  const { updateUser, logout } = useAuth(); // Проверка авторизации и получение функции обновления
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Events state
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Salary state
  const [salary, setSalary] = useState<SalaryEntry[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Calculate events statistics
  const eventsStats = {
    total: events.length,
    draft: events.filter(e => e.status === 'draft').length,
    request: events.filter(e => e.status === 'request').length,
    in_work: events.filter(e => e.status === 'in_work').length,
    completed: events.filter(e => e.status === 'completed').length,
    canceled: events.filter(e => e.status === 'canceled').length,
  };

  // Filter events by selected status
  const filteredEvents = selectedStatusFilter === null
    ? events
    : events.filter(e => e.status === selectedStatusFilter);

  const handleStatusFilterClick = (status: string | null) => {
    setSelectedStatusFilter(status === selectedStatusFilter ? null : status);
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.auth.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setAvatarUrl(data.avatarUrl || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Не удалось загрузить профиль' });
    } finally {
      setLoading(false);
    }
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadEvents = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setEventsLoading(true);
      const data = await api.events.list({ managerId: profile.id });
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setEventsLoading(false);
    }
  }, [profile?.id]);

  const loadSalary = useCallback(async () => {
    try {
      setSalaryLoading(true);
      const data = await api.auth.getSalary();
      setSalary(data);
    } catch (error) {
      console.error('Failed to load salary:', error);
    } finally {
      setSalaryLoading(false);
    }
  }, []);

  useEffect(() => {
    // #region agent log
    const logData = {location:'Profile.tsx:97',message:'useEffect triggered',data:{profileId:profile?.id,loadEventsDefined:!!loadEvents,loadSalaryDefined:!!loadSalary},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]', logData);
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    // #endregion
    if (profile?.id) {
      // #region agent log
      const logData2 = {location:'Profile.tsx:99',message:'Calling loadEvents and loadSalary',data:{profileId:profile.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]', logData2);
      fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
      // #endregion
      loadEvents();
      loadSalary();
    }
  }, [profile?.id, loadEvents, loadSalary]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const updated = await api.auth.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfile(updated);
      setFirstName(updated.firstName || '');
      setLastName(updated.lastName || '');
      setAvatarUrl(updated.avatarUrl || '');
      // Обновляем контекст авторизации, чтобы данные сохранились после обновления страницы
      updateUser(updated);
      setMessage({ type: 'success', text: 'Профиль успешно обновлен' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось сохранить профиль' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Пароль должен быть не менее 6 символов' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await api.auth.updatePassword({
        currentPassword,
        newPassword,
      });
      setMessage({ type: 'success', text: 'Пароль успешно изменен' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось изменить пароль' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="card">
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.displayName || 'Пользователь';

  return (
    <div className="profile-page">
      <div className="profile-main">
        <div className="profile-left">
          <div className="profile-header card">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{displayName}</h2>
                <p className="profile-email">{profile?.email}</p>
              </div>
            </div>
            <button 
              type="button" 
              className="profile-logout-button" 
              onClick={logout}
              title="Выйти"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11L14 8L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Выйти</span>
            </button>
          </div>

          <div className="profile-tabs card">
        <div className="profile-tabs-header">
          <button
            type="button"
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Смена пароля
          </button>
        </div>

        {message && (
          <div className={`profile-message profile-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-form">
            <div className="profile-form-row">
              <label className="profile-label">
                <span>Имя</span>
                <input
                  type="text"
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Введите имя"
                  disabled={saving}
                />
              </label>
              <label className="profile-label">
                <span>Фамилия</span>
                <input
                  type="text"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Введите фамилию"
                  disabled={saving}
                />
              </label>
            </div>
            <label className="profile-label">
              <span>Email</span>
              <input
                type="email"
                className="input"
                value={profile?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <small className="profile-hint">Email нельзя изменить</small>
            </label>
            <label className="profile-label">
              <span>URL аватарки</span>
              <input
                type="url"
                className="input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                disabled={saving}
              />
              <small className="profile-hint">Введите URL изображения для аватарки</small>
            </label>
            {avatarUrl && (
              <div className="profile-avatar-preview">
                <img src={avatarUrl} alt="Preview" className="profile-avatar-preview-img" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              </div>
            )}
            <div className="profile-form-actions">
              <button
                type="button"
                className="button-primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="profile-form">
            <label className="profile-label">
              <span>Текущий пароль</span>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введите текущий пароль"
                disabled={saving}
              />
            </label>
            <label className="profile-label">
              <span>Новый пароль</span>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Введите новый пароль (минимум 6 символов)"
                disabled={saving}
              />
            </label>
            <label className="profile-label">
              <span>Подтвердите новый пароль</span>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                disabled={saving}
              />
            </label>
            <div className="profile-form-actions">
              <button
                type="button"
                className="button-primary"
                onClick={handleChangePassword}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              >
                {saving ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </div>
          </div>
        )}
          </div>
        </div>

        {profile?.id && (
          <div className="profile-right">
            <div className="profile-salary card">
              <h3 className="profile-salary-title">Начисления</h3>
              {salaryLoading ? (
                <p className="profile-salary-empty">Загрузка начислений...</p>
              ) : salary.length === 0 ? (
                <p className="profile-salary-empty">Нет начислений</p>
              ) : (
                <div className="profile-salary-list">
                  {salary.map((entry) => {
                    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                    return (
                      <div key={`${entry.year}-${entry.month}`} className="profile-salary-month">
                        <div className="profile-salary-month-header">
                          <h4 className="profile-salary-month-title">
                            {monthNames[entry.month - 1]} {entry.year}
                          </h4>
                          <span className="profile-salary-month-amount">
                            {entry.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </span>
                        </div>
                        <div className="profile-salary-assignments">
                          {entry.assignments.map((assignment, idx) => (
                            <div key={idx} className="profile-salary-assignment">
                              <div className="profile-salary-assignment-info">
                                <span className="profile-salary-assignment-event">Мероприятие #{assignment.eventId}</span>
                                <span className="profile-salary-assignment-time">
                                  {formatDateTime(assignment.startTime)} — {formatDateTime(assignment.endTime)}
                                </span>
                              </div>
                              <div className="profile-salary-assignment-details">
                                <span>{assignment.hours} ч.</span>
                                <span className="profile-salary-assignment-amount">
                                  {assignment.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="profile-events card">
              <h3 className="profile-events-title">Мои мероприятия</h3>
              
              {eventsLoading ? (
                <p className="profile-events-empty">Загрузка мероприятий...</p>
              ) : events.length === 0 ? (
                <p className="profile-events-empty">Нет мероприятий</p>
              ) : (
                <>
                  <div className="profile-events-dashboard">
                    <div 
                      className={`profile-events-stat ${selectedStatusFilter === null ? 'profile-events-stat-active' : ''}`}
                      onClick={() => handleStatusFilterClick(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="profile-events-stat-label">Всего</span>
                      <span className="profile-events-stat-value">{eventsStats.total}</span>
                    </div>
                    {eventsStats.draft > 0 && (
                      <div 
                        className={`profile-events-stat profile-events-stat-draft ${selectedStatusFilter === 'draft' ? 'profile-events-stat-active' : ''}`}
                        onClick={() => handleStatusFilterClick('draft')}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="profile-events-stat-label">Черновик</span>
                        <span className="profile-events-stat-value">{eventsStats.draft}</span>
                      </div>
                    )}
                    {eventsStats.request > 0 && (
                      <div 
                        className={`profile-events-stat profile-events-stat-request ${selectedStatusFilter === 'request' ? 'profile-events-stat-active' : ''}`}
                        onClick={() => handleStatusFilterClick('request')}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="profile-events-stat-label">Запрос</span>
                        <span className="profile-events-stat-value">{eventsStats.request}</span>
                      </div>
                    )}
                    {eventsStats.in_work > 0 && (
                      <div 
                        className={`profile-events-stat profile-events-stat-in_work ${selectedStatusFilter === 'in_work' ? 'profile-events-stat-active' : ''}`}
                        onClick={() => handleStatusFilterClick('in_work')}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="profile-events-stat-label">В работе</span>
                        <span className="profile-events-stat-value">{eventsStats.in_work}</span>
                      </div>
                    )}
                    {eventsStats.completed > 0 && (
                      <div 
                        className={`profile-events-stat profile-events-stat-completed ${selectedStatusFilter === 'completed' ? 'profile-events-stat-active' : ''}`}
                        onClick={() => handleStatusFilterClick('completed')}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="profile-events-stat-label">Завершено</span>
                        <span className="profile-events-stat-value">{eventsStats.completed}</span>
                      </div>
                    )}
                    {eventsStats.canceled > 0 && (
                      <div 
                        className={`profile-events-stat profile-events-stat-canceled ${selectedStatusFilter === 'canceled' ? 'profile-events-stat-active' : ''}`}
                        onClick={() => handleStatusFilterClick('canceled')}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="profile-events-stat-label">Отменено</span>
                        <span className="profile-events-stat-value">{eventsStats.canceled}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-events-list-container">
                    <div className="profile-events-list">
                      {filteredEvents.length === 0 ? (
                        <p className="profile-events-empty">
                          {selectedStatusFilter ? 'Нет мероприятий с выбранным статусом' : 'Нет мероприятий'}
                        </p>
                      ) : (
                        filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className="profile-event-item"
                          onClick={() => event.id && navigate(`/events/${event.id}`, { state: { from: 'profile' } })}
                        >
                          <div className="profile-event-header">
                            <h4 className="profile-event-title">{event.title}</h4>
                            <span className={`profile-event-status profile-event-status-${event.status}`}>
                              {event.status === 'draft' && 'Черновик'}
                              {event.status === 'request' && 'Запрос'}
                              {event.status === 'in_work' && 'В работе'}
                              {event.status === 'completed' && 'Завершено'}
                              {event.status === 'canceled' && 'Отменено'}
                            </span>
                          </div>
                          {event.description && (
                            <p className="profile-event-description">{event.description}</p>
                          )}
                          <div className="profile-event-dates">
                            <span>Начало: {formatDateTime(event.startDate)}</span>
                            <span>Окончание: {formatDateTime(event.endDate)}</span>
                          </div>
                          <div className="profile-event-budget">
                            <span>Бюджет: {(event.contractPrice || 0).toLocaleString('ru-RU')} ₽</span>
                            {event.budgetActual > 0 && (
                              <span>Факт: {event.budgetActual.toLocaleString('ru-RU')} ₽</span>
                            )}
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
