/**
 * @file: StaffForm.tsx
 * @description: Form for creating and editing staff members.
 * @dependencies: services/api.ts
 * @created: 2026-01-26
 */

import { useState } from 'react';
import { api } from '../services/api';
import type { StaffDto, StaffStatus } from '../services/api';
import { DraggableModal } from './DraggableModal';
import { DatePicker } from './DatePicker';

interface StaffFormProps {
  staff?: StaffDto;
  onSave: () => void;
  onCancel: () => void;
}

export function StaffForm({ staff, onSave, onCancel }: StaffFormProps) {
  const getInitialFormData = (): Omit<StaffDto, 'id' | 'createdAt' | 'updatedAt'> => {
    if (staff) {
      return {
        firstName: staff.firstName,
        lastName: staff.lastName,
        middleName: staff.middleName,
        email: staff.email,
        phone: staff.phone,
        rate: staff.rate,
        currency: staff.currency,
        status: staff.status,
        city: staff.city,
        profile: staff.profile,
        employmentType: staff.employmentType,
        otherPaymentMethods: staff.otherPaymentMethods,
        passportSeries: staff.passportSeries,
        passportNumber: staff.passportNumber,
        passportIssuedBy: staff.passportIssuedBy,
        passportIssueDate: staff.passportIssueDate,
        passportDepartmentCode: staff.passportDepartmentCode,
        passportScanUrl: staff.passportScanUrl,
        snils: staff.snils,
        inn: staff.inn,
        birthDate: staff.birthDate,
        birthPlace: staff.birthPlace,
        registrationAddress: staff.registrationAddress,
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      rate: 0,
      currency: 'RUB',
      status: 'active',
    };
  };

  const [initialFormData] = useState(() => getInitialFormData());
  const [formData, setFormData] = useState<Omit<StaffDto, 'id' | 'createdAt' | 'updatedAt'>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Нормализуем данные для сравнения (убираем пустые строки)
  const normalizeForComparison = (data: typeof formData) => {
    return {
      ...data,
      firstName: data.firstName?.trim() || '',
      lastName: data.lastName?.trim() || '',
      middleName: data.middleName?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      city: data.city?.trim() || '',
      profile: data.profile?.trim() || '',
      employmentType: data.employmentType?.trim() || '',
      otherPaymentMethods: data.otherPaymentMethods?.trim() || '',
      passportSeries: data.passportSeries?.trim() || '',
      passportNumber: data.passportNumber?.trim() || '',
      passportIssuedBy: data.passportIssuedBy?.trim() || '',
      passportDepartmentCode: data.passportDepartmentCode?.trim() || '',
      passportScanUrl: data.passportScanUrl?.trim() || '',
      snils: data.snils?.trim() || '',
      inn: data.inn?.trim() || '',
      birthPlace: data.birthPlace?.trim() || '',
      registrationAddress: data.registrationAddress?.trim() || '',
    };
  };

  // Проверяем, есть ли изменения в форме
  const hasChanges = JSON.stringify(normalizeForComparison(formData)) !== JSON.stringify(normalizeForComparison(initialFormData));

  const filled = (s: string | undefined | null) => (s ?? '').trim().length > 0;
  const hasAbout =
    filled(formData.city) ||
    filled(formData.profile) ||
    (formData.rate != null && formData.rate > 0) ||
    filled(formData.employmentType) ||
    filled(formData.otherPaymentMethods);
  const hasDocs =
    filled(formData.passportSeries) ||
    filled(formData.passportNumber) ||
    filled(formData.passportIssuedBy) ||
    filled(formData.passportIssueDate) ||
    filled(formData.passportDepartmentCode) ||
    filled(formData.passportScanUrl) ||
    filled(formData.snils) ||
    filled(formData.inn) ||
    filled(formData.birthDate) ||
    filled(formData.birthPlace) ||
    filled(formData.registrationAddress);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Имя должно содержать минимум 2 символа';
    }
    if (formData.firstName && formData.firstName.length > 100) {
      newErrors.firstName = 'Имя не должно превышать 100 символов';
    }
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Фамилия должна содержать минимум 2 символа';
    }
    if (formData.lastName && formData.lastName.length > 100) {
      newErrors.lastName = 'Фамилия не должна превышать 100 символов';
    }
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Некорректный формат email';
      }
    }
    if (formData.rate !== undefined && formData.rate < 0) {
      newErrors.rate = 'Ставка не может быть отрицательной';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Omit<StaffDto, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        rate: formData.rate || undefined,
        currency: 'RUB',
        status: formData.status,
        city: formData.city?.trim() || undefined,
        profile: formData.profile?.trim() || undefined,
        employmentType: formData.employmentType?.trim() || undefined,
        otherPaymentMethods: formData.otherPaymentMethods?.trim() || undefined,
        passportSeries: formData.passportSeries?.trim() || undefined,
        passportNumber: formData.passportNumber?.trim() || undefined,
        passportIssuedBy: formData.passportIssuedBy?.trim() || undefined,
        passportIssueDate: formData.passportIssueDate || undefined,
        passportDepartmentCode: formData.passportDepartmentCode?.trim() || undefined,
        passportScanUrl: formData.passportScanUrl?.trim() || undefined,
        snils: formData.snils?.trim() || undefined,
        inn: formData.inn?.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace?.trim() || undefined,
        registrationAddress: formData.registrationAddress?.trim() || undefined,
      };

      if (staff?.id) {
        await api.staff.update(staff.id, payload);
      } else {
        await api.staff.create(payload);
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
      title={staff ? 'Редактировать сотрудника' : 'Создать сотрудника'}
      onClose={onCancel}
      hasChanges={hasChanges}
    >
      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3 className="form-section-title">Базовая информация</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Имя *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>Фамилия *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Отчество</label>
              <input
                type="text"
                value={formData.middleName || ''}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'input-error' : ''}
                placeholder="email@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Статус *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
            >
              <option value="active">Активен</option>
              <option value="inactive">Неактивен</option>
            </select>
          </div>
        </div>

        {hasAbout && (
          <div className="form-section">
            <h3 className="form-section-title">О персонале</h3>
            <div className="form-row">
            <div className="form-group">
              <label>Город</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Профиль (роли через "/")</label>
              <input
                type="text"
                value={formData.profile || ''}
                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                placeholder="Менеджер / Бригадир / Инженер"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ставка (₽)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rate || ''}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value ? Number(e.target.value) : undefined })}
                className={errors.rate ? 'input-error' : ''}
              />
              {errors.rate && <span className="error-text">{errors.rate}</span>}
            </div>
            <div className="form-group">
              <label>По найму</label>
              <input
                type="text"
                value={formData.employmentType || ''}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                placeholder="ИП ЮИН"
              />
            </div>
          </div>
            <div className="form-group">
              <label>Другие способы оплаты</label>
              <input
                type="text"
                value={formData.otherPaymentMethods || ''}
                onChange={(e) => setFormData({ ...formData, otherPaymentMethods: e.target.value })}
                placeholder="ТИНЬКОФФ 545..."
              />
            </div>
          </div>
        )}

        {hasDocs && (
          <div className="form-section">
            <h3 className="form-section-title">Документы</h3>
            <div className="form-row">
            <div className="form-group">
              <label>Паспорт РФ, серия</label>
              <input
                type="text"
                value={formData.passportSeries || ''}
                onChange={(e) => setFormData({ ...formData, passportSeries: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Паспорт РФ, номер</label>
              <input
                type="text"
                value={formData.passportNumber || ''}
                onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Паспорт РФ, кем выдан, дата выдачи</label>
            <input
              type="text"
              value={formData.passportIssuedBy || ''}
              onChange={(e) => setFormData({ ...formData, passportIssuedBy: e.target.value })}
              placeholder="Отделом УФМС..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Дата выдачи</label>
              <DatePicker
                value={formData.passportIssueDate ? formData.passportIssueDate.split('T')[0] : ''}
                onChange={(value) => setFormData({ ...formData, passportIssueDate: value ? `${value}T00:00:00Z` : undefined })}
                placeholder="Выберите дату выдачи"
              />
            </div>
            <div className="form-group">
              <label>Код подразделения</label>
              <input
                type="text"
                value={formData.passportDepartmentCode || ''}
                onChange={(e) => setFormData({ ...formData, passportDepartmentCode: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Скан паспорта (URL)</label>
            <input
              type="url"
              value={formData.passportScanUrl || ''}
              onChange={(e) => setFormData({ ...formData, passportScanUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>СНИЛС</label>
              <input
                type="text"
                value={formData.snils || ''}
                onChange={(e) => setFormData({ ...formData, snils: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>ИНН</label>
              <input
                type="text"
                value={formData.inn || ''}
                onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Дата рождения</label>
              <DatePicker
                value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                onChange={(value) => setFormData({ ...formData, birthDate: value ? `${value}T00:00:00Z` : undefined })}
                placeholder="Выберите дату рождения"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>Место рождения</label>
              <input
                type="text"
                value={formData.birthPlace || ''}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                placeholder="г. Киров, Кировская область"
              />
            </div>
          </div>
            <div className="form-group">
              <label>Адрес регистрации</label>
              <textarea
                value={formData.registrationAddress || ''}
                onChange={(e) => setFormData({ ...formData, registrationAddress: e.target.value })}
                rows={2}
                placeholder="Кировская область, г. Киров..."
              />
            </div>
          </div>
        )}

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
