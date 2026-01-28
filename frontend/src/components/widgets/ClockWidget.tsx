/**
 * @file: ClockWidget.tsx
 * @description: Виджет часов
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import type { WidgetProps } from '../../types/widgets';
import './ClockWidget.css';

export function ClockWidget({}: WidgetProps) {
  const [time, setTime] = useState(new Date());
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      setDate(now);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="clock-widget">
      <div className="clock-time">{formatTime(time)}</div>
      <div className="clock-date">{formatDate(date)}</div>
    </div>
  );
}
