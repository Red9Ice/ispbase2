/**
 * @file: EquipmentFilters.tsx
 * @description: Фильтры для поиска и фильтрации оборудования на складе.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { EquipmentStatus, EquipmentCategoryDto } from '../services/api';
import { categoryOptions } from '../utils/categoryTree';

export interface EquipmentFilters {
  status?: EquipmentStatus;
  categoryId?: number;
  q?: string;
  manufacturer?: string;
}

interface EquipmentFiltersProps {
  filters: EquipmentFilters;
  onChange: (filters: EquipmentFilters) => void;
  onReset: () => void;
}

export function EquipmentFilters({ filters, onChange, onReset }: EquipmentFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<EquipmentCategoryDto[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.equipmentCategories.list();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const categoryOpts = useMemo(() => categoryOptions(categories), [categories]);

  const updateFilter = (key: keyof EquipmentFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.status ||
      filters.categoryId ||
      filters.q ||
      filters.manufacturer
    );
  };

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <div className="filters-title">
          <span>Фильтры</span>
          {hasActiveFilters() && <span className="filter-badge">{Object.keys(filters).filter(k => filters[k as keyof EquipmentFilters]).length}</span>}
        </div>
        <div className="filters-actions">
          {hasActiveFilters() && (
            <button onClick={onReset} className="button-link">
              Сбросить
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="button-link">
            {expanded ? 'Свернуть' : 'Развернуть'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Поиск по тексту</label>
              <input
                type="text"
                placeholder="Название, модель, серийный номер..."
                value={filters.q || ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                className="input"
              />
            </div>

            <div className="filter-group">
              <label>Статус</label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value || undefined)}
                className="select"
              >
                <option value="">Все</option>
                <option value="available">Доступно</option>
                <option value="in_use">В использовании</option>
                <option value="maintenance">На обслуживании</option>
                <option value="retired">Списано</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Категория</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => updateFilter('categoryId', e.target.value ? Number(e.target.value) : undefined)}
                className="select"
              >
                <option value="">Все</option>
                {categoryOpts.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.path}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Производитель</label>
              <input
                type="text"
                placeholder="Название производителя..."
                value={filters.manufacturer || ''}
                onChange={(e) => updateFilter('manufacturer', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
