/**
 * @file: useWidgets.ts
 * @description: Хук для управления виджетами dashboard с сохранением в localStorage
 * @created: 2026-01-27
 * @updated: 2026-01-27 - Обновлен для работы с позициями в пикселях вместо grid units
 */

import { useState, useEffect, useCallback } from 'react';
import type { WidgetConfig, WidgetType, WidgetPosition } from '../types/widgets';
import { widgetRegistry } from '../components/widgets/widgetRegistry';

const STORAGE_KEY = 'dashboard-widgets';

const generateWidgetId = (type: WidgetType, index: number) => `${type}-${index}`;

// Конвертируем grid units в пиксели (базовые значения)
const GRID_UNIT_TO_PX = 80; // 1 grid unit = 80px
const ROW_HEIGHT = 70; // Высота одной строки в grid

// Миграция виджетов со старой структуры (layout) на новую (position)
const migrateWidget = (widget: any): WidgetConfig | null => {
  try {
    // Проверяем базовую структуру виджета
    if (!widget || !widget.id || !widget.type) {
      console.warn('Invalid widget structure:', widget);
      return null;
    }

    // Если виджет уже имеет новую структуру, валидируем и возвращаем
    if (widget.position && !widget.layout) {
      const position = widget.position;
      if (typeof position.x === 'number' && 
          typeof position.y === 'number' && 
          typeof position.width === 'number' && 
          typeof position.height === 'number' &&
          position.width > 0 &&
          position.height > 0) {
        return widget as WidgetConfig;
      } else {
        console.warn('Invalid position in widget, migrating:', widget);
      }
    }
    
    // Мигрируем со старой структуры
    if (widget.layout) {
      const oldLayout = widget.layout;
      if (typeof oldLayout.x === 'number' && 
          typeof oldLayout.y === 'number' && 
          typeof oldLayout.w === 'number' && 
          typeof oldLayout.h === 'number') {
        return {
          id: widget.id,
          type: widget.type,
          title: widget.title ?? 'Виджет',
          visible: widget.visible ?? false,
          position: {
            x: oldLayout.x * GRID_UNIT_TO_PX + (oldLayout.x * 20), // Учитываем отступы между виджетами
            y: oldLayout.y * ROW_HEIGHT + (oldLayout.y * 10), // Учитываем вертикальные отступы
            width: Math.max(100, oldLayout.w * GRID_UNIT_TO_PX),
            height: Math.max(60, oldLayout.h * ROW_HEIGHT),
          },
        };
      }
    }
    
    // Если структура не распознана, создаем дефолтную позицию
    const config = widgetRegistry[widget.type as WidgetType];
    if (!config) {
      console.warn('Widget type not found in registry:', widget.type);
      return null;
    }
    
    const defaultWidth = config.defaultSize.w ? config.defaultSize.w * GRID_UNIT_TO_PX : 240;
    const defaultHeight = config.defaultSize.h ? config.defaultSize.h * ROW_HEIGHT : 200;
    
    return {
      id: widget.id,
      type: widget.type,
      title: widget.title ?? config.title ?? 'Виджет',
      visible: widget.visible ?? false,
      position: {
        x: 0,
        y: 0,
        width: defaultWidth,
        height: defaultHeight,
      },
    };
  } catch (error) {
    console.error('Error migrating widget:', widget, error);
    return null;
  }
};

const getDefaultWidgets = (): WidgetConfig[] => {
  const defaultWidgets: WidgetConfig[] = [];
  const allTypes = Object.keys(widgetRegistry) as WidgetType[];

  // Создаем все виджеты, но по умолчанию они невидимы (пользователь выберет их на приветственном экране)
  allTypes.forEach((type, index) => {
    const config = widgetRegistry[type];
    const defaultWidth = config.defaultSize.w * GRID_UNIT_TO_PX;
    const defaultHeight = config.defaultSize.h * GRID_UNIT_TO_PX;
    
    defaultWidgets.push({
      id: generateWidgetId(type, index),
      type,
      title: config.title,
      visible: false, // По умолчанию все виджеты скрыты
      position: {
        x: (index % 4) * (defaultWidth + 20), // 20px отступ между виджетами
        y: Math.floor(index / 4) * (defaultHeight + 20),
        width: defaultWidth,
        height: defaultHeight,
      },
    });
  });

  return defaultWidgets;
};

