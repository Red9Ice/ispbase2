/**
 * @file: EventsTableView.tsx
 * @description: Компонент табличного календаря мероприятий (плитки по дням недели)
 * @dependencies: services/api.ts, EventBar.tsx
 * @created: 2026-01-28
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EventDto } from '../services/api';
import { EventBar } from './EventBar';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAYS_OF_WEEK_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface EventsTableViewProps {
  events: EventDto[];
  loading: boolean;
  onEventClick: (event: EventDto) => void;
  /** При указании тулбар рендерится в этот DOM‑элемент (например, в sticky‑header) */
  toolbarPortalTargetId?: string;
}

interface WeekEvent {
  event: EventDto;
  row: number;
  startDay: number; // Индекс дня начала (0-6)
  endDay: number; // Индекс дня окончания (0-6)
  startOffset: number; // Смещение от начала дня в процентах (0-100)
  endOffset: number; // Смещение от конца дня в процентах (0-100)
}

interface WeekRow {
  startDate: Date;
  days: Date[];
  weekEvents: WeekEvent[]; // События недели с информацией о позиционировании
  dayEventCounts: number[]; // Количество событий в каждом дне (для кнопки "+N ещё")
  expanded: boolean[];
}

interface MonthData {
  year: number;
  month: number;
  monthName: string;
  weeks: WeekRow[];
}

