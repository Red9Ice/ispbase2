/**
 * @file: api.ts
 * @description: API service for backend communication.
 * @dependencies: none
 * @created: 2026-01-26
 */

// Автоматически определяем API URL на основе текущего хоста
function getApiBaseUrl(): string {
  // Если задана переменная окружения, используем её
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const host = window.location.hostname;

  // Если это localhost или 127.0.0.1, используем localhost для API
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3001/api/v1';
  }
  
  // Иначе используем тот же хост, но порт 3001 для API
  return `http://${host}:3001/api/v1`;
}

const API_BASE_URL = getApiBaseUrl();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export type EventStatus = 'draft' | 'request' | 'in_work' | 'completed' | 'canceled';

export interface WeatherDto {
  temperature: number;
  description: string;
  icon: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  date: string;
}

export interface DistanceDto {
  distance: number;
  time: number;
  distanceFormatted: string;
  timeFormatted: string;
  fromCity: string;
  toCity: string;
}

export interface EventDto {
  id?: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  contractPrice: number; // Цена контракта (было budgetPlanned)
  budgetActual: number;
  clientId: number;
  venueId: number;
  managerId?: number; // Менеджер
  foremanId?: number; // Бригадир
  commercialProposal?: string; // КП
  opm?: string; // ОПМ
  transport?: string; // Транспорт
  margin?: number; // Маржинальность (в процентах)
  profitability?: number; // Рентабельность (в процентах)
  createdAt?: string;
  updatedAt?: string;
  weather?: WeatherDto;
  distance?: DistanceDto;
}

export interface EventFilters {
  status?: EventStatus;
  startFrom?: string;
  endTo?: string;
  clientId?: number;
  venueId?: number;
  managerId?: number;
  q?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: 'startDate' | 'endDate' | 'status' | 'contractPrice' | 'createdAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface Client {
  id: number;
  name: string;
  type: 'company' | 'person';
  contactName?: string;
  email?: string;
  phone?: string;
}

export interface Venue {
  id: number;
  name: string;
  address?: string;
  capacity?: number;
  contactName?: string;
  phone?: string;
}

export type StaffStatus = 'active' | 'inactive';

export interface StaffDto {
  id?: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  rate?: number;
  currency: 'RUB';
  status: StaffStatus;
  
  // О персонале
  city?: string;
  profile?: string; // Роли через "/"
  employmentType?: string; // По найму
  otherPaymentMethods?: string; // Другие способы оплаты
  
