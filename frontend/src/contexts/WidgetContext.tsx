/**
 * @file: WidgetContext.tsx
 * @description: Контекст для передачи данных в виджеты
 * @created: 2026-01-27
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { EventDto, StaffDto, TaskStatus } from '../services/api';

interface WidgetContextData {
  dashboardData?: {
    eventCounts: Record<string, number>;
    staffActive: number;
    staffInactive: number;
    contractPrice: number; // Цена контракта (было budgetPlanned)
    budgetActual: number;
    equipmentTotal: number;
    equipmentAvailable: number;
    equipmentInUse: number;
    equipmentMaintenance: number;
    eventsByStatus: Array<{ name: string; value: number }>;
    budgetTrend: Array<{ month: string; planned: number; actual: number }>;
    nearestEvents: EventDto[];
    activeStaffPreview: StaffDto[];
  };
  events?: EventDto[];
  staffList?: StaffDto[];
  onTaskClick?: (taskId: number) => void;
  onCreateTask?: (status: TaskStatus) => void;
  onEventClick?: (eventId: number) => void;
  onStaffClick?: (staffId: number) => void;
  tasksRefreshTrigger?: number;
}

const WidgetContext = createContext<WidgetContextData>({});

export function WidgetProvider({ children, value }: { children: ReactNode; value: WidgetContextData }) {
  return <WidgetContext.Provider value={value}>{children}</WidgetContext.Provider>;
}

export function useWidgetContext() {
  return useContext(WidgetContext);
}
