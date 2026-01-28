/**
 * @file: EquipmentCategoryManager.tsx
 * @description: Управление категориями оборудования в виде дерева.
 * @dependencies: services/api.ts, utils/categoryTree.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { EquipmentCategoryDto } from '../services/api';
import { buildCategoryTree, categoryOptions, type CategoryTreeNode } from '../utils/categoryTree';
import { ConfirmDialog } from './ConfirmDialog';
import './EquipmentCategoryManager.css';

export function EquipmentCategoryManager() {
  const [categories, setCategories] = useState<EquipmentCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EquipmentCategoryDto | undefined>(undefined);
  const [formData, setFormData] = useState({ name: '', description: '', parentId: null as number | null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const options = useMemo(() => categoryOptions(categories), [categories]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.equipmentCategories.list();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = (parentId?: number | null) => {
    setEditingCategory(undefined);
    const pid = parentId ?? null;
    setFormData({ name: '', description: '', parentId: pid });
    setShowForm(true);
  };

  const handleEdit = (category: EquipmentCategoryDto) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId ?? null,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingCategoryId) {
      return;
    }
    try {
      await api.equipmentCategories.delete(deletingCategoryId);
      // Анимация удаления элемента из списка
      const categoryElement = document.querySelector(`[data-category-id="${deletingCategoryId}"]`);
      if (categoryElement) {
        categoryElement.classList.add('item-deleting');
        setTimeout(() => {
          loadCategories();
        }, 400);
      } else {
        loadCategories();
      }
      setShowDeleteConfirm(false);
      setDeletingCategoryId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ошибка при удалении');
      setShowDeleteConfirm(false);
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingCategoryId(id);
    setShowDeleteConfirm(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 1) {
      newErrors.name = 'Название обязательно';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        parentId: formData.parentId,
      };
      if (editingCategory?.id) {
        await api.equipmentCategories.update(editingCategory.id, payload);
      } else {
        await api.equipmentCategories.create(payload);
      }
      setShowForm(false);
      setEditingCategory(undefined);
      loadCategories();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка при сохранении' });
    } finally {
      setSaving(false);
    }
  };

  const collectIds = (nodes: CategoryTreeNode[], targetId: number): CategoryTreeNode | null => {
    for (const n of nodes) {
      if (n.id === targetId) return n;
      const found = collectIds(n.children, targetId);
      if (found) return found;
    }
    return null;
  };

  const optionsExcludingSelfAndDescendants = useMemo(() => {
    if (!editingCategory?.id) return options;
    const exclude = new Set<number>();
    const addNodeAndDescendants = (node: CategoryTreeNode) => {
      exclude.add(node.id);
      node.children.forEach(addNodeAndDescendants);
    };
    const start = collectIds(tree, editingCategory.id);
    if (start) addNodeAndDescendants(start);
    return options.filter((o) => !exclude.has(o.id));
  }, [editingCategory?.id, options, tree]);

  if (loading) {
    return <div className="empty-state">Загрузка категорий...</div>;
  }

  return (
    <div className="equipment-category-manager">
      <div className="category-manager-header">
        <h3>Категории оборудования</h3>
        <div className="category-manager-actions">
          <button type="button" className="button-secondary" onClick={() => handleCreate(null)}>
            Создать корневую
          </button>
          <button type="button" className="button-primary" onClick={() => handleCreate()}>
            Создать категорию
          </button>
        </div>
      </div>

      {showForm && (
        <div className="panel category-form-panel">
          <div className="panel-header">
            {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
          </div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Родительская категория</label>
                <select
                  value={formData.parentId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                >
                  <option value="">— Без родителя (корневая) —</option>
                  {(editingCategory ? optionsExcludingSelfAndDescendants : options).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.path}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              {errors.submit && <div className="error-text">{errors.submit}</div>}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(undefined);
                  }}
                  className="button-secondary"
                >
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="button-primary">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="category-tree-wrap">
        {tree.length === 0 ? (
          <div className="empty-state">Нет категорий</div>
        ) : (
          <ul className="category-tree">
            {tree.map((node) => (
              <CategoryTreeItem
                key={node.id}
                node={node}
                expanded={expanded}
                onToggle={toggleExpand}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onCreateChild={handleCreate}
              />
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удаление категории"
        message="Вы уверены, что хотите удалить эту категорию? Подкатегории не удаляются. Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingCategoryId(null);
        }}
      />
    </div>
  );
}

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onEdit: (c: EquipmentCategoryDto) => void;
  onDelete: (id: number) => void;
  onCreateChild: (parentId: number) => void;
}

function CategoryTreeItem({
  node,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onCreateChild,
}: CategoryTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <li className="category-tree-item" data-category-id={node.id}>
      <div className="category-tree-node">
        <span
          className={`category-tree-toggle ${hasChildren ? '' : 'category-tree-toggle-empty'}`}
          onClick={() => hasChildren && onToggle(node.id)}
          role="button"
          tabIndex={0}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : '·'}
        </span>
        <span className="category-tree-label">{node.name}</span>
        {node.description && (
          <span className="category-tree-desc">{node.description}</span>
        )}
        <span className="category-tree-actions">
          <button type="button" className="button-link" onClick={() => onCreateChild(node.id)}>
            Добавить
          </button>
          <button type="button" className="button-link" onClick={() => onEdit(node.raw)}>
            Изменить
          </button>
          <button
            type="button"
            className="button-link category-tree-delete"
            onClick={() => node.id && onDelete(node.id)}
          >
            Удалить
          </button>
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul className="category-tree">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
