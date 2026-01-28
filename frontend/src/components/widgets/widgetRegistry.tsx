/**
 * @file: widgetRegistry.tsx
 * @description: Реестр всех доступных виджетов
 * @created: 2026-01-27
 */

import type { WidgetRegistry } from '../../types/widgets';
import { StatsWidget } from './StatsWidget';
import { ChartsWidget } from './ChartsWidget';
import { TasksWidget } from './TasksWidget';
import { NearestEventsWidget } from './NearestEventsWidget';
import { ActiveStaffWidget } from './ActiveStaffWidget';
import { ClockWidget } from './ClockWidget';
import { WeatherWidget } from './WeatherWidget';

export const widgetRegistry: WidgetRegistry = {
  stats: {
    title: 'Статистика',
    component: StatsWidget,
    defaultSize: { w: 6, h: 4 }, // Увеличено для отображения всех 8 карточек статистики
    minSize: { w: 3, h: 2 },
    description: 'Основные показатели системы: события, персонал, бюджет, оборудование',
  },
  charts: {
    title: 'Графики',
    component: ChartsWidget,
    defaultSize: { w: 8, h: 6 }, // Увеличено для лучшего отображения графиков
    minSize: { w: 3, h: 3 },
    description: 'Визуализация данных: события по статусам, динамика бюджета, загрузка персонала',
  },
  tasks: {
    title: 'Задачи',
    component: TasksWidget,
    defaultSize: { w: 8, h: 6 }, // Увеличено для лучшего отображения канбан-доски
    minSize: { w: 4, h: 4 },
    description: 'Канбан-доска для управления задачами',
  },
  nearestEvents: {
    title: 'Ближайшие события',
    component: NearestEventsWidget,
    defaultSize: { w: 6, h: 5 }, // Увеличено для отображения большего количества событий
    minSize: { w: 3, h: 3 },
    description: 'Список предстоящих мероприятий',
  },
  activeStaff: {
    title: 'Активный персонал',
    component: ActiveStaffWidget,
    defaultSize: { w: 6, h: 5 }, // Увеличено для отображения большего количества сотрудников
    minSize: { w: 3, h: 3 },
    description: 'Список активных сотрудников',
  },
  clock: {
    title: 'Часы',
    component: ClockWidget,
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 3 },
    maxSize: { w: 3, h: 4 },
    description: 'Текущее время и дата',
  },
  weather: {
    title: 'Погода',
    component: WeatherWidget,
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 3, h: 4 },
    description: 'Погода по текущему местоположению',
  },
};
