/**
 * @file: auth-routes.ts
 * @description: Auth and permissions API route handlers.
 * @dependencies: auth.service, permissions.service, roles.repository, middleware
 * @created: 2026-01-27
 */

import { Response } from 'express';
import { Router } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { PermissionsService } from '../modules/permissions/permissions.service';
import type { RolesRepository } from '../modules/roles/roles.repository';
import { authMiddleware, requirePermission, AuthRequest } from '../modules/auth/middleware';
import { PermissionKey } from '../modules/permissions/dto/permission.dto';
import type { StaffRepository } from '../modules/staff/staff.repository';
import type { AssignmentsRepository } from '../modules/assignments/assignments.repository';

export function setupAuthRoutes(
  authService: AuthService,
  permissionsService: PermissionsService,
  rolesRepository: RolesRepository,
  staffRepository: StaffRepository,
  assignmentsRepository: AssignmentsRepository,
  router: Router,
): void {
  const auth = authMiddleware(authService);
  const needAccessManage = requirePermission(authService, 'access:manage');

  router.post('/auth/login', async (req, res: Response) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }
      const result = await authService.login(String(email).trim(), String(password));
      if (!result) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/auth/register', async (req, res: Response) => {
    try {
      const { email, password, displayName } = req.body || {};
      if (!email || !password || !displayName) {
        res.status(400).json({ error: 'Email, password and displayName required' });
        return;
      }
      const result = await authService.register(
        String(email),
        String(password),
        String(displayName),
      );
      if ('error' in result) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(201).json(result);
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/auth/me', auth, async (req: AuthRequest, res: Response) => {
    const user = await authService.getUserById(req.auth!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const permissions = authService.getPermissions(req.auth!.userId);
    res.json({ user, permissions });
  });

  router.get('/auth/profile', auth, async (req: AuthRequest, res: Response) => {
    const user = await authService.getUserById(req.auth!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  });

  router.patch('/auth/profile', auth, async (req: AuthRequest, res: Response) => {
    try {
      const { firstName, lastName, avatarUrl } = req.body || {};
      const updates: { firstName?: string; lastName?: string; avatarUrl?: string } = {};
      if (firstName !== undefined) updates.firstName = String(firstName).trim() || undefined;
      if (lastName !== undefined) updates.lastName = String(lastName).trim() || undefined;
      if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl).trim() || undefined;
      const result = await authService.updateProfile(req.auth!.userId, updates);
      if ('error' in result) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.patch('/auth/password', auth, async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'currentPassword and newPassword required' });
        return;
      }
      const result = await authService.updatePassword(req.auth!.userId, {
        currentPassword: String(currentPassword),
        newPassword: String(newPassword),
      });
      if ('error' in result) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/users', auth, needAccessManage, (_req, res: Response) => {
    try {
      const list = permissionsService.listUsersWithPermissions();
      res.json(list);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/users/:id', auth, async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    const user = await authService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  });

  router.get('/users/:id/permissions', auth, needAccessManage, (req, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    const data = permissionsService.getByUserId(id);
    if (!data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(data);
  });

  router.patch('/users/:id/permissions', auth, needAccessManage, (req, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    const { permissions } = req.body || {};
    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: 'permissions array required' });
      return;
    }
    const valid = (permissions as unknown[]).filter((p): p is PermissionKey =>
      typeof p === 'string' && ['events:read','events:write','staff:read','staff:write','dashboard:read','calendar:read','access:manage'].includes(p),
    );
    const updated = permissionsService.update(id, { permissions: valid });
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(updated);
  });

  router.get('/permissions/keys', auth, (_req, res: Response) => {
    res.json(permissionsService.allPermissionKeys());
  });

  router.get('/roles', auth, needAccessManage, (_req, res: Response) => {
    try {
      const roles = rolesRepository.list();
      res.json(roles);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/auth/salary', auth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await authService.getUserById(req.auth!.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Находим сотрудника по email пользователя
      const staff = staffRepository.list().find(s => s.email.toLowerCase() === user.email.toLowerCase());
      if (!staff || !staff.rate) {
        res.json([]);
        return;
      }

      // Получаем все назначения для этого сотрудника
      const allAssignments = assignmentsRepository.listAll();
      const userAssignments = allAssignments.filter(a => a.staffId === staff.id && a.status === 'completed');

      // Группируем по месяцам и годам
      const salaryByMonth: Record<string, { year: number; month: number; amount: number; assignments: Array<{ eventId: number; startTime: string; endTime: string; hours: number; amount: number }> }> = {};

      for (const assignment of userAssignments) {
        const startDate = new Date(assignment.startTime);
        const endDate = new Date(assignment.endTime);
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1; // 1-12
        const key = `${year}-${month.toString().padStart(2, '0')}`;

        // Рассчитываем часы работы
        const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        
        // Используем paymentAmount если указан, иначе рассчитываем по rate
        const amount = assignment.paymentAmount !== undefined && assignment.paymentAmount !== null
          ? assignment.paymentAmount
          : hours * (staff.rate || 0);

        if (!salaryByMonth[key]) {
          salaryByMonth[key] = {
            year,
            month,
            amount: 0,
            assignments: [],
          };
        }

        salaryByMonth[key].amount += amount;
        salaryByMonth[key].assignments.push({
          eventId: assignment.eventId,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          hours: Math.round(hours * 100) / 100,
          amount: Math.round(amount * 100) / 100,
        });
      }

      // Преобразуем в массив и сортируем по году и месяцу (от новых к старым)
      const result = Object.values(salaryByMonth).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching salary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
