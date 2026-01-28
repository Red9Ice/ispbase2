/**
 * @file: EventsTimelineView.tsx
 * @description: Компонент горизонтального календаря (таймлайн/диаграмма Ганта)
 * @dependencies: services/api.ts, EventBar.tsx
 * @created: 2026-01-28
 */

import { useState, useMemo, useRef, useEffect, useCallback, Fragment } from 'react';
import type { EventDto } from '../services/api';
import { EventBar } from './EventBar';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

interface EventsTimelineViewProps {
  events: EventDto[];
  loading: boolean;
  onEventClick: (event: EventDto) => void;
  onLoadEventsRange?: (start: Date, end: Date) => void;
}

type TimeScale = 'year' | 'month' | 'day' | 'hour' | 'minute';

interface TimelineSlot {
  date: Date;
  label: string;
  width: number;
  dayOfWeek?: string;
  month?: number;
  isWeekend?: boolean;
}

// Фиксированная точка отсчета - 1 января 2000 года
const TIMELINE_EPOCH = new Date(2000, 0, 1, 0, 0, 0, 0);

// Функция для получения шага времени в миллисекундах
function getTimeStepMs(scale: TimeScale): number {
  if (scale === 'minute') return 15 * 60 * 1000; // 15 минут
  if (scale === 'hour') return 60 * 60 * 1000; // 1 час
  if (scale === 'day') return 24 * 60 * 60 * 1000; // 1 день
  if (scale === 'month') return 30 * 24 * 60 * 60 * 1000; // ~30 дней
  return 365 * 24 * 60 * 60 * 1000; // 1 год
}

// Функция для нормализации даты до начала/конца периода
function normalizeDateToPeriod(date: Date, scale: TimeScale, mode: 'start' | 'end'): void {
  if (scale === 'minute') {
    date.setSeconds(0, 0);
    const minutes = date.getMinutes();
    date.setMinutes(Math.floor(minutes / 15) * 15);
    if (mode === 'end') {
      date.setMinutes(date.getMinutes() + 15);
      date.setMilliseconds(date.getMilliseconds() - 1);
    }
  } else if (scale === 'hour') {
    date.setMinutes(0, 0, 0);
    if (mode === 'end') {
      date.setHours(date.getHours() + 1);
      date.setMilliseconds(date.getMilliseconds() - 1);
    }
  } else if (scale === 'day') {
    date.setHours(0, 0, 0, 0);
    if (mode === 'end') {
      date.setDate(date.getDate() + 1);
      date.setMilliseconds(date.getMilliseconds() - 1);
    }
  } else if (scale === 'month') {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    if (mode === 'end') {
      date.setMonth(date.getMonth() + 1);
      date.setMilliseconds(date.getMilliseconds() - 1);
    }
  } else {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
    if (mode === 'end') {
      date.setFullYear(date.getFullYear() + 1);
      date.setMilliseconds(date.getMilliseconds() - 1);
    }
  }
}

function getTimeScaleForZoom(zoom: number): TimeScale {
  if (zoom >= 4) return 'hour';
  if (zoom >= 2) return 'day';
  if (zoom >= 1) return 'day';
  if (zoom >= 0.5) return 'month';
  return 'year';
}