  // Документы
  passportSeries?: string;
  passportNumber?: string;
  passportIssuedBy?: string;
  passportIssueDate?: string;
  passportDepartmentCode?: string;
  passportScanUrl?: string;
  snils?: string;
  inn?: string;
  birthDate?: string;
  birthPlace?: string;
  registrationAddress?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusConfig {
  code: string;
  label: string;
  backgroundColor: string;
  textColor: string;
  backgroundColorDark?: string;
  textColorDark?: string;
}

export interface ThemeColors {
  colorAccent: string;
  colorAccentHover: string;
  colorAccentLight: string;
  colorAccentDark: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgSidebar: string;
  bgSidebarHover: string;
  bgSidebarActive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textSidebar: string;
  textSidebarActive: string;
  borderColor: string;
  borderColorStrong: string;
  borderSidebar: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  tableHeaderBg: string;
  tableRowHover: string;
}

export interface ThemeColorsDark {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgSidebar: string;
  bgSidebarHover: string;
  bgSidebarActive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textSidebar: string;
  textSidebarActive: string;
  borderColor: string;
  borderColorStrong: string;
  borderSidebar: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  tableHeaderBg: string;
  tableRowHover: string;
}

export interface SettingsDto {
  eventStatuses: StatusConfig[];
  staffStatuses: StatusConfig[];
  themeColors: ThemeColors;
  themeColorsDark: ThemeColorsDark;
}

export interface EquipmentCategoryDto {
  id?: number;
  name: string;
  description?: string;
  parentId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export interface EquipmentDto {
  id?: number;
  name: string;
  model?: string;
  manufacturer?: string;
  categoryId: number;
  serialNumber?: string;
  photoUrl?: string;
  status: EquipmentStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MovementType = 'in' | 'out' | 'transfer' | 'maintenance';

export interface EquipmentMovementDto {
  id?: number;
  equipmentId: number;
  movementType: MovementType;
  fromLocation?: string;
  toLocation?: string;
  eventId?: number;
  notes?: string;
  movedAt: string;
  createdAt?: string;
}

export type PermissionKey =
  | 'events:read'
  | 'events:write'
  | 'staff:read'
  | 'staff:write'
  | 'dashboard:read'
  | 'calendar:read'
  | 'access:manage';

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryEntry {
  year: number;
  month: number;
  amount: number;
  assignments: Array<{
    eventId: number;
    startTime: string;
    endTime: string;
    hours: number;
    amount: number;
  }>;
}

export type AssignmentStatus = 'planned' | 'confirmed' | 'completed' | 'canceled';

export interface AssignmentDto {
  id?: number;
  eventId: number;
  staffId: number;
  roleId: number;
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  paymentAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentFilters {
  status?: AssignmentStatus;
  startFrom?: string;
  endTo?: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
  permissions: PermissionKey[];
}

export interface MeResult {
  user: AuthUser;
  permissions: PermissionKey[];
}

export interface UserPermissionsDto {
  userId: number;
  email: string;
  displayName?: string;
  permissions: PermissionKey[];
}

export type RoleId = 'admin' | 'manager' | 'editor' | 'viewer' | 'accountant';

export interface RoleDto {
  id: RoleId;
  name: string;
  description: string;
  permissions: PermissionKey[];
}

export type HistoryAction = 'create' | 'update' | 'delete';

export interface ChangeHistoryRecord {
  id: number;
  actorId: number | null;
  action: HistoryAction;
  entityType: string;
  entityId: number;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

export type TaskStatus = 'draft' | 'todo' | 'in_progress' | 'done' | 'closed' | 'cancelled';

export interface TaskDto {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  responsibleId?: number;
  problemId?: number;
  dueDate?: string;
  completionPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  responsibleId?: number;
  problemId?: number;
  q?: string;
  trackedOnly?: boolean;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  // Создаем контроллер для таймаута
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Включаем отправку куки в запросах
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        authToken = null;
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Ошибка сети. Проверьте подключение к интернету и убедитесь, что сервер запущен');
      }
      throw error;
    }
    throw new Error('Неизвестная ошибка при выполнении запроса');
  }
}

export interface UserProfileUpdateDto {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UserPasswordUpdateDto {
  currentPassword: string;
  newPassword: string;
}

export const api = {
  auth: {
    login: (email: string, password: string): Promise<LoginResult> =>
      request<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (
      email: string,
      password: string,
      displayName: string,
    ): Promise<LoginResult> =>
      request<LoginResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      }),
    me: (): Promise<MeResult> => request<MeResult>('/auth/me'),
    getProfile: (): Promise<AuthUser> => request<AuthUser>('/auth/profile'),
    updateProfile: (updates: UserProfileUpdateDto): Promise<AuthUser> =>
      request<AuthUser>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    getSalary: (): Promise<SalaryEntry[]> => request<SalaryEntry[]>('/auth/salary'),
    updatePassword: (data: UserPasswordUpdateDto): Promise<{ success: boolean }> =>
      request<{ success: boolean }>('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  users: {
    listWithPermissions: (): Promise<UserPermissionsDto[]> =>
      request<UserPermissionsDto[]>('/users'),
    getById: (userId: number): Promise<AuthUser> =>
      request<AuthUser>(`/users/${userId}`),
    getPermissions: (userId: number): Promise<UserPermissionsDto> =>
      request<UserPermissionsDto>(`/users/${userId}/permissions`),
    updatePermissions: (userId: number, permissions: PermissionKey[]): Promise<UserPermissionsDto> =>
      request<UserPermissionsDto>(`/users/${userId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      }),
  },
  permissions: {
    keys: (): Promise<PermissionKey[]> => request<PermissionKey[]>('/permissions/keys'),
  },
  roles: {
    list: (): Promise<RoleDto[]> => request<RoleDto[]>('/roles'),
  },
  events: {
    list: (filters?: EventFilters): Promise<EventDto[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      return request<EventDto[]>(`/events?${params.toString()}`);
    },
    getById: (id: number): Promise<EventDto> => {
      return request<EventDto>(`/events/${id}`);
    },
    create: (payload: Omit<EventDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventDto> => {
      return request<EventDto>('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: (id: number, payload: Partial<EventDto>): Promise<EventDto> => {
      return request<EventDto>(`/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    delete: (id: number): Promise<void> => {
      return request<void>(`/events/${id}`, {
        method: 'DELETE',
      });
    },
  },
  clients: {
    list: (): Promise<Client[]> => {
      return request<Client[]>('/clients');
    },
    getById: (id: number): Promise<Client> => {
      return request<Client>(`/clients/${id}`);
    },
  },
  venues: {
    list: (): Promise<Venue[]> => {
      return request<Venue[]>('/venues');
    },
    getById: (id: number): Promise<Venue> => {
      return request<Venue>(`/venues/${id}`);
    },
  },
  staff: {
    list: (): Promise<StaffDto[]> => {
      return request<StaffDto[]>('/staff');
    },
    getById: (id: number): Promise<StaffDto> => {
      return request<StaffDto>(`/staff/${id}`);
    },
    create: (payload: Omit<StaffDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffDto> => {
      return request<StaffDto>('/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: (id: number, payload: Partial<StaffDto>): Promise<StaffDto> => {
      return request<StaffDto>(`/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    deactivate: (id: number): Promise<void> => {
      return request<void>(`/staff/${id}`, {
        method: 'DELETE',
      });
    },
  },
  settings: {
    get: (): Promise<SettingsDto> => {
      return request<SettingsDto>('/settings');
    },
    update: (settings: Partial<SettingsDto>): Promise<SettingsDto> => {
      return request<SettingsDto>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
    },
    reset: (): Promise<SettingsDto> => {
      return request<SettingsDto>('/settings/reset', {
        method: 'POST',
      });
    },
  },
  equipmentCategories: {
    list: (): Promise<EquipmentCategoryDto[]> => {
      return request<EquipmentCategoryDto[]>('/equipment-categories');
    },
    getById: (id: number): Promise<EquipmentCategoryDto> => {
      return request<EquipmentCategoryDto>(`/equipment-categories/${id}`);
    },
    create: (payload: Omit<EquipmentCategoryDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<EquipmentCategoryDto> => {
      return request<EquipmentCategoryDto>('/equipment-categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: (id: number, payload: Partial<EquipmentCategoryDto>): Promise<EquipmentCategoryDto> => {
      return request<EquipmentCategoryDto>(`/equipment-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    delete: (id: number): Promise<void> => {
      return request<void>(`/equipment-categories/${id}`, {
        method: 'DELETE',
      });
    },
  },
  equipment: {
    list: (): Promise<EquipmentDto[]> => {
      return request<EquipmentDto[]>('/equipment');
    },
    getById: (id: number): Promise<EquipmentDto> => {
      return request<EquipmentDto>(`/equipment/${id}`);
    },
    create: (payload: Omit<EquipmentDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<EquipmentDto> => {
      return request<EquipmentDto>('/equipment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: (id: number, payload: Partial<EquipmentDto>): Promise<EquipmentDto> => {
      return request<EquipmentDto>(`/equipment/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    delete: (id: number): Promise<void> => {
      return request<void>(`/equipment/${id}`, {
        method: 'DELETE',
      });
    },
  },
  equipmentMovements: {
    list: (): Promise<EquipmentMovementDto[]> => {
      return request<EquipmentMovementDto[]>('/equipment-movements');
    },
    findByEquipmentId: (equipmentId: number): Promise<EquipmentMovementDto[]> => {
      return request<EquipmentMovementDto[]>(`/equipment-movements/equipment/${equipmentId}`);
    },
    findByEventId: (eventId: number): Promise<EquipmentMovementDto[]> => {
      return request<EquipmentMovementDto[]>(`/equipment-movements/event/${eventId}`);
    },
    create: (payload: Omit<EquipmentMovementDto, 'id' | 'createdAt'>): Promise<EquipmentMovementDto> => {
      return request<EquipmentMovementDto>('/equipment-movements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
  history: {
    list: (filters?: {
      entityType?: string;
      entityId?: number;
      actorId?: number;
      action?: 'create' | 'update' | 'delete';
      limit?: number;
      offset?: number;
    }): Promise<ChangeHistoryRecord[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      return request<ChangeHistoryRecord[]>(`/history?${params.toString()}`);
    },
  },
  tasks: {
    list: (filters?: TaskFilters): Promise<TaskDto[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      return request<TaskDto[]>(`/tasks?${params.toString()}`);
    },
    getById: (id: number): Promise<TaskDto> => {
      return request<TaskDto>(`/tasks/${id}`);
    },
    create: (payload: Omit<TaskDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskDto> => {
      return request<TaskDto>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: (id: number, payload: Partial<TaskDto>): Promise<TaskDto> => {
      return request<TaskDto>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    delete: (id: number): Promise<void> => {
      return request<void>(`/tasks/${id}`, {
        method: 'DELETE',
      });
    },
  },
  assignments: {
    listByEvent: (eventId: number, filters?: AssignmentFilters): Promise<AssignmentDto[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      return request<AssignmentDto[]>(`/events/${eventId}/assignments?${params.toString()}`);
    },
    getById: (id: number): Promise<AssignmentDto> => {
      return request<AssignmentDto>(`/assignments/${id}`);
    },
    create: (eventId: number, payload: Omit<AssignmentDto, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>): Promise<AssignmentDto> => {
      return request<AssignmentDto>(`/events/${eventId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: (id: number, payload: Partial<AssignmentDto>): Promise<AssignmentDto> => {
      return request<AssignmentDto>(`/assignments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    delete: (id: number): Promise<void> => {
      return request<void>(`/assignments/${id}`, {
        method: 'DELETE',
      });
    },
  },
  weather: {
    getByCity: (city: string, date: string): Promise<WeatherDto> => {
      return request<WeatherDto>(`/weather?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`);
    },
  },
  distance: {
    getByCity: (city: string, fromCity?: string): Promise<DistanceDto> => {
      const params = new URLSearchParams({ city });
      if (fromCity) {
        params.append('fromCity', fromCity);
      }
      return request<DistanceDto>(`/distance?${params.toString()}`);
    },
  },
};
