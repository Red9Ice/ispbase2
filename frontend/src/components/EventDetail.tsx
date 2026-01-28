/**
 * @file: EventDetail.tsx
 * @description: Detailed view for a single event.
 * @dependencies: services/api.ts
 * @created: 2026-01-26
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { EventDto, Client, Venue } from '../services/api';
import { DraggableModal } from './DraggableModal';
import { ConfirmDialog } from './ConfirmDialog';

interface EventDetailProps {
  eventId: number;
  onClose: () => void;
  onEdit: (event: EventDto) => void;
  onDelete?: () => void;
}

export function EventDetail({ eventId, onClose, onEdit, onDelete }: EventDetailProps) {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const eventData = await api.events.getById(eventId);
        setEvent(eventData);

        const [clientData, venueData] = await Promise.all([
          api.clients.getById(eventData.clientId).catch(() => null),
          api.venues.getById(eventData.venueId).catch(() => null),
        ]);
        setClient(clientData);
        setVenue(venueData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить мероприятие');
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  const handleDelete = async () => {
    if (!event) {
      return;
    }

    setDeleting(true);
    try {
      await api.events.delete(event.id!);
      // Анимация удаления элемента из списка
      const rowElement = document.querySelector(`[data-event-id="${event.id}"]`);
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
      alert(err instanceof Error ? err.message : 'Ошибка при удалении');
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

  if (error || !event) {
    return (
      <DraggableModal title="Ошибка" onClose={onClose}>
        <p>{error || 'Мероприятие не найдено'}</p>
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

  const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    request: 'Запрос',
    in_work: 'В работе',
    completed: 'Завершено',
    canceled: 'Отменено',
  };

  return (
    <DraggableModal title={event.title} onClose={onClose} size="large">
      <div className="detail-section">
        <h3 className="detail-section-title">Основная информация</h3>
        <div className="detail-row">
          <div className="detail-label">Статус</div>
          <div className="detail-value">
            <span className={`tag ${event.status}`}>{statusLabels[event.status] || event.status}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-label">Дата начала</div>
          <div className="detail-value">{formatDate(event.startDate)}</div>
        </div>

        <div className="detail-row">
          <div className="detail-label">Дата окончания</div>
          <div className="detail-value">{formatDate(event.endDate)}</div>
        </div>

        {event.description && (
          <div className="detail-row">
            <div className="detail-label">Описание</div>
            <div className="detail-value">{event.description}</div>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Клиент и площадка</h3>
        <div className="detail-row">
          <div className="detail-label">Клиент</div>
          <div className="detail-value">
                {client ? (
                  <div>
                    <div>{client.name}</div>
                    {client.contactName && <div className="detail-subtext">Контакт: {client.contactName}</div>}
                    {client.email && <div className="detail-subtext">Email: {client.email}</div>}
                    {client.phone && <div className="detail-subtext">Телефон: {client.phone}</div>}
                  </div>
                ) : (
                  <span className="detail-subtext">Не найден</span>
                )}
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-label">Площадка</div>
          <div className="detail-value">
                {venue ? (
                  <div>
                    <div>{venue.name}</div>
                    {venue.address && <div className="detail-subtext">Адрес: {venue.address}</div>}
                    {venue.capacity && <div className="detail-subtext">Вместимость: {venue.capacity}</div>}
                    {venue.contactName && <div className="detail-subtext">Контакт: {venue.contactName}</div>}
                    {venue.phone && <div className="detail-subtext">Телефон: {venue.phone}</div>}
                  </div>
                ) : (
                  <span className="detail-subtext">Не найдена</span>
                )}
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Бюджет</h3>
        <div className="detail-row">
          <div className="detail-label">Планируемый бюджет</div>
          <div className="detail-value">
            {(event.contractPrice || 0).toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-label">Фактический бюджет</div>
          <div className="detail-value">
            {event.budgetActual.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      {(event.createdAt || event.updatedAt) && (
        <div className="detail-section">
          <h3 className="detail-section-title">Метаданные</h3>
          {event.createdAt && (
            <div className="detail-row">
              <div className="detail-label">Создано</div>
              <div className="detail-value">{formatDate(event.createdAt)}</div>
            </div>
          )}

          {event.updatedAt && (
            <div className="detail-row">
              <div className="detail-label">Обновлено</div>
              <div className="detail-value">{formatDate(event.updatedAt)}</div>
            </div>
          )}
        </div>
      )}

      <div className="detail-actions">
        <button onClick={() => onEdit(event)} className="button-primary">
          Редактировать
        </button>
        <button onClick={handleDeleteClick} disabled={deleting} className="button-danger">
          {deleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удаление мероприятия"
        message={`Вы уверены, что хотите удалить мероприятие "${event?.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </DraggableModal>
  );
}