export function useWidgets() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (!Array.isArray(parsed)) {
          console.warn('Invalid widgets data in localStorage, resetting to defaults');
          return getDefaultWidgets();
        }
        
        // Мигрируем все виджеты на новую структуру
        const migrated = parsed
          .map((w: any) => {
            try {
              return migrateWidget(w);
            } catch (error) {
              console.error('Failed to migrate widget:', w, error);
              return null;
            }
          })
          .filter((w: WidgetConfig | null): w is WidgetConfig => w !== null);
        
        // Проверяем, что все виджеты из реестра присутствуют
        const existingTypes = new Set(migrated.map((w: WidgetConfig) => w.type));
        const allTypes = Object.keys(widgetRegistry) as WidgetType[];
        
        // Добавляем отсутствующие виджеты
        allTypes.forEach((type) => {
          if (!existingTypes.has(type)) {
            const config = widgetRegistry[type];
            if (!config) return;
            
            const defaultWidth = config.defaultSize.w * GRID_UNIT_TO_PX;
            const defaultHeight = config.defaultSize.h * ROW_HEIGHT;
            
            const newWidget: WidgetConfig = {
              id: generateWidgetId(type, migrated.length),
              type,
              title: config.title,
              visible: false,
              position: {
                x: 0,
                y: migrated.length * (defaultHeight + 20),
                width: defaultWidth,
                height: defaultHeight,
              },
            };
            migrated.push(newWidget);
          }
        });
        
        return migrated;
      }
    } catch (error) {
      console.error('Failed to load widgets from localStorage:', error);
      // Очищаем поврежденные данные
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    return getDefaultWidgets();
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Сохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save widgets to localStorage:', error);
    }
  }, [widgets]);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => {
      const updated = prev.map((w) => {
        if (w.id === widgetId) {
          const newVisible = !w.visible;
          console.log('Toggling widget:', widgetId, 'from', w.visible, 'to', newVisible);
          return { ...w, visible: newVisible };
        }
        return w;
      });
      console.log('After toggle - visible widgets:', updated.filter(w => w.visible).length);
      return updated;
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, visible: false } : w)));
  }, []);

  const handlePositionChange = useCallback((widgetId: string, position: WidgetPosition) => {
    setWidgets((prev) =>
      prev.map((widget) => {
        if (widget.id === widgetId) {
          return { ...widget, position: { ...position } };
        }
        return widget;
      })
    );
  }, []);

  const addWidget = useCallback((type: WidgetType) => {
    const config = widgetRegistry[type];
    if (!config) return;

    const existingWidget = widgets.find((w) => w.type === type);
    if (existingWidget) {
      // Если виджет уже существует, просто делаем его видимым
      toggleWidget(existingWidget.id);
      return;
    }

    // Находим максимальную y координату для размещения нового виджета
    // Учитываем только видимые виджеты для правильного позиционирования
    const visibleWidgets = widgets.filter(w => w.visible);
    const maxY = visibleWidgets.length > 0 
      ? Math.max(...visibleWidgets.map((w) => w.position.y + w.position.height), 0)
      : 0;
    
    const defaultWidth = config.defaultSize.w * GRID_UNIT_TO_PX;
    const defaultHeight = config.defaultSize.h * ROW_HEIGHT;

    const newWidget: WidgetConfig = {
      id: generateWidgetId(type, widgets.length),
      type,
      title: config.title,
      visible: true, // Явно устанавливаем видимость
      position: {
        x: 20, // Небольшой отступ от края
        y: maxY + 20, // Добавляем отступ
        width: defaultWidth,
        height: defaultHeight,
      },
    };

    console.log('Adding new widget:', newWidget);
    setWidgets((prev) => {
      const updated = [...prev, newWidget];
      console.log('Updated widgets count:', updated.length, 'visible:', updated.filter(w => w.visible).length);
      return updated;
    });
  }, [widgets, toggleWidget]);

  const autoArrangeWidgets = useCallback((containerWidth: number, containerHeight: number) => {
    const visible = widgets.filter(w => w.visible);
    if (visible.length === 0) return;

    // Отступы между виджетами и от краев
    const padding = 20;
    const gap = 20;
    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2);

    // Вычисляем оптимальное количество колонок на основе среднего defaultSize виджетов
    // Используем реальные размеры виджетов для более точного расчета
    const avgDefaultWidth = visible.reduce((sum, w) => {
      const config = widgetRegistry[w.type];
      return sum + (config?.defaultSize?.w ? config.defaultSize.w * GRID_UNIT_TO_PX : 400);
    }, 0) / visible.length;
    
    let cols = Math.floor((availableWidth + gap) / (avgDefaultWidth + gap));
    cols = Math.max(1, Math.min(cols, visible.length)); // Минимум 1, максимум количество виджетов

    // Сортируем виджеты по приоритету размера (большие виджеты сначала)
    const sortedVisible = [...visible].sort((a, b) => {
      const configA = widgetRegistry[a.type];
      const configB = widgetRegistry[b.type];
      const sizeA = (configA?.defaultSize?.w || 3) * (configA?.defaultSize?.h || 3);
      const sizeB = (configB?.defaultSize?.w || 3) * (configB?.defaultSize?.h || 3);
      return sizeB - sizeA;
    });

    // Алгоритм плотной упаковки: заполняем строки слева направо, сверху вниз
    const positions: Array<{ x: number; y: number; width: number; height: number }> = [];
    const rowHeights: number[] = []; // Высота каждой строки
    let currentX = padding;
    let currentY = padding;
    let currentRow = 0;
    let maxRowHeight = 0;

    sortedVisible.forEach((widget) => {
      const config = widgetRegistry[widget.type];
      const minWidth = config?.minSize?.w ? config.minSize.w * GRID_UNIT_TO_PX : 200;
      const minHeight = config?.minSize?.h ? config.minSize.h * ROW_HEIGHT : 150;
      
      // Используем defaultSize как оптимальный размер для полной видимости контента
      // Это гарантирует, что вся информация в виджете будет видна
      const defaultWidth = config?.defaultSize?.w ? config.defaultSize.w * GRID_UNIT_TO_PX : 400;
      const defaultHeight = config?.defaultSize?.h ? config.defaultSize.h * ROW_HEIGHT : 300;

      // Вычисляем размер ячейки для текущей колонки
      const cellWidth = (availableWidth - (gap * (cols - 1))) / cols;
      
      // Приоритет: использовать defaultSize для полной видимости контента
      // Если defaultSize больше ячейки, используем ячейку, но не меньше минимального размера
      // Если defaultSize меньше ячейки, используем defaultSize для лучшей читаемости
      let widgetWidth = defaultWidth;
      
      // Если виджет слишком широкий для ячейки, ограничиваем, но не меньше минимального
      if (widgetWidth > cellWidth) {
        widgetWidth = Math.max(minWidth, cellWidth);
      }
      
      // Вычисляем высоту с сохранением пропорций из defaultSize
      const aspectRatio = defaultWidth / defaultHeight;
      let widgetHeight = widgetWidth / aspectRatio;
      
      // Обеспечиваем минимальную высоту для читаемости
      widgetHeight = Math.max(minHeight, widgetHeight);
      
      // Если высота получилась слишком большой из-за ограничения по ширине,
      // пересчитываем с учетом максимальной доступной высоты
      const maxAvailableHeight = availableHeight - (currentY - padding);
      if (widgetHeight > maxAvailableHeight && maxAvailableHeight > minHeight) {
        widgetHeight = maxAvailableHeight;
        widgetWidth = widgetHeight * aspectRatio;
        // Проверяем, что ширина не превышает доступное пространство
        if (widgetWidth > cellWidth) {
          widgetWidth = Math.max(minWidth, cellWidth);
          widgetHeight = widgetWidth / aspectRatio;
        }
      }

      // Проверяем, помещается ли виджет в текущую строку
      if (currentX + widgetWidth + gap > containerWidth - padding) {
        // Переходим на новую строку
        currentRow++;
        currentX = padding;
        currentY += maxRowHeight + gap;
        maxRowHeight = 0;
      }

      // Позиция виджета - плотно от левого верхнего угла
      const x = currentX;
      const y = currentY;

      positions.push({ x, y, width: widgetWidth, height: widgetHeight });

      // Обновляем позицию для следующего виджета
      currentX += widgetWidth + gap;
      maxRowHeight = Math.max(maxRowHeight, widgetHeight);
      rowHeights[currentRow] = maxRowHeight;
    });

    // Обновляем позиции и размеры всех виджетов
    const updatedWidgets = widgets.map((widget) => {
      if (!widget.visible) return widget;

      const widgetIndex = sortedVisible.findIndex(w => w.id === widget.id);
      if (widgetIndex === -1) return widget;

      const pos = positions[widgetIndex];

      return {
        ...widget,
        position: {
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
        },
      };
    });

    // Применяем изменения ко всем виджетам одновременно
    setWidgets(updatedWidgets);
    console.log('Auto-arranged widgets:', updatedWidgets.filter(w => w.visible).length);
  }, [widgets]);

  return {
    widgets,
    isEditMode,
    setIsEditMode,
    toggleWidget,
    removeWidget,
    handlePositionChange,
    addWidget,
    autoArrangeWidgets,
  };
}
