/**
 * @file: main.ts
 * @description: Backend entry point with Express server.
 * @dependencies: express, cors, modules, auth
 * @created: 2026-01-26
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { AuthRequest } from './modules/auth/middleware';
import { EventsController } from './modules/events/events.controller';
import { EventsServiceImpl } from './modules/events/events.service.impl';
import { EventsRepository } from './modules/events/events.repository';
import { EventFilters } from './modules/events/events.service';
import { EventStatus } from './modules/events/dto/event.dto';
import { StaffController } from './modules/staff/staff.controller';
import { StaffServiceImpl } from './modules/staff/staff.service.impl';
import { StaffRepository } from './modules/staff/staff.repository';
import { ClientsRepository } from './modules/clients/clients.repository';
import { VenuesRepository } from './modules/venues/venues.repository';
import { SettingsController } from './modules/settings/settings.controller';
import { SettingsServiceImpl } from './modules/settings/settings.service.impl';
import { SettingsRepository } from './modules/settings/settings.repository';
import { UsersRepository } from './modules/users/users.repository';
import { PermissionsRepository } from './modules/permissions/permissions.repository';
import { RolesRepository } from './modules/roles/roles.repository';
import { AuthService } from './modules/auth/auth.service';
import { PermissionsService } from './modules/permissions/permissions.service';
import { authMiddleware } from './modules/auth/middleware';
import { setupAuthRoutes } from './common/auth-routes';
import { seedAuth } from './modules/auth/seed';
import { EquipmentCategoriesController } from './modules/equipment-categories/equipment-categories.controller';
import { EquipmentCategoriesServiceImpl } from './modules/equipment-categories/equipment-categories.service.impl';
import { EquipmentCategoriesRepository } from './modules/equipment-categories/equipment-categories.repository';
import { EquipmentController } from './modules/equipment/equipment.controller';
import { EquipmentServiceImpl } from './modules/equipment/equipment.service.impl';
import { EquipmentRepository } from './modules/equipment/equipment.repository';
import { EquipmentMovementsController } from './modules/equipment-movements/equipment-movements.controller';
import { EquipmentMovementsServiceImpl } from './modules/equipment-movements/equipment-movements.service.impl';
import { EquipmentMovementsRepository } from './modules/equipment-movements/equipment-movements.repository';
import { HistoryRepository } from './modules/history/history.repository';
import { HistoryServiceImpl } from './modules/history/history.service.impl';
import { seedEquipment } from './modules/equipment/seed';
import { TasksController } from './modules/tasks/tasks.controller';
import { TasksServiceImpl } from './modules/tasks/tasks.service.impl';
import { TasksRepository } from './modules/tasks/tasks.repository';
import { TaskFilters } from './modules/tasks/tasks.service';
import { TaskStatus } from './modules/tasks/dto/task.dto';
import { AssignmentsRepository } from './modules/assignments/assignments.repository';
import { AssignmentsController } from './modules/assignments/assignments.controller';
import { AssignmentsServiceImpl } from './modules/assignments/assignments.service.impl';
import { AssignmentStatus } from './modules/assignments/dto/assignment.dto';
import { AssignmentFilters } from './modules/assignments/assignments.service';
import { handleError, handleValidationError, handleNotFoundError } from './common/error-handler';
import { WeatherServiceImpl } from './modules/weather/weather.service.impl';
import { WeatherController } from './modules/weather/weather.controller';
import { DistanceServiceImpl } from './modules/distance/distance.service.impl';
import { DistanceController } from './modules/distance/distance.controller';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Функция для проверки разрешенных origin
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Разрешаем запросы без origin (например, из мобильных приложений или Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Если задан FRONTEND_URL, используем его
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Разрешаем localhost
    if (origin === frontendUrl || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Разрешаем IP адреса в локальной сети (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localNetworkPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/;
    if (localNetworkPattern.test(origin)) {
      return callback(null, true);
    }
    
    // В development режиме разрешаем все
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Разрешаем отправку куки
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

const eventsRepository = new EventsRepository();
const clientsRepository = new ClientsRepository();
const venuesRepository = new VenuesRepository();
const weatherService = new WeatherServiceImpl();
const weatherController = new WeatherController(weatherService);
const distanceService = new DistanceServiceImpl();
const distanceController = new DistanceController(distanceService);
const eventsService = new EventsServiceImpl(eventsRepository, weatherService, distanceService, venuesRepository);
const eventsController = new EventsController(eventsService);

const staffRepository = new StaffRepository();
const staffService = new StaffServiceImpl(staffRepository);
const staffController = new StaffController(staffService);

const settingsRepository = new SettingsRepository();
const settingsService = new SettingsServiceImpl(settingsRepository);
const settingsController = new SettingsController(settingsService);

const usersRepository = new UsersRepository();
const permissionsRepository = new PermissionsRepository();
const rolesRepository = new RolesRepository();
const authService = new AuthService(usersRepository, permissionsRepository);
const permissionsService = new PermissionsService(usersRepository, permissionsRepository);

const equipmentCategoriesRepository = new EquipmentCategoriesRepository();
const equipmentCategoriesService = new EquipmentCategoriesServiceImpl(equipmentCategoriesRepository);
const equipmentCategoriesController = new EquipmentCategoriesController(equipmentCategoriesService);

const equipmentRepository = new EquipmentRepository();
const equipmentService = new EquipmentServiceImpl(equipmentRepository);
const equipmentController = new EquipmentController(equipmentService);

const equipmentMovementsRepository = new EquipmentMovementsRepository();
const equipmentMovementsService = new EquipmentMovementsServiceImpl(equipmentMovementsRepository);
const equipmentMovementsController = new EquipmentMovementsController(equipmentMovementsService);

const historyRepository = new HistoryRepository();
const historyService = new HistoryServiceImpl(historyRepository);

const tasksRepository = new TasksRepository();
const tasksService = new TasksServiceImpl(tasksRepository);
const tasksController = new TasksController(tasksService);

const assignmentsRepository = new AssignmentsRepository();
const assignmentsService = new AssignmentsServiceImpl(assignmentsRepository);
const assignmentsController = new AssignmentsController(assignmentsService);

const apiRouter = express.Router();

setupAuthRoutes(authService, permissionsService, rolesRepository, staffRepository, assignmentsRepository, apiRouter);

apiRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const filters: EventFilters = {
      status: req.query.status as EventStatus | undefined,
      startFrom: req.query.startFrom as string | undefined,
      endTo: req.query.endTo as string | undefined,
      clientId: req.query.clientId ? Number(req.query.clientId) : undefined,
      venueId: req.query.venueId ? Number(req.query.venueId) : undefined,
      q: req.query.q as string | undefined,
      minBudget: req.query.minBudget ? Number(req.query.minBudget) : undefined,
      maxBudget: req.query.maxBudget ? Number(req.query.maxBudget) : undefined,
      sortBy: req.query.sortBy as EventFilters['sortBy'],
      sortDir: req.query.sortDir as 'asc' | 'desc' | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };
    const events = await eventsController.list(filters);
    res.json(events);
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.post('/events', async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventsController.create(req.body);
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'create',
      entityType: 'event',
      entityId: (event as unknown as { id: number }).id,
      oldValues: null,
      newValues: event as unknown as Record<string, unknown>,
    });
    res.status(201).json(event);
  } catch (error: unknown) {
    handleValidationError(error, res);
  }
});

apiRouter.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const event = await eventsController.getById(id);
    if (!event) {
      return handleNotFoundError(res, 'Event');
    }
    res.json(event);
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.patch('/events/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const existing = await eventsController.getById(id);
    const event = await eventsController.update(id, req.body);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'event',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: event as unknown as Record<string, unknown>,
      });
    }
    res.json(event);
  } catch (error: unknown) {
    handleValidationError(error, res);
  }
});

apiRouter.delete('/events/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const existing = await eventsController.getById(id);
    await eventsController.remove(id);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'delete',
        entityType: 'event',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: null,
      });
    }
    res.status(204).send();
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.get('/staff', async (_req: Request, res: Response) => {
  try {
    const staff = await staffController.list();
    res.json(staff);
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.post('/staff', async (req: AuthRequest, res: Response) => {
  try {
    const person = await staffController.create(req.body);
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'create',
      entityType: 'staff',
      entityId: person.id!,
      oldValues: null,
      newValues: person as unknown as Record<string, unknown>,
    });
    res.status(201).json(person);
  } catch (error: unknown) {
    handleValidationError(error, res);
  }
});

apiRouter.get('/staff/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff id' });
    }
    const person = await staffController.getById(id);
    if (!person) {
      return handleNotFoundError(res, 'Staff');
    }
    res.json(person);
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.patch('/staff/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff id' });
    }
    const existing = await staffController.getById(id);
    const person = await staffController.update(id, req.body);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'staff',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: person as unknown as Record<string, unknown>,
      });
    }
    res.json(person);
  } catch (error: unknown) {
    handleValidationError(error, res);
  }
});

apiRouter.delete('/staff/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff id' });
    }
    const existing = await staffController.getById(id);
    await staffController.deactivate(id);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'staff',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: { ...existing, status: 'inactive' } as unknown as Record<string, unknown>,
      });
    }
    res.status(204).send();
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.get('/clients', async (_req: Request, res: Response) => {
  try {
    const clients = clientsRepository.list();
    res.json(clients);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const client = clientsRepository.getById(id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/venues', async (_req: Request, res: Response) => {
  try {
    const venues = venuesRepository.list();
    res.json(venues);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/venues/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const venue = venuesRepository.getById(id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json(venue);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/weather', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;
    const date = req.query.date as string;
    
    if (!city || !date) {
      return res.status(400).json({ error: 'City and date parameters are required' });
    }
    
    const weather = await weatherController.getWeatherByCity(city, date);
    if (!weather) {
      return res.status(404).json({ error: 'Weather data not found' });
    }
    res.json(weather);
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.get('/distance', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;
    const fromCity = req.query.fromCity as string | undefined;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    const distance = await distanceController.getDistanceAndTime(city, fromCity);
    if (!distance) {
      return res.status(404).json({ error: 'Distance data not found' });
    }
    res.json(distance);
  } catch (error: unknown) {
    handleError(error, res);
  }
});

apiRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await settingsController.get();
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.patch('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await settingsController.get();
    const settings = await settingsController.update(req.body);
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'update',
      entityType: 'settings',
      entityId: 0,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: settings as unknown as Record<string, unknown>,
    });
    res.json(settings);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.post('/settings/reset', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await settingsController.get();
    const settings = await settingsController.reset();
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'update',
      entityType: 'settings',
      entityId: 0,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: settings as unknown as Record<string, unknown>,
    });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Equipment Categories API
apiRouter.get('/equipment-categories', async (_req: Request, res: Response) => {
  try {
    const categories = await equipmentCategoriesController.list();
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/equipment-categories', async (req: AuthRequest, res: Response) => {
  try {
    const category = await equipmentCategoriesController.create(req.body);
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'create',
      entityType: 'equipment_category',
      entityId: (category as unknown as { id: number }).id,
      oldValues: null,
      newValues: category as unknown as Record<string, unknown>,
    });
    res.status(201).json(category);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.get('/equipment-categories/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const category = await equipmentCategoriesController.getById(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.patch('/equipment-categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await equipmentCategoriesController.getById(id);
    const category = await equipmentCategoriesController.update(id, req.body);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'equipment_category',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: category as unknown as Record<string, unknown>,
      });
    }
    res.json(category);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.delete('/equipment-categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await equipmentCategoriesController.getById(id);
    await equipmentCategoriesController.delete(id);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'delete',
        entityType: 'equipment_category',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: null,
      });
    }
    res.status(204).send();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

// Equipment API
apiRouter.get('/equipment', async (_req: Request, res: Response) => {
  try {
    const equipment = await equipmentController.list();
    res.json(equipment);
  } catch (error) {
    console.error('Error in GET /equipment:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.post('/equipment', async (req: AuthRequest, res: Response) => {
  try {
    const item = await equipmentController.create(req.body);
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'create',
      entityType: 'equipment',
      entityId: (item as unknown as { id: number }).id,
      oldValues: null,
      newValues: item as unknown as Record<string, unknown>,
    });
    res.status(201).json(item);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.get('/equipment/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await equipmentController.getById(id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.patch('/equipment/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await equipmentController.getById(id);
    const item = await equipmentController.update(id, req.body);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'equipment',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: item as unknown as Record<string, unknown>,
      });
    }
    res.json(item);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.delete('/equipment/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await equipmentController.getById(id);
    await equipmentController.delete(id);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'delete',
        entityType: 'equipment',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: null,
      });
    }
    res.status(204).send();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

// Equipment Movements API
apiRouter.get('/equipment-movements', async (_req: Request, res: Response) => {
  try {
    const movements = await equipmentMovementsController.list();
    res.json(movements);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/equipment-movements/equipment/:equipmentId', async (req: Request, res: Response) => {
  try {
    const equipmentId = Number(req.params.equipmentId);
    const movements = await equipmentMovementsController.findByEquipmentId(equipmentId);
    res.json(movements);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/equipment-movements/event/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const movements = await equipmentMovementsController.findByEventId(eventId);
    res.json(movements);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assignments API
apiRouter.get('/events/:eventId/assignments', async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const filters: AssignmentFilters = {
      status: req.query.status as AssignmentStatus | undefined,
      startFrom: req.query.startFrom as string | undefined,
      endTo: req.query.endTo as string | undefined,
    };
    const assignments = await assignmentsController.listByEvent(eventId, filters);
    res.json(assignments);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.post('/events/:eventId/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const assignment = await assignmentsController.create({ ...req.body, eventId });
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'create',
      entityType: 'assignment',
      entityId: (assignment as unknown as { id: number }).id,
      oldValues: null,
      newValues: assignment as unknown as Record<string, unknown>,
    });
    res.status(201).json(assignment);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.get('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const assignment = await assignmentsController.getById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.patch('/assignments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await assignmentsController.getById(id);
    const assignment = await assignmentsController.update(id, req.body);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'assignment',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: assignment as unknown as Record<string, unknown>,
      });
    }
    res.json(assignment);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.delete('/assignments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await assignmentsController.getById(id);
    await assignmentsController.remove(id);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'delete',
        entityType: 'assignment',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: null,
      });
    }
    res.status(204).send();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.post('/equipment-movements', async (req: Request, res: Response) => {
  try {
    const movement = await equipmentMovementsController.create(req.body);
    res.status(201).json(movement);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const entityType = (req.query.entityType as string) || undefined;
    const entityId = req.query.entityId != null ? Number(req.query.entityId) : undefined;
    const actorId = req.query.actorId != null ? Number(req.query.actorId) : undefined;
    const action = (req.query.action as 'create' | 'update' | 'delete') || undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : 100;
    const offset = req.query.offset != null ? Number(req.query.offset) : 0;
    const items = await historyService.list({
      entityType,
      entityId,
      actorId,
      action,
      limit: Number.isInteger(limit) && limit > 0 ? limit : 100,
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tasks API
apiRouter.get('/tasks', async (req: Request, res: Response) => {
  try {
    const filters: TaskFilters = {
      status: req.query.status as TaskStatus | undefined,
      responsibleId: req.query.responsibleId ? Number(req.query.responsibleId) : undefined,
      problemId: req.query.problemId ? Number(req.query.problemId) : undefined,
      q: req.query.q as string | undefined,
      trackedOnly: req.query.trackedOnly === 'true',
    };
    const tasks = await tasksController.list(filters);
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const task = await tasksController.create(req.body);
    await historyService.record({
      actorId: req.auth?.userId ?? null,
      action: 'create',
      entityType: 'task',
      entityId: (task as unknown as { id: number }).id,
      oldValues: null,
      newValues: task as unknown as Record<string, unknown>,
    });
    res.status(201).json(task);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const task = await tasksController.getById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.patch('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await tasksController.getById(id);
    const task = await tasksController.update(id, req.body);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'update',
        entityType: 'task',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: task as unknown as Record<string, unknown>,
      });
    }
    res.json(task);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: msg });
  }
});

apiRouter.delete('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await tasksController.getById(id);
    await tasksController.remove(id);
    if (existing) {
      await historyService.record({
        actorId: req.auth?.userId ?? null,
        action: 'delete',
        entityType: 'task',
        entityId: id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: null,
      });
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const auth = authMiddleware(authService, { 
  skipPaths: [
    '/auth/login', 
    '/auth/register'
  ] 
});
app.use('/api/v1', auth, apiRouter);

const HISTORY_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 день

async function runHistoryCleanup() {
  try {
    const deleted = await historyService.cleanupExpired();
    if (deleted > 0) {
      console.log(`[history] Удалено записей старше 1 года: ${deleted}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('does not exist') || msg.includes('cleanup_entity_change_history')) {
      console.warn('[history] Функция очистки не найдена. Примените миграцию 004: docs/migrations/004_history_retention_1year.sql');
    } else {
      console.error('[history] Ошибка очистки устаревших записей:', err);
    }
  }
}

async function start() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:903',message:'start() function entry',data:{port:PORT,host:process.env.HOST},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:904',message:'before seedAuth',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  await seedAuth(usersRepository, permissionsRepository);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:905',message:'after seedAuth success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:906',message:'before seedEquipment',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  seedEquipment(equipmentCategoriesRepository, equipmentRepository);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:907',message:'after seedEquipment success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:908',message:'before runHistoryCleanup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  await runHistoryCleanup();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:909',message:'after runHistoryCleanup success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const HOST = process.env.HOST || '0.0.0.0';
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:910',message:'before app.listen',data:{host:HOST,port:PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  app.listen(PORT, HOST, () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:911',message:'app.listen callback - server started',data:{host:HOST,port:PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log(`Server running on http://${HOST}:${PORT}`);
    setInterval(runHistoryCleanup, HISTORY_CLEANUP_INTERVAL_MS);
  });
}

start().catch((err) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:925',message:'start() catch error',data:{error:err instanceof Error?err.message:String(err),stack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D,E'})}).catch(()=>{});
  // #endregion
  console.error('Failed to start:', err);
  process.exit(1);
});
