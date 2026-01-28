/**
 * @file: App.tsx
 * @description: Main application component with events management.
 * @dependencies: components, services/api.ts
 * @created: 2026-01-26
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/useAuth';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { EventDetailPage } from './components/EventDetailPage';
import { EventFormPage } from './components/EventFormPage';
import { EventFilters } from './components/EventFilters';
import { EventsListView } from './components/EventsListView';
import { EventsTableView } from './components/EventsTableView';
import { EventsTimelineView } from './components/EventsTimelineView';
import { StaffForm } from './components/StaffForm';
import { StaffDetailPage } from './components/StaffDetailPage';
import { StaffPage } from './components/StaffPage';
import { ThemeToggle } from './components/ThemeToggle';
import { Dashboard } from './components/Dashboard';
import { WidgetManager } from './components/widgets/WidgetManager';
import { useWidgets } from './hooks/useWidgets';
import { Settings } from './components/Settings';
import { EquipmentForm } from './components/EquipmentForm';
import { EquipmentDetailPage } from './components/EquipmentDetailPage';
import { type EquipmentFilters as EquipmentFiltersType } from './components/EquipmentFilters';
import { WarehousePage } from './components/WarehousePage';
import { AccessManagement } from './components/AccessManagement';
import { History } from './components/History';
import { VirtualLoading } from './components/VirtualLoading';
import { Profile } from './components/Profile';
import { TaskForm } from './components/TaskForm';
import { TaskDetailPage } from './components/TaskDetailPage';
import { api } from './services/api';
import type { EventDto, EventFilters as EventFiltersType, StaffDto, EquipmentDto, SettingsDto, StatusConfig, EquipmentCategoryDto, TaskDto, TaskStatus } from './services/api';
import type { EquipmentCaseDto } from './components/WarehouseCasesTab';
import { formatDate } from './utils/format';
import { LogoIcon } from './components/LogoIcon';

type PageKey = 'dashboard' | 'events' | 'staff' | 'settings' | 'warehouse' | 'history' | 'access' | 'loading' | 'profile';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: 'Панель управления',
  events: 'Мероприятия',
  staff: 'Персонал',
  warehouse: 'Склад',
  settings: 'Настройки',
  history: 'История изменений',
  access: 'Управление доступом',
  loading: 'Виртуальная погрузка',
  profile: 'Профиль',
};

type AuthMode = 'login' | 'register';

function App() {
  const { user, ready, logout, hasPermission, permissions } = useAuth();
  
  // Функция для определения роли пользователя на основе permissions
  const getUserRole = useCallback((userPermissions: string[]): string => {
    // Определяем роли на основе permissions
    if (userPermissions.includes('access:manage')) {
      return 'Администратор';
    }
    
    const hasWrite = userPermissions.includes('events:write') || userPermissions.includes('staff:write');
    const hasRead = userPermissions.includes('events:read') || userPermissions.includes('staff:read');
    const hasDashboard = userPermissions.includes('dashboard:read');
    
    if (hasWrite && hasRead && hasDashboard) {
      return 'Менеджер';
    }
    
    if (hasRead && !hasWrite) {
      return 'Просмотр';
    }
    
    if (hasDashboard && hasRead && !hasWrite) {
      return 'Бухгалтер';
    }
    
    // Если есть только write без read (маловероятно, но на всякий случай)
    if (hasWrite) {
      return 'Редактор';
    }
    
    return 'Пользователь';
  }, []);
  
  const userRole = useMemo(() => getUserRole(permissions), [permissions, getUserRole]);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const active = useMemo((): PageKey => {
    if (pathname.startsWith('/events')) return 'events';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/staff') return 'staff';
    if (pathname === '/warehouse') return 'warehouse';
    if (pathname === '/loading') return 'loading';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/history') return 'history';
    if (pathname === '/access') return 'access';
    return 'events';
  }, [pathname]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EventFiltersType>({});
  type EventsViewMode = 'list' | 'table' | 'timeline';
  const [eventsViewMode, setEventsViewMode] = useState<EventsViewMode>(() => {
    const saved = localStorage.getItem('events-view-mode');
    return (saved as EventsViewMode) || 'list';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  // Удалено отдельное состояние userProfile - используем данные из контекста авторизации

  // Staff state
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffDto | undefined>(undefined);

  // Dashboard state
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const [isLocked, setIsLocked] = useState(() => {
    const saved = localStorage.getItem('dashboard-locked');
    return saved === 'true';
  });
  const { widgets, toggleWidget, autoArrangeWidgets } = useWidgets();
  
  // Проверяем, есть ли видимые виджеты (dashboard настроен)
  const hasVisibleWidgets = widgets.some(w => w.visible);

  const handleToggleLock = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    localStorage.setItem('dashboard-locked', newLocked.toString());
  };

  // Equipment state
  const [equipmentList, setEquipmentList] = useState<EquipmentDto[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentFilters, setEquipmentFilters] = useState<EquipmentFiltersType>({});
  const [equipmentCategories, setEquipmentCategories] = useState<EquipmentCategoryDto[]>([]);
  // Заглушка для кейсов (пока нет API)
  const [warehouseCases] = useState<EquipmentCaseDto[]>([
    {
      id: 1,
      name: 'Кейс: Pelican 1510',
      sku: 'CASE-PEL-1510-001',
      status: 'active',
      inventoryCount: 5,
      warehouseCount: 4,
      shiftPrice: 15000,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Кейс: SKB 3U Rack Case',
      sku: 'CASE-SKB-3U-001',
      status: 'active',
      inventoryCount: 3,
      warehouseCount: 2,
      shiftPrice: 25000,
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentDto | undefined>(undefined);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Tasks state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | undefined>(undefined);
  const [taskFormStatus, setTaskFormStatus] = useState<TaskStatus | undefined>(undefined);
  const [tasksRefreshTrigger, setTasksRefreshTrigger] = useState(0);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.events.list(filters);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Callback для загрузки событий по диапазону дат (для бесконечной прокрутки таймлайна)
  const handleLoadEventsRange = useCallback(async (start: Date, end: Date) => {
    try {
      // Загружаем события только по диапазону дат, игнорируя другие фильтры для бесконечной прокрутки
      const data = await api.events.list({
        startFrom: start.toISOString(),
        endTo: end.toISOString(),
      });
      // Объединяем новые события с существующими, убирая дубликаты
      setEvents((prevEvents) => {
        const existingIds = new Set(prevEvents.map(e => e.id));
        const newEvents = data.filter(e => e.id && !existingIds.has(e.id));
        return [...prevEvents, ...newEvents];
      });
    } catch (error) {
      console.error('Failed to load events range:', error);
    }
  }, []);

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const data = await api.staff.list();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setStaffLoading(false);
    }
  };

  const loadSettings = useCallback(async () => {
    try {
      const settings = await api.settings.get();
      applySettings(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Удалена функция loadUserProfile - данные профиля теперь загружаются через контекст авторизации

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Listen for theme changes and reapply settings
  useEffect(() => {
    const handleThemeChange = () => {
      // Reapply settings when theme changes
      loadSettings();
    };

    // Listen for custom theme change event
    window.addEventListener('themechange', handleThemeChange);

    // Check theme on mount and when it changes
    const observer = new MutationObserver(() => {
      handleThemeChange();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      observer.disconnect();
    };
  }, [loadSettings]);

  useEffect(() => {
    if (active === 'events' || pathname.startsWith('/events')) {
      loadEvents();
    }
    if (active === 'staff') loadStaff();
    if (active === 'dashboard') loadDashboardData();
    if (active === 'warehouse') loadEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pathname, filters, equipmentFilters]);

  const applySettings = (settings: SettingsDto) => {
    const root = document.documentElement;
    const themeColors = settings.themeColors;
    const themeColorsDark = settings.themeColorsDark;
    const isDarkTheme = root.getAttribute('data-theme') === 'dark';

    // Always apply light theme colors to :root (they are the base)
    root.style.setProperty('--color-accent', themeColors.colorAccent);
    root.style.setProperty('--color-accent-hover', themeColors.colorAccentHover);
    root.style.setProperty('--color-accent-light', themeColors.colorAccentLight);
    root.style.setProperty('--color-accent-dark', themeColors.colorAccentDark);
    root.style.setProperty('--bg-primary', themeColors.bgPrimary);
    root.style.setProperty('--bg-secondary', themeColors.bgSecondary);
    root.style.setProperty('--bg-tertiary', themeColors.bgTertiary);
    root.style.setProperty('--bg-sidebar', themeColors.bgSidebar);
    root.style.setProperty('--bg-sidebar-hover', themeColors.bgSidebarHover);
    root.style.setProperty('--bg-sidebar-active', themeColors.bgSidebarActive);
    root.style.setProperty('--text-primary', themeColors.textPrimary);
    root.style.setProperty('--text-secondary', themeColors.textSecondary);
    root.style.setProperty('--text-tertiary', themeColors.textTertiary);
    root.style.setProperty('--text-sidebar', themeColors.textSidebar);
    root.style.setProperty('--text-sidebar-active', themeColors.textSidebarActive);
    root.style.setProperty('--border-color', themeColors.borderColor);
    root.style.setProperty('--border-color-strong', themeColors.borderColorStrong);
    root.style.setProperty('--border-sidebar', themeColors.borderSidebar);
    root.style.setProperty('--card-bg', themeColors.cardBg);
    root.style.setProperty('--card-border', themeColors.cardBorder);
    root.style.setProperty('--input-bg', themeColors.inputBg);
    root.style.setProperty('--input-border', themeColors.inputBorder);
    root.style.setProperty('--input-focus', themeColors.inputFocus);
    root.style.setProperty('--table-header-bg', themeColors.tableHeaderBg);
    root.style.setProperty('--table-row-hover', themeColors.tableRowHover);

    // Apply dark theme colors only if dark theme is active
    if (isDarkTheme) {
      root.style.setProperty('--bg-primary', themeColorsDark.bgPrimary);
      root.style.setProperty('--bg-secondary', themeColorsDark.bgSecondary);
      root.style.setProperty('--bg-tertiary', themeColorsDark.bgTertiary);
      root.style.setProperty('--bg-sidebar', themeColorsDark.bgSidebar);
      root.style.setProperty('--bg-sidebar-hover', themeColorsDark.bgSidebarHover);
      root.style.setProperty('--bg-sidebar-active', themeColorsDark.bgSidebarActive);
      root.style.setProperty('--text-primary', themeColorsDark.textPrimary);
      root.style.setProperty('--text-secondary', themeColorsDark.textSecondary);
      root.style.setProperty('--text-tertiary', themeColorsDark.textTertiary);
      root.style.setProperty('--text-sidebar', themeColorsDark.textSidebar);
      root.style.setProperty('--text-sidebar-active', themeColorsDark.textSidebarActive);
      root.style.setProperty('--border-color', themeColorsDark.borderColor);
      root.style.setProperty('--border-color-strong', themeColorsDark.borderColorStrong);
      root.style.setProperty('--border-sidebar', themeColorsDark.borderSidebar);
      root.style.setProperty('--card-bg', themeColorsDark.cardBg);
      root.style.setProperty('--card-border', themeColorsDark.cardBorder);
      root.style.setProperty('--input-bg', themeColorsDark.inputBg);
      root.style.setProperty('--input-border', themeColorsDark.inputBorder);
      root.style.setProperty('--input-focus', themeColorsDark.inputFocus);
      root.style.setProperty('--table-header-bg', themeColorsDark.tableHeaderBg);
      root.style.setProperty('--table-row-hover', themeColorsDark.tableRowHover);
    }

    // Apply status colors (distinct ids to avoid event/staff collision)
    settings.eventStatuses.forEach((status: StatusConfig) => {
      const id = `event-status-${status.code}`;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        .tag.${status.code} {
          background: ${status.backgroundColor} !important;
          color: ${status.textColor} !important;
        }
        [data-theme="dark"] .tag.${status.code} {
          background: ${status.backgroundColorDark || status.backgroundColor} !important;
          color: ${status.textColorDark || status.textColor} !important;
        }
      `;
      const oldStyle = document.getElementById(id);
      if (oldStyle) oldStyle.remove();
      document.head.appendChild(style);
    });

    settings.staffStatuses.forEach((status: StatusConfig) => {
      const id = `staff-status-${status.code}`;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        .tag.${status.code} {
          background: ${status.backgroundColor} !important;
          color: ${status.textColor} !important;
        }
        [data-theme="dark"] .tag.${status.code} {
          background: ${status.backgroundColorDark || status.backgroundColor} !important;
          color: ${status.textColorDark || status.textColor} !important;
        }
      `;
      const oldStyle = document.getElementById(id);
      if (oldStyle) oldStyle.remove();
      document.head.appendChild(style);
    });
  };

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      await Promise.all([loadEvents(), loadStaff(), loadEquipment()]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleCreate = () => navigate('/events/new');
  const handleEdit = (event: EventDto) => navigate(`/events/${event.id}/edit`);
  const handleView = (eventId: number) => navigate(`/events/${eventId}`);

  // Staff handlers
  const handleCreateStaff = () => {
    setEditingStaff(undefined);
    setShowStaffForm(true);
  };

  const handleEditStaff = (staff: StaffDto) => {
    setEditingStaff(staff);
    setShowStaffForm(true);
  };

  const handleViewStaff = (staffId: number) => {
    navigate(`/staff/${staffId}`, { state: { from: 'staff' } });
  };

  const handleSaveStaff = () => {
    setShowStaffForm(false);
    setEditingStaff(undefined);
    loadStaff();
  };

  const handleCloseStaffModal = () => {
    setShowStaffForm(false);
    setEditingStaff(undefined);
  };

  // Equipment handlers
  const loadEquipment = async () => {
    setEquipmentLoading(true);
    try {
      const [data, categories] = await Promise.all([
        api.equipment.list(),
        api.equipmentCategories.list(),
      ]);
      setEquipmentList(data);
      setEquipmentCategories(categories);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handleCreateEquipment = () => {
    setEditingEquipment(undefined);
    setShowEquipmentForm(true);
  };

  const handleEditEquipment = (equipment: EquipmentDto) => {
    setEditingEquipment(equipment);
    setShowEquipmentForm(true);
  };

  const handleViewEquipment = (equipmentId: number) => {
    navigate(`/equipment/${equipmentId}`, { state: { from: 'warehouse' } });
  };

  const handleSaveEquipment = () => {
    setShowEquipmentForm(false);
    setEditingEquipment(undefined);
    loadEquipment();
  };

  const handleCloseEquipmentModal = () => {
    setShowEquipmentForm(false);
    setEditingEquipment(undefined);
  };

  // Tasks handlers
  const handleCreateTask = (status?: TaskStatus) => {
    setEditingTask(undefined);
    setTaskFormStatus(status);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: TaskDto) => {
    setEditingTask(task);
    setTaskFormStatus(undefined);
    setShowTaskForm(true);
  };

  const handleViewTask = (taskId: number) => {
    navigate(`/tasks/${taskId}`, { state: { from: 'dashboard' } });
  };

  const handleSaveTask = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
    setTaskFormStatus(undefined);
    setTasksRefreshTrigger((prev) => prev + 1);
  };

  const handleCloseTaskModal = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
    setTaskFormStatus(undefined);
  };

  const dashboardData = useMemo(() => {
    const eventCounts = events.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const staffActive = staffList.filter((s) => s.status === 'active').length;
    const staffInactive = staffList.length - staffActive;
    const budgetPlanned = events.reduce((sum, e) => sum + (e.contractPrice || 0), 0);
    const budgetActual = events.reduce((sum, e) => sum + e.budgetActual, 0);
    
    // Equipment statistics
    const equipmentCounts = equipmentList.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const equipmentAvailable = equipmentCounts['available'] ?? 0;
    const equipmentInUse = equipmentCounts['in_use'] ?? 0;
    const equipmentMaintenance = equipmentCounts['maintenance'] ?? 0;
    const equipmentRetired = equipmentCounts['retired'] ?? 0;
    const equipmentByCategory = equipmentList.reduce(
      (acc, e) => {
        acc[e.categoryId] = (acc[e.categoryId] ?? 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );
    
    const eventsByStatus = [
      { name: 'В работе', value: eventCounts['in_work'] ?? 0 },
      { name: 'Запрос', value: eventCounts['request'] ?? 0 },
      { name: 'Черновик', value: eventCounts['draft'] ?? 0 },
      { name: 'Завершено', value: eventCounts['completed'] ?? 0 },
      { name: 'Отменено', value: eventCounts['canceled'] ?? 0 },
    ];
    const budgetTrend = [
      { month: 'Янв', planned: 3200000, actual: 3100000 },
      { month: 'Фев', planned: 3500000, actual: 3400000 },
      { month: 'Мар', planned: 3800000, actual: 3700000 },
      { month: 'Апр', planned: 4000000, actual: 3900000 },
      { month: 'Май', planned: 4200000, actual: 4100000 },
      { month: 'Июн', planned: budgetPlanned, actual: budgetActual },
    ];
    const nearestEvents = [...events]
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
    const activeStaffPreview = staffList.filter((s) => s.status === 'active').slice(0, 5);
    return {
      eventCounts,
      staffActive,
      staffInactive,
      contractPrice: budgetPlanned, // Используем переименованное поле
      budgetActual,
      eventsByStatus,
      budgetTrend,
      nearestEvents,
      activeStaffPreview,
      equipmentCounts,
      equipmentAvailable,
      equipmentInUse,
      equipmentMaintenance,
      equipmentRetired,
      equipmentByCategory,
      equipmentTotal: equipmentList.length,
    };
  }, [events, staffList, equipmentList]);

  const pageTitle = PAGE_TITLES[active];
  const isEventSubpage = pathname === '/events/new' || /^\/events\/\d+\/edit$/.test(pathname) || (/^\/events\/\d+$/.test(pathname) && !pathname.endsWith('/edit'));


  if (!ready) {
    return (
      <div className="app app-loading">
        <div className="empty-state">Загрузка…</div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'register' ? (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    ) : (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    );
  }

  return (
    <div className="app">
      <button 
        className="mobile-menu-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Открыть меню"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="brand">
          {sidebarCollapsed ? (
            <div className="brand-logo">
              <LogoIcon width="100%" height="100%" className="brand-logo-img" />
            </div>
          ) : (
            <LogoIcon width="100%" height="auto" className="brand-logo-full" showText={true} />
          )}
        </div>
        <nav className="nav">
          <Link
            to="/dashboard"
            className={active === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="Панель управления"
          >
            <span className="nav-item-icon">📊</span>
            {!sidebarCollapsed && <span className="nav-item-text">Панель управления</span>}
          </Link>
          <Link
            to="/events"
            className={active === 'events' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="Мероприятия"
          >
            <span className="nav-item-icon">🎭</span>
            {!sidebarCollapsed && <span className="nav-item-text">Мероприятия</span>}
          </Link>
          <Link
            to="/staff"
            className={active === 'staff' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="Персонал"
          >
            <span className="nav-item-icon">👥</span>
            {!sidebarCollapsed && <span className="nav-item-text">Персонал</span>}
          </Link>
          <Link
            to="/warehouse"
            className={active === 'warehouse' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="Склад"
          >
            <span className="nav-item-icon">📦</span>
            {!sidebarCollapsed && <span className="nav-item-text">Склад</span>}
          </Link>
          <Link
            to="/loading"
            className={active === 'loading' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="Виртуальная погрузка"
          >
            <span className="nav-item-icon">🚚</span>
            {!sidebarCollapsed && <span className="nav-item-text">Виртуальная погрузка</span>}
          </Link>
          <Link
            to="/history"
            className={active === 'history' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="История изменений"
          >
            <span className="nav-item-icon">📜</span>
            {!sidebarCollapsed && <span className="nav-item-text">История изменений</span>}
          </Link>
          {hasPermission('access:manage') && (
            <Link
              to="/access"
              className={active === 'access' ? 'nav-item active' : 'nav-item'}
              onClick={() => setSidebarOpen(false)}
              title="Управление доступом"
            >
              <span className="nav-item-icon">🔐</span>
              {!sidebarCollapsed && <span className="nav-item-text">Управление доступом</span>}
            </Link>
          )}
          <button type="button" className="nav-item disabled" title="Отчеты">
            <span className="nav-item-icon">📈</span>
            {!sidebarCollapsed && <span className="nav-item-text">Отчеты</span>}
          </button>
          <button type="button" className="nav-item disabled" title="Договоры">
            <span className="nav-item-icon">📄</span>
            {!sidebarCollapsed && <span className="nav-item-text">Договоры</span>}
          </button>
          <Link
            to="/settings"
            className={active === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSidebarOpen(false)}
            title="Настройки"
          >
            <span className="nav-item-icon">⚙️</span>
            {!sidebarCollapsed && <span className="nav-item-text">Настройки</span>}
          </Link>
        </nav>
        <div className="sidebar-footer">
          {user && (
            <Link
              to="/profile"
              className="sidebar-profile"
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || user.email) : undefined}
            >
              <div className="sidebar-profile-avatar">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="sidebar-profile-avatar-img" />
                ) : (
                  <div className="sidebar-profile-avatar-placeholder">
                    {(user?.firstName && user?.lastName
                      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                      : (user.displayName || user.email).charAt(0).toUpperCase()
                    )}
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="sidebar-profile-info">
                  <div className="sidebar-profile-name">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.displayName || user.email}
                  </div>
                  <div className="sidebar-profile-role">
                    {userRole}
                  </div>
                </div>
              )}
            </Link>
          )}
          {!sidebarCollapsed && <span>v0.1 MVP</span>}
          <div className="sidebar-footer-actions">
            <ThemeToggle />
            <button
              type="button"
              className="sidebar-collapse-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
              aria-label={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            >
              <span className="sidebar-collapse-icon">
                {sidebarCollapsed ? '→' : '←'}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        {!isEventSubpage && (
        <header className="topbar">
          <div>
            <div className="page-title">
              {pageTitle}
              {active === 'events' && (
                <span className="page-title-count">
                  {loading ? (
                    <span className="loading-text">(загрузка...)</span>
                  ) : (
                    ` (${events.length})`
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            {active === 'dashboard' && hasVisibleWidgets && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="button-secondary"
                  onClick={handleToggleLock}
                  title={isLocked ? 'Разблокировать виджеты' : 'Заблокировать виджеты'}
                  style={{ 
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'auto',
                    width: 'auto'
                  }}
                >
                  {isLocked ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  )}
                </button>
                <button
                  className="button-secondary"
                  onClick={() => {
                    // Получаем размеры контейнера виджетов
                    const container = document.querySelector('.widget-container') as HTMLElement & { autoArrange?: () => void };
                    if (container?.autoArrange) {
                      // Используем функцию из контейнера, которая знает точные размеры
                      container.autoArrange();
                    } else if (container) {
                      const rect = container.getBoundingClientRect();
                      // Используем реальные размеры контейнера или размеры viewport
                      const width = rect.width || (window.innerWidth - 280);
                      const height = rect.height || (window.innerHeight - 200);
                      autoArrangeWidgets(width, height);
                    } else {
                      // Fallback на размеры окна (минус sidebar и topbar)
                      autoArrangeWidgets(window.innerWidth - 280, window.innerHeight - 200);
                    }
                  }}
                  title="Автоматически разместить виджеты"
                  style={{ 
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'auto',
                    width: 'auto'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="button-secondary"
                    onClick={() => {
                      localStorage.removeItem('dashboard-setup-completed');
                      localStorage.removeItem('dashboard-widgets');
                      window.location.reload();
                    }}
                    title="Сбросить настройку dashboard (только для разработки)"
                  >
                    Сброс
                  </button>
                )}
                <button
                  className="button-secondary"
                  onClick={() => setShowWidgetManager(true)}
                  title="Управление виджетами"
                >
                  Виджеты
                </button>
              </div>
            )}
            {pathname === '/events' && (
              <>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className={`button-secondary ${eventsViewMode === 'list' ? 'active' : ''}`}
                    onClick={() => {
                      setEventsViewMode('list');
                      localStorage.setItem('events-view-mode', 'list');
                    }}
                    title="Список"
                    style={{ 
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 'auto',
                      width: 'auto'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"/>
                      <line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/>
                      <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                  <button
                    className={`button-secondary ${eventsViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => {
                      setEventsViewMode('table');
                      localStorage.setItem('events-view-mode', 'table');
                    }}
                    title="Табличный календарь"
                    style={{ 
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 'auto',
                      width: 'auto'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </button>
                  <button
                    className={`button-secondary ${eventsViewMode === 'timeline' ? 'active' : ''}`}
                    onClick={() => {
                      setEventsViewMode('timeline');
                      localStorage.setItem('events-view-mode', 'timeline');
                    }}
                    title="Горизонтальный календарь (таймлайн)"
                    style={{ 
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 'auto',
                      width: 'auto'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <line x1="2" y1="6" x2="22" y2="6"/>
                      <line x1="2" y1="18" x2="22" y2="18"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </button>
                </div>
                <button className="primary" onClick={handleCreate}>
                  Создать мероприятие
                </button>
              </>
            )}
            {active === 'staff' && (
              <button className="primary" onClick={handleCreateStaff}>
                Создать сотрудника
              </button>
            )}
            {active === 'warehouse' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="primary" onClick={handleCreateEquipment}>
                  Создать оборудование
                </button>
                <button className="button-secondary" onClick={() => setShowCategoryManager(!showCategoryManager)}>
                  {showCategoryManager ? 'Скрыть категории' : 'Управление категориями'}
                </button>
              </div>
            )}
          </div>
        </header>
        )}

        {pathname === '/' && <Navigate to="/events" replace />}

        {pathname === '/events/new' && <EventFormPage />}
        {/^\/events\/\d+\/edit$/.test(pathname) && <EventFormPage />}
        {/^\/events\/\d+$/.test(pathname) && !pathname.endsWith('/edit') && <EventDetailPage />}
        
        {/^\/staff\/\d+$/.test(pathname) && !pathname.endsWith('/edit') && <StaffDetailPage />}
        {/^\/equipment\/\d+$/.test(pathname) && !pathname.endsWith('/edit') && <EquipmentDetailPage />}
        {/^\/tasks\/\d+$/.test(pathname) && !pathname.endsWith('/edit') && <TaskDetailPage />}

        {pathname === '/events' && (
          <section className="events-page">
            <div className="events-page-sticky-header">
              <EventFilters
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters({})}
              />
              {eventsViewMode === 'table' && (
                <div id="events-table-toolbar-slot" className="events-table-toolbar-slot" />
              )}
            </div>
            <div className="panel">
              {eventsViewMode === 'list' && (
                <EventsListView
                  events={events}
                  loading={loading}
                  onEventClick={handleView}
                  onEventEdit={handleEdit}
                />
              )}
              {eventsViewMode === 'table' && (
                <EventsTableView
                  events={events}
                  loading={loading}
                  onEventClick={(event) => event.id && handleView(event.id)}
                  toolbarPortalTargetId="events-table-toolbar-slot"
                />
              )}
              {eventsViewMode === 'timeline' && (
                <EventsTimelineView
                  events={events}
                  loading={loading}
                  onEventClick={(event) => event.id && handleView(event.id)}
                  onLoadEventsRange={handleLoadEventsRange}
                />
              )}
            </div>
          </section>
        )}

        {active === 'dashboard' && (
          <>
            <Dashboard
              dashboardData={dashboardData}
              events={events}
              staffList={staffList}
              onTaskClick={handleViewTask}
              onCreateTask={handleCreateTask}
              onEventClick={handleView}
              onStaffClick={handleViewStaff}
              tasksRefreshTrigger={tasksRefreshTrigger}
              loading={dashboardLoading}
              onShowWidgetManager={() => setShowWidgetManager(true)}
              isLocked={isLocked}
              onToggleLock={handleToggleLock}
            />
            {showWidgetManager && (
              <WidgetManager
                widgets={widgets}
                onToggleWidget={toggleWidget}
                onClose={() => setShowWidgetManager(false)}
              />
            )}
          </>
        )}

        {active === 'staff' && (
          <StaffPage
            staffList={staffList}
            loading={staffLoading}
            onViewStaff={handleViewStaff}
            onEditStaff={handleEditStaff}
          />
        )}

        {active === 'warehouse' && (
          <WarehousePage
            equipmentList={equipmentList}
            equipmentCategories={equipmentCategories}
            selectedCategoryId={equipmentFilters.categoryId}
            onSelectCategory={(categoryId: number | null) =>
              setEquipmentFilters((prev: EquipmentFiltersType) => ({ ...prev, categoryId: categoryId ?? undefined }))
            }
            onViewEquipment={handleViewEquipment}
            onEditEquipment={handleEditEquipment}
            onCreateProduct={handleCreateEquipment}
            onCreateSet={handleCreateEquipment}
            onEditSet={(set) => console.log('Edit set', set)}
            onViewSet={(id) => console.log('View set', id)}
            onCreateCase={handleCreateEquipment}
            onEditCase={(caseItem) => console.log('Edit case', caseItem)}
            onViewCase={(id) => console.log('View case', id)}
            warehouseCases={warehouseCases}
            loading={equipmentLoading}
          />
        )}

        {active === 'profile' && <Profile />}

        {active === 'settings' && <Settings />}

        {active === 'history' && <History />}

        {active === 'loading' && (
          <section className="events-page">
            <VirtualLoading warehouseCases={warehouseCases} />
          </section>
        )}

        {active === 'access' && (
          <section className="events-page">
            <AccessManagement />
          </section>
        )}
      </main>

      {showStaffForm && (
        <StaffForm
          staff={editingStaff}
          onSave={handleSaveStaff}
          onCancel={handleCloseStaffModal}
        />
      )}

      {showEquipmentForm && (
        <EquipmentForm
          equipment={editingEquipment}
          onSave={handleSaveEquipment}
          onCancel={handleCloseEquipmentModal}
        />
      )}

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          initialStatus={taskFormStatus}
          onSave={handleSaveTask}
          onCancel={handleCloseTaskModal}
        />
      )}
    </div>
  );
}

export default App;
