"use strict";
/**
 * @file: main.ts
 * @description: Backend entry point with Express server.
 * @dependencies: express, cors, modules, auth
 * @created: 2026-01-26
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const events_controller_1 = require("./modules/events/events.controller");
const events_service_impl_1 = require("./modules/events/events.service.impl");
const events_repository_1 = require("./modules/events/events.repository");
const staff_controller_1 = require("./modules/staff/staff.controller");
const staff_service_impl_1 = require("./modules/staff/staff.service.impl");
const staff_repository_1 = require("./modules/staff/staff.repository");
const clients_repository_1 = require("./modules/clients/clients.repository");
const venues_repository_1 = require("./modules/venues/venues.repository");
const settings_controller_1 = require("./modules/settings/settings.controller");
const settings_service_impl_1 = require("./modules/settings/settings.service.impl");
const settings_repository_1 = require("./modules/settings/settings.repository");
const users_repository_1 = require("./modules/users/users.repository");
const permissions_repository_1 = require("./modules/permissions/permissions.repository");
const roles_repository_1 = require("./modules/roles/roles.repository");
const auth_service_1 = require("./modules/auth/auth.service");
const permissions_service_1 = require("./modules/permissions/permissions.service");
const middleware_1 = require("./modules/auth/middleware");
const auth_routes_1 = require("./common/auth-routes");
const seed_1 = require("./modules/auth/seed");
const equipment_categories_controller_1 = require("./modules/equipment-categories/equipment-categories.controller");
const equipment_categories_service_impl_1 = require("./modules/equipment-categories/equipment-categories.service.impl");
const equipment_categories_repository_1 = require("./modules/equipment-categories/equipment-categories.repository");
const equipment_controller_1 = require("./modules/equipment/equipment.controller");
const equipment_service_impl_1 = require("./modules/equipment/equipment.service.impl");
const equipment_repository_1 = require("./modules/equipment/equipment.repository");
const equipment_movements_controller_1 = require("./modules/equipment-movements/equipment-movements.controller");
const equipment_movements_service_impl_1 = require("./modules/equipment-movements/equipment-movements.service.impl");
const equipment_movements_repository_1 = require("./modules/equipment-movements/equipment-movements.repository");
const history_repository_1 = require("./modules/history/history.repository");
const history_service_impl_1 = require("./modules/history/history.service.impl");
const seed_2 = require("./modules/equipment/seed");
const tasks_controller_1 = require("./modules/tasks/tasks.controller");
const tasks_service_impl_1 = require("./modules/tasks/tasks.service.impl");
const tasks_repository_1 = require("./modules/tasks/tasks.repository");
const assignments_repository_1 = require("./modules/assignments/assignments.repository");
const assignments_controller_1 = require("./modules/assignments/assignments.controller");
const assignments_service_impl_1 = require("./modules/assignments/assignments.service.impl");
const error_handler_1 = require("./common/error-handler");
const weather_service_impl_1 = require("./modules/weather/weather.service.impl");
const distance_service_impl_1 = require("./modules/distance/distance.service.impl");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
// Функция для проверки разрешенных origin
const corsOptions = {
    origin: (origin, callback) => {
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
app.use((0, cors_1.default)(corsOptions));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
const eventsRepository = new events_repository_1.EventsRepository();
const clientsRepository = new clients_repository_1.ClientsRepository();
const venuesRepository = new venues_repository_1.VenuesRepository();
const weatherService = new weather_service_impl_1.WeatherServiceImpl();
const distanceService = new distance_service_impl_1.DistanceServiceImpl();
const eventsService = new events_service_impl_1.EventsServiceImpl(eventsRepository, weatherService, distanceService, venuesRepository);
const eventsController = new events_controller_1.EventsController(eventsService);
const staffRepository = new staff_repository_1.StaffRepository();
const staffService = new staff_service_impl_1.StaffServiceImpl(staffRepository);
const staffController = new staff_controller_1.StaffController(staffService);
const settingsRepository = new settings_repository_1.SettingsRepository();
const settingsService = new settings_service_impl_1.SettingsServiceImpl(settingsRepository);
const settingsController = new settings_controller_1.SettingsController(settingsService);
const usersRepository = new users_repository_1.UsersRepository();
const permissionsRepository = new permissions_repository_1.PermissionsRepository();
const rolesRepository = new roles_repository_1.RolesRepository();
const authService = new auth_service_1.AuthService(usersRepository, permissionsRepository);
const permissionsService = new permissions_service_1.PermissionsService(usersRepository, permissionsRepository);
const equipmentCategoriesRepository = new equipment_categories_repository_1.EquipmentCategoriesRepository();
const equipmentCategoriesService = new equipment_categories_service_impl_1.EquipmentCategoriesServiceImpl(equipmentCategoriesRepository);
const equipmentCategoriesController = new equipment_categories_controller_1.EquipmentCategoriesController(equipmentCategoriesService);
const equipmentRepository = new equipment_repository_1.EquipmentRepository();
const equipmentService = new equipment_service_impl_1.EquipmentServiceImpl(equipmentRepository);
const equipmentController = new equipment_controller_1.EquipmentController(equipmentService);
const equipmentMovementsRepository = new equipment_movements_repository_1.EquipmentMovementsRepository();
const equipmentMovementsService = new equipment_movements_service_impl_1.EquipmentMovementsServiceImpl(equipmentMovementsRepository);
const equipmentMovementsController = new equipment_movements_controller_1.EquipmentMovementsController(equipmentMovementsService);
const historyRepository = new history_repository_1.HistoryRepository();
const historyService = new history_service_impl_1.HistoryServiceImpl(historyRepository);
const tasksRepository = new tasks_repository_1.TasksRepository();
const tasksService = new tasks_service_impl_1.TasksServiceImpl(tasksRepository);
const tasksController = new tasks_controller_1.TasksController(tasksService);
const assignmentsRepository = new assignments_repository_1.AssignmentsRepository();
const assignmentsService = new assignments_service_impl_1.AssignmentsServiceImpl(assignmentsRepository);
const assignmentsController = new assignments_controller_1.AssignmentsController(assignmentsService);
const apiRouter = express_1.default.Router();
(0, auth_routes_1.setupAuthRoutes)(authService, permissionsService, rolesRepository, staffRepository, assignmentsRepository, apiRouter);
apiRouter.get('/events', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            startFrom: req.query.startFrom,
            endTo: req.query.endTo,
            clientId: req.query.clientId ? Number(req.query.clientId) : undefined,
            venueId: req.query.venueId ? Number(req.query.venueId) : undefined,
            q: req.query.q,
            minBudget: req.query.minBudget ? Number(req.query.minBudget) : undefined,
            maxBudget: req.query.maxBudget ? Number(req.query.maxBudget) : undefined,
            sortBy: req.query.sortBy,
            sortDir: req.query.sortDir,
            page: req.query.page ? Number(req.query.page) : undefined,
            pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        };
        const events = await eventsController.list(filters);
        res.json(events);
    }
    catch (error) {
        (0, error_handler_1.handleError)(error, res);
    }
});
apiRouter.post('/events', async (req, res) => {
    try {
        const event = await eventsController.create(req.body);
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'create',
            entityType: 'event',
            entityId: event.id,
            oldValues: null,
            newValues: event,
        });
        res.status(201).json(event);
    }
    catch (error) {
        (0, error_handler_1.handleValidationError)(error, res);
    }
});
apiRouter.get('/events/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid event id' });
        }
        const event = await eventsController.getById(id);
        if (!event) {
            return (0, error_handler_1.handleNotFoundError)(res, 'Event');
        }
        res.json(event);
    }
    catch (error) {
        (0, error_handler_1.handleError)(error, res);
    }
});
apiRouter.patch('/events/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: event,
            });
        }
        res.json(event);
    }
    catch (error) {
        (0, error_handler_1.handleValidationError)(error, res);
    }
});
apiRouter.delete('/events/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: null,
            });
        }
        res.status(204).send();
    }
    catch (error) {
        (0, error_handler_1.handleError)(error, res);
    }
});
apiRouter.get('/staff', async (_req, res) => {
    try {
        const staff = await staffController.list();
        res.json(staff);
    }
    catch (error) {
        (0, error_handler_1.handleError)(error, res);
    }
});
apiRouter.post('/staff', async (req, res) => {
    try {
        const person = await staffController.create(req.body);
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'create',
            entityType: 'staff',
            entityId: person.id,
            oldValues: null,
            newValues: person,
        });
        res.status(201).json(person);
    }
    catch (error) {
        (0, error_handler_1.handleValidationError)(error, res);
    }
});
apiRouter.get('/staff/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid staff id' });
        }
        const person = await staffController.getById(id);
        if (!person) {
            return (0, error_handler_1.handleNotFoundError)(res, 'Staff');
        }
        res.json(person);
    }
    catch (error) {
        (0, error_handler_1.handleError)(error, res);
    }
});
apiRouter.patch('/staff/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: person,
            });
        }
        res.json(person);
    }
    catch (error) {
        (0, error_handler_1.handleValidationError)(error, res);
    }
});
apiRouter.delete('/staff/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: { ...existing, status: 'inactive' },
            });
        }
        res.status(204).send();
    }
    catch (error) {
        (0, error_handler_1.handleError)(error, res);
    }
});
apiRouter.get('/clients', async (_req, res) => {
    try {
        const clients = clientsRepository.list();
        res.json(clients);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.get('/clients/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const client = clientsRepository.getById(id);
        if (!client)
            return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.get('/venues', async (_req, res) => {
    try {
        const venues = venuesRepository.list();
        res.json(venues);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.get('/venues/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const venue = venuesRepository.getById(id);
        if (!venue)
            return res.status(404).json({ error: 'Venue not found' });
        res.json(venue);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.get('/settings', async (_req, res) => {
    try {
        const settings = await settingsController.get();
        res.json(settings);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.patch('/settings', async (req, res) => {
    try {
        const existing = await settingsController.get();
        const settings = await settingsController.update(req.body);
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'update',
            entityType: 'settings',
            entityId: 0,
            oldValues: existing,
            newValues: settings,
        });
        res.json(settings);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.post('/settings/reset', async (req, res) => {
    try {
        const existing = await settingsController.get();
        const settings = await settingsController.reset();
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'update',
            entityType: 'settings',
            entityId: 0,
            oldValues: existing,
            newValues: settings,
        });
        res.json(settings);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Equipment Categories API
apiRouter.get('/equipment-categories', async (_req, res) => {
    try {
        const categories = await equipmentCategoriesController.list();
        res.json(categories);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.post('/equipment-categories', async (req, res) => {
    try {
        const category = await equipmentCategoriesController.create(req.body);
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'create',
            entityType: 'equipment_category',
            entityId: category.id,
            oldValues: null,
            newValues: category,
        });
        res.status(201).json(category);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.get('/equipment-categories/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const category = await equipmentCategoriesController.getById(id);
        if (!category)
            return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.patch('/equipment-categories/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: category,
            });
        }
        res.json(category);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.delete('/equipment-categories/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: null,
            });
        }
        res.status(204).send();
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
// Equipment API
apiRouter.get('/equipment', async (_req, res) => {
    try {
        const equipment = await equipmentController.list();
        res.json(equipment);
    }
    catch (error) {
        console.error('Error in GET /equipment:', error);
        res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
});
apiRouter.post('/equipment', async (req, res) => {
    try {
        const item = await equipmentController.create(req.body);
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'create',
            entityType: 'equipment',
            entityId: item.id,
            oldValues: null,
            newValues: item,
        });
        res.status(201).json(item);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.get('/equipment/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const item = await equipmentController.getById(id);
        if (!item)
            return res.status(404).json({ error: 'Equipment not found' });
        res.json(item);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.patch('/equipment/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: item,
            });
        }
        res.json(item);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.delete('/equipment/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: null,
            });
        }
        res.status(204).send();
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
// Equipment Movements API
apiRouter.get('/equipment-movements', async (_req, res) => {
    try {
        const movements = await equipmentMovementsController.list();
        res.json(movements);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.get('/equipment-movements/equipment/:equipmentId', async (req, res) => {
    try {
        const equipmentId = Number(req.params.equipmentId);
        const movements = await equipmentMovementsController.findByEquipmentId(equipmentId);
        res.json(movements);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.get('/equipment-movements/event/:eventId', async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const movements = await equipmentMovementsController.findByEventId(eventId);
        res.json(movements);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Assignments API
apiRouter.get('/events/:eventId/assignments', async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const filters = {
            status: req.query.status,
            startFrom: req.query.startFrom,
            endTo: req.query.endTo,
        };
        const assignments = await assignmentsController.listByEvent(eventId, filters);
        res.json(assignments);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.post('/events/:eventId/assignments', async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const assignment = await assignmentsController.create({ ...req.body, eventId });
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'create',
            entityType: 'assignment',
            entityId: assignment.id,
            oldValues: null,
            newValues: assignment,
        });
        res.status(201).json(assignment);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.get('/assignments/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const assignment = await assignmentsController.getById(id);
        if (!assignment)
            return res.status(404).json({ error: 'Assignment not found' });
        res.json(assignment);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.patch('/assignments/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: assignment,
            });
        }
        res.json(assignment);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.delete('/assignments/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: null,
            });
        }
        res.status(204).send();
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.post('/equipment-movements', async (req, res) => {
    try {
        const movement = await equipmentMovementsController.create(req.body);
        res.status(201).json(movement);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.get('/history', async (req, res) => {
    try {
        const entityType = req.query.entityType || undefined;
        const entityId = req.query.entityId != null ? Number(req.query.entityId) : undefined;
        const actorId = req.query.actorId != null ? Number(req.query.actorId) : undefined;
        const action = req.query.action || undefined;
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
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Tasks API
apiRouter.get('/tasks', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            responsibleId: req.query.responsibleId ? Number(req.query.responsibleId) : undefined,
            problemId: req.query.problemId ? Number(req.query.problemId) : undefined,
            q: req.query.q,
            trackedOnly: req.query.trackedOnly === 'true',
        };
        const tasks = await tasksController.list(filters);
        res.json(tasks);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.post('/tasks', async (req, res) => {
    try {
        const task = await tasksController.create(req.body);
        await historyService.record({
            actorId: req.auth?.userId ?? null,
            action: 'create',
            entityType: 'task',
            entityId: task.id,
            oldValues: null,
            newValues: task,
        });
        res.status(201).json(task);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.get('/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const task = await tasksController.getById(id);
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
apiRouter.patch('/tasks/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: task,
            });
        }
        res.json(task);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Bad request';
        res.status(400).json({ error: msg });
    }
});
apiRouter.delete('/tasks/:id', async (req, res) => {
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
                oldValues: existing,
                newValues: null,
            });
        }
        res.status(204).send();
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const auth = (0, middleware_1.authMiddleware)(authService, { skipPaths: ['/auth/login', '/auth/register'] });
app.use('/api/v1', auth, apiRouter);
const HISTORY_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 день
async function runHistoryCleanup() {
    try {
        const deleted = await historyService.cleanupExpired();
        if (deleted > 0) {
            console.log(`[history] Удалено записей старше 1 года: ${deleted}`);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('does not exist') || msg.includes('cleanup_entity_change_history')) {
            console.warn('[history] Функция очистки не найдена. Примените миграцию 004: docs/migrations/004_history_retention_1year.sql');
        }
        else {
            console.error('[history] Ошибка очистки устаревших записей:', err);
        }
    }
}
async function start() {
    await (0, seed_1.seedAuth)(usersRepository, permissionsRepository);
    (0, seed_2.seedEquipment)(equipmentCategoriesRepository, equipmentRepository);
    await runHistoryCleanup();
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
        setInterval(runHistoryCleanup, HISTORY_CLEANUP_INTERVAL_MS);
    });
}
start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
});
