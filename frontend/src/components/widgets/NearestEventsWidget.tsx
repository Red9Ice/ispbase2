/**
 * @file: NearestEventsWidget.tsx
 * @description: Виджет ближайших событий
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import type { WidgetProps } from '../../types/widgets';
import type { EventDto } from '../../services/api';
import { formatDate } from '../../utils/format';
import './NearestEventsWidget.css';

interface NearestEventsWidgetProps extends WidgetProps {
  events?: EventDto[];
  onEventClick?: (eventId: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

export function NearestEventsWidget({ events = [], onEventClick }: NearestEventsWidgetProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Получаем уникальные статусы из событий
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    events.forEach((event) => {
      if (event.status) {
        statuses.add(event.status);
      }
    });
    return Array.from(statuses).sort();
  }, [events]);

  // Фильтруем события по выбранному статусу
  const filteredEvents = useMemo(() => {
    if (!selectedStatus) {
      return events;
    }
    return events.filter((event) => event.status === selectedStatus);
  }, [events, selectedStatus]);

  if (events.length === 0) {
    return (
      <div className="nearest-events-widget">
        <div className="empty-state">Нет событий</div>
      </div>
    );
  }

  return (
    <div className="nearest-events-widget">
      {availableStatuses.length > 0 && (
        <div className="events-filters">
          <button
            className={`filter-btn ${selectedStatus === null ? 'active' : ''}`}
            onClick={() => setSelectedStatus(null)}
            title="Все события"
          >
            Все
          </button>
          {availableStatuses.map((status) => (
            <button
              key={status}
              className={`filter-btn tag ${status} ${selectedStatus === status ? 'active' : ''}`}
              onClick={() => setSelectedStatus(status)}
              title={STATUS_LABELS[status] ?? status}
            >
              {STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="empty-state">Нет событий с выбранным статусом</div>
      ) : (
        <div className="events-list">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="event-item"
              onClick={() => event.id && onEventClick?.(event.id)}
            >
              <div className="event-title">{event.title}</div>
              <div className="event-meta">
                <span className={`event-status tag ${event.status}`}>
                  {STATUS_LABELS[event.status] ?? event.status}
                </span>
                <span className="event-date">{formatDate(event.startDate)}</span>
              </div>
              {event.contractPrice && (
                <div className="event-budget">
                  {(event.contractPrice || 0).toLocaleString('ru-RU')} ₽
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
