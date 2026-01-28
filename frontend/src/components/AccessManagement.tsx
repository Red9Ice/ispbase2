/**
 * @file: AccessManagement.tsx
 * @description: Access management: quick roles, custom matrix, table view.
 * @dependencies: api, PermissionKey, RoleDto, UserPermissionsDto
 * @created: 2026-01-27
 */

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import {
  api,
  type UserPermissionsDto,
  type PermissionKey,
  type RoleDto,
} from '../services/api';
import './AccessManagement.css';

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'events:read': 'Мероприятия: чтение',
  'events:write': 'Мероприятия: запись',
  'staff:read': 'Персонал: чтение',
  'staff:write': 'Персонал: запись',
  'dashboard:read': 'Дашборд: чтение',
  'calendar:read': 'Календарь: чтение',
  'access:manage': 'Управление доступом',
};

type ViewMode = 'table' | 'matrix';

export function AccessManagement() {
  const [list, setList] = useState<UserPermissionsDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  /* Table: edit single user */
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<PermissionKey[]>([]);

  /* Matrix: user × permission grid, dirty users */
  const [matrix, setMatrix] = useState<Map<number, Set<PermissionKey>>>(new Map());
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const allKeys = useMemo(
    () => Object.keys(PERMISSION_LABELS) as PermissionKey[],
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.users.listWithPermissions(),
        api.roles.list(),
      ]);
      setList(usersData);
      setRoles(rolesData);
      const m = new Map<number, Set<PermissionKey>>();
      usersData.forEach((u) => {
        m.set(u.userId, new Set(u.permissions));
      });
      setMatrix(m);
      setDirty(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Table: apply role to user (draft or save) */
  const applyRole = useCallback(
    (userId: number, role: RoleDto) => {
      if (viewMode === 'table') {
        if (editing === userId) {
          setDraft([...role.permissions]);
        } else {
          setEditing(userId);
          setDraft([...role.permissions]);
        }
        return;
      }
      setMatrix((prev) => {
        const next = new Map(prev);
        next.set(userId, new Set(role.permissions));
        return next;
      });
      setDirty((prev) => new Set(prev).add(userId));
    },
    [viewMode, editing],
  );

  /* Table: toggle permission in draft */
  const togglePerm = useCallback((p: PermissionKey) => {
    setDraft((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }, []);

  const startEdit = useCallback((row: UserPermissionsDto) => {
    setEditing(row.userId);
    setDraft([...row.permissions]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraft([]);
  }, []);

  const saveTable = useCallback(async () => {
    if (editing == null) return;
    setError(null);
    try {
      await api.users.updatePermissions(editing, draft);
      setEditing(null);
      setDraft([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    }
  }, [editing, draft, load]);

  /* Matrix: toggle cell */
  const toggleMatrixCell = useCallback((userId: number, p: PermissionKey) => {
    setMatrix((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(userId) ?? []);
      if (set.has(p)) set.delete(p);
      else set.add(p);
      next.set(userId, set);
      return next;
    });
    setDirty((prev) => new Set(prev).add(userId));
  }, []);

  const saveMatrix = useCallback(async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        Array.from(dirty).map((userId) => {
          const perms = matrix.get(userId) ?? new Set<PermissionKey>();
          return api.users.updatePermissions(userId, Array.from(perms));
        }),
      );
      setDirty(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [dirty, matrix, load]);

  const hasMatrixPerm = useCallback(
    (userId: number, p: PermissionKey) => matrix.get(userId)?.has(p) ?? false,
    [matrix],
  );

  const userLabel = (u: UserPermissionsDto) =>
    u.displayName || u.email || `#${u.userId}`;

  return (
    <section className="access-management">
      <div className="access-toolbar">
        <div className="access-view-toggle">
          <span className="access-view-label">Вид:</span>
          <button
            type="button"
            className={`access-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Таблица
          </button>
          <button
            type="button"
            className={`access-view-btn ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
          >
            Матрица
          </button>
        </div>
        {viewMode === 'matrix' && dirty.size > 0 && (
          <div className="access-matrix-actions">
            <span className="access-dirty-hint">
              Изменено пользователей: {dirty.size}
            </span>
            <button
              type="button"
              className="primary"
              onClick={saveMatrix}
              disabled={saving}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>

      {roles.length > 0 && (
        <div className="access-quick-roles">
          <span className="access-quick-label">Быстрые роли:</span>
          <div className="access-roles-list">
            {roles.map((role) => (
              <div key={role.id} className="access-role-chip" title={role.description}>
                <span className="access-role-name">{role.name}</span>
                <span className="access-role-apply-label">→ применить к</span>
                <select
                  className="access-role-select"
                  defaultValue=""
                  onChange={(e) => {
                    const uid = Number(e.target.value);
                    if (uid && !Number.isNaN(uid)) applyRole(uid, role);
                    e.target.value = '';
                  }}
                >
                  <option value="">выбрать пользователя</option>
                  {list.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {userLabel(u)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="access-error">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <div>Права доступа</div>
          {loading && <span className="loading-text"> (загрузка…)</span>}
        </div>

        {loading && list.length === 0 ? (
          <div className="panel-body">
            <div className="empty-state">Загрузка…</div>
          </div>
        ) : list.length === 0 ? (
          <div className="panel-body">
            <div className="empty-state">Нет пользователей</div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="access-table-wrap">
            <table className="table access-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Права</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.userId}</td>
                    <td>
                      <span className="access-user-display">
                        {row.displayName && (
                          <span className="access-user-name">{row.displayName}</span>
                        )}
                        <span className="access-user-email">{row.email}</span>
                      </span>
                    </td>
                    <td>
                      {editing === row.userId ? (
                        <div className="access-perms-edit">
                          {allKeys.map((k) => (
                            <label key={k} className="access-check">
                              <input
                                type="checkbox"
                                checked={draft.includes(k)}
                                onChange={() => togglePerm(k)}
                              />
                              <span>{PERMISSION_LABELS[k]}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="access-perms-list">
                          {row.permissions.length
                            ? row.permissions.map((p) => (
                                <span key={p} className="tag tag-sm">
                                  {PERMISSION_LABELS[p]}
                                </span>
                              ))
                            : '—'}
                        </div>
                      )}
                    </td>
                    <td>
                      {editing === row.userId ? (
                        <>
                          <button
                            type="button"
                            className="button-link"
                            onClick={saveTable}
                          >
                            Сохранить
                          </button>
                          <button
                            type="button"
                            className="button-link"
                            onClick={cancelEdit}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="button-link"
                            onClick={() => startEdit(row)}
                          >
                            Изменить
                          </button>
                          <select
                            className="access-row-role-select"
                            defaultValue=""
                            onChange={(e) => {
                              const id = e.target.value;
                              const r = roles.find((x) => x.id === id);
                              if (r) applyRole(row.userId, r);
                              e.target.value = '';
                            }}
                          >
                            <option value="">Роль…</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="access-matrix-wrap">
            <div className="access-matrix-grid">
              <div className="access-matrix-corner" />
              {allKeys.map((p) => (
                <div
                  key={p}
                  className="access-matrix-col-head"
                  title={PERMISSION_LABELS[p]}
                >
                  {PERMISSION_LABELS[p]}
                </div>
              ))}
              {list.map((u) => (
                <Fragment key={u.userId}>
                  <div className="access-matrix-row-head">
                    <span className="access-matrix-user-name">
                      {u.displayName || u.email}
                    </span>
                    <span className="access-matrix-user-email">{u.email}</span>
                    {dirty.has(u.userId) && (
                      <span className="access-matrix-dirty-dot" title="Есть несохранённые изменения" />
                    )}
                  </div>
                  {allKeys.map((p) => (
                    <div
                      key={p}
                      className="access-matrix-cell"
                      role="gridcell"
                    >
                      <label className="access-matrix-check">
                        <input
                          type="checkbox"
                          checked={hasMatrixPerm(u.userId, p)}
                          onChange={() => toggleMatrixCell(u.userId, p)}
                        />
                      </label>
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
