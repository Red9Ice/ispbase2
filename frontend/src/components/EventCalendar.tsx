/**
 * @file: EventCalendar.tsx
 * @description: Gantt-style calendar: timeline on top, projects (by status) on left.
 * Navigation by scroll; Ctrl+scroll zooms.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { api, type EventDto } from '../services/api';
import './EventCalendar.css';

type EventStatus = 'draft' | 'request' | 'in_work' | 'completed' | 'canceled';
type TimeScale = 'hour' | 'day' | 'week' | 'month';
type ZoomLevel = 0.5 | 1 | 1.5 | 2 | 3 | 4;

const STATUS_ORDER: EventStatus[] = ['in_work', 'request', 'draft', 'completed', 'canceled'];
const ZOOM_LEVELS: ZoomLevel[] = [0.5, 1, 1.5, 2, 3, 4];

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

const STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'var(--status-draft)',
  request: 'var(--status-request)',
  in_work: 'var(--status-in-work)',
  completed: 'var(--status-completed)',
  canceled: 'var(--status-canceled)',
};

interface EventCalendarProps {
  onEventClick?: (event: EventDto) => void;
}

interface ProjectRow {
  status: EventStatus;
  events: EventDto[];
  isFirstInProject: boolean;
}

interface EventTooltip {
  event: EventDto;
  x: number;
  y: number;
  barCenterX: number; // Центр колбаски по горизонтали
  barCenterY: number; // Центр колбаски по вертикали для позиционирования стрелки
}

export function EventCalendar({ onEventClick }: EventCalendarProps) {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const end = new Date(t.getFullYear(), t.getMonth() + 5, 0);
    return { start, end };
  });
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<EventTooltip | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [dragging, setDragging] = useState<{ event: EventDto; type: 'start' | 'end' | 'move' } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; eventStart: Date; eventEnd: Date } | null>(null);
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadEvents = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventCalendar.tsx:81',message:'loadEvents called',data:{dateRangeStart:dateRange.start.toISOString(),dateRangeEnd:dateRange.end.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setLoading(true);
    try {
      const data = await api.events.list({
        startFrom: dateRange.start.toISOString(),
        endTo: dateRange.end.toISOString(),
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventCalendar.tsx:88',message:'Events loaded',data:{eventsCount:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventCalendar.tsx:96',message:'useEffect triggered loadEvents',data:{loadEventsDefined:!!loadEvents},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    loadEvents();
  }, [loadEvents]);

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

  useEffect(() => {
    const el = bodyRef.current;
    const header = headerRef.current;
    if (!el || !header) return;
    const onScroll = () => {
      const sx = el.scrollLeft;
      setScrollLeft(sx);
      if (header.scrollLeft !== sx) header.scrollLeft = sx;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const h = headerRef.current;
    if (h && h.scrollLeft !== scrollLeft) h.scrollLeft = scrollLeft;
  }, [scrollLeft]);

  const handleRange = (months: number) => {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const end = new Date(t.getFullYear(), t.getMonth() + months, 0);
    setDateRange({ start, end });
  };

  const handlePrev = () => {
    const start = new Date(dateRange.start);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(dateRange.end);
    end.setMonth(end.getMonth() - 1);
    setDateRange({ start, end });
  };

  const handleNext = () => {
    const start = new Date(dateRange.start);
    start.setMonth(start.getMonth() + 1);
    const end = new Date(dateRange.end);
    end.setMonth(end.getMonth() + 1);
    setDateRange({ start, end });
  };

  const zoomIn = useCallback(() => {
    setZoomLevel((z) => {
      const i = ZOOM_LEVELS.indexOf(z);
      return i < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[i + 1]! : z;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((z) => {
      const i = ZOOM_LEVELS.indexOf(z);
      return i > 0 ? ZOOM_LEVELS[i - 1]! : z;
    });
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoomLevel((z) => {
        const i = ZOOM_LEVELS.indexOf(z);
        if (e.deltaY > 0) return i > 0 ? ZOOM_LEVELS[i - 1]! : z;
        return i < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[i + 1]! : z;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const cur = new Date(dateRange.start);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    if (timeScale === 'hour') {
      while (cur <= end) {
        slots.push(new Date(cur));
        cur.setHours(cur.getHours() + 1);
      }
    } else if (timeScale === 'day') {
      while (cur <= end) {
        slots.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (timeScale === 'week') {
      while (cur <= end) {
        slots.push(new Date(cur));
        cur.setDate(cur.getDate() + 7);
      }
    } else {
      while (cur <= end) {
        slots.push(new Date(cur));
        cur.setMonth(cur.getMonth() + 1);
      }
    }
    return slots;
  }, [dateRange, timeScale]);

  const quarterRanges = useMemo(() => {
    const q: { label: string; start: Date; end: Date; monthOffset: number }[] = [];
    const cur = new Date(dateRange.start.getFullYear(), Math.floor(dateRange.start.getMonth() / 3) * 3, 1);
    const end = new Date(dateRange.end);
    const baseYear = dateRange.start.getFullYear();
    const baseMonth = dateRange.start.getMonth();

    while (cur <= end) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const qNum = Math.floor(m / 3) + 1;
      const start = new Date(cur);
      const endQ = new Date(y, m + 3, 0);
      const monthOffset = (y - baseYear) * 12 + (m - baseMonth);
      q.push({ label: `Q${qNum} ${y}`, start, end: endQ, monthOffset });
      cur.setMonth(cur.getMonth() + 3);
    }
    return q;
  }, [dateRange]);

  const baseSlotWidth =
    timeScale === 'hour' ? 60 : timeScale === 'day' ? 100 : timeScale === 'week' ? 150 : 200;
  const slotWidth = baseSlotWidth * zoomLevel;
  const totalWidth = timeSlots.length * slotWidth;

  const projectRows = useMemo(() => {
    const byStatus = new Map<EventStatus, EventDto[]>();
    for (const s of STATUS_ORDER) byStatus.set(s, []);

    const unique = Array.from(new Map(events.map((e) => [e.id, e])).values());
    for (const e of unique) {
      const s = e.status as EventStatus;
      if (STATUS_ORDER.includes(s)) byStatus.get(s)!.push(e);
    }

    const rows: ProjectRow[] = [];

    for (const status of STATUS_ORDER) {
      const list = byStatus.get(status)!.slice().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      const rowEvents: EventDto[][] = [];

      for (const ev of list) {
        const start = new Date(ev.startDate).getTime();
        const end = new Date(ev.endDate).getTime();
        let rowIndex = -1;
        
        // Ищем первую доступную строку, где событие не пересекается с другими
        // Важно: событие будет оставаться на этой строке на протяжении всей длительности
        for (let i = 0; i < rowEvents.length; i++) {
          // Проверяем, не пересекается ли событие с другими в этой строке
          const hasConflict = rowEvents[i]!.some((e) => {
            const es = new Date(e.startDate).getTime();
            const ee = new Date(e.endDate).getTime();
            // События пересекаются, если они не полностью разделены
            return !(end < es || start > ee);
          });
          
          if (!hasConflict) {
            rowIndex = i;
            break; // Используем первую доступную строку
          }
        }
        
        // Если не нашли подходящую строку, создаем новую
        if (rowIndex === -1) {
          rowIndex = rowEvents.length;
          rowEvents.push([]);
        }
        
        // Размещаем событие в найденной строке
        // Это событие будет оставаться на этой строке на протяжении всей длительности
        rowEvents[rowIndex]!.push(ev);
      }

      let first = true;
      for (const evs of rowEvents) {
        rows.push({ status, events: evs, isFirstInProject: first });
        first = false;
      }
    }

    return rows;
  }, [events]);

  const rangeStart = useMemo(() => {
    const d = new Date(dateRange.start);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [dateRange]);

  const getEventPosition = useCallback(
    (event: EventDto) => {
      const es = new Date(event.startDate).getTime();
      const ee = new Date(event.endDate).getTime();

      let left: number;
      let w: number;

      if (timeScale === 'hour') {
        left = ((es - rangeStart) / (1000 * 60 * 60)) * slotWidth;
        w = Math.max(((ee - es) / (1000 * 60 * 60)) * slotWidth, 50);
      } else if (timeScale === 'day') {
        left = ((es - rangeStart) / (1000 * 60 * 60 * 24)) * slotWidth;
        w = Math.max(((ee - es) / (1000 * 60 * 60 * 24)) * slotWidth, 80);
      } else if (timeScale === 'week') {
        left = ((es - rangeStart) / (1000 * 60 * 60 * 24 * 7)) * slotWidth;
        w = Math.max(((ee - es) / (1000 * 60 * 60 * 24 * 7)) * slotWidth, 100);
      } else {
        const ms = (d: Date) => (d.getFullYear() - 1970) * 12 + d.getMonth();
        left = (ms(new Date(event.startDate)) - ms(new Date(dateRange.start))) * slotWidth;
        const dur = (ee - es) / (1000 * 60 * 60 * 24 * 30);
        w = Math.max(dur * slotWidth, 120);
      }

      if (left < 0) {
        w += left;
        left = 0;
      }
      // Ограничиваем правую границу колбаски, чтобы она не выходила за пределы контейнера
      if (left + w > totalWidth) {
        w = Math.max(0, totalWidth - left);
      }
      return { left, width: w };
    },
    [dateRange, timeScale, slotWidth, rangeStart],
  );

  const todayPosition = useMemo(() => {
    const now = new Date();
    if (now < dateRange.start || now > dateRange.end) return null;
    const t = now.getTime();
    let pos: number;
    if (timeScale === 'hour') {
      pos = ((t - rangeStart) / (1000 * 60 * 60)) * slotWidth;
    } else if (timeScale === 'day') {
      pos = ((t - rangeStart) / (1000 * 60 * 60 * 24)) * slotWidth;
    } else if (timeScale === 'week') {
      pos = ((t - rangeStart) / (1000 * 60 * 60 * 24 * 7)) * slotWidth;
    } else {
      const ms = (d: Date) => (d.getFullYear() - 1970) * 12 + d.getMonth();
      pos = (ms(now) - ms(new Date(dateRange.start))) * slotWidth;
    }
    return Math.max(0, Math.min(pos, totalWidth - 1));
  }, [dateRange, timeScale, slotWidth, rangeStart, totalWidth]);

  const formatSlot = (d: Date) => {
    if (timeScale === 'hour') return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (timeScale === 'day') return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    if (timeScale === 'week') {
      const w = new Date(d);
      w.setDate(d.getDate() - d.getDay());
      return `${w.getDate()}.${w.getMonth() + 1}`;
    }
    return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  };

  const formatEventTime = (e: EventDto) => {
    const s = new Date(e.startDate);
    const end = new Date(e.endDate);
    if (timeScale === 'hour') {
      return `${s.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${s.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
  };

  // Позиционирование tooltip - справа/слева от колбаски со стрелкой на середину
  useEffect(() => {
    if (tooltip && showTooltip && tooltipRef.current && bodyRef.current) {
      const tooltipEl = tooltipRef.current;
      const calendarEl = bodyRef.current.parentElement;
      
      requestAnimationFrame(() => {
        if (!tooltipEl || !calendarEl) return;
        
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const calendarRect = calendarEl.getBoundingClientRect();

        // Позиционируем tooltip справа от колбаски
        // Стрелка слева будет указывать на центр колбаски по высоте
        const arrowSize = 8;
        const gap = 4;
        
        let x = tooltip.barCenterX + gap + arrowSize - (bodyRef.current?.scrollLeft || 0);
        let y = tooltip.barCenterY - tooltipRect.height / 2;
        
        // Проверка выхода за правую границу
        if (x + tooltipRect.width > calendarRect.width) {
          // Показываем слева от колбаски
          x = tooltip.barCenterX - tooltipRect.width - gap - arrowSize - (bodyRef.current?.scrollLeft || 0);
          tooltipEl.classList.add('tooltip-arrow-right');
          tooltipEl.classList.remove('tooltip-arrow-left');
        } else {
          tooltipEl.classList.add('tooltip-arrow-left');
          tooltipEl.classList.remove('tooltip-arrow-right');
        }
        
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
        
        // Вычисляем смещение стрелки по вертикали
        const tooltipCenterY = y + tooltipRect.height / 2;
        const arrowOffsetY = tooltip.barCenterY - tooltipCenterY;
        tooltipEl.style.setProperty('--arrow-offset-y', `${arrowOffsetY}px`);
      });
    }
  }, [tooltip, showTooltip]);

  // Обработка drag-and-drop
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, event: EventDto, type: 'start' | 'end' | 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const calendarRect = bodyRef.current?.getBoundingClientRect();
    if (!calendarRect) return;

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // Вычисляем начальную позицию события на временной шкале
    const eventPos = getEventPosition(event);
    const startX = eventPos.left;
    
    setDragging({ event, type });
    setDragStartPos({
      x: e.clientX - calendarRect.left + (bodyRef.current?.scrollLeft || 0),
      eventStart,
      eventEnd,
    });
  }, [getEventPosition]);

  useEffect(() => {
    if (!dragging || !dragStartPos) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!bodyRef.current) return;
      
      const calendarRect = bodyRef.current.getBoundingClientRect();
      const newX = e.clientX - calendarRect.left + bodyRef.current.scrollLeft;
      const deltaX = newX - dragStartPos.x;

      // Вычисляем новую дату на основе смещения от начальной позиции
      let timeDelta: number;
      if (timeScale === 'hour') {
        timeDelta = (deltaX / slotWidth) * (1000 * 60 * 60);
      } else if (timeScale === 'day') {
        timeDelta = (deltaX / slotWidth) * (1000 * 60 * 60 * 24);
      } else if (timeScale === 'week') {
        timeDelta = (deltaX / slotWidth) * (1000 * 60 * 60 * 24 * 7);
      } else {
        // month
        const ms = (d: Date) => (d.getFullYear() - 1970) * 12 + d.getMonth();
        const monthsDelta = deltaX / slotWidth;
        const newStart = new Date(dragStartPos.eventStart);
        newStart.setMonth(newStart.getMonth() + monthsDelta);
        timeDelta = newStart.getTime() - dragStartPos.eventStart.getTime();
      }

      // Обновляем событие в реальном времени (оптимистичное обновление)
      setEvents((prevEvents) =>
        prevEvents.map((ev) => {
          if (ev.id !== dragging.event.id) return ev;
          
          if (dragging.type === 'start') {
            const newStart = new Date(dragStartPos.eventStart.getTime() + timeDelta);
            const duration = dragStartPos.eventEnd.getTime() - dragStartPos.eventStart.getTime();
            return {
              ...ev,
              startDate: newStart.toISOString(),
              endDate: new Date(newStart.getTime() + duration).toISOString(),
            };
          } else if (dragging.type === 'end') {
            const newEnd = new Date(dragStartPos.eventEnd.getTime() + timeDelta);
            // Проверяем, что конец не раньше начала
            if (newEnd.getTime() <= dragStartPos.eventStart.getTime()) {
              return ev;
            }
            return {
              ...ev,
              endDate: newEnd.toISOString(),
            };
          } else {
            // move - перемещаем событие целиком
            const duration = dragStartPos.eventEnd.getTime() - dragStartPos.eventStart.getTime();
            const newStart = new Date(dragStartPos.eventStart.getTime() + timeDelta);
            return {
              ...ev,
              startDate: newStart.toISOString(),
              endDate: new Date(newStart.getTime() + duration).toISOString(),
            };
          }
        })
      );
    };

    const handleMouseUp = async () => {
      if (!dragging || !dragStartPos) return;

      // Сохраняем изменения на сервер
      const updatedEvent = events.find((e) => e.id === dragging.event.id);
      if (updatedEvent) {
        try {
          await api.events.update(updatedEvent.id!, {
            startDate: updatedEvent.startDate,
            endDate: updatedEvent.endDate,
          });
          // Перезагружаем события для синхронизации
          loadEvents();
        } catch (error) {
          console.error('Failed to update event:', error);
          // Откатываем изменения при ошибке
          loadEvents();
        }
      }

      setDragging(null);
      setDragStartPos(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStartPos, timeScale, slotWidth, events, loadEvents]);

  // Обработчики drag-and-drop для заголовка
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Только левая кнопка мыши
    e.preventDefault();
    setIsDraggingHeader(true);
    setDragStartX(e.clientX);
    setDragStartScrollLeft(bodyRef.current?.scrollLeft || 0);
  }, []);

  useEffect(() => {
    if (!isDraggingHeader) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!bodyRef.current) return;
      const deltaX = dragStartX - e.clientX;
      bodyRef.current.scrollLeft = dragStartScrollLeft + deltaX;
    };

    const handleMouseUp = () => {
      setIsDraggingHeader(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHeader, dragStartX, dragStartScrollLeft]);

  // Обработка клавиатуры для горизонтальной прокрутки
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          body.scrollLeft -= 100;
        } else {
          body.scrollLeft -= 50;
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          body.scrollLeft += 100;
        } else {
          body.scrollLeft += 50;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Определение контрастного цвета текста (белый или черный)
  const getContrastTextColor = useCallback((bgColor: string): string => {
    // Получаем вычисленное значение CSS переменной
    const tempEl = document.createElement('div');
    tempEl.style.color = bgColor;
    document.body.appendChild(tempEl);
    const computedColor = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    
    // Парсим RGB значение
    const rgbMatch = computedColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0] || '0');
      const g = parseInt(rgbMatch[1] || '0');
      const b = parseInt(rgbMatch[2] || '0');
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#FFFFFF';
    }
    
    // По умолчанию белый текст
    return '#FFFFFF';
  }, []);

  return (
    <div className="event-calendar gantt-timeline">
      <div className="gantt-toolbar">
        <div className="gantt-toolbar-ranges">
          <button type="button" className="gantt-btn" onClick={() => handleRange(3)}>
            3 мес
          </button>
          <button type="button" className="gantt-btn" onClick={() => handleRange(6)}>
            6 мес
          </button>
          <button type="button" className="gantt-btn" onClick={() => handleRange(12)}>
            1 год
          </button>
          <button type="button" className="gantt-btn" onClick={handlePrev} title="Назад">
            ←
          </button>
          <button type="button" className="gantt-btn" onClick={handleNext} title="Вперёд">
            →
          </button>
        </div>
        <div className="gantt-toolbar-scale">
          <label>Шкала:</label>
          <select
            value={timeScale}
            onChange={(e) => setTimeScale(e.target.value as TimeScale)}
            className="gantt-select"
          >
            <option value="hour">Часы</option>
            <option value="day">Дни</option>
            <option value="week">Недели</option>
            <option value="month">Месяцы</option>
          </select>
        </div>
        <div className="gantt-toolbar-zoom">
          <span className="gantt-zoom-hint">Масштаб: Ctrl+колёсико</span>
          <button type="button" className="gantt-btn-icon" onClick={zoomOut} title="Уменьшить">
            −
          </button>
          <span className="gantt-zoom-value">{zoomLevel}×</span>
          <button type="button" className="gantt-btn-icon" onClick={zoomIn} title="Увеличить">
            +
          </button>
        </div>
      </div>

      {loading ? (
        <div className="gantt-loading">
          <div className="empty-state">Загрузка мероприятий…</div>
        </div>
      ) : (
        <div className="gantt-scroll-wrap">
          <div className="gantt-timeline-header">
            <div className="gantt-header-corner" />
            <div 
              className="gantt-header-ruler-wrap" 
              ref={headerRef}
              onMouseDown={handleHeaderMouseDown}
              style={{ cursor: isDraggingHeader ? 'grabbing' : 'grab' }}
            >
              <div className="gantt-timeline-ruler" style={{ width: totalWidth }}>
              {timeScale === 'month' && quarterRanges.length > 0 && (
                <div className="gantt-ruler-quarters">
                  {quarterRanges.map((q) => (
                    <div
                      key={q.label}
                      className="gantt-quarter-cell"
                      style={{
                        left: `${q.monthOffset * slotWidth}px`,
                        width: `${3 * slotWidth}px`,
                      }}
                    >
                      {q.label}
                    </div>
                  ))}
                </div>
              )}
              <div className="gantt-ruler-months">
                {timeSlots.map((slot, i) => (
                  <div
                    key={`slot-${slot.getTime()}-${i}`}
                    className="gantt-ruler-slot"
                    style={{ width: `${slotWidth}px` }}
                  >
                    {formatSlot(slot)}
                  </div>
                ))}
              </div>
              {todayPosition != null && (
                <div
                  className="gantt-today-marker"
                  style={{ left: `${todayPosition}px` }}
                  title="Сегодня"
                >
                  <span className="gantt-today-label">Сегодня</span>
                </div>
              )}
              </div>
            </div>
          </div>

          <div
            className="gantt-timeline-body"
            ref={bodyRef}
            style={{ '--slot-width': `${slotWidth}px` } as React.CSSProperties}
            role="application"
            aria-label="Календарь мероприятий"
          >
            <div className="gantt-body-inner" style={{ width: 220 + totalWidth }}>
              {projectRows.map((row, idx) => (
                <div key={`${row.status}-${idx}-${row.events[0]?.id || idx}`} className="gantt-project-row">
                  <div className="gantt-project-cell">
                    {row.isFirstInProject ? (
                      <div
                        className="gantt-project-block"
                        style={{ backgroundColor: STATUS_COLORS[row.status] }}
                      >
                        {STATUS_LABELS[row.status]}
                      </div>
                    ) : (
                      <div className="gantt-project-cell-fill" />
                    )}
                  </div>
                  <div className="gantt-timeline-cell" style={{ width: totalWidth }}>
                    {row.events.map((ev) => {
                      const pos = getEventPosition(ev);
                      const isHovered = hoveredEventId === ev.id;
                      const isDimmed = hoveredEventId !== null && hoveredEventId !== ev.id;
                      const bgColor = STATUS_COLORS[ev.status as EventStatus] || '#888';
                      const textColor = getContrastTextColor(bgColor);
                      const isDragging = dragging?.event.id === ev.id;
                      
                      return (
                        <div
                          key={ev.id}
                          className={`gantt-event-bar ${isHovered ? 'gantt-event-bar-hovered' : ''} ${isDimmed ? 'gantt-event-bar-dimmed' : ''} ${isDragging ? 'gantt-event-bar-dragging' : ''}`}
                          style={{
                            left: `${pos.left}px`,
                            width: `${pos.width}px`,
                            backgroundColor: bgColor,
                            color: textColor,
                          }}
                          onMouseMove={(e) => {
                            if (isDragging) return;
                            
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const isNearLeft = mouseX <= 5;
                            const isNearRight = mouseX >= rect.width - 5;
                            const isInMiddle = !isNearLeft && !isNearRight;
                            
                            if (isNearLeft) {
                              e.currentTarget.style.cursor = 'ew-resize';
                            } else if (isNearRight) {
                              e.currentTarget.style.cursor = 'ew-resize';
                            } else if (isInMiddle) {
                              e.currentTarget.style.cursor = 'move';
                            }
                          }}
                          onMouseEnter={(e) => {
                            setHoveredEventId(ev.id || null);
                            // Отменяем скрытие tooltip, если оно было запланировано
                            if (hideTooltipTimeoutRef.current) {
                              clearTimeout(hideTooltipTimeoutRef.current);
                              hideTooltipTimeoutRef.current = null;
                            }
                            // Отменяем показ tooltip, если он уже запланирован
                            if (showTooltipTimeoutRef.current) {
                              clearTimeout(showTooltipTimeoutRef.current);
                            }
                            // Показываем tooltip с задержкой 500мс
                            const rect = e.currentTarget.getBoundingClientRect();
                            const calendarRect = bodyRef.current?.getBoundingClientRect();
                            if (calendarRect) {
                              // Вычисляем центр колбаски
                              const barCenterX = rect.left - calendarRect.left + rect.width / 2 + (bodyRef.current?.scrollLeft || 0);
                              const barCenterY = rect.top - calendarRect.top + rect.height / 2 + (bodyRef.current?.scrollTop || 0);
                              
                              setTooltip({
                                event: ev,
                                x: barCenterX,
                                y: rect.top - calendarRect.top + (bodyRef.current?.scrollTop || 0),
                                barCenterX,
                                barCenterY,
                              });
                              showTooltipTimeoutRef.current = setTimeout(() => {
                                setShowTooltip(true);
                              }, 500);
                            }
                          }}
                          onMouseLeave={(e) => {
                            setHoveredEventId(null);
                            e.currentTarget.style.cursor = 'pointer';
                            // Отменяем показ tooltip, если он еще не показан
                            if (showTooltipTimeoutRef.current) {
                              clearTimeout(showTooltipTimeoutRef.current);
                              showTooltipTimeoutRef.current = null;
                            }
                            // Скрываем tooltip только если курсор не на tooltip
                            if (!isTooltipHovered) {
                              setShowTooltip(false);
                              setTooltip(null);
                            }
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const isNearLeft = mouseX <= 5;
                            const isNearRight = mouseX >= rect.width - 5;
                            
                            if (isNearLeft) {
                              handleMouseDown(e, ev, 'start');
                            } else if (isNearRight) {
                              handleMouseDown(e, ev, 'end');
                            } else {
                              handleMouseDown(e, ev, 'move');
                            }
                          }}
                          onClick={(e) => {
                            // Предотвращаем клик при drag-and-drop
                            if (dragging) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            onEventClick?.(ev);
                          }}
                        >
                          {isHovered && (
                            <>
                              <div className="gantt-event-bar-resize-handle gantt-event-bar-resize-handle-left" />
                              <div className="gantt-event-bar-resize-handle gantt-event-bar-resize-handle-right" />
                            </>
                          )}
                          <span className="gantt-event-title" style={{ color: textColor }}>{ev.title}</span>
                          <span className="gantt-event-time" style={{ color: textColor }}>{formatEventTime(ev)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {projectRows.length === 0 && (
                <div className="gantt-empty-row">
                  <div className="gantt-project-cell" />
                  <div className="gantt-timeline-cell gantt-empty" style={{ width: totalWidth }}>
                    <div className="empty-state">Нет мероприятий в выбранном периоде</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="gantt-legend">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="gantt-legend-item">
            <div
              className="gantt-legend-dot"
              style={{ backgroundColor: STATUS_COLORS[s] }}
            />
            <span>{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* Всплывающее окно с информацией о мероприятии */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className={`gantt-event-tooltip ${showTooltip ? 'gantt-event-tooltip-visible' : 'gantt-event-tooltip-hidden'} ${isDraggingTooltip ? 'gantt-event-tooltip-dragging' : ''}`}
          onMouseEnter={() => {
            setIsTooltipHovered(true);
            // Отменяем скрытие tooltip, если оно было запланировано
            if (hideTooltipTimeoutRef.current) {
              clearTimeout(hideTooltipTimeoutRef.current);
              hideTooltipTimeoutRef.current = null;
            }
            setShowTooltip(true);
          }}
          onMouseLeave={() => {
            // Не скрываем tooltip если идёт перетаскивание
            if (isDraggingTooltip) return;
            
            setIsTooltipHovered(false);
            // Скрываем tooltip когда курсор уходит с tooltip
            setShowTooltip(false);
            setTooltip(null);
            setTooltipPosition(null);
          }}
        >
          <div 
            className="gantt-event-tooltip-title gantt-event-tooltip-draggable"
            onMouseDown={handleTooltipTitleMouseDown}
          >
            {tooltip.event.title}
          </div>
          <div className="gantt-event-tooltip-status">
            {STATUS_LABELS[tooltip.event.status as EventStatus]}
          </div>
          <div className="gantt-event-tooltip-time">
            Начало: {new Date(tooltip.event.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="gantt-event-tooltip-time">
            Окончание: {new Date(tooltip.event.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {tooltip.event.description && (
            <div className="gantt-event-tooltip-description">{tooltip.event.description}</div>
          )}
        </div>
      )}
    </div>
  );
}