function getSlotWidthForZoom(scale: TimeScale, zoom: number): number {
  if (scale === 'minute') return 60 * zoom;
  if (scale === 'hour') return 100 * zoom;
  if (scale === 'day') return 120 * zoom;
  if (scale === 'month') return 200 * zoom;
  return 300 * zoom; // year
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function EventsTimelineView({ events, loading, onEventClick, onLoadEventsRange }: EventsTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 30 дней по умолчанию
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [hoveredEventId, setHoveredEventId] = useState<number | undefined>(undefined);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<number>>(new Set());
  const [tooltipEvent, setTooltipEvent] = useState<{ event: EventDto; x: number; y: number } | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastLoadedRangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const zoomAnimRef = useRef<number | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const zoomRef = useRef<number>(zoomLevel);

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
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    return () => {
      if (zoomAnimRef.current != null) cancelAnimationFrame(zoomAnimRef.current);
      if (scrollAnimRef.current != null) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  // Определяем масштаб времени на основе zoomLevel
  const timeScale: TimeScale = useMemo(() => {
    return getTimeScaleForZoom(zoomLevel);
  }, [zoomLevel]);

  // Вычисляем ширину одного слота в зависимости от масштаба
  const slotWidth = useMemo(() => {
    return getSlotWidthForZoom(timeScale, zoomLevel);
  }, [timeScale, zoomLevel]);

  // Вычисляем видимый диапазон дат на основе scrollLeft
  const visibleDateRange = useMemo(() => {
    const body = bodyRef.current;
    if (!body) {
      // По умолчанию показываем текущую дату
      const now = new Date();
      const daysVisible = 30 / zoomLevel;
      const start = new Date(now);
      start.setDate(start.getDate() - daysVisible / 2);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + daysVisible / 2);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const viewportWidth = body.clientWidth;
    const buffer = viewportWidth * 2; // Буфер по 2 экрана с каждой стороны
    
    // Вычисляем начальную и конечную позиции в пикселях
    const startPixel = Math.max(0, scrollLeft - buffer);
    const endPixel = scrollLeft + viewportWidth + buffer;

    // Конвертируем пиксели в даты относительно эпохи
    const startDate = new Date(TIMELINE_EPOCH.getTime() + (startPixel / slotWidth) * getTimeStepMs(timeScale));
    const endDate = new Date(TIMELINE_EPOCH.getTime() + (endPixel / slotWidth) * getTimeStepMs(timeScale));

    // Округляем до начала периода
    normalizeDateToPeriod(startDate, timeScale, 'start');
    normalizeDateToPeriod(endDate, timeScale, 'end');

    return { start: startDate, end: endDate };
  }, [scrollLeft, zoomLevel, timeScale, slotWidth]);

  // Генерируем слоты времени для заголовка на основе видимого диапазона
  const timeSlots = useMemo(() => {
    const slots: TimelineSlot[] = [];
    const current = new Date(visibleDateRange.start);
    const end = new Date(visibleDateRange.end);

    if (timeScale === 'minute') {
      while (current <= end) {
        slots.push({
          date: new Date(current),
          label: current.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          width: slotWidth,
        });
        current.setMinutes(current.getMinutes() + 15);
      }
    } else if (timeScale === 'hour') {
      while (current <= end) {
        slots.push({
          date: new Date(current),
          label: current.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          width: slotWidth,
        });
        current.setHours(current.getHours() + 1);
      }
    } else if (timeScale === 'day') {
      while (current <= end) {
        const dayOfWeek = current.toLocaleDateString('ru-RU', { weekday: 'short' });
        const dayNumber = current.getDate();
        const dayOfWeekNumber = current.getDay(); // 0 = воскресенье, 6 = суббота
        const isWeekend = dayOfWeekNumber === 0 || dayOfWeekNumber === 6;
        slots.push({
          date: new Date(current),
          label: dayNumber.toString(),
          width: slotWidth,
          dayOfWeek: dayOfWeek,
          month: current.getMonth() + 1,
          isWeekend: isWeekend,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (timeScale === 'month') {
      while (current <= end) {
        slots.push({
          date: new Date(current),
          label: current.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
          width: slotWidth,
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      while (current <= end) {
        slots.push({
          date: new Date(current),
          label: current.getFullYear().toString(),
          width: slotWidth,
        });
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    return slots;
  }, [visibleDateRange, timeScale, slotWidth]);

  // Группировка дней по месяцам для заголовка (актуально для timeScale === 'day')
  const monthGroups = useMemo(() => {
    if (timeScale !== 'day') return [];

    type MonthGroup = { key: string; label: string; width: number };
    const groups: MonthGroup[] = [];

    for (const slot of timeSlots) {
      const d = slot.date;
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.width += slot.width;
      } else {
        groups.push({ key, label, width: slot.width });
      }
    }

    return groups;
  }, [timeScale, timeSlots]);

  // Вычисляем общую ширину таймлайна (бесконечная, но для рендеринга используем видимый диапазон)
  // Для бесконечной прокрутки используем очень большую ширину
  const totalWidth = useMemo(() => {
    // Вычисляем ширину для видимого диапазона + буфер
    const body = bodyRef.current;
    if (!body) {
      // Вычисляем ширину на основе видимого диапазона дат
      const timeStepMs = getTimeStepMs(timeScale);
      const rangeMs = visibleDateRange.end.getTime() - visibleDateRange.start.getTime();
      return (rangeMs / timeStepMs) * slotWidth;
    }
    
    const viewportWidth = body.clientWidth;
    const buffer = viewportWidth * 2;
    const timeStepMs = getTimeStepMs(timeScale);
    const rangeMs = visibleDateRange.end.getTime() - visibleDateRange.start.getTime();
    const calculatedWidth = (rangeMs / timeStepMs) * slotWidth;
    // Ограничиваем максимальной шириной, но оставляем возможность прокрутки
    return Math.max(calculatedWidth, scrollLeft + viewportWidth + buffer);
  }, [scrollLeft, visibleDateRange, timeScale, slotWidth]);

  // Позиция текущего времени относительно эпохи
  const todayPosition = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    const epochTime = TIMELINE_EPOCH.getTime();
    const timeStepMs = getTimeStepMs(timeScale);
    const position = ((nowTime - epochTime) / timeStepMs) * slotWidth;
    return position;
  }, [timeScale, slotWidth]);

  // Распределяем события по строкам (без перекрытий)
  const eventRows = useMemo(() => {
    const rows: EventDto[][] = [];
    const sortedEvents = events
      .filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        // Фильтруем события, которые пересекаются с видимым диапазоном
        return eventStart <= visibleDateRange.end && eventEnd >= visibleDateRange.start;
      })
      .sort((a, b) => {
        const startA = new Date(a.startDate).getTime();
        const startB = new Date(b.startDate).getTime();
        if (startA !== startB) return startA - startB;
        const endA = new Date(a.endDate).getTime();
        const endB = new Date(b.endDate).getTime();
        return endB - endA; // Более длинные события первыми
      });

    sortedEvents.forEach((event) => {
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = new Date(event.endDate).getTime();

      let placed = false;
      for (let i = 0; i < rows.length; i++) {
        const canPlace = rows[i]!.every((existingEvent) => {
          const existingStart = new Date(existingEvent.startDate).getTime();
          const existingEnd = new Date(existingEvent.endDate).getTime();
          return eventEnd < existingStart || eventStart > existingEnd;
        });

        if (canPlace) {
          rows[i]!.push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rows.push([event]);
      }
    });

    return rows;
  }, [events, visibleDateRange]);

  // Вычисляем позицию события на таймлайне относительно эпохи
  const getEventPosition = useCallback(
    (event: EventDto) => {
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = new Date(event.endDate).getTime();
      const epochTime = TIMELINE_EPOCH.getTime();
      const timeStepMs = getTimeStepMs(timeScale);

      // Вычисляем позицию начала события
      const left = ((eventStart - epochTime) / timeStepMs) * slotWidth;
      
      // Вычисляем ширину события
      const width = ((eventEnd - eventStart) / timeStepMs) * slotWidth;

      return {
        left: Math.max(0, left),
        width: Math.max(20, width), // Минимальная ширина 20px
      };
    },
    [timeScale, slotWidth],
  );

  // Обработка прокрутки и определение видимых колбасок + загрузка событий
  useEffect(() => {
    const body = bodyRef.current;
    const header = headerRef.current;
    if (!body || !header) return;

    const updateVisibleEvents = () => {
      const visible = new Set<number>();
      const bodyRect = body.getBoundingClientRect();
      const scrollLeft = body.scrollLeft;
      const scrollRight = scrollLeft + body.clientWidth;

      // Находим все колбаски и проверяем их видимость
      const eventBars = body.querySelectorAll<HTMLElement>('.events-timeline-event-bar');
      eventBars.forEach((bar) => {
        const barLeft = bar.offsetLeft;
        const barRight = barLeft + bar.offsetWidth;
        const eventId = parseInt(bar.getAttribute('data-event-id') || '0');
        
        // Колбаска видна, если пересекается с видимой областью
        if (barRight > scrollLeft && barLeft < scrollRight && eventId > 0) {
          visible.add(eventId);
        }
      });

      setVisibleEventIds(visible);
    };

    const handleScroll = () => {
      setScrollLeft(body.scrollLeft);
      setScrollTop(body.scrollTop);
      if (header.scrollLeft !== body.scrollLeft) {
        header.scrollLeft = body.scrollLeft;
      }
      updateVisibleEvents();

      // Загружаем события для нового видимого диапазона
      if (onLoadEventsRange) {
        const viewportWidth = body.clientWidth;
        const buffer = viewportWidth * 3; // Буфер по 3 экрана с каждой стороны
        
        const startPixel = Math.max(0, body.scrollLeft - buffer);
        const endPixel = body.scrollLeft + viewportWidth + buffer;

        const timeStepMs = getTimeStepMs(timeScale);
        const startDate = new Date(TIMELINE_EPOCH.getTime() + (startPixel / slotWidth) * timeStepMs);
        const endDate = new Date(TIMELINE_EPOCH.getTime() + (endPixel / slotWidth) * timeStepMs);

        normalizeDateToPeriod(startDate, timeScale, 'start');
        normalizeDateToPeriod(endDate, timeScale, 'end');

        // Загружаем только если диапазон изменился значительно
        const lastRange = lastLoadedRangeRef.current;
        if (!lastRange || 
            Math.abs(startDate.getTime() - lastRange.start.getTime()) > timeStepMs * 10 ||
            Math.abs(endDate.getTime() - lastRange.end.getTime()) > timeStepMs * 10) {
          lastLoadedRangeRef.current = { start: startDate, end: endDate };
          onLoadEventsRange(startDate, endDate);
        }
      }
    };

    body.addEventListener('scroll', handleScroll);
    // Обновляем видимость при изменении размеров или событий
    const resizeObserver = new ResizeObserver(updateVisibleEvents);
    resizeObserver.observe(body);
    
    // Первоначальное обновление
    updateVisibleEvents();
    
    // Первоначальная загрузка событий
    if (onLoadEventsRange) {
      const viewportWidth = body.clientWidth;
      const buffer = viewportWidth * 3;
      const startPixel = Math.max(0, body.scrollLeft - buffer);
      const endPixel = body.scrollLeft + viewportWidth + buffer;
      const timeStepMs = getTimeStepMs(timeScale);
      const startDate = new Date(TIMELINE_EPOCH.getTime() + (startPixel / slotWidth) * timeStepMs);
      const endDate = new Date(TIMELINE_EPOCH.getTime() + (endPixel / slotWidth) * timeStepMs);
      normalizeDateToPeriod(startDate, timeScale, 'start');
      normalizeDateToPeriod(endDate, timeScale, 'end');
      lastLoadedRangeRef.current = { start: startDate, end: endDate };
      onLoadEventsRange(startDate, endDate);
    }
    
    return () => {
      body.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [events, eventRows, timeScale, slotWidth, onLoadEventsRange]);

  useEffect(() => {
    const header = headerRef.current;
    if (header && header.scrollLeft !== scrollLeft) {
      header.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  // Устанавливаем начальную позицию прокрутки на текущую дату
  useEffect(() => {
    const body = bodyRef.current;
    if (body && scrollLeft === 0) {
      const now = new Date();
      const nowTime = now.getTime();
      const epochTime = TIMELINE_EPOCH.getTime();
      const timeStepMs = getTimeStepMs(timeScale);
      const position = ((nowTime - epochTime) / timeStepMs) * slotWidth;
      body.scrollLeft = position - body.clientWidth / 2;
      setScrollLeft(position - body.clientWidth / 2);
    }
  }, [timeScale, slotWidth]); // Только при изменении масштаба

  const animateScrollLeftTo = useCallback((target: number, durationMs = 180) => {
    const body = bodyRef.current;
    if (!body) return;

    const start = body.scrollLeft;
    const end = Math.max(0, target);
    if (Math.abs(end - start) < 0.5) return;

    if (scrollAnimRef.current != null) cancelAnimationFrame(scrollAnimRef.current);

    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = easeOutCubic(t);
      body.scrollLeft = start + (end - start) * eased;
      if (t < 1) {
        scrollAnimRef.current = requestAnimationFrame(tick);
      } else {
        scrollAnimRef.current = null;
      }
    };

    scrollAnimRef.current = requestAnimationFrame(tick);
  }, []);

  const animateZoomTo = useCallback((targetZoom: number, durationMs = 220) => {
    const body = bodyRef.current;
    if (!body) return;

    const startZoom = zoomRef.current;
    const endZoom = Math.max(0.1, Math.min(10, targetZoom));
    if (Math.abs(endZoom - startZoom) < 0.0000001) return;

    if (zoomAnimRef.current != null) cancelAnimationFrame(zoomAnimRef.current);

    // Фиксируем дату (время) в центре экрана
    const viewportCenterX = body.clientWidth / 2;
    const centerPixel = body.scrollLeft + viewportCenterX;
    const startScale = getTimeScaleForZoom(startZoom);
    const startSlotW = getSlotWidthForZoom(startScale, startZoom);
    const startStep = getTimeStepMs(startScale);
    const centerTimeMs = TIMELINE_EPOCH.getTime() + (centerPixel / startSlotW) * startStep;

    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = easeOutCubic(t);
      const z = startZoom + (endZoom - startZoom) * eased;

      zoomRef.current = z;
      setZoomLevel(z);

      const scale = getTimeScaleForZoom(z);
      const slotW = getSlotWidthForZoom(scale, z);
      const step = getTimeStepMs(scale);
      const newCenterPos = ((centerTimeMs - TIMELINE_EPOCH.getTime()) / step) * slotW;
      body.scrollLeft = newCenterPos - viewportCenterX;

      if (t < 1) {
        zoomAnimRef.current = requestAnimationFrame(tick);
      } else {
        zoomAnimRef.current = null;
      }
    };

    zoomAnimRef.current = requestAnimationFrame(tick);
  }, []);

  // Обработка колесика мыши для масштабирования
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        // Масштабирование (плавная анимация) от центра экрана
        e.preventDefault();
        const zoomStep = 0.1 / 19; // ≈ 0.00526
        const nextZoom =
          e.deltaY > 0
            ? zoomRef.current * (1 - zoomStep)
            : zoomRef.current * (1 + zoomStep);
        animateZoomTo(nextZoom);
      } else if (e.ctrlKey || e.metaKey) {
        // Горизонтальная прокрутка (плавная анимация)
        e.preventDefault();
        animateScrollLeftTo(body.scrollLeft + e.deltaY);
      }
      // Вертикальная прокрутка работает по умолчанию
    };

    body.addEventListener('wheel', handleWheel, { passive: false });
    return () => body.removeEventListener('wheel', handleWheel);
  }, [animateScrollLeftTo, animateZoomTo]);

  // Тот же wheel-хэндлер на заголовке
  useEffect(() => {
    const header = headerRef.current;
    const body = bodyRef.current;
    if (!header || !body) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        const zoomStep = 0.1 / 19; // ≈ 0.00526
        const nextZoom =
          e.deltaY > 0
            ? zoomRef.current * (1 - zoomStep)
            : zoomRef.current * (1 + zoomStep);
        animateZoomTo(nextZoom);
      } else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        animateScrollLeftTo(body.scrollLeft + e.deltaY);
      }
    };

    header.addEventListener('wheel', handleWheel, { passive: false });
    return () => header.removeEventListener('wheel', handleWheel);
  }, [animateScrollLeftTo, animateZoomTo]);

  // Обработка клавиатуры
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
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const zoomStep = 0.1 / 19; // ≈ 0.00526
        setZoomLevel((prev) => Math.min(10, prev * (1 + zoomStep)));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const zoomStep = 0.1 / 19; // ≈ 0.00526
        setZoomLevel((prev) => Math.max(0.1, prev * (1 - zoomStep)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleToday = () => {
    if (bodyRef.current) {
      const now = new Date();
      const nowTime = now.getTime();
      const epochTime = TIMELINE_EPOCH.getTime();
      const timeStepMs = getTimeStepMs(timeScale);
      const position = ((nowTime - epochTime) / timeStepMs) * slotWidth;
      bodyRef.current.scrollLeft = position - bodyRef.current.clientWidth / 2;
    }
  };

  const handleResetZoom = useCallback(() => {
    // Устанавливаем масштаб по умолчанию (zoomLevel = 1, что соответствует 30 дням)
    setZoomLevel(1);
    // Прокручиваем к текущей дате после изменения масштаба
    setTimeout(() => {
      if (bodyRef.current) {
        const now = new Date();
        const nowTime = now.getTime();
        const epochTime = TIMELINE_EPOCH.getTime();
        const defaultTimeScale: TimeScale = 'day';
        const timeStepMs = getTimeStepMs(defaultTimeScale);
        const defaultSlotWidth = 120 * 1; // zoomLevel = 1
        const position = ((nowTime - epochTime) / timeStepMs) * defaultSlotWidth;
        bodyRef.current.scrollLeft = position - bodyRef.current.clientWidth / 2;
        setScrollLeft(position - bodyRef.current.clientWidth / 2);
      }
    }, 100); // Небольшая задержка для применения нового масштаба
  }, []);

  if (loading && events.length === 0) {
    return (
      <div className="panel-body">
        <div className="empty-state">Загрузка мероприятий...</div>
      </div>
    );
  }

  return (
    <div className="events-timeline-view">
      <div className="events-timeline-toolbar">
        <button className="button-secondary" onClick={handleToday}>
          Сегодня
        </button>
        <div className="events-timeline-zoom">
          <span>Масштаб: {zoomLevel.toFixed(3)}×</span>
          <button className="button-secondary" onClick={() => {
            const zoomStep = 0.1 / 19; // ≈ 0.00526
            setZoomLevel((z) => Math.min(10, z * (1 + zoomStep)));
          }}>
            +
          </button>
          <button className="button-secondary" onClick={() => {
            const zoomStep = 0.1 / 19; // ≈ 0.00526
            setZoomLevel((z) => Math.max(0.1, z * (1 - zoomStep)));
          }}>
            −
          </button>
          <button className="button-secondary" onClick={handleResetZoom} title="Сброс масштаба (30 дней)">
            ↺
          </button>
        </div>
        <div className="events-timeline-hint">
          Shift+колесико: масштаб | Ctrl+колесико: горизонтальная прокрутка
        </div>
      </div>
      <div className="events-timeline-container">
        <div 
          className="events-timeline-header" 
          ref={headerRef}
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: isDraggingHeader ? 'grabbing' : 'grab' }}
        >
          <div className="events-timeline-header-inner" style={{ width: totalWidth }}>
            {timeScale === 'day' && (
              <div className="events-timeline-header-months">
                {monthGroups.map((g) => (
                  <div
                    key={g.key}
                    className="events-timeline-header-month"
                    style={{ width: `${g.width}px` }}
                    title={g.label}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
            )}

            <div className="events-timeline-header-days">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot.date.getTime()}
                  className={`events-timeline-header-slot ${slot.isWeekend ? 'events-timeline-header-slot-weekend' : ''}`}
                  style={{ width: `${slot.width}px` }}
                >
                  {timeScale === 'day' && 'dayOfWeek' in slot ? (
                    <div className="events-timeline-header-day">
                      <div className="events-timeline-header-day-number">{slot.label}</div>
                      <div className="events-timeline-header-day-weekday">{slot.dayOfWeek}</div>
                    </div>
                  ) : (
                    slot.label
                  )}
                </div>
              ))}
            </div>

            {todayPosition >= 0 && todayPosition <= totalWidth && (
              <div
                className="events-timeline-today-marker"
                style={{ left: `${todayPosition}px` }}
              >
                <div className="events-timeline-today-line" />
                <div className="events-timeline-today-label">Сегодня</div>
              </div>
            )}
          </div>
        </div>
        <div className="events-timeline-body" ref={bodyRef}>
          <div className="events-timeline-body-inner" style={{ width: `${totalWidth}px`, maxWidth: 'none' }}>
            {eventRows.map((row, rowIndex) => (
              <div key={rowIndex} className="events-timeline-row">
                {row.map((event) => {
                  const pos = getEventPosition(event);
                  const isVisible = event.id ? visibleEventIds.has(event.id) : false;
                  const bodyRect = bodyRef.current?.getBoundingClientRect();
                  // Используем state scrollLeft для обновления при прокрутке
                  const currentScrollLeft = scrollLeft;
                  // Название показываем всегда, если колбаска видна в контейнере
                  const showTitle = isVisible;
                  
                  // Вычисляем максимальную ширину названия колбаски, чтобы оно не выходило за правую границу контейнера
                  const maxTitleWidth = bodyRect ? (() => {
                    const barLeftRelativeToViewport = pos.left - currentScrollLeft;
                    const availableWidth = bodyRect.width - barLeftRelativeToViewport;
                    // Ограничиваем ширину названия, чтобы оно не выходило за правую границу
                    return Math.max(0, Math.min(availableWidth - 16, pos.width - 16)); // 16px для padding
                  })() : pos.width;
                  
                  return (
                    <Fragment key={event.id ?? `${event.title}-${pos.left}-${pos.width}`}>
                      {/* Название события с sticky позиционированием - показывается только когда колбаска видна */}
                      {showTitle && (
                        <div
                          key={`title-${event.id}`}
                          className="events-timeline-event-title-sticky"
                          style={{
                            position: 'sticky',
                            left: 0,
                            height: '28px',
                            zIndex: 20,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '4px',
                            paddingRight: '8px',
                          }}
                          data-event-id={event.id}
                        >
                          <span
                            className="events-timeline-event-title-text"
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '200px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {event.title}
                          </span>
                        </div>
                      )}
                      {/* Колбаска события */}
                      <EventBar
                        key={event.id}
                        event={event}
                        style={{
                          position: 'absolute',
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          maxWidth: bodyRect ? `${Math.min(pos.width, maxTitleWidth + 16)}px` : `${pos.width}px`,
                          top: '2px',
                          height: '28px',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          '--max-title-width': `${maxTitleWidth}px`,
                        } as React.CSSProperties}
                        onClick={onEventClick}
                        onMouseEnter={(e) => {
                          if (event.id) {
                            setHoveredEventId(event.id);
                            // Задержка перед показом tooltip
                            if (tooltipTimeoutRef.current) {
                              clearTimeout(tooltipTimeoutRef.current);
                            }
                            tooltipTimeoutRef.current = setTimeout(() => {
                              setTooltipEvent({ 
                                event, 
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
                        isHovered={event.id === hoveredEventId}
                        showTooltip={false}
                        className="events-timeline-event-bar"
                        data-event-id={event.id}
                      />
                    </Fragment>
                  );
                })}
              </div>
            ))}
            {eventRows.length === 0 && (
              <div className="events-timeline-empty">
                <div className="empty-state">Нет мероприятий в выбранном периоде</div>
              </div>
            )}
          </div>
        </div>
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
            <div>Начало: {new Date(tooltipEvent.event.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(tooltipEvent.event.startDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Окончание: {new Date(tooltipEvent.event.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(tooltipEvent.event.endDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
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
