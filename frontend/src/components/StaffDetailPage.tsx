/**
 * @file: StaffDetailPage.tsx
 * @description: Полноценная страница просмотра персонала.
 * @dependencies: services/api, EventPages.css, format
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { StaffDto } from '../services/api';
import { formatDateTime } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import './EventPages.css';

export function StaffDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Определяем, откуда пришли, чтобы правильно вернуться назад
  const fromPage = (location.state as { from?: string })?.from || 'staff';
  const backPath = '/staff';
  
  // Извлекаем ID из URL, если useParams не сработал (из-за условного рендеринга в App.tsx)
  const pathMatch = location.pathname.match(/^\/staff\/(\d+)$/);
  const id = paramId || pathMatch?.[1] || null;
  const [staff, setStaff] = useState<StaffDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID персонала не указан');
      setLoading(false);
      return;
    }
    
    const loadStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const staffId = Number(id);
        if (isNaN(staffId)) {
          throw new Error('Неверный ID персонала');
        }
        const staffData = await api.staff.getById(staffId);
        setStaff(staffData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить персонал');
      } finally {
        setLoading(false);
      }
    };
    
    loadStaff();
  }, [id]);

  const handleDelete = async () => {
    if (!staff) return;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await api.staff.deactivate(staff.id!);
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
      alert(err instanceof Error ? err.message : 'Ошибка при деактивации');
    }
  };

  const handleEdit = () => {
    if (staff?.id) {
      navigate(`/staff/${staff.id}/edit`);
    }
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="event-page-loading">Загрузка…</div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="event-page">
        <div className="event-page-header">
          <nav className="event-page-breadcrumb">
            <Link to={backPath}>Персонал</Link>
            <span> / </span>
            <span>Ошибка</span>
          </nav>
        </div>
        <div className="event-page-error">{error || 'Персонал не найден'}</div>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(backPath)}>
            К списку
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${staff.lastName} ${staff.firstName}${staff.middleName ? ' ' + staff.middleName : ''}`;

  return (
    <div className="event-page">
      <header className="event-page-header">
        <nav className="event-page-breadcrumb">
          <Link to={backPath}>Персонал</Link>
          <span> / </span>
          <span>{fullName}</span>
        </nav>
        <h1 className="event-page-title">{fullName}</h1>
        <p className="event-page-subtitle">
          <span className={`tag ${staff.status}`}>
            {staff.status === 'active' ? 'Активен' : 'Неактивен'}
          </span>
        </p>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(backPath)}>
            ← К списку
          </button>
          <button type="button" className="button-primary" onClick={handleEdit}>
            Редактировать
          </button>
          {staff.status === 'active' && (
            <button 
              type="button" 
              className="button-danger" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Деактивация…' : 'Деактивировать'}
            </button>
          )}
        </div>
      </header>

      <section className="event-section">
        <h2 className="event-section-title">О персонале</h2>
        <div className="event-section-body">
          {staff.city && (
            <div className="event-detail-row">
              <div className="event-detail-label">Город</div>
              <div className="event-detail-value">{staff.city}</div>
            </div>
          )}
          {staff.profile && (
            <div className="event-detail-row">
              <div className="event-detail-label">Профиль</div>
              <div className="event-detail-value">{staff.profile}</div>
            </div>
          )}
          {staff.rate !== undefined && (
            <div className="event-detail-row">
              <div className="event-detail-label">Ставка</div>
              <div className="event-detail-value">
                {staff.currency} {staff.rate.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          {staff.employmentType && (
            <div className="event-detail-row">
              <div className="event-detail-label">По найму</div>
              <div className="event-detail-value">{staff.employmentType}</div>
            </div>
          )}
          {staff.phone && (
            <div className="event-detail-row">
              <div className="event-detail-label">Номер телефона</div>
              <div className="event-detail-value">
                <a href={`tel:${staff.phone}`} className="button-link">
                  {staff.phone}
                </a>
              </div>
            </div>
          )}
          {staff.otherPaymentMethods && (
            <div className="event-detail-row">
              <div className="event-detail-label">Другие способы оплаты</div>
              <div className="event-detail-value">{staff.otherPaymentMethods}</div>
            </div>
          )}
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title">Документы</h2>
        <div className="event-section-body">
          {(staff.passportSeries || staff.passportNumber) && (
            <div className="event-detail-row">
              <div className="event-detail-label">Паспорт РФ, серия номер</div>
              <div className="event-detail-value">
                {staff.passportSeries || ''} {staff.passportNumber || ''}
              </div>
            </div>
          )}
          {staff.passportIssuedBy && (
            <div className="event-detail-row">
              <div className="event-detail-label">Паспорт РФ, кем выдан, дата выдачи</div>
              <div className="event-detail-value">{staff.passportIssuedBy}</div>
            </div>
          )}
          {staff.passportIssueDate && (
            <div className="event-detail-row">
              <div className="event-detail-label">Дата выдачи</div>
              <div className="event-detail-value">{formatDateShort(staff.passportIssueDate)}</div>
            </div>
          )}
          {staff.passportDepartmentCode && (
            <div className="event-detail-row">
              <div className="event-detail-label">Код подразделения</div>
              <div className="event-detail-value">{staff.passportDepartmentCode}</div>
            </div>
          )}
          {staff.passportScanUrl && (
            <div className="event-detail-row">
              <div className="event-detail-label">Скан паспорта</div>
              <div className="event-detail-value">
                <a href={staff.passportScanUrl} target="_blank" rel="noopener noreferrer" className="button-link">
                  {staff.passportScanUrl.split('/').pop() || 'Скачать'}
                </a>
              </div>
            </div>
          )}
          {staff.snils && (
            <div className="event-detail-row">
              <div className="event-detail-label">СНИЛС</div>
              <div className="event-detail-value">{staff.snils}</div>
            </div>
          )}
          {staff.inn && (
            <div className="event-detail-row">
              <div className="event-detail-label">ИНН</div>
              <div className="event-detail-value">{staff.inn}</div>
            </div>
          )}
          {staff.birthDate && (
            <div className="event-detail-row">
              <div className="event-detail-label">Дата рождения</div>
              <div className="event-detail-value">{formatDateShort(staff.birthDate)}</div>
            </div>
          )}
          {staff.birthPlace && (
            <div className="event-detail-row">
              <div className="event-detail-label">Место рождения</div>
              <div className="event-detail-value">{staff.birthPlace}</div>
            </div>
          )}
          {staff.registrationAddress && (
            <div className="event-detail-row">
              <div className="event-detail-label">Адрес регистрации</div>
              <div className="event-detail-value">{staff.registrationAddress}</div>
            </div>
          )}
        </div>
      </section>

      <section className="event-section">
        <h2 className="event-section-title">Базовая информация</h2>
        <div className="event-section-body">
          <div className="event-detail-row">
            <div className="event-detail-label">Статус</div>
            <div className="event-detail-value">
              <span className={`tag ${staff.status}`}>
                {staff.status === 'active' ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>
          <div className="event-detail-row">
            <div className="event-detail-label">Email</div>
            <div className="event-detail-value">
              <a href={`mailto:${staff.email}`} className="button-link">
                {staff.email}
              </a>
            </div>
          </div>
          {staff.createdAt && (
            <div className="event-detail-row">
              <div className="event-detail-label">Создано</div>
              <div className="event-detail-value">{formatDateTime(staff.createdAt)}</div>
            </div>
          )}
          {staff.updatedAt && (
            <div className="event-detail-row">
              <div className="event-detail-label">Обновлено</div>
              <div className="event-detail-value">{formatDateTime(staff.updatedAt)}</div>
            </div>
          )}
        </div>
      </section>

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Деактивация сотрудника"
          message={`Вы уверены, что хотите деактивировать сотрудника "${staff.firstName} ${staff.lastName}"? Это действие можно отменить позже.`}
          confirmText="Деактивировать"
          cancelText="Отмена"
          type="warning"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
