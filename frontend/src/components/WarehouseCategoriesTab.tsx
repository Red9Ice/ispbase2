/**
 * @file: WarehouseCategoriesTab.tsx
 * @description: Вкладка "Категории" с древовидной структурой, drag-and-drop и формой редактирования.
 * @dependencies: services/api.ts, utils/categoryTree.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { EquipmentCategoryDto } from '../services/api';
import { buildCategoryTree, type CategoryTreeNode } from '../utils/categoryTree';
import './WarehouseCategoriesTab.css';

interface WarehouseCategoriesTabProps {
  onCreateCategory?: () => void;
}

export function WarehouseCategoriesTab({ }: WarehouseCategoriesTabProps) {
  const [categories, setCategories] = useState<EquipmentCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'custom' | 'name'>('custom');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategoryDto | null>(null);
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [draggedNode, setDraggedNode] = useState<CategoryTreeNode | null>(null);
  const [dragOverNode, setDragOverNode] = useState<number | null>(null);

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    parentId: null as number | null,
    color: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const tree = useMemo(() => {
    let result = buildCategoryTree(categories);
    if (sortOrder === 'name') {
      const sortTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
        return nodes
          .map((node) => ({
            ...node,
            children: sortTree(node.children),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      };
      result = sortTree(result);
    }
    return result;
  }, [categories, sortOrder]);

  // Фильтрация дерева по поисковому запросу
  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;
    const query = searchQuery.toLowerCase();
    const filterTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      return nodes
        .filter((node) => node.name.toLowerCase().includes(query))
        .map((node) => ({
          ...node,
          children: filterTree(node.children),
        }));
    };
    return filterTree(tree);
  }, [tree, searchQuery]);

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

  const handleSelectCategory = (category: EquipmentCategoryDto) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId ?? null,
      color: (category as any).color || '',
      comment: category.description || '',
    });
  };

  const handleCreateNew = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      parentId: null,
      color: '',
      comment: '',
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 1) {
      newErrors.name = 'Наименование обязательно';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.comment?.trim() || undefined,
        parentId: formData.parentId,
      };
      if (formData.color) {
        payload.color = formData.color;
      }

      if (selectedCategory?.id) {
        await api.equipmentCategories.update(selectedCategory.id, payload);
      } else {
        await api.equipmentCategories.create(payload);
      }
      setSelectedCategory(null);
      setFormData({ name: '', parentId: null, color: '', comment: '' });
      loadCategories();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка при сохранении' });
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, node: CategoryTreeNode) => {
    if (!isOrderMode) return;
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nodeId: number) => {
    if (!isOrderMode || !draggedNode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverNode(nodeId);
  };

  const handleDragLeave = () => {
    setDragOverNode(null);
  };

  const handleDrop = async (e: React.DragEvent, targetNode: CategoryTreeNode) => {
    if (!isOrderMode || !draggedNode || draggedNode.id === targetNode.id) {
      setDragOverNode(null);
      return;
    }
    e.preventDefault();
    setDragOverNode(null);

    // TODO: Реализовать изменение порядка через API
    // Пока просто обновляем локально
    console.log('Move', draggedNode.id, 'to', targetNode.id);
    setDraggedNode(null);
  };

  const getCategoryOptions = (): Array<{ id: number | null; name: string; path: string }> => {
    const options: Array<{ id: number | null; name: string; path: string }> = [{ id: null, name: 'Отсутствует', path: 'Отсутствует' }];
    const addOptions = (nodes: CategoryTreeNode[], level = 0) => {
      nodes.forEach((node) => {
        if (selectedCategory?.id !== node.id) {
          options.push({
            id: node.id,
            name: node.name,
            path: '  '.repeat(level) + node.name,
          });
          if (node.children.length > 0) {
            addOptions(node.children, level + 1);
          }
        }
      });
    };
    addOptions(tree);
    return options;
  };

  const getMaxDepth = (node: CategoryTreeNode, currentDepth = 0): number => {
    if (node.children.length === 0) return currentDepth;
    return Math.max(...node.children.map((child) => getMaxDepth(child, currentDepth + 1)));
  };

  const canAddChild = (parentId: number | null): boolean => {
    if (parentId === null) return true;
    const findNode = (nodes: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
      }
      return null;
    };
    const parentNode = findNode(tree, parentId);
    if (!parentNode) return true;
    return getMaxDepth(parentNode) < 4; // Максимум 5 уровней (0-4)
  };

  if (loading) {
    return <div className="empty-state">Загрузка категорий...</div>;
  }

  return (
    <div className="warehouse-categories-tab">
      <div className="warehouse-categories-layout">
        {/* Левая часть - дерево категорий */}
        <div className="warehouse-categories-tree-section">
          <div className="warehouse-categories-search-section">
            <h3 className="warehouse-categories-title">Поиск по дереву категорий</h3>
            <div className="warehouse-categories-sort">
              <span>Сортировка по: </span>
              <button
                className="warehouse-categories-sort-button"
                onClick={() => setSortOrder(sortOrder === 'custom' ? 'name' : 'custom')}
              >
                {sortOrder === 'custom' ? 'Заданному порядку' : 'Названию'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="warehouse-search">
              <svg className="warehouse-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zm0-9a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="currentColor"/>
                <path d="M11.293 11.293l2.354 2.354a.5.5 0 0 1-.708.708l-2.354-2.354a.5.5 0 0 1 .708-.708z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="warehouse-search-input"
              />
            </div>
            <p className="warehouse-categories-hint">
              Чтобы задать порядок и иерархию, перетаскивайте категории в дереве ниже
            </p>
          </div>

          <div className="warehouse-categories-tree-container">
            {filteredTree.length === 0 ? (
              <div className="empty-state">Категории не найдены</div>
            ) : (
              <ul className="warehouse-categories-tree">
                {filteredTree.map((node) => (
                  <CategoryTreeItem
                    key={node.id}
                    node={node}
                    level={0}
                    expanded={expanded}
                    selectedCategory={selectedCategory}
                    isOrderMode={isOrderMode}
                    draggedNode={draggedNode}
                    dragOverNode={dragOverNode}
                    onToggle={toggleExpand}
                    onSelect={handleSelectCategory}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Правая часть - форма создания/редактирования */}
        <div className="warehouse-categories-form-section">
          <div className="warehouse-categories-form-header">
            <button
              className="warehouse-button-secondary"
              onClick={() => setIsOrderMode(!isOrderMode)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Задать порядок
            </button>
          </div>

          <div className="warehouse-categories-form-content">
            <button
              className="warehouse-categories-create-button"
              onClick={handleCreateNew}
              title="Создать новую категорию"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <form onSubmit={handleSubmit} className="warehouse-categories-form">
              <div className="form-group">
                <label>
                  Наименование <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'input-error' : ''}
                  placeholder="Введите название категории"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

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
                  disabled={!canAddChild(formData.parentId)}
                >
                  {getCategoryOptions().map((opt) => (
                    <option key={opt.id ?? 'null'} value={opt.id ?? ''}>
                      {opt.path}
                    </option>
                  ))}
                </select>
                {formData.parentId !== null && !canAddChild(formData.parentId) && (
                  <span className="form-hint">Максимальная вложенность - 5 уровней</span>
                )}
                {formData.parentId === null && (
                  <span className="form-hint">Максимальная вложенность - 5 уровней</span>
                )}
              </div>

              <div className="form-group">
                <label>Цвет</label>
                <div className="warehouse-color-picker">
                  {formData.color ? (
                    <div className="warehouse-color-display" style={{ backgroundColor: formData.color }}>
                      <span>{formData.color}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, color: '' })}
                        className="warehouse-color-remove"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const color = prompt('Введите цвет в формате #RRGGBB или название:');
                        if (color) setFormData({ ...formData, color });
                      }}
                      className="warehouse-color-set"
                    >
                      Задать
                    </button>
                  )}
                </div>
                {!formData.color && <span className="form-hint">Не указан</span>}
              </div>

              <div className="form-group">
                <label>Комментарий</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  placeholder="Введите комментарий"
                />
              </div>

              {errors.submit && <div className="error-text">{errors.submit}</div>}

              <div className="form-actions">
                <button type="submit" disabled={saving} className="warehouse-button-primary">
                  {saving ? 'Сохранение...' : selectedCategory ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  level: number;
  expanded: Set<number>;
  selectedCategory: EquipmentCategoryDto | null;
  isOrderMode: boolean;
  draggedNode: CategoryTreeNode | null;
  dragOverNode: number | null;
  onToggle: (id: number) => void;
  onSelect: (category: EquipmentCategoryDto) => void;
  onDragStart: (e: React.DragEvent, node: CategoryTreeNode) => void;
  onDragOver: (e: React.DragEvent, nodeId: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, node: CategoryTreeNode) => void;
}