export function EventsTableView({ events, loading, onEventClick, toolbarPortalTargetId }: EventsTableViewProps) {
  const [centerDate, setCenterDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredEventId, setHoveredEventId] = useState<number | undefined>(undefined);
  const [tooltipEvent, setTooltipEvent] = useState<{ event: EventDto; x: number; y: number } | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Количество месяцев для отображения (в прошлое и будущее)
  const MONTHS_TO_SHOW = 12; // 6 месяцев в прошлое и 6 в будущее

  // Позиционирование tooltip - фиксированная позиция относительно мышки
  useEffect(() => {
    if (!tooltipEvent || !tooltipRef.current) return;

    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;

    // Центрируем относительно мышки, позиция не меняется
    tooltipEl.style.left = `${tooltipEvent.x}px`;
    tooltipEl.style.right = 'auto';
    tooltipEl.style.transform = 'translate(-50%, -100%)';
    tooltipEl.classList.remove('tooltip-aligned-right');
  }, [tooltipEvent]);

  // Проверка, является ли день выходным
  const isWeekend = useCallback((date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // Воскресенье или суббота
  }, []);

  // Проверка, является ли день праздничным (упрощенная версия)
  const isHoliday = useCallback((date: Date): boolean => {
    // Здесь можно добавить проверку праздничных дней
    // Пока возвращаем false
    return false;
  }, []);

  // Генерация месяцев для отображения
  const months = useMemo(() => {
    const monthsList: MonthData[] = [];
    const centerYear = centerDate.getFullYear();
    const centerMonth = centerDate.getMonth();
    
    // Генерируем месяцы (в прошлое и будущее от центрального)
    const startMonthOffset = -Math.floor(MONTHS_TO_SHOW / 2);
    
    for (let m = 0; m < MONTHS_TO_SHOW; m++) {
      const monthOffset = startMonthOffset + m;
      const monthDate = new Date(centerYear, centerMonth + monthOffset, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const monthName = monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      
      // Находим первый день месяца
      const firstDay = new Date(year, month, 1);
      // Находим первый понедельник (может быть в предыдущем месяце)
      const start = new Date(firstDay);
      while (start.getDay() !== 1) {
        start.setDate(start.getDate() - 1);
      }
      
      const weeks: WeekRow[] = [];
      const monthEnd = new Date(year, month + 1, 0);
      
      // Генерируем недели до конца месяца
      let weekStart = new Date(start);
      while (weekStart <= monthEnd || weekStart.getMonth() === month) {
        const days: Date[] = [];
        for (let d = 0; d < 7; d++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + d);
          days.push(day);
        }

        // Находим все события, которые попадают в эту неделю
        const weekStartTime = days[0]!.getTime();
        const weekEndTime = new Date(days[6]!);
        weekEndTime.setHours(23, 59, 59, 999);
        const weekEndTimeValue = weekEndTime.getTime();

        const weekEvents = events
          .filter((event) => {
            const eventStart = new Date(event.startDate).getTime();
            const eventEnd = new Date(event.endDate).getTime();
            return eventStart <= weekEndTimeValue && eventEnd >= weekStartTime;
          })
          .sort((a, b) => {
            const startA = new Date(a.startDate).getTime();
            const startB = new Date(b.startDate).getTime();
            if (startA !== startB) return startA - startB;
            const durationA = new Date(a.endDate).getTime() - startA;
            const durationB = new Date(b.endDate).getTime() - startB;
            return durationB - durationA; // Более длинные первыми при одинаковом начале
          });

        // Распределяем события по строкам (rows), учитывая пересечения
        const rows: EventDto[][] = [];
        const weekEventData: WeekEvent[] = [];

        weekEvents.forEach((event) => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          const eventStartTime = eventStart.getTime();
          const eventEndTime = eventEnd.getTime();

          // Определяем, в каких днях недели находится событие
          let startDay = 0;
          let endDay = 6;
          let startOffset = 0;
          let endOffset = 100;

          for (let i = 0; i < 7; i++) {
            const day = days[i]!;
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            const dayStartTime = dayStart.getTime();
            const dayEndTime = dayEnd.getTime();

            if (eventStartTime >= dayStartTime && eventStartTime <= dayEndTime) {
              startDay = i;
              const dayDuration = dayEndTime - dayStartTime;
              const offsetFromDayStart = eventStartTime - dayStartTime;
              startOffset = (offsetFromDayStart / dayDuration) * 100;
            }

            if (eventEndTime >= dayStartTime && eventEndTime <= dayEndTime) {
              endDay = i;
              const dayDuration = dayEndTime - dayStartTime;
              const offsetFromDayStart = eventEndTime - dayStartTime;
              endOffset = (offsetFromDayStart / dayDuration) * 100;
            }
          }

          // Находим строку, где можно разместить событие
          let rowIndex = -1;
          for (let r = 0; r < rows.length; r++) {
            const canPlace = rows[r]!.every((existingEvent) => {
              const existingStart = new Date(existingEvent.startDate).getTime();
              const existingEnd = new Date(existingEvent.endDate).getTime();
              // События не пересекаются
              return eventEndTime < existingStart || eventStartTime > existingEnd;
            });

            if (canPlace) {
              rowIndex = r;
              break;
            }
          }

          if (rowIndex === -1) {
            rowIndex = rows.length;
            rows.push([]);
          }

          rows[rowIndex]!.push(event);
          weekEventData.push({
            event,
            row: rowIndex,
            startDay,
            endDay,
            startOffset,
            endOffset,
          });
        });

        // Подсчитываем количество событий в каждом дне (для кнопки "+N ещё")
        const dayEventCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
        const maxVisibleRows = 5; // Максимум 5 видимых строк на день
        
        // Подсчитываем, сколько событий проходит через каждый день
        weekEventData.forEach((weekEvent) => {
          for (let day = weekEvent.startDay; day <= weekEvent.endDay; day++) {
            dayEventCounts[day]++;
          }
        });

        weeks.push({
          startDate: new Date(weekStart),
          days,
          weekEvents: weekEventData,
          dayEventCounts,
          expanded: [false, false, false, false, false, false, false],
        });
        
        // Переходим к следующей неделе
        weekStart.setDate(weekStart.getDate() + 7);
        
        // Если неделя полностью выходит за пределы месяца, прекращаем
        if (weekStart > monthEnd && weekStart.getMonth() !== month) {
          break;
        }
      }
      
      monthsList.push({
        year,
        month,
        monthName,
        weeks,
      });
    }

    return monthsList;
  }, [events, centerDate]);

  const handleToday = () => {
    const today = new Date();
    setCenterDate(new Date(today.getFullYear(), today.getMonth(), 1));
    // Прокручиваем к текущему месяцу
    setTimeout(() => {
      if (containerRef.current) {
        const todayMonthIndex = Math.floor(MONTHS_TO_SHOW / 2);
        const monthElement = containerRef.current.querySelector(`[data-month-index="${todayMonthIndex}"]`);
        if (monthElement) {
          monthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const handleExpandRow = (monthIndex: number, weekIndex: number, dayIndex: number) => {
    const key = `${monthIndex}-${weekIndex}-${dayIndex}`;
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getEventPosition = (event: EventDto, day: Date) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    if (eventStart > dayEnd || eventEnd < dayStart) {
      return null;
    }

    const startInDay = eventStart > dayStart ? eventStart : dayStart;
    const endInDay = eventEnd < dayEnd ? eventEnd : dayEnd;
    
    const dayStartTime = dayStart.getTime();
    const dayEndTime = dayEnd.getTime();
    const startTime = startInDay.getTime();
    const endTime = endInDay.getTime();

    const left = ((startTime - dayStartTime) / (dayEndTime - dayStartTime)) * 100;
    const width = ((endTime - startTime) / (dayEndTime - dayStartTime)) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const toolbar = (
    <div className="events-table-toolbar events-table-toolbar-sticky">
      <button className="button-secondary" type="button" onClick={handleToday}>
        Сегодня
      </button>
    </div>
  );
  const portalTarget = typeof document !== 'undefined' && toolbarPortalTargetId
    ? document.getElementById(toolbarPortalTargetId)
    : null;

  return (
    <div className="events-table-view">
      {portalTarget ? createPortal(toolbar, portalTarget) : toolbar}
      <div className="events-table-container" ref={containerRef}>
        {loading && events.length === 0 ? (
          <div className="events-table-loading">
            <div className="empty-state">Загрузка мероприятий...</div>
          </div>
        ) : (
        months.map((monthData, monthIndex) => (
          <div 
            key={`${monthData.year}-${monthData.month}`}
            className="events-table-month-section"
            data-month-index={monthIndex}
          >
            <div className="events-table-month-header">
              {monthData.monthName}
            </div>
            <table className="events-table-calendar">
              <thead>
                <tr>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <th 
                      key={index}
                      className={`events-table-day-header ${isWeekend(new Date(monthData.weeks[0]?.days[index] || new Date())) ? 'weekend' : ''}`}
                    >
                      <div>{day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthData.weeks.map((week, weekIndex) => {
                  // Группируем события по строкам (rows)
                  const maxRow = Math.max(...week.weekEvents.map(e => e.row), -1);
                  const rows: WeekEvent[][] = [];
                  for (let r = 0; r <= maxRow; r++) {
                    rows[r] = week.weekEvents.filter(e => e.row === r);
                  }

                  const maxVisibleRows = 5;
                  const isExpanded = expandedRows.has(`${monthIndex}-${weekIndex}`);
                  const visibleRows = isExpanded ? rows : rows.slice(0, maxVisibleRows);
                  const hiddenRowsCount = Math.max(0, rows.length - maxVisibleRows);

                  return (
                    <React.Fragment key={`week-${weekIndex}`}>
                      {/* Строка с заголовками дней (только для первой строки событий) */}
                      {visibleRows.length > 0 && (
                        <tr className="events-table-week-header-row">
                          {week.days.map((day, dayIndex) => {
                            const isDayWeekend = isWeekend(day);
                            const isDayHoliday = isHoliday(day);
                            return (
                              <td 
                                key={dayIndex}
                                className={`events-table-day-header-cell ${isDayWeekend ? 'weekend' : ''} ${isDayHoliday ? 'holiday' : ''}`}
                              >
                                <div className="events-table-day-number">
                                  {day.getDate()}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      )}
                      
                      {/* Рендерим строки с колбасками */}
                      {visibleRows.map((rowEvents, rowIndex) => {
                        const dayWidthPercent = 100 / 7;
                        
                        return (
                          <tr key={`week-${weekIndex}-row-${rowIndex}`} className="events-table-event-row">
                            {/* Одна большая ячейка для всех дней недели с колбасками */}
                            <td 
                              colSpan={7} 
                              className="events-table-week-days-container"
                              style={{ 
                                position: 'relative', 
                                height: '24px',
                                padding: '2px',
                                borderBottom: rowIndex < visibleRows.length - 1 ? 'none' : undefined
                              }}
                            >
                              {week.days.map((day, dayIndex) => {
                                const isDayWeekend = isWeekend(day);
                                const isDayHoliday = isHoliday(day);
                                return (
                                  <div
                                    key={dayIndex}
                                    className={`events-table-day-background ${isDayWeekend ? 'weekend' : ''} ${isDayHoliday ? 'holiday' : ''}`}
                                    style={{
                                      position: 'absolute',
                                      left: `${dayIndex * dayWidthPercent}%`,
                                      width: `${dayWidthPercent}%`,
                                      top: 0,
                                      bottom: 0,
                                      borderRight: dayIndex < 6 ? '1px solid var(--border-color)' : 'none',
                                    }}
                                  />
                                );
                              })}
                              {/* Колбаски событий */}
                              {rowEvents.map((weekEvent) => {
                                const startPosition = (weekEvent.startDay * dayWidthPercent) + (weekEvent.startOffset * dayWidthPercent / 100);
                                const endPosition = ((weekEvent.endDay + 1) * dayWidthPercent) - ((100 - weekEvent.endOffset) * dayWidthPercent / 100);
                                const width = endPosition - startPosition;
                                const isHovered = weekEvent.event.id === hoveredEventId;

                                return (
                                  <EventBar
                                    key={weekEvent.event.id || `${weekEvent.row}-${weekIndex}`}
                                    event={weekEvent.event}
                                    style={{
                                      position: 'absolute',
                                      left: `${startPosition}%`,
                                      width: `${width}%`,
                                      top: '2px',
                                      height: '20px',
                                      fontSize: '11px',
                                      padding: '2px 4px',
                                      borderRadius: '3px',
                                      zIndex: 2,
                                    }}
                                    onClick={() => onEventClick(weekEvent.event)}
                                    onMouseEnter={(e) => {
                                      if (weekEvent.event.id) {
                                        setHoveredEventId(weekEvent.event.id);
                                        // Задержка перед показом tooltip
                                        if (tooltipTimeoutRef.current) {
                                          clearTimeout(tooltipTimeoutRef.current);
                                        }
                                        tooltipTimeoutRef.current = setTimeout(() => {
                                          setTooltipEvent({ 
                                            event: weekEvent.event, 
                                            x: e.clientX, 
                                            y: e.clientY 
                                          });
                                        }, 500);
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      // Небольшая задержка перед скрытием, чтобы дать время перейти на tooltip
                                      if (hideTooltipTimeoutRef.current) {
                                        clearTimeout(hideTooltipTimeoutRef.current);
                                      }
                                      hideTooltipTimeoutRef.current = setTimeout(() => {
                                        // Скрываем tooltip только если курсор не на tooltip
                                        if (!isTooltipHovered) {
                                          setHoveredEventId(undefined);
                                          setTooltipEvent(null);
                                        }
                                      }, 100);
                                    }}
                                    isHovered={isHovered}
                                    showTooltip={false}
                                    className="events-table-event-bar"
                                  />
                                );
                              })}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Кнопка "+N ещё" */}
                      {!isExpanded && hiddenRowsCount > 0 && (
                        <tr className="events-table-more-row">
                          <td colSpan={7} style={{ textAlign: 'center', padding: '0.5rem', border: 'none' }}>
                            <button
                              className="events-table-more-button"
                              onClick={() => handleExpandRow(monthIndex, weekIndex, 0)}
                            >
                              +{hiddenRowsCount} строк
                            </button>
                          </td>
                        </tr>
                      )}
                      {isExpanded && hiddenRowsCount === 0 && rows.length > maxVisibleRows && (
                        <tr className="events-table-more-row">
                          <td colSpan={7} style={{ textAlign: 'center', padding: '0.5rem', border: 'none' }}>
                            <button
                              className="events-table-more-button"
                              onClick={() => handleExpandRow(monthIndex, weekIndex, 0)}
                            >
                              Свернуть
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
        )}
      </div>
      {tooltipEvent && (
        <div
          ref={tooltipRef}
          className="event-bar-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipEvent.x}px`,
            top: `${tooltipEvent.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            zIndex: 10000,
          }}
          onMouseEnter={() => {
            setIsTooltipHovered(true);
            // Отменяем скрытие tooltip, если оно было запланировано
            if (hideTooltipTimeoutRef.current) {
              clearTimeout(hideTooltipTimeoutRef.current);
              hideTooltipTimeoutRef.current = undefined;
            }
            // Убеждаемся, что hoveredEventId установлен
            if (tooltipEvent.event.id) {
              setHoveredEventId(tooltipEvent.event.id);
            }
          }}
          onMouseLeave={() => {
            setIsTooltipHovered(false);
            // Скрываем tooltip когда курсор уходит с tooltip
            setHoveredEventId(undefined);
            setTooltipEvent(null);
          }}
        >
          <div className="event-bar-tooltip-title">{tooltipEvent.event.title}</div>
          <div className="event-bar-tooltip-status">
            {STATUS_LABELS[tooltipEvent.event.status] || tooltipEvent.event.status}
          </div>
          <div className="event-bar-tooltip-dates">
            <div>Начало: {formatDate(tooltipEvent.event.startDate)} {formatTime(tooltipEvent.event.startDate)}</div>
            <div>Окончание: {formatDate(tooltipEvent.event.endDate)} {formatTime(tooltipEvent.event.endDate)}</div>
          </div>
          {tooltipEvent.event.contractPrice > 0 && (
            <div className="event-bar-tooltip-price">
              Бюджет: {tooltipEvent.event.contractPrice.toLocaleString('ru-RU')} ₽
            </div>
          )}
          {tooltipEvent.event.description && (
            <div className="event-bar-tooltip-description">{tooltipEvent.event.description}</div>
          )}
        </div>
      )}
    </div>
  );
}
