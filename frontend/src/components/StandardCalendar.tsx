/**
 * @file: StandardCalendar.tsx
 * @description: Стандартный календарь с вертикальной прокруткой. Месяцы располагаются друг под другом.
 * Мероприятия отображаются в виде цветных полосок. При наведении показывается всплывающее окно.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { api, type EventDto, type EventStatus, type StatusConfig } from '../services/api';
import './StandardCalendar.css';

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

// Цвета по умолчанию (будут переопределены из настроек)
const DEFAULT_STATUS_COLORS: Record<EventStatus, { bg: string; text: string }> = {
  draft: { bg: '#F1F5F9', text: '#64748B' },
  request: { bg: 'rgba(255, 140, 0, 0.15)', text: '#E67E00' },
  in_work: { bg: 'rgba(59, 130, 246, 0.15)', text: '#1e40af' },
  completed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#065f46' },
  canceled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#991b1b' },
};

interface StandardCalendarProps {
  onEventClick?: (event: EventDto) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventDto[]; // Мероприятия, которые начинаются в этот день
  dayIndex: number; // Индекс дня в общей сетке месяца (для grid-column)
}

interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarDay[][];
  allDays: CalendarDay[]; // Все дни месяца в плоском массиве для grid
  eventLayers?: Map<number, number>; // eventId -> layer для предотвращения наложений
}

interface EventTooltip {
  event: EventDto;
  x: number;
  y: number;
  barCenterX: number; // Центр колбаски по горизонтали для позиционирования стрелки
  barCenterY: number; // Центр колбаски по вертикали для позиционирования стрелки
}

export function StandardCalendar({ onEventClick }: StandardCalendarProps) {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusConfigs, setStatusConfigs] = useState<Map<string, StatusConfig>>(new Map());
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<EventTooltip | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDraggingTooltip, setIsDraggingTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; tooltipX: number; tooltipY: number } | null>(null);

  // Загрузка настроек статусов
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.settings.get();
        const configMap = new Map<string, StatusConfig>();
        settings.eventStatuses.forEach((config) => {
          configMap.set(config.code, config);
        });
        setStatusConfigs(configMap);
      } catch (e) {
        console.error('Failed to load status settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Получение цвета статуса
  const getStatusColor = useCallback(
    (status: EventStatus): { bg: string; text: string } => {
      const config = statusConfigs.get(status);
      if (config) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
          bg: isDark ? config.backgroundColorDark || config.backgroundColor : config.backgroundColor,
          text: isDark ? config.textColorDark || config.textColor : config.textColor,
        };
      }
      return DEFAULT_STATUS_COLORS[status];
    },
    [statusConfigs],
  );

  // Определение контрастного цвета текста (белый или черный)
  const getContrastTextColor = useCallback((bgColor: string): string => {
    // Для rgba цветов учитываем альфа-канал и смешиваем с фоном
    if (bgColor.includes('rgba')) {
      const rgbaMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1] || '0');
        const g = parseInt(rgbaMatch[2] || '0');
        const b = parseInt(rgbaMatch[3] || '0');
        const alpha = parseFloat(rgbaMatch[4] || '1');
        
        // Получаем цвет фона (белый для светлой темы, темный для темной)
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgR = isDark ? 18 : 255; // --bg-primary в темной/светлой теме
        const bgG = isDark ? 18 : 255;
        const bgB = isDark ? 18 : 255;
        
        // Смешиваем цвет с фоном с учетом альфа-канала
        const mixedR = Math.round(r * alpha + bgR * (1 - alpha));
        const mixedG = Math.round(g * alpha + bgG * (1 - alpha));
        const mixedB = Math.round(b * alpha + bgB * (1 - alpha));
        
        // Вычисляем яркость смешанного цвета
        const brightness = (mixedR * 299 + mixedG * 587 + mixedB * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
      }
    }
    
    // Для обычных hex/rgb цветов
    const rgbMatch = bgColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0] || '0');
      const g = parseInt(rgbMatch[1] || '0');
      const b = parseInt(rgbMatch[2] || '0');
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#FFFFFF';
    }
    
    // По умолчанию темный текст
    return '#000000';
  }, []);

  // Загрузка мероприятий
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 0);
      const data = await api.events.list({
        startFrom: startDate.toISOString(),
        endTo: endDate.toISOString(),
      });
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Алгоритм размещения полосок без наложений
  const calculateEventLayers = useCallback((monthDays: CalendarDay[]): Map<number, number> => {
    const eventLayers = new Map<number, number>(); // eventId -> layer (row)
    const dayOccupiedLayers: Map<number, Set<number>> = new Map(); // dayIndex -> Set<layer>

    // Получаем все мероприятия, которые начинаются в этом месяце
    const monthEvents: Array<{ event: EventDto; startDayIndex: number; endDayIndex: number }> = [];
    
    monthDays.forEach((day) => {
      day.events.forEach((event) => {
        const eventStart = new Date(event.startDate);
        eventStart.setHours(0, 0, 0, 0);
        const eventEnd = new Date(event.endDate);
        eventEnd.setHours(23, 59, 59, 999);
        const dayStart = new Date(day.date);
        dayStart.setHours(0, 0, 0, 0);

        if (eventStart.getTime() === dayStart.getTime()) {
          // Вычисляем индексы дней, которые покрывает мероприятие
          let endDayIndex = day.dayIndex;
          for (let i = day.dayIndex; i < monthDays.length; i++) {
            const checkDay = monthDays[i];
            if (!checkDay) break;
            const checkDayStart = new Date(checkDay.date);
            checkDayStart.setHours(0, 0, 0, 0);
            if (checkDayStart <= eventEnd) {
              endDayIndex = i;
            } else {
              break;
            }
          }
          monthEvents.push({
            event,
            startDayIndex: day.dayIndex,
            endDayIndex,
          });
        }
      });
    });

    // Сортируем мероприятия по длине (от длинных к коротким), затем по дате начала
    // Более длинные мероприятия будут размещены выше (низкий номер слоя)
    monthEvents.sort((a, b) => {
      const lengthA = a.endDayIndex - a.startDayIndex;
      const lengthB = b.endDayIndex - b.startDayIndex;
      // Сначала по длине (от длинных к коротким)
      if (lengthB !== lengthA) {
        return lengthB - lengthA;
      }
      // Если длина одинаковая, сортируем по дате начала
      return a.startDayIndex - b.startDayIndex;
    });

    // Размещаем мероприятия по слоям
    // Более длинные мероприятия получают более низкий номер слоя (выше на экране)
    monthEvents.forEach(({ event, startDayIndex, endDayIndex }) => {
      let assignedLayer = -1;

      // Ищем свободный слой
      for (let layer = 0; layer < 10; layer++) {
        let canPlace = true;
        // Проверяем, не занят ли этот слой в дни, которые покрывает мероприятие
        for (let dayIdx = startDayIndex; dayIdx <= endDayIndex; dayIdx++) {
          const occupiedLayers = dayOccupiedLayers.get(dayIdx);
          if (occupiedLayers && occupiedLayers.has(layer)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          assignedLayer = layer;
          // Помечаем слой как занятый для всех дней мероприятия
          for (let dayIdx = startDayIndex; dayIdx <= endDayIndex; dayIdx++) {
            if (!dayOccupiedLayers.has(dayIdx)) {
              dayOccupiedLayers.set(dayIdx, new Set());
            }
            dayOccupiedLayers.get(dayIdx)!.add(layer);
          }
          break;
        }
      }

      if (assignedLayer >= 0 && event.id) {
        eventLayers.set(event.id, assignedLayer);
      }
    });

    return eventLayers;
  }, []);

  // Генерация календарных месяцев
  const calendarMonths = useMemo((): CalendarMonth[] => {
    const months: CalendarMonth[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Генерируем 12 месяцев начиная с текущего
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0

      const weeks: CalendarDay[][] = [];
      let currentWeek: CalendarDay[] = [];
      let dayIndex = 0; // Общий индекс дня в сетке месяца

      // Пустые дни в начале месяца
      for (let j = 0; j < firstDayOfWeek; j++) {
        const prevDate = new Date(year, month, 1 - firstDayOfWeek + j);
        currentWeek.push({
          date: prevDate,
          isCurrentMonth: false,
          isToday: false,
          events: [],
          dayIndex: dayIndex++,
        });
      }

      // Дни месяца
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const isToday =
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();

        // Находим мероприятия, которые начинаются именно в этот день
        // (полоска будет растягиваться через несколько дней)
        const dayEvents = events.filter((event) => {
          const eventStart = new Date(event.startDate);
          eventStart.setHours(0, 0, 0, 0);
          return date.getTime() === eventStart.getTime();
        });

        currentWeek.push({
          date,
          isCurrentMonth: true,
          isToday,
          events: dayEvents,
          dayIndex: dayIndex++,
        });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Пустые дни в конце месяца
      if (currentWeek.length > 0) {
        const nextMonth = month + 1;
        let nextDay = 1;
        while (currentWeek.length < 7) {
          const nextDate = new Date(year, nextMonth, nextDay);
          currentWeek.push({
            date: nextDate,
            isCurrentMonth: false,
            isToday: false,
            events: [],
            dayIndex: dayIndex++,
          });
          nextDay++;
        }
        weeks.push(currentWeek);
      }

      // Создаем плоский массив всех дней для grid
      const allDays: CalendarDay[] = [];
      weeks.forEach((week) => {
        week.forEach((day) => {
          allDays.push(day);
        });
      });

      // Вычисляем слои для мероприятий, чтобы избежать наложений
      const eventLayers = calculateEventLayers(allDays);
      
      // Сохраняем информацию о слоях в структуре месяца
      months.push({ year, month, weeks, allDays, eventLayers });
    }

    return months;
  }, [currentDate, events, calculateEventLayers]);


  // Очистка timeout'ов при размонтировании
  useEffect(() => {
    return () => {
      if (showTooltipTimeoutRef.current) {
        clearTimeout(showTooltipTimeoutRef.current);
      }
      if (hideTooltipTimeoutRef.current) {
        clearTimeout(hideTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Обработка наведения на мероприятие
  const handleEventMouseEnter = useCallback(
    (event: EventDto, e: React.MouseEvent<HTMLDivElement>) => {
      // Отменяем скрытие, если оно было запланировано
      if (hideTooltipTimeoutRef.current) {
        clearTimeout(hideTooltipTimeoutRef.current);
        hideTooltipTimeoutRef.current = null;
      }
      
      setHoveredEventId(event.id || null);
      
      // Если tooltip уже показан для этого события, не обновляем позицию
      if (tooltip && tooltip.event.id === event.id && showTooltip) {
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const calendarRect = calendarRef.current?.getBoundingClientRect();
      if (calendarRect) {
        // Вычисляем центр колбаски для позиционирования стрелки
        const barCenterX = rect.left - calendarRect.left + rect.width / 2;
        const barCenterY = rect.top - calendarRect.top + rect.height / 2;
        
        // Начальная позиция tooltip (над колбаской)
        const x = barCenterX;
        const y = rect.top - calendarRect.top;
        
        // Сбрасываем ручную позицию при показе нового tooltip
        setTooltipPosition(null);
        
        setTooltip({
          event,
          x,
          y,
          barCenterX,
          barCenterY,
        });
        // Показываем tooltip с задержкой 500мс
        if (showTooltipTimeoutRef.current) {
          clearTimeout(showTooltipTimeoutRef.current);
        }
        showTooltipTimeoutRef.current = setTimeout(() => {
          setShowTooltip(true);
        }, 500);
      }
    },
    [tooltip, showTooltip],
  );

  const handleEventMouseLeave = useCallback(() => {
    setHoveredEventId(null);
    // Отменяем показ tooltip, если он еще не показан
    if (showTooltipTimeoutRef.current) {
      clearTimeout(showTooltipTimeoutRef.current);
      showTooltipTimeoutRef.current = null;
    }
    // Небольшая задержка перед скрытием, чтобы дать время перейти на tooltip
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current);
    }
    hideTooltipTimeoutRef.current = setTimeout(() => {
      // Скрываем tooltip только если курсор не на tooltip
      if (!isTooltipHovered) {
        setShowTooltip(false);
        setTooltip(null);
      }
    }, 100);
  }, [isTooltipHovered]);

  // Обработка наведения на сам tooltip
  const handleTooltipMouseEnter = useCallback(() => {
    setIsTooltipHovered(true);
    // Отменяем скрытие tooltip, если оно было запланировано
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current);
      hideTooltipTimeoutRef.current = null;
    }
    setShowTooltip(true);
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    // Не скрываем tooltip если идёт перетаскивание
    if (isDraggingTooltip) return;
    
    setIsTooltipHovered(false);
    // Скрываем tooltip когда курсор уходит с tooltip
    setShowTooltip(false);
    setTooltip(null);
    setTooltipPosition(null);
  }, [isDraggingTooltip]);

  // Начало перетаскивания tooltip за заголовок
  const handleTooltipTitleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tooltipRef.current) return;
    
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const calendarRect = calendarRef.current?.getBoundingClientRect();
    if (!calendarRect) return;
    
    setIsDraggingTooltip(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tooltipX: tooltipRect.left - calendarRect.left,
      tooltipY: tooltipRect.top - calendarRect.top,
    };
  }, []);

  // Обработка перетаскивания tooltip
  useEffect(() => {
    if (!isDraggingTooltip) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !calendarRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      
      const newX = dragStartRef.current.tooltipX + deltaX;
      const newY = dragStartRef.current.tooltipY + deltaY;
      
      setTooltipPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingTooltip(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTooltip]);

  // Позиционирование tooltip (автоматическое при показе или ручное при перетаскивании)
  useEffect(() => {
    if (tooltip && showTooltip && tooltipRef.current && calendarRef.current) {
      const tooltipEl = tooltipRef.current;
      const calendarEl = calendarRef.current;
      
      // Если tooltip перетаскивается или уже был перемещён вручную, используем ручную позицию
      if (tooltipPosition) {
        tooltipEl.style.left = `${tooltipPosition.x}px`;
        tooltipEl.style.top = `${tooltipPosition.y}px`;
        tooltipEl.style.right = 'auto';
        tooltipEl.style.transform = 'none';
        // Скрываем стрелку при ручном перемещении
        tooltipEl.classList.remove('tooltip-arrow-left', 'tooltip-arrow-right');
        tooltipEl.classList.add('tooltip-no-arrow');
        return;
      }
      
      // Используем requestAnimationFrame для правильного позиционирования после рендера
      requestAnimationFrame(() => {
        if (!tooltipEl || !calendarEl) return;
        
        const tooltipRect = tooltipEl.getBoundingClientRect();

        // Позиционируем tooltip справа от колбаски
        // Стрелка слева будет указывать на центр колбаски по высоте
        const arrowSize = 8;
        const gap = 4; // Отступ между колбаской и стрелкой
        
        let x = tooltip.barCenterX + gap + arrowSize; // Слева tooltip (стрелка будет указывать влево)
        let y = tooltip.barCenterY - tooltipRect.height / 2; // Центрируем по вертикали относительно центра колбаски
        
        // Проверка выхода за правую границу календаря
        const calendarWidth = calendarEl.scrollWidth;
        if (x + tooltipRect.width > calendarWidth) {
          // Если не помещается справа, показываем слева от колбаски
          x = tooltip.barCenterX - tooltipRect.width - gap - arrowSize;
          tooltipEl.classList.add('tooltip-arrow-right');
          tooltipEl.classList.remove('tooltip-arrow-left');
        } else {
          tooltipEl.classList.add('tooltip-arrow-left');
          tooltipEl.classList.remove('tooltip-arrow-right');
        }
        tooltipEl.classList.remove('tooltip-no-arrow');
        
        // Проверка выхода за верхнюю границу
        if (y < 0) {
          y = 8;
        }
        
        // Проверка выхода за нижнюю границу
        const calendarHeight = calendarEl.scrollHeight;
        if (y + tooltipRect.height > calendarHeight) {
          y = calendarHeight - tooltipRect.height - 8;
        }

        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.right = 'auto';
        tooltipEl.style.top = `${y}px`;
        tooltipEl.style.transform = 'none';
        
        // Вычисляем смещение стрелки по вертикали, чтобы она указывала точно на центр колбаски
        const tooltipCenterY = y + tooltipRect.height / 2;
        const arrowOffsetY = tooltip.barCenterY - tooltipCenterY;
        tooltipEl.style.setProperty('--arrow-offset-y', `${arrowOffsetY}px`);
      });
    }
  }, [tooltip, showTooltip, tooltipPosition]);

  const formatMonthName = (year: number, month: number): string => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const formatEventTime = (event: EventDto): string => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startStr = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} – ${endStr}`;
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="standard-calendar" ref={calendarRef}>
      {loading && events.length === 0 ? (
        <div className="calendar-loading">
          <div className="empty-state">Загрузка мероприятий...</div>
        </div>
      ) : (
        <div className="calendar-container">
          {calendarMonths.map((month, monthIdx) => (
            <div key={`${month.year}-${month.month}`} className="calendar-month">
              <h2 className="calendar-month-title">
                {formatMonthName(month.year, month.month)}
              </h2>
              <div className="calendar-grid">
                {/* Заголовки дней недели */}
                <div 
                  className="calendar-weekdays"
                  style={{
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  } as React.CSSProperties}
                >
                  {weekDays.map((day) => (
                    <div key={day} className="calendar-weekday">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Все дни месяца в одной сетке */}
                <div 
                  className="calendar-days-grid"
                  style={{
                    gridTemplateRows: `repeat(${Math.ceil(month.allDays.length / 7)}, 120px)`,
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  } as React.CSSProperties}
                >
                  {month.allDays.map((day, dayIdx) => {
                    const dayKey = `${month.year}-${month.month}-${day.date.getDate()}-${dayIdx}`;
                    return (
                      <div
                        key={dayKey}
                        className={`calendar-day ${day.isCurrentMonth ? '' : 'calendar-day-other-month'} ${day.isToday ? 'calendar-day-today' : ''}`}
                      >
                        <div className="calendar-day-number">{day.date.getDate()}</div>
                        <div className="calendar-day-events">
                          {day.events.map((event) => {
                            const statusColor = getStatusColor(event.status as EventStatus);
                            const textColor = getContrastTextColor(statusColor.bg);
                            const isHovered = hoveredEventId === event.id;
                            const isDimmed = hoveredEventId !== null && hoveredEventId !== event.id;
                            
                            // Вычисляем количество дней для растягивания полоски
                            const eventStart = new Date(event.startDate);
                            eventStart.setHours(0, 0, 0, 0);
                            const eventEnd = new Date(event.endDate);
                            eventEnd.setHours(23, 59, 59, 999);
                            const dayStart = new Date(day.date);
                            dayStart.setHours(0, 0, 0, 0);
                            
                            // Вычисляем длительность мероприятия в днях
                            let spanDays = 1;
                            
                            // Вычисляем количество дней для растягивания полоски
                            // Если мероприятие начинается в этот день, растягиваем до конца мероприятия в пределах месяца
                            if (eventStart.getTime() === dayStart.getTime()) {
                              // Вычисляем количество дней до конца мероприятия в пределах этого месяца
                              let daysInMonth = 0;
                              for (let i = day.dayIndex; i < month.allDays.length; i++) {
                                const checkDay = month.allDays[i];
                                if (!checkDay) break;
                                const checkDayStart = new Date(checkDay.date);
                                checkDayStart.setHours(0, 0, 0, 0);
                                // Проверяем, попадает ли день в период мероприятия
                                if (checkDayStart >= eventStart && checkDayStart <= eventEnd) {
                                  daysInMonth++;
                                } else if (checkDayStart > eventEnd) {
                                  // Если день выходит за пределы мероприятия, прекращаем подсчет
                                  break;
                                }
                              }
                              spanDays = Math.max(1, daysInMonth);
                              
                              // Полоски могут растягиваться через несколько недель и до конца месяца
                            }

                            // Получаем слой для этого мероприятия (для предотвращения наложений)
                            const layer = month.eventLayers?.get(event.id || -1) || 0;
                            // Высота полоски (20px min-height) + gap (4px = 0.25rem)
                            const eventBarHeight = 20;
                            const gapBetweenBars = 4; // 0.25rem = 4px
                            const topOffset = layer * (eventBarHeight + gapBetweenBars);

                            const style: React.CSSProperties = {
                              backgroundColor: statusColor.bg,
                              color: textColor,
                              position: 'relative',
                            };

                            // Если мероприятие длится больше одного дня, растягиваем полоску
                            if (spanDays > 1) {
                              style.position = 'absolute';
                              style.left = '0';
                              // Ширина = количество дней * 100% + отступы между ячейками (2px на каждую границу)
                              style.width = `calc(${spanDays * 100}% + ${(spanDays - 1) * 4}px)`;
                              style.top = `${topOffset}px`;
                              style.zIndex = 2;
                            }

                            return (
                              <div
                                key={event.id}
                                className={`calendar-event-bar ${isHovered ? 'calendar-event-bar-hovered' : ''} ${isDimmed ? 'calendar-event-bar-dimmed' : ''}`}
                                style={style}
                                onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                                onMouseLeave={handleEventMouseLeave}
                                onClick={() => onEventClick?.(event)}
                                title={event.title}
                              >
                                <span className="calendar-event-title">{event.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Всплывающее окно с информацией о мероприятии */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className={`calendar-event-tooltip ${showTooltip ? 'calendar-event-tooltip-visible' : 'calendar-event-tooltip-hidden'} ${isDraggingTooltip ? 'calendar-event-tooltip-dragging' : ''}`}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div 
            className="calendar-event-tooltip-title calendar-event-tooltip-draggable"
            onMouseDown={handleTooltipTitleMouseDown}
          >
            {tooltip.event.title}
          </div>
          <div className="calendar-event-tooltip-status">
            {STATUS_LABELS[tooltip.event.status as EventStatus]}
          </div>
          <div className="calendar-event-tooltip-time">
            Начало: {new Date(tooltip.event.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="calendar-event-tooltip-time">
            Окончание: {new Date(tooltip.event.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {tooltip.event.description && (
            <div className="calendar-event-tooltip-description">{tooltip.event.description}</div>
          )}
        </div>
      )}
    </div>
  );
}
