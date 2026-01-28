/**
 * @file: Dashboard.tsx
 * @description: Компонент dashboard с системой виджетов и приветственным экраном
 * @dependencies: widgets, hooks/useWidgets, WelcomeScreen
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import { WidgetContainer } from './widgets/WidgetContainer';
import { WidgetManager } from './widgets/WidgetManager';
import { WelcomeScreen } from './widgets/WelcomeScreen';
import { ParticlesAnimation } from './widgets/ParticlesAnimation';
import { useWidgets } from '../hooks/useWidgets';
import { WidgetProvider } from '../contexts/WidgetContext';
import type { EventDto, StaffDto, TaskStatus } from '../services/api';
import type { WidgetType } from '../types/widgets';
import './Dashboard.css';

interface DashboardProps {
  dashboardData: {
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
  events: EventDto[];
  staffList: StaffDto[];
  onTaskClick?: (taskId: number) => void;
  onCreateTask?: (status: TaskStatus) => void;
  onEventClick?: (eventId: number) => void;
  onStaffClick?: (staffId: number) => void;
  tasksRefreshTrigger?: number;
  loading?: boolean;
  onShowWidgetManager?: () => void;
  onResetDashboard?: () => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
}

const DASHBOARD_SETUP_KEY = 'dashboard-setup-completed';

export function Dashboard({
  dashboardData,
  events,
  staffList,
  onTaskClick,
  onCreateTask,
  onEventClick,
  onStaffClick,
  tasksRefreshTrigger,
  loading = false,
  onShowWidgetManager,
  onResetDashboard,
  isLocked = false,
  onToggleLock,
}: DashboardProps) {
  const {
    widgets,
    toggleWidget,
    removeWidget,
    handlePositionChange,
    addWidget,
    autoArrangeWidgets,
  } = useWidgets();

  const [showWidgetManager, setShowWidgetManager] = useState(false);
  
  // Используем переданные функции или локальные
  const handleShowWidgetManager = () => {
    if (onShowWidgetManager) {
      onShowWidgetManager();
    } else {
      setShowWidgetManager(true);
    }
  };
  
  // Обработчик сброса dashboard
  const handleResetDashboard = () => {
    if (onResetDashboard) {
      onResetDashboard();
    } else {
      localStorage.removeItem(DASHBOARD_SETUP_KEY);
      localStorage.removeItem('dashboard-widgets');
      window.location.reload();
    }
  };
  
  // Определяем начальное состояние приветственного экрана
  // Простая логика: если флаг настройки не установлен, показываем приветственный экран
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => {
    const setupCompleted = localStorage.getItem(DASHBOARD_SETUP_KEY) === 'true';
    // Если настройка не завершена, всегда показываем приветственный экран
    return !setupCompleted;
  });

  // Определяем видимые виджеты
  const visibleWidgets = widgets.filter(w => w.visible);

  useEffect(() => {
    const visibleWidgetsCount = visibleWidgets.length;
    
    // Если есть видимые виджеты, скрываем приветственный экран и отмечаем настройку как завершенную
    if (visibleWidgetsCount > 0 && showWelcomeScreen) {
      console.log('Hiding welcome screen, widgets visible:', visibleWidgetsCount);
      setShowWelcomeScreen(false);
      localStorage.setItem(DASHBOARD_SETUP_KEY, 'true');
      // Прокручиваем страницу вверх после завершения настройки
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Если все виджеты закрыты, всегда показываем приветственный экран
    else if (visibleWidgetsCount === 0 && !showWelcomeScreen) {
      console.log('Showing welcome screen, no widgets visible');
      setShowWelcomeScreen(true);
    }
  }, [widgets, showWelcomeScreen, visibleWidgets]);

  // Прокрутка к началу страницы при первой загрузке dashboard
  useEffect(() => {
    // Прокручиваем к началу страницы при монтировании компонента
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Также прокручиваем после небольшой задержки на случай, если контент еще загружается
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []); // Выполняется только при монтировании

  // Отладочная информация (можно удалить после тестирования)
  useEffect(() => {
    console.log('Dashboard state:', {
      showWelcomeScreen,
      visibleWidgetsCount: visibleWidgets.length,
      setupCompleted: localStorage.getItem(DASHBOARD_SETUP_KEY),
      widgetsCount: widgets.length,
    });
  }, [showWelcomeScreen, visibleWidgets.length, widgets.length]);

  const handleStartSetup = () => {
    setShowWelcomeScreen(false);
    localStorage.setItem(DASHBOARD_SETUP_KEY, 'true');
  };

  const handleAddWidget = (type: WidgetType) => {
    addWidget(type);
    // После добавления виджета отмечаем настройку как завершенную
    localStorage.setItem(DASHBOARD_SETUP_KEY, 'true');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="empty-state">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  // Показываем приветственный экран, если он еще не был пройден
  if (showWelcomeScreen) {
    console.log('Rendering WelcomeScreen');
    return (
      <WidgetProvider
        value={{
          dashboardData,
          events,
          staffList,
          onTaskClick,
          onCreateTask,
          onEventClick,
          onStaffClick,
          tasksRefreshTrigger,
        }}
      >
        <div className="dashboard dashboard-welcome">
          <WelcomeScreen
            onStartSetup={handleStartSetup}
            onAddWidget={handleAddWidget}
            existingWidgets={widgets.map(w => ({ type: w.type, visible: w.visible }))}
          />
        </div>
      </WidgetProvider>
    );
  }

  // Если нет видимых виджетов, показываем WelcomeScreen
  const hasVisibleWidgets = widgets.filter(w => w.visible).length > 0;
  
  if (!hasVisibleWidgets) {
    return (
      <WidgetProvider
        value={{
          dashboardData,
          events,
          staffList,
          onTaskClick,
          onCreateTask,
          onEventClick,
          onStaffClick,
          tasksRefreshTrigger,
        }}
      >
        <div className="dashboard dashboard-welcome">
          <WelcomeScreen
            onStartSetup={handleStartSetup}
            onAddWidget={handleAddWidget}
            existingWidgets={widgets.map(w => ({ type: w.type, visible: w.visible }))}
          />
        </div>
      </WidgetProvider>
    );
  }

  return (
    <WidgetProvider
      value={{
        dashboardData,
        events,
        staffList,
        onTaskClick,
        onCreateTask,
        onEventClick,
        onStaffClick,
        tasksRefreshTrigger,
      }}
    >
      <div 
        className="dashboard"
        style={{
          display: 'flex',
          flexDirection: 'column',
          visibility: 'visible',
          opacity: 1,
          background: 'var(--bg-primary)',
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - 80px)',
          height: 'auto',
          flex: 1,
        }}
      >
        <ParticlesAnimation className="dashboard-particles" opacity={0.6} />
        <WidgetContainer
          widgets={widgets}
          onPositionChange={handlePositionChange}
          onRemoveWidget={removeWidget}
          onAddWidgets={handleShowWidgetManager}
          isLocked={isLocked}
          onAutoArrange={autoArrangeWidgets}
        />

        {showWidgetManager && !onShowWidgetManager && (
          <WidgetManager
            widgets={widgets}
            onToggleWidget={toggleWidget}
            onAddWidget={addWidget}
            onClose={() => setShowWidgetManager(false)}
          />
        )}
      </div>
    </WidgetProvider>
  );
}
