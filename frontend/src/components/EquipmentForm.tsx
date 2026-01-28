/**
 * @file: EquipmentForm.tsx
 * @description: Form for creating and editing equipment.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { EquipmentDto, EquipmentStatus, EquipmentCategoryDto } from '../services/api';
import { categoryOptions } from '../utils/categoryTree';
import { DraggableModal } from './DraggableModal';

interface EquipmentFormProps {
  equipment?: EquipmentDto;
  onSave: () => void;
  onCancel: () => void;
}

export function EquipmentForm({ equipment, onSave, onCancel }: EquipmentFormProps) {
  const getInitialFormData = (): Omit<EquipmentDto, 'id' | 'createdAt' | 'updatedAt'> => {
    if (equipment) {
      return {
        name: equipment.name,
        model: equipment.model || '',
        manufacturer: equipment.manufacturer || '',
        categoryId: equipment.categoryId,
        serialNumber: equipment.serialNumber || '',
        photoUrl: equipment.photoUrl || '',
        status: equipment.status,
        description: equipment.description || '',
      };
    }
    return {
      name: '',
      model: '',
      manufacturer: '',
      categoryId: 0,
      serialNumber: '',
      photoUrl: '',
      status: 'available',
      description: '',
    };
  };

  const [initialFormData, setInitialFormData] = useState(() => getInitialFormData());
  const [formData, setFormData] = useState<Omit<EquipmentDto, 'id' | 'createdAt' | 'updatedAt'>>(initialFormData);
  const [categories, setCategories] = useState<EquipmentCategoryDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.equipmentCategories.list();
        setCategories(data);
        if (data.length > 0 && !equipment) {
          const opts = categoryOptions(data);
          const firstId = opts[0]?.id ?? 0;
          setFormData(prev => ({ ...prev, categoryId: firstId }));
          setInitialFormData(prev => ({ ...prev, categoryId: firstId }));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [equipment]);

  const categoryOpts = useMemo(() => categoryOptions(categories), [categories]);

  // Нормализуем данные для сравнения (убираем пустые строки)
  const normalizeForComparison = (data: typeof formData) => {
    return {
      ...data,
      name: data.name?.trim() || '',
      model: data.model?.trim() || '',
      manufacturer: data.manufacturer?.trim() || '',
      serialNumber: data.serialNumber?.trim() || '',
      photoUrl: data.photoUrl?.trim() || '',
      description: data.description?.trim() || '',
    };
  };

  // Проверяем, есть ли изменения в форме
  const hasChanges = JSON.stringify(normalizeForComparison(formData)) !== JSON.stringify(normalizeForComparison(initialFormData));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 1) {
      newErrors.name = 'Название обязательно';
    }
    if (formData.name && formData.name.length > 200) {
      newErrors.name = 'Название не должно превышать 200 символов';
    }
    if (!formData.categoryId || formData.categoryId <= 0) {
      newErrors.categoryId = 'Категория обязательна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Omit<EquipmentDto, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        model: formData.model?.trim() || undefined,
        manufacturer: formData.manufacturer?.trim() || undefined,
        categoryId: formData.categoryId,
        serialNumber: formData.serialNumber?.trim() || undefined,
        photoUrl: formData.photoUrl?.trim() || undefined,
        status: formData.status,
        description: formData.description?.trim() || undefined,
      };

      if (equipment?.id) {
        await api.equipment.update(equipment.id, payload);
      } else {
        await api.equipment.create(payload);
      }
      onSave();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, photoUrl: e.target.value });
  };

  return (
    <DraggableModal
      title={equipment ? 'Редактировать оборудование' : 'Создать оборудование'}
      onClose={onCancel}
      size="large"
      hasChanges={hasChanges}
    >
      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3 className="form-section-title">Основная информация</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'input-error' : ''}
                placeholder="Название оборудования"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Категория *</label>
              {loadingCategories ? (
                <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Загрузка категорий...</div>
              ) : (
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  className={errors.categoryId ? 'input-error' : ''}
                >
                  <option value={0}>Выберите категорию</option>
                  {categoryOpts.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.path}
                    </option>
                  ))}
                </select>
              )}
              {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Модель</label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Модель оборудования"
              />
            </div>

            <div className="form-group">
              <label>Производитель</label>
              <input
                type="text"
                value={formData.manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Название производителя"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Серийный номер</label>
              <input
                type="text"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="SN123456789"
              />
            </div>

            <div className="form-group">
              <label>Статус *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
              >
                <option value="available">Доступно</option>
                <option value="in_use">В использовании</option>
                <option value="maintenance">На обслуживании</option>
                <option value="retired">Списано</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Фото и описание</h3>
          <div className="form-group">
            <label>URL фото</label>
            <input
              type="url"
              value={formData.photoUrl || ''}
              onChange={handlePhotoUrlChange}
              placeholder="https://example.com/photo.jpg"
            />
            {formData.photoUrl && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Описание оборудования..."
            />
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
