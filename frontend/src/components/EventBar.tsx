/**
 * @file: EventBar.tsx
 * @description: Компонент колбаски мероприятия для отображения в календарях
 * @dependencies: services/api.ts
 * @created: 2026-01-28
 */

import { useState, useRef, useEffect } from 'react';
import type { EventDto } from '../services/api';

// Более темные и менее насыщенные цвета
const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--status-draft, #64748b)', // Темнее серый
  request: 'var(--status-request, #2563eb)', // Темнее синий
  in_work: 'var(--status-in-work, #d97706)', // Темнее оранжевый
  completed: 'var(--status-completed, #059669)', // Темнее зеленый
  canceled: 'var(--status-canceled, #dc2626)', // Темнее красный
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

interface EventBarProps {
  event: EventDto;
  style?: React.CSSProperties;
  onClick?: (event: EventDto) => void;
  onResizeStart?: (event: EventDto, edge: 'start' | 'end') => void;
  onResize?: (event: EventDto, edge: 'start' | 'end', newDate: Date) => void;
  onMove?: (event: EventDto, newStartDate: Date) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  isHovered?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function EventBar({ 
  event, 
  style, 
  onClick, 
  onResizeStart,
  onResize,
  onMove,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  isHovered: externalIsHovered,
  showTooltip: externalShowTooltip = true,
  className = '' 
}: EventBarProps) {
  const [isHoveredLocal, setIsHoveredLocal] = useState(false);
  const isHovered = externalIsHovered !== undefined ? externalIsHovered : isHoveredLocal;
  const [showTooltipLocal, setShowTooltipLocal] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTooltip = externalShowTooltip === false ? false : showTooltipLocal;
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, date: new Date() });

  const statusColor = STATUS_COLORS[event.status] || '#888';
  const statusLabel = STATUS_LABELS[event.status] || event.status;

  // Определяем контрастный цвет текста
  const getTextColor = (bgColor: string): string => {
    // Простая проверка яркости
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0] || '128');
      const g = parseInt(rgb[1] || '128');
      const b = parseInt(rgb[2] || '128');
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000' : '#fff';
    }
    return '#fff';
  };

  const textColor = getTextColor(statusColor);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:90',message:'Tooltip visibility useEffect triggered',data:{isHovered,externalIsHovered,externalShowTooltip,showTooltipLocal,eventId:event.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Работаем только с локальным состоянием, если внешнее не контролируется
    if (externalIsHovered !== undefined || externalShowTooltip === false) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:92',message:'Early return - external control',data:{externalIsHovered,externalShowTooltip},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return;
    }

    if (isHovered) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:96',message:'Setting timeout to show tooltip',data:{isHovered},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltipLocal(true);
      }, 500); // Задержка 500мс перед показом подсказки
    } else {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = undefined;
      }
      // Задержка исчезания подсказки
      const hideTimeout = setTimeout(() => {
        setShowTooltipLocal(false);
      }, 200);
      return () => clearTimeout(hideTimeout);
    }
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = undefined;
      }
    };
  }, [isHovered, externalIsHovered, externalShowTooltip]);

  // Позиционирование tooltip - фиксированная позиция относительно мышки
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:120',message:'Tooltip positioning useEffect triggered',data:{showTooltip,isHovered,tooltipPositionX:tooltipPosition.x,tooltipPositionY:tooltipPosition.y,eventId:event.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!showTooltip || !isHovered || !tooltipRef.current) return;

    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:127',message:'Setting tooltip position',data:{x:tooltipPosition.x,y:tooltipPosition.y},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Центрируем относительно мышки, позиция не меняется
    tooltipEl.style.left = `${tooltipPosition.x}px`;
    tooltipEl.style.right = 'auto';
    tooltipEl.style.transform = 'translate(-50%, -100%)';
    tooltipEl.classList.remove('tooltip-aligned-right');
  }, [showTooltip, isHovered, tooltipPosition.x, tooltipPosition.y]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:133',message:'handleMouseEnter called',data:{clientX:e.clientX,clientY:e.clientY,externalIsHovered,externalShowTooltip,eventId:event.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (externalIsHovered === undefined) {
      setIsHoveredLocal(true);
    }
    onMouseEnter?.(e);
    if (externalShowTooltip !== false) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltipLocal(true);
      }, 500);
      const rect = barRef.current?.getBoundingClientRect();
      if (rect) {
        // Обновляем позицию только если она изменилась
        if (tooltipPosition.x !== e.clientX || tooltipPosition.y !== e.clientY) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:144',message:'Setting tooltipPosition',data:{x:e.clientX,y:e.clientY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setTooltipPosition({ x: e.clientX, y: e.clientY });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    onMouseMove?.(e);
    // Позиция tooltip не меняется при движении мыши
  };

  const handleMouseLeave = () => {
    if (externalIsHovered === undefined) {
      setIsHoveredLocal(false);
    }
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    // Небольшая задержка перед скрытием, чтобы дать время перейти на tooltip
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current);
    }
    hideTooltipTimeoutRef.current = setTimeout(() => {
      // Скрываем tooltip только если курсор не на tooltip
      if (!isTooltipHovered) {
        setShowTooltipLocal(false);
      }
    }, 100);
    onMouseLeave?.();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Только левая кнопка мыши
    
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const edgeThreshold = 10; // Порог для определения края (10px)

    if (x < edgeThreshold) {
      // Начало колбаски
      setDragType('start');
      setIsDragging(true);
      onResizeStart?.(event, 'start');
      dragStartPos.current = { x: e.clientX, y: e.clientY, date: new Date(event.startDate) };
    } else if (x > rect.width - edgeThreshold) {
      // Конец колбаски
      setDragType('end');
      setIsDragging(true);
      onResizeStart?.(event, 'end');
      dragStartPos.current = { x: e.clientX, y: e.clientY, date: new Date(event.endDate) };
    } else {
      // Перемещение всей колбаски
      setDragType('move');
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY, date: new Date(event.startDate) };
    }

    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventBar.tsx:206',message:'Drag useEffect triggered',data:{isDragging,dragType,eventId:event.id,eventTitle:event.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current || !dragType) return;

      const parent = barRef.current.parentElement;
      if (!parent) return;

      // Здесь нужно будет реализовать логику определения новой даты
      // на основе позиции мыши и контекста календаря
      // Пока оставляем заглушку
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, event]);

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

  return (
    <>
      <div
        ref={barRef}
        className={`event-bar ${className} ${isHovered ? 'event-bar-hovered' : ''} ${isDragging ? 'event-bar-dragging' : ''}`}
        style={{
          backgroundColor: statusColor,
          color: textColor,
          ...style,
        }}
        onClick={(e) => {
          if (!isDragging && onClick) {
            onClick(event);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        title={event.title}
        data-event-id={event.id}
      >
        <span className="event-bar-title">{event.title}</span>
        {dragType === 'start' && (
          <div className="event-bar-resize-handle event-bar-resize-handle-start" />
        )}
        {dragType === 'end' && (
          <div className="event-bar-resize-handle event-bar-resize-handle-end" />
        )}
      </div>
      {showTooltip && isHovered && externalShowTooltip !== false && (
        <div
          ref={tooltipRef}
          className="event-bar-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
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
            if (externalShowTooltip !== false) {
              setShowTooltipLocal(true);
            }
          }}
          onMouseLeave={() => {
            setIsTooltipHovered(false);
            // Небольшая задержка перед скрытием
            if (hideTooltipTimeoutRef.current) {
              clearTimeout(hideTooltipTimeoutRef.current);
            }
            hideTooltipTimeoutRef.current = setTimeout(() => {
              setShowTooltipLocal(false);
            }, 100);
          }}
        >
          <div className="event-bar-tooltip-title">{event.title}</div>
          <div className="event-bar-tooltip-status">{statusLabel}</div>
          <div className="event-bar-tooltip-dates">
            <div>Начало: {formatDate(event.startDate)} {formatTime(event.startDate)}</div>
            <div>Окончание: {formatDate(event.endDate)} {formatTime(event.endDate)}</div>
          </div>
          {event.contractPrice > 0 && (
            <div className="event-bar-tooltip-price">
              Бюджет: {event.contractPrice.toLocaleString('ru-RU')} ₽
            </div>
          )}
          {event.description && (
            <div className="event-bar-tooltip-description">{event.description}</div>
          )}
        </div>
      )}
    </>
  );
}
