/**
 * @file: EquipmentShipmentsTab.tsx
 * @description: Вкладка календаря для отображения отправок оборудования по мероприятиям.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo } from 'react';
import { api, type EquipmentMovementDto, type EventDto, type EquipmentDto } from '../services/api';
import { formatDateTime } from '../utils/format';
import './EquipmentShipmentsTab.css';

interface ShipmentRow {
  movement: EquipmentMovementDto;
  event?: EventDto;
  equipment?: EquipmentDto;
}

export function EquipmentShipmentsTab() {
  const [movements, setMovements] = useState<EquipmentMovementDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsData, eventsData, equipmentData] = await Promise.all([
        api.equipmentMovements.list(),
        api.events.list(),
        api.equipment.list(),
      ]);
      setMovements(movementsData);
      setEvents(eventsData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const shipments: ShipmentRow[] = useMemo(() => {
    const eventMap = new Map(events.map((e) => [e.id, e]));
    const equipmentMap = new Map(equipment.map((e) => [e.id, e]));

    return movements
      .filter((m) => m.eventId && m.movementType === 'out')
      .map((movement) => ({
        movement,
        event: movement.eventId ? eventMap.get(movement.eventId) : undefined,
        equipment: equipmentMap.get(movement.equipmentId),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.movement.movedAt).getTime();
        const dateB = new Date(b.movement.movedAt).getTime();
        return dateB - dateA;
      });
  }, [movements, events, equipment]);

  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;

    const query = searchQuery.toLowerCase();
    return shipments.filter((row) => {
      const eventTitle = row.event?.title.toLowerCase() || '';
      const equipmentName = row.equipment?.name.toLowerCase() || '';
      const toLocation = row.movement.toLocation?.toLowerCase() || '';
      return (
        eventTitle.includes(query) ||
        equipmentName.includes(query) ||
        toLocation.includes(query)
      );
    });
  }, [shipments, searchQuery]);

  if (loading) {
    return (
      <div className="shipments-loading">
        <div className="empty-state">Загрузка отправок оборудования...</div>
      </div>
    );
  }

  return (
    <div className="equipment-shipments-tab">
      <div className="shipments-header">
        <div className="shipments-search">
          <input
            type="text"
            placeholder="Поиск по мероприятию, оборудованию или месту назначения..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shipments-search-input"
          />
        </div>
        <div className="shipments-stats">
          Всего отправок: {filteredShipments.length}
        </div>
      </div>

      {filteredShipments.length === 0 ? (
        <div className="shipments-empty">
          <div className="empty-state">
            {searchQuery ? 'Отправки не найдены' : 'Нет отправок оборудования'}
          </div>
        </div>
      ) : (
        <div className="shipments-table-wrapper">
          <table className="shipments-table">
            <thead>
              <tr>
                <th>Дата отправки</th>
                <th>Мероприятие</th>
                <th>Оборудование</th>
                <th>Откуда</th>
                <th>Куда</th>
                <th>Примечания</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((row) => (
                <tr key={row.movement.id} className="shipments-row">
                  <td className="shipments-date">
                    {formatDateTime(row.movement.movedAt)}
                  </td>
                  <td className="shipments-event">
                    {row.event ? (
                      <span className="event-link" title={row.event.description}>
                        {row.event.title}
                      </span>
                    ) : (
                      <span className="text-muted">Мероприятие не найдено</span>
                    )}
                  </td>
                  <td className="shipments-equipment">
                    {row.equipment ? (
                      <span title={row.equipment.description || ''}>
                        {row.equipment.name}
                        {row.equipment.model && ` (${row.equipment.model})`}
                      </span>
                    ) : (
                      <span className="text-muted">Оборудование не найдено</span>
                    )}
                  </td>
                  <td className="shipments-from">
                    {row.movement.fromLocation || '-'}
                  </td>
                  <td className="shipments-to">
                    <strong>{row.movement.toLocation || '-'}</strong>
                  </td>
                  <td className="shipments-notes">
                    {row.movement.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
