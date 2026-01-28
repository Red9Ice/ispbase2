/**
 * @file: widgets.ts
 * @description: Типы и интерфейсы для системы виджетов dashboard
 * @created: 2026-01-27
 * @updated: 2026-01-27 - Заменен LayoutItem на WidgetPosition для свободного позиционирования
 */

export type WidgetType = 
  | 'stats'
  | 'charts'
  | 'tasks'
  | 'nearestEvents'
  | 'activeStaff'
  | 'clock'
  | 'weather';

export interface WidgetPosition {
  x: number; // Позиция X в пикселях
  y: number; // Позиция Y в пикселях
  width: number; // Ширина в пикселях
  height: number; // Высота в пикселях
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  position: WidgetPosition; // Заменено layout на position
}

export interface WidgetProps {
  id: string;
  onRemove?: () => void;
}

export interface WidgetRegistry {
  [key: string]: {
    title: string;
    component: React.ComponentType<WidgetProps>;
    defaultSize: { w: number; h: number };
    minSize?: { w: number; h: number };
    maxSize?: { w: number; h: number };
    description?: string;
  };
}