function CategoryTreeItem({
  node,
  level,
  expanded,
  selectedCategory,
  isOrderMode,
  draggedNode,
  dragOverNode,
  onToggle,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: CategoryTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedCategory?.id === node.id;
  const isDragged = draggedNode?.id === node.id;
  const isDragOver = dragOverNode === node.id;

  return (
    <li
      className={`warehouse-categories-tree-item ${isSelected ? 'warehouse-categories-tree-item-selected' : ''} ${isDragged ? 'warehouse-categories-tree-item-dragged' : ''} ${isDragOver ? 'warehouse-categories-tree-item-drag-over' : ''}`}
      draggable={isOrderMode}
      onDragStart={(e) => onDragStart(e, node)}
      onDragOver={(e) => onDragOver(e, node.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, node)}
      style={{ paddingLeft: level * 20 }}
    >
      <div className="warehouse-categories-tree-node">
        <span
          className={`warehouse-categories-tree-toggle ${hasChildren ? '' : 'warehouse-categories-tree-toggle-empty'}`}
          onClick={() => hasChildren && onToggle(node.id)}
          role="button"
          tabIndex={0}
        >
          {hasChildren ? (isExpanded ? '−' : '+') : '·'}
        </span>
        <input
          type="checkbox"
          className="warehouse-categories-tree-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          className={`warehouse-categories-tree-label ${isSelected ? 'warehouse-categories-tree-label-selected' : ''}`}
          onClick={() => onSelect(node.raw)}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <ul className="warehouse-categories-tree">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              selectedCategory={selectedCategory}
              isOrderMode={isOrderMode}
              draggedNode={draggedNode}
              dragOverNode={dragOverNode}
              onToggle={onToggle}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
