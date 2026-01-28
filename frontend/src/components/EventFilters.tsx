/**
 * @file: EventFilters.tsx
 * @description: Advanced search and filters for events.
 * @dependencies: services/api.ts
 * @created: 2026-01-26
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { EventFilters as EventFiltersType, Client, Venue } from '../services/api';
import { DatePicker } from './DatePicker';

interface EventFiltersProps {
  filters: EventFiltersType;
  onChange: (filters: EventFiltersType) => void;
  onReset: () => void;
}

export function EventFilters({ filters, onChange, onReset }: EventFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, venuesData] = await Promise.all([
          api.clients.list(),
          api.venues.list(),
        ]);
        setClients(clientsData);
        setVenues(venuesData);
      } catch (error) {
        console.error('Failed to load clients/venues:', error);
      }
    };
    loadData();
  }, []);

  const updateFilter = (key: keyof EventFiltersType, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.status ||
      filters.startFrom ||
      filters.endTo ||
      filters.clientId ||
      filters.venueId ||
      filters.q ||
      filters.minBudget ||
      filters.maxBudget
    );
  };

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <div className="filters-title">
          <span>Фильтры</span>
          {hasActiveFilters() && <span className="filter-badge">{Object.keys(filters).filter(k => filters[k as keyof EventFiltersType]).length}</span>}
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
                placeholder="Название или описание..."
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
                <option value="draft">Черновик</option>
                <option value="request">Запрос</option>
                <option value="in_work">В работе</option>
                <option value="completed">Завершено</option>
                <option value="canceled">Отменено</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Дата начала (от)</label>
              <DatePicker
                value={filters.startFrom ? (filters.startFrom.includes('T') ? filters.startFrom.split('T')[0] : filters.startFrom) : ''}
                onChange={(value) => updateFilter('startFrom', value ? `${value}T00:00:00Z` : undefined)}
                placeholder="Выберите дату"
                max={filters.endTo ? (filters.endTo.includes('T') ? filters.endTo.split('T')[0] : filters.endTo) : undefined}
              />
            </div>

            <div className="filter-group">
              <label>Дата окончания (до)</label>
              <DatePicker
                value={filters.endTo ? (filters.endTo.includes('T') ? filters.endTo.split('T')[0] : filters.endTo) : ''}
                onChange={(value) => updateFilter('endTo', value ? `${value}T23:59:59Z` : undefined)}
                placeholder="Выберите дату"
                min={filters.startFrom ? (filters.startFrom.includes('T') ? filters.startFrom.split('T')[0] : filters.startFrom) : undefined}
              />
            </div>

            <div className="filter-group">
              <label>Клиент</label>
              <select
                value={filters.clientId || ''}
                onChange={(e) => updateFilter('clientId', e.target.value ? Number(e.target.value) : undefined)}
                className="select"
              >
                <option value="">Все</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Площадка</label>
              <select
                value={filters.venueId || ''}
                onChange={(e) => updateFilter('venueId', e.target.value ? Number(e.target.value) : undefined)}
                className="select"
              >
                <option value="">Все</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Бюджет от (₽)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={filters.minBudget || ''}
                onChange={(e) => updateFilter('minBudget', e.target.value ? Number(e.target.value) : undefined)}
                className="input"
              />
            </div>

            <div className="filter-group">
              <label>Бюджет до (₽)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={filters.maxBudget || ''}
                onChange={(e) => updateFilter('maxBudget', e.target.value ? Number(e.target.value) : undefined)}
                className="input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
