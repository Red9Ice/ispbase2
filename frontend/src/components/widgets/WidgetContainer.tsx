/**
 * @file: WidgetContainer.tsx
 * @description: Контейнер для виджетов с свободным перетаскиванием и изменением размера
 * @features:
 *   - Свободное перемещение виджетов без привязки к сетке
 *   - Масштабирование по вертикали и горизонтали без ограничений
 *   - Перетаскивание только за заголовок виджета
 *   - Визуальная обратная связь при перетаскивании и масштабировании
 * @dependencies: react-draggable, react-resizable
 * @created: 2026-01-27
 * @updated: 2026-01-27 - Полная переработка: убран react-grid-layout, используется свободное позиционирование
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './WidgetContainer.css';
import type { WidgetConfig, WidgetType, WidgetPosition } from '../../types/widgets';
import { widgetRegistry } from './widgetRegistry';
import { useWidgetContext } from '../../contexts/WidgetContext';

// Отдельный компонент для виджета с поддержкой nodeRef
interface DraggableWidgetProps {
  widget: WidgetConfig;
  widgetProps: any;
  WidgetComponent: React.ComponentType<any>;
  isLocked: boolean;
  isDragging: boolean;
  isResizing: boolean;
  hasCollision: boolean;
  minWidth: number;
  minHeight: number;
  onDragStart: (widgetId: string) => void;
  onDrag: (widgetId: string, e: DraggableEvent, data: DraggableData) => void;
  onDragStop: (widgetId: string) => void;
  onResizeStart: (widgetId: string) => void;
  onResize: (widgetId: string, e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  onResizeStop: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
}

function DraggableWidget({
  widget,
  widgetProps,
  WidgetComponent,
  isLocked,
  isDragging,
  isResizing,
  hasCollision,
  minWidth,
  minHeight,
  onDragStart,
  onDrag,
  onDragStop,
  onResizeStart,
  onResize,
  onResizeStop,
  onRemoveWidget,
}: DraggableWidgetProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      disabled={isLocked}
      handle=".widget-header"
      position={{ x: widget.position.x, y: widget.position.y }}
      onStart={() => onDragStart(widget.id)}
      onDrag={(e, data) => onDrag(widget.id, e, data)}
      onStop={() => onDragStop(widget.id)}
      bounds="parent"
    >
      <div ref={nodeRef}>
        <Resizable
          width={widget.position.width}
          height={widget.position.height}
          minConstraints={[minWidth, minHeight]}
          maxConstraints={[Infinity, Infinity]}
          resizeHandles={['s', 'e', 'se']}
          onResizeStart={() => onResizeStart(widget.id)}
          onResize={(e, data) => onResize(widget.id, e, data)}
          onResizeStop={() => onResizeStop(widget.id)}
          disabled={isLocked}
        >
          <div
            className={`widget-wrapper ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${hasCollision ? 'collision' : ''}`}
            style={{
              width: widget.position.width,
              height: widget.position.height,
            }}
          >
            <div className={`widget-header ${isLocked ? 'locked' : ''}`}>
              <span className="widget-title">{widget.title}</span>
              <button
                className="widget-remove-btn"
                onClick={() => onRemoveWidget(widget.id)}
                title="Скрыть виджет"
              >
                ×
              </button>
            </div>
            <div className="widget-content">
              <WidgetComponent 
                id={widget.id} 
                onRemove={() => onRemoveWidget(widget.id)}
                {...widgetProps}
              />
            </div>
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
}

interface WidgetContainerProps {
  widgets: WidgetConfig[];
  onPositionChange: (widgetId: string, position: WidgetPosition) => void;
  onRemoveWidget: (widgetId: string) => void;
  onAddWidgets?: () => void;
  isLocked?: boolean;
  onAutoArrange?: (containerWidth: number, containerHeight: number) => void;
}

export function WidgetContainer({ 
  widgets, 
  onPositionChange, 
  onRemoveWidget,
  onAddWidgets,
  isLocked = false,
  onAutoArrange
}: WidgetContainerProps) {
  const visibleWidgets = useMemo(() => {
    const filtered = widgets
      .filter(w => w.visible)
      .filter(w => {
        // Валидация структуры виджета
        if (!w.position || typeof w.position.x !== 'number' || typeof w.position.y !== 'number' || 
            typeof w.position.width !== 'number' || typeof w.position.height !== 'number') {
          console.warn('Invalid widget position:', w);
          return false;
        }
        return true;
      });
    
    console.log('WidgetContainer - Total widgets:', widgets.length, 'Visible:', filtered.length);
    return filtered;
  }, [widgets]);
  
  const widgetContext = useWidgetContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [collisionWidgetId, setCollisionWidgetId] = useState<string | null>(null);

  // Экспортируем функцию для автоматического размещения через ref
  useEffect(() => {
    if (onAutoArrange && containerRef.current) {
      const handleAutoArrange = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          onAutoArrange(rect.width, rect.height || window.innerHeight - 200);
        }
      };
      
      // Сохраняем функцию в элементе для доступа извне
      (containerRef.current as any).autoArrange = handleAutoArrange;
    }
  }, [onAutoArrange]);

  // Если нет видимых виджетов, возвращаем null
  if (visibleWidgets.length === 0) {
    return null;
  }

  // Функция проверки коллизии между двумя прямоугольниками
  // Добавляем небольшой отступ (10px) между виджетами
  const WIDGET_SPACING = 10;
  
  const checkCollision = useCallback((
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean => {
    // Учитываем отступ между виджетами
    return !(
      rect1.x + rect1.width + WIDGET_SPACING <= rect2.x ||
      rect2.x + rect2.width + WIDGET_SPACING <= rect1.x ||
      rect1.y + rect1.height + WIDGET_SPACING <= rect2.y ||
      rect2.y + rect2.height + WIDGET_SPACING <= rect1.y
    );
  }, []);

  // Функция поиска коллизий с другими виджетами
  const findCollisions = useCallback((
    widgetId: string,
    position: WidgetPosition
  ): WidgetConfig[] => {
    return visibleWidgets.filter(w => {
      if (w.id === widgetId) return false;
      return checkCollision(
        {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
        },
        {
          x: w.position.x,
          y: w.position.y,
          width: w.position.width,
          height: w.position.height,
        }
      );
    });
  }, [visibleWidgets, checkCollision]);

  const getWidgetProps = (widgetType: WidgetType) => {
    switch (widgetType) {
      case 'stats':
        return {
          dashboardData: widgetContext.dashboardData,
          eventsCount: widgetContext.events?.length ?? 0,
          staffCount: widgetContext.staffList?.length ?? 0,
        };
      case 'charts':
        return {
          eventsByStatus: widgetContext.dashboardData?.eventsByStatus ?? [],
          budgetTrend: widgetContext.dashboardData?.budgetTrend ?? [],
          staffUtilization: [
            { name: 'Техдир', utilization: 85 },
            { name: 'Координатор', utilization: 72 },
            { name: 'Свет', utilization: 68 },
            { name: 'Звук', utilization: 75 },
            { name: 'Видео', utilization: 60 },
          ],
        };
      case 'tasks':
        return {
          onTaskClick: widgetContext.onTaskClick,
          onCreateTask: widgetContext.onCreateTask,
          refreshTrigger: widgetContext.tasksRefreshTrigger,
        };
      case 'nearestEvents':
        return {
          events: widgetContext.dashboardData?.nearestEvents ?? [],
          onEventClick: widgetContext.onEventClick,
        };
      case 'activeStaff':
        return {
          staff: widgetContext.dashboardData?.activeStaffPreview ?? [],
          onStaffClick: widgetContext.onStaffClick,
        };
      default:
        return {};
    }
  };

  const handleDragStart = useCallback((widgetId: string) => {
    if (!isLocked) {
      setDraggingId(widgetId);
    }
  }, [isLocked]);

  const handleDrag = useCallback((widgetId: string, e: DraggableEvent, data: DraggableData) => {
    if (isLocked) return;
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const container = containerRef.current;
    if (!container) return;

    // Ограничиваем перемещение границами контейнера
    const containerRect = container.getBoundingClientRect();
    const maxX = containerRect.width - widget.position.width;
    const maxY = containerRect.height - widget.position.height;

    let newX = Math.max(0, Math.min(data.x, maxX));
    let newY = Math.max(0, Math.min(data.y, maxY));

    // Проверяем коллизии с другими виджетами
    const newPosition: WidgetPosition = {
      x: newX,
      y: newY,
      width: widget.position.width,
      height: widget.position.height,
    };

    const collisions = findCollisions(widgetId, newPosition);
    
    if (collisions.length > 0) {
      // Если есть коллизии, пытаемся найти ближайшую свободную позицию
      const collision = collisions[0];
      const collisionRect = {
        x: collision.position.x,
        y: collision.position.y,
        width: collision.position.width,
        height: collision.position.height,
      };

      let foundPosition = false;

      // Пробуем разместить виджет справа от коллизии
      const tryRightX = collisionRect.x + collisionRect.width + WIDGET_SPACING;
      if (tryRightX + widget.position.width <= containerRect.width) {
        const rightPosition: WidgetPosition = {
          ...newPosition,
          x: tryRightX,
        };
        if (findCollisions(widgetId, rightPosition).length === 0) {
          newX = tryRightX;
          newY = newPosition.y;
          foundPosition = true;
        }
      }

      // Если справа не получилось, пробуем снизу
      if (!foundPosition) {
        const tryBottomY = collisionRect.y + collisionRect.height + WIDGET_SPACING;
        if (tryBottomY + widget.position.height <= containerRect.height) {
          const bottomPosition: WidgetPosition = {
            ...newPosition,
            y: tryBottomY,
          };
          if (findCollisions(widgetId, bottomPosition).length === 0) {
            newY = tryBottomY;
            newX = newPosition.x;
            foundPosition = true;
          }
        }
      }

      // Если все еще есть коллизии, не обновляем позицию
      if (!foundPosition) {
        const finalPosition: WidgetPosition = {
          x: newX,
          y: newY,
          width: widget.position.width,
          height: widget.position.height,
        };
        
        const finalCollisions = findCollisions(widgetId, finalPosition);
        if (finalCollisions.length > 0) {
          // Показываем визуальную обратную связь о коллизии
          setCollisionWidgetId(widgetId);
          // Возвращаемся к предыдущей позиции
          return;
        }
      }
    }

    // Сбрасываем индикатор коллизии при успешном перемещении
    if (collisionWidgetId === widgetId) {
      setCollisionWidgetId(null);
    }

    onPositionChange(widgetId, {
      ...widget.position,
      x: newX,
      y: newY,
    });
  }, [widgets, isLocked, onPositionChange, findCollisions, collisionWidgetId]);

  const handleDragStop = useCallback((widgetId: string) => {
    setDraggingId(null);
    setCollisionWidgetId(null);
  }, []);

  const handleResizeStart = useCallback((widgetId: string) => {
    if (!isLocked) {
      setResizingId(widgetId);
    }
  }, [isLocked]);

  const handleResize = useCallback((
    widgetId: string,
    e: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => {
    if (isLocked) return;

    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const container = containerRef.current;
    if (!container) return;

    const config = widgetRegistry[widget.type];
    const minWidth = config?.minSize?.w ? config.minSize.w * 80 : 100;
    const minHeight = config?.minSize?.h ? config.minSize.h * 60 : 60;

    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - widget.position.x;
    const maxHeight = containerRect.height - widget.position.y;

    let newWidth = Math.max(minWidth, Math.min(data.size.width, maxWidth));
    let newHeight = Math.max(minHeight, Math.min(data.size.height, maxHeight));

    // Проверяем коллизии с другими виджетами при изменении размера
    const newPosition: WidgetPosition = {
      x: widget.position.x,
      y: widget.position.y,
      width: newWidth,
      height: newHeight,
    };

    const collisions = findCollisions(widgetId, newPosition);
    
    if (collisions.length > 0) {
      // Если есть коллизии, ограничиваем размер до границы первого столкновения
      const collision = collisions[0];
      
      // Ограничиваем ширину
      if (newPosition.x + newWidth > collision.position.x) {
        newWidth = Math.max(minWidth, collision.position.x - newPosition.x - WIDGET_SPACING);
      }
      
      // Ограничиваем высоту
      if (newPosition.y + newHeight > collision.position.y) {
        newHeight = Math.max(minHeight, collision.position.y - newPosition.y - WIDGET_SPACING);
      }

      // Проверяем еще раз после ограничения
      const limitedPosition: WidgetPosition = {
        x: widget.position.x,
        y: widget.position.y,
        width: newWidth,
        height: newHeight,
      };

      const finalCollisions = findCollisions(widgetId, limitedPosition);
      if (finalCollisions.length > 0) {
        // Показываем визуальную обратную связь о коллизии
        setCollisionWidgetId(widgetId);
        // Если все еще есть коллизии, не изменяем размер
        return;
      }
    }

    // Сбрасываем индикатор коллизии при успешном изменении размера
    if (collisionWidgetId === widgetId) {
      setCollisionWidgetId(null);
    }

    onPositionChange(widgetId, {
      ...widget.position,
      width: newWidth,
      height: newHeight,
    });
  }, [widgets, isLocked, onPositionChange, findCollisions, collisionWidgetId]);

  const handleResizeStop = useCallback((widgetId: string) => {
    setResizingId(null);
    setCollisionWidgetId(null);
  }, []);

  if (!visibleWidgets || visibleWidgets.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="widget-container"
      style={{ position: 'relative', width: '100%', minHeight: '100vh' }}
    >
      {visibleWidgets.map((widget) => {
        try {
          const WidgetComponent = widgetRegistry[widget.type]?.component;
          if (!WidgetComponent) {
            console.warn(`Widget component not found for type: ${widget.type}`);
            return null;
          }

          // Валидация позиции виджета
          if (!widget.position || 
              typeof widget.position.x !== 'number' || 
              typeof widget.position.y !== 'number' || 
              typeof widget.position.width !== 'number' || 
              typeof widget.position.height !== 'number' ||
              widget.position.width <= 0 ||
              widget.position.height <= 0) {
            console.error('Invalid widget position:', widget);
            return null;
          }

          const widgetProps = getWidgetProps(widget.type);
          const config = widgetRegistry[widget.type];
          const minWidth = config?.minSize?.w ? config.minSize.w * 80 : 100;
          const minHeight = config?.minSize?.h ? config.minSize.h * 60 : 60;
          const isDragging = draggingId === widget.id;
          const isResizing = resizingId === widget.id;
          const hasCollision = collisionWidgetId === widget.id;

          return (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              widgetProps={widgetProps}
              WidgetComponent={WidgetComponent}
              isLocked={isLocked}
              isDragging={isDragging}
              isResizing={isResizing}
              hasCollision={hasCollision}
              minWidth={minWidth}
              minHeight={minHeight}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragStop={handleDragStop}
              onResizeStart={handleResizeStart}
              onResize={handleResize}
              onResizeStop={handleResizeStop}
              onRemoveWidget={onRemoveWidget}
            />
          );
        } catch (error) {
          console.error(`Error rendering widget ${widget.id}:`, error);
          return null;
        }
      })}
    </div>
  );
}
