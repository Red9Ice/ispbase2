/**
 * @file: StaffDetail.tsx
 * @description: Detailed view for a single staff member.
 * @dependencies: services/api.ts
 * @created: 2026-01-26
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { StaffDto } from '../services/api';
import { DraggableModal } from './DraggableModal';
import { ConfirmDialog } from './ConfirmDialog';

interface StaffDetailProps {
  staffId: number;
  onClose: () => void;
  onEdit: (staff: StaffDto) => void;
  onDelete?: () => void;
}

export function StaffDetail({ staffId, onClose, onEdit, onDelete }: StaffDetailProps) {
  const [staff, setStaff] = useState<StaffDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const staffData = await api.staff.getById(staffId);
        setStaff(staffData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить сотрудника');
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [staffId]);

  const handleDelete = async () => {
    if (!staff) {
      return;
    }

    setDeleting(true);
    try {
      await api.staff.deactivate(staff.id!);
      // Анимация удаления элемента из списка
      const rowElement = document.querySelector(`[data-staff-id="${staff.id}"]`);
      if (rowElement) {
        rowElement.classList.add('table-row-deleting');
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
        }, rowElement ? 500 : 0);
      }
    } catch (err: unknown) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : 'Ошибка при деактивации');
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

  if (error || !staff) {
    return (
      <DraggableModal title="Ошибка" onClose={onClose}>
        <p>{error || 'Сотрудник не найден'}</p>
      </DraggableModal>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fullName = `${staff.lastName} ${staff.firstName}${staff.middleName ? ' ' + staff.middleName : ''}`;

  return (
    <DraggableModal title={fullName} onClose={onClose} size="large">
          {/* О персонале */}
          <div className="detail-section">
            <h3 className="detail-section-title">О персонале</h3>
            {staff.city && (
              <div className="detail-row">
                <div className="detail-label">Город</div>
                <div className="detail-value">{staff.city}</div>
              </div>
            )}
            {staff.profile && (
              <div className="detail-row">
                <div className="detail-label">Профиль</div>
                <div className="detail-value">{staff.profile}</div>
              </div>
            )}
            {staff.rate !== undefined && (
              <div className="detail-row">
                <div className="detail-label">Ставка</div>
                <div className="detail-value">
                  {staff.currency} {staff.rate.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
            {staff.employmentType && (
              <div className="detail-row">
                <div className="detail-label">По найму</div>
                <div className="detail-value">{staff.employmentType}</div>
              </div>
            )}
            {staff.phone && (
              <div className="detail-row">
                <div className="detail-label">Номер телефона</div>
                <div className="detail-value">
                  <a href={`tel:${staff.phone}`} className="button-link">
                    {staff.phone}
                  </a>
                </div>
              </div>
            )}
            {staff.otherPaymentMethods && (
              <div className="detail-row">
                <div className="detail-label">Другие способы оплаты</div>
                <div className="detail-value">{staff.otherPaymentMethods}</div>
              </div>
            )}
          </div>

          {/* Документы */}
          <div className="detail-section">
            <h3 className="detail-section-title">Документы</h3>
            {(staff.passportSeries || staff.passportNumber) && (
              <div className="detail-row">
                <div className="detail-label">Паспорт РФ, серия номер</div>
                <div className="detail-value">
                  {staff.passportSeries || ''} {staff.passportNumber || ''}
                </div>
              </div>
            )}
            {staff.passportIssuedBy && (
              <div className="detail-row">
                <div className="detail-label">Паспорт РФ, кем выдан, дата выдачи</div>
                <div className="detail-value">{staff.passportIssuedBy}</div>
              </div>
            )}
            {staff.passportIssueDate && (
              <div className="detail-row">
                <div className="detail-label">Дата выдачи</div>
                <div className="detail-value">{formatDateShort(staff.passportIssueDate)}</div>
              </div>
            )}
            {staff.passportDepartmentCode && (
              <div className="detail-row">
                <div className="detail-label">Код подразделения</div>
                <div className="detail-value">{staff.passportDepartmentCode}</div>
              </div>
            )}
            {staff.passportScanUrl && (
              <div className="detail-row">
                <div className="detail-label">Скан паспорта</div>
                <div className="detail-value">
                  <a href={staff.passportScanUrl} target="_blank" rel="noopener noreferrer" className="button-link">
                    {staff.passportScanUrl.split('/').pop() || 'Скачать'}
                  </a>
                </div>
              </div>
            )}
            {staff.snils && (
              <div className="detail-row">
                <div className="detail-label">СНИЛС</div>
                <div className="detail-value">{staff.snils}</div>
              </div>
            )}
            {staff.inn && (
              <div className="detail-row">
                <div className="detail-label">ИНН</div>
                <div className="detail-value">{staff.inn}</div>
              </div>
            )}
            {staff.birthDate && (
              <div className="detail-row">
                <div className="detail-label">Дата рождения</div>
                <div className="detail-value">{formatDateShort(staff.birthDate)}</div>
              </div>
            )}
            {staff.birthPlace && (
              <div className="detail-row">
                <div className="detail-label">Место рождения</div>
                <div className="detail-value">{staff.birthPlace}</div>
              </div>
            )}
            {staff.registrationAddress && (
              <div className="detail-row">
                <div className="detail-label">Адрес регистрации</div>
                <div className="detail-value">{staff.registrationAddress}</div>
              </div>
            )}
          </div>

          {/* Базовая информация */}
          <div className="detail-section">
            <h3 className="detail-section-title">Базовая информация</h3>
            <div className="detail-row">
              <div className="detail-label">Статус</div>
              <div className="detail-value">
                <span className={`tag ${staff.status}`}>
                  {staff.status === 'active' ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email</div>
              <div className="detail-value">
                <a href={`mailto:${staff.email}`} className="button-link">
                  {staff.email}
                </a>
              </div>
            </div>
            {staff.createdAt && (
              <div className="detail-row">
                <div className="detail-label">Создано</div>
                <div className="detail-value">{formatDate(staff.createdAt)}</div>
              </div>
            )}
            {staff.updatedAt && (
              <div className="detail-row">
                <div className="detail-label">Обновлено</div>
                <div className="detail-value">{formatDate(staff.updatedAt)}</div>
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button onClick={() => onEdit(staff)} className="button-primary">
              Редактировать
            </button>
            {staff.status === 'active' && (
              <button onClick={handleDeleteClick} disabled={deleting} className="button-danger">
                {deleting ? 'Деактивация...' : 'Деактивировать'}
              </button>
            )}
          </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Деактивация сотрудника"
        message={`Вы уверены, что хотите деактивировать сотрудника "${staff?.firstName} ${staff?.lastName}"? Это действие можно отменить позже.`}
        confirmText="Деактивировать"
        cancelText="Отмена"
        type="warning"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </DraggableModal>
  );
}
