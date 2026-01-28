/**
 * @file: WidgetContainer.simple.tsx
 * @description: Упрощенная версия контейнера виджетов без GridLayout для диагностики
 * @created: 2026-01-27
 */

import { useMemo } from 'react';
import type { WidgetConfig, WidgetType } from '../../types/widgets';
import { widgetRegistry } from './widgetRegistry';
import { useWidgetContext } from '../../contexts/WidgetContext';
import './WidgetContainer.css';

interface WidgetContainerProps {
  widgets: WidgetConfig[];
  onLayoutChange: (layouts: any) => void;
  onRemoveWidget: (widgetId: string) => void;
  isEditMode?: boolean;
}

export function WidgetContainer({ 
  widgets, 
  onLayoutChange: _onLayoutChange, 
  onRemoveWidget,
  isEditMode = false 
}: WidgetContainerProps) {
  const widgetContext = useWidgetContext();
  const visibleWidgets = useMemo(() => widgets.filter(w => w.visible), [widgets]);

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

  if (visibleWidgets.length === 0) {
    return (
      <div className="widget-container">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Нет видимых виджетов. Нажмите кнопку "+ Виджеты" чтобы добавить виджеты на dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="widget-container">
      {visibleWidgets.map((widget) => {
        const WidgetComponent = widgetRegistry[widget.type]?.component;
        if (!WidgetComponent) {
          console.warn(`Widget component not found for type: ${widget.type}`);
          return null;
        }

        const widgetProps = getWidgetProps(widget.type);
        const config = widgetRegistry[widget.type];
        const defaultSize = config.defaultSize || { w: 3, h: 3 };
        
        // Вычисляем высоту на основе grid units
        // Базовый размер: ~80px для h=1
        const widgetHeight = `${defaultSize.h * 80}px`;

        return (
          <div 
            key={widget.id} 
            className="widget-wrapper"
            style={{ 
              minHeight: widgetHeight,
            }}
          >
            <div className="widget-header">
              <span className="widget-title">{widget.title}</span>
              {isEditMode && (
                <button
                  className="widget-remove-btn"
                  onClick={() => onRemoveWidget(widget.id)}
                  title="Скрыть виджет"
                >
                  ×
                </button>
              )}
            </div>
            <div className="widget-content">
              <WidgetComponent 
                id={widget.id} 
                onRemove={() => onRemoveWidget(widget.id)}
                {...widgetProps}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
