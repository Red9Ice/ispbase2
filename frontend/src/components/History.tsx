/**
 * @file: History.tsx
 * @description: История редактирования и обновлений данных — кем, когда, что; прошлые и текущие значения.
 * @dependencies: services/api.ts, utils/format.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
import { api } from '../services/api';
import type { ChangeHistoryRecord, HistoryAction, AuthUser } from '../services/api';
import { formatDateTime } from '../utils/format';
import './History.css';

const ENTITY_LABELS: Record<string, string> = {
  event: 'Мероприятие',
  staff: 'Персонал',
  equipment: 'Оборудование',
  equipment_category: 'Категория оборудования',
  settings: 'Настройки',
};

const ACTION_LABELS: Record<HistoryAction, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
};

const SKIP_KEYS = ['createdAt', 'updatedAt'];

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

type ChangedField = { key: string; oldVal: unknown; newVal: unknown };

function getChangedFields(
  action: HistoryAction,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
): ChangedField[] {
  if (action === 'create') {
    if (!newValues) return [];
    return Object.entries(newValues)
      .filter(([k]) => !SKIP_KEYS.includes(k))
      .map(([key, newVal]) => ({ key, oldVal: null, newVal }));
  }
  if (action === 'delete') {
    if (!oldValues) return [];
    return Object.entries(oldValues)
      .filter(([k]) => !SKIP_KEYS.includes(k))
      .map(([key, oldVal]) => ({ key, oldVal, newVal: null }));
  }
  // update: только поля, где значение изменилось
  const old = oldValues ?? {};
  const new_ = newValues ?? {};
  const keys = new Set([...Object.keys(old), ...Object.keys(new_)]);
  const out: ChangedField[] = [];
  for (const key of keys) {
    if (SKIP_KEYS.includes(key)) continue;
    const o = key in old ? old[key] : undefined;
    const n = key in new_ ? new_[key] : undefined;
    const same = JSON.stringify(o) === JSON.stringify(n);
    if (!same) out.push({ key, oldVal: o, newVal: n });
  }
  return out;
}

function renderChangedOnly(
  action: HistoryAction,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
): React.ReactNode {
  const fields = getChangedFields(action, oldValues, newValues);
  if (fields.length === 0) return <em>Нет изменённых полей</em>;
  return (
    <table className="history-diff-table">
      <thead>
        <tr>
          <th>Поле</th>
          <th className="history-old">Было</th>
          <th className="history-new">Стало</th>
        </tr>
      </thead>
      <tbody>
        {fields.map(({ key, oldVal, newVal }) => (
          <tr key={key}>
            <td className="history-diff-key">{key}</td>
            <td className="history-old">{formatVal(oldVal)}</td>
            <td className="history-new">{formatVal(newVal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function History() {
  const [items, setItems] = useState<ChangeHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<string>('');
  const [entityId, setEntityId] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [users, setUsers] = useState<Map<number, AuthUser>>(new Map());

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Parameters<typeof api.history.list>[0] = { limit: 100 };
      if (entityType) filters.entityType = entityType;
      if (entityId.trim()) {
        const n = Number(entityId);
        if (Number.isInteger(n) && n > 0) filters.entityId = n;
      }
      if (action) filters.action = action as HistoryAction;
      const data = await api.history.list(filters);
      setItems(data);

      // Загружаем информацию о пользователях
      const userIds = new Set<number>();
      data.forEach((item) => {
        if (item.actorId) userIds.add(item.actorId);
      });

      const usersMap = new Map<number, AuthUser>();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const user = await api.users.getById(userId);
            usersMap.set(userId, user);
          } catch (e) {
            console.error(`Failed to load user ${userId}:`, e);
          }
        }),
      );
      setUsers(usersMap);
    } catch (e) {
      console.error('Failed to load history:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, action]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const entityLabel = (t: string) => ENTITY_LABELS[t] ?? t;
  const actionLabel = (a: HistoryAction) => ACTION_LABELS[a] ?? a;

  const getUserDisplay = (actorId: number | null): { name: string; avatar: string | null } => {
    if (!actorId) return { name: '—', avatar: null };
    const user = users.get(actorId);
    if (!user) return { name: `ID: ${actorId}`, avatar: null };
    const name = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.displayName || user.email;
    return { name, avatar: user.avatarUrl || null };
  };

  return (
    <div className="history-page">
      <div className="history-filters card">
        <h3 className="history-filters-title">Фильтры</h3>
        <div className="history-filters-row">
          <label>
            <span>Сущность</span>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="input"
            >
              <option value="">Все</option>
              {Object.entries(ENTITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>ID сущности</span>
            <input
              type="number"
              min={1}
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="—"
              className="input"
            />
          </label>
          <label>
            <span>Действие</span>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="input"
            >
              <option value="">Все</option>
              {Object.entries(ACTION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="primary" onClick={loadHistory}>
            Обновить
          </button>
        </div>
      </div>

      <div className="history-list card">
        <h3 className="history-list-title">История изменений</h3>
        {loading ? (
          <p className="history-empty">Загрузка…</p>
        ) : items.length === 0 ? (
          <p className="history-empty">Записей нет</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Когда</th>
                  <th>Кто</th>
                  <th>Действие</th>
                  <th>Сущность</th>
                  <th>ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const userDisplay = getUserDisplay(r.actorId);
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="history-row"
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      >
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>
                          <div className="history-actor">
                            {userDisplay.avatar ? (
                              <img src={userDisplay.avatar} alt={userDisplay.name} className="history-actor-avatar" />
                            ) : (
                              <div className="history-actor-placeholder">
                                {userDisplay.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="history-actor-name">{userDisplay.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`history-action history-action-${r.action}`}>
                            {actionLabel(r.action)}
                          </span>
                        </td>
                        <td>{entityLabel(r.entityType)}</td>
                        <td>{r.entityId}</td>
                        <td>
                          <button
                            type="button"
                            className="history-toggle"
                            aria-expanded={expandedId === r.id}
                          >
                            {expandedId === r.id ? '▲ Свернуть' : '▼ Было / Стало'}
                          </button>
                        </td>
                      </tr>
                    {expandedId === r.id && (
                      <tr className="history-detail-row">
                        <td colSpan={6}>
                          <div className="history-detail">
                            {renderChangedOnly(r.action, r.oldValues, r.newValues)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
