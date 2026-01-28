/**
 * @file: CalendarPage.tsx
 * @description: Календарь с вкладками для мероприятий и отправок оборудования.
 * @dependencies: StandardCalendar.tsx, EquipmentShipmentsTab.tsx
 * @created: 2026-01-27
 */

import { useState } from 'react';
import { StandardCalendar } from './StandardCalendar';
import { EquipmentShipmentsTab } from './EquipmentShipmentsTab';
import type { EventDto } from '../services/api';
import './CalendarPage.css';

type CalendarTab = 'events' | 'shipments';

interface CalendarPageProps {
  onEventClick?: (event: EventDto) => void;
}

export function CalendarPage({ onEventClick }: CalendarPageProps) {
  const [activeTab, setActiveTab] = useState<CalendarTab>('events');

  return (
    <div className="calendar-page">
      <div className="calendar-tabs">
        <button
          className={`calendar-tab ${activeTab === 'events' ? 'calendar-tab-active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Мероприятия
        </button>
        <button
          className={`calendar-tab ${activeTab === 'shipments' ? 'calendar-tab-active' : ''}`}
          onClick={() => setActiveTab('shipments')}
        >
          Отправки оборудования
        </button>
      </div>

      <div className="calendar-content">
        {activeTab === 'events' && <StandardCalendar onEventClick={onEventClick} />}
        {activeTab === 'shipments' && <EquipmentShipmentsTab />}
      </div>
    </div>
  );
}
