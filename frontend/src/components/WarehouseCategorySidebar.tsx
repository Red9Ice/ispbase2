/**
 * @file: WarehouseCategorySidebar.tsx
 * @description: Боковая панель с деревом категорий для быстрой фильтрации склада.
 * @dependencies: utils/categoryTree.ts
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import { buildCategoryTree, type CategoryTreeNode } from '../utils/categoryTree';
import type { EquipmentCategoryDto } from '../services/api';
import './WarehouseCategorySidebar.css';

interface WarehouseCategorySidebarProps {
  categories: EquipmentCategoryDto[];
  selectedCategoryId: number | null | undefined;
  onSelectCategory: (categoryId: number | null) => void;
}

export function WarehouseCategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: WarehouseCategorySidebarProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategorySelection = (id: number) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Для навигации по категориям (упрощенная версия)
  const categoriesPerPage = 10;
  const totalCategoryPages = Math.ceil(tree.length / categoriesPerPage);
  const displayedCategories = tree.slice(
    (currentCategoryPage - 1) * categoriesPerPage,
    currentCategoryPage * categoriesPerPage
  );

  return (
    <aside className="warehouse-category-sidebar">
      <div className="warehouse-sidebar-header">
        <div className="warehouse-sidebar-navigation">
          <button
            className="warehouse-sidebar-nav-button"
            disabled={currentCategoryPage === 1}
            onClick={() => setCurrentCategoryPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <span className="warehouse-sidebar-nav-info">
            Категории: {currentCategoryPage}
          </span>
          <button
            className="warehouse-sidebar-nav-button"
            disabled={currentCategoryPage >= totalCategoryPages}
            onClick={() => setCurrentCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
          >
            ›
          </button>
        </div>
      </div>
      <nav className="warehouse-sidebar-tree">
        <ul className="warehouse-sidebar-list">
          {displayedCategories.map((node) => (
            <CategorySidebarItem
              key={node.id}
              node={node}
              level={0}
              expanded={expanded}
              selectedCategoryId={selectedCategoryId}
              selectedCategories={selectedCategories}
              onToggle={toggleExpand}
              onSelect={onSelectCategory}
              onToggleSelection={toggleCategorySelection}
            />
          ))}
        </ul>
        <div className="warehouse-sidebar-no-category">
          <input
            type="checkbox"
            checked={selectedCategoryId === null}
            onChange={() => onSelectCategory(null)}
            className="warehouse-sidebar-checkbox"
          />
          <button
            type="button"
            className={`warehouse-sidebar-item ${selectedCategoryId === null ? 'warehouse-sidebar-item-active' : ''}`}
            onClick={() => onSelectCategory(null)}
          >
            Без категории
          </button>
        </div>
      </nav>
    </aside>
  );
}

interface CategorySidebarItemProps {
  node: CategoryTreeNode;
  level: number;
  expanded: Set<number>;
  selectedCategoryId: number | null | undefined;
  selectedCategories: Set<number>;
  onToggle: (id: number) => void;
  onSelect: (id: number | null) => void;
  onToggleSelection: (id: number) => void;
}

function CategorySidebarItem({
  node,
  level,
  expanded,
  selectedCategoryId,
  selectedCategories,
  onToggle,
  onSelect,
  onToggleSelection,
}: CategorySidebarItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedCategoryId === node.id;
  const isChecked = selectedCategories.has(node.id);

  return (
    <li className="warehouse-sidebar-list-item" style={{ paddingLeft: level * 12 }}>
      <div className="warehouse-sidebar-node">
        <span
          className={`warehouse-sidebar-toggle ${hasChildren ? '' : 'warehouse-sidebar-toggle-empty'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          role="button"
          tabIndex={0}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {hasChildren ? (isExpanded ? '−' : '+') : '·'}
        </span>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(node.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="warehouse-sidebar-checkbox"
        />
        <button
          type="button"
          className={`warehouse-sidebar-item ${isSelected ? 'warehouse-sidebar-item-active' : ''}`}
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <ul className="warehouse-sidebar-list">
          {node.children.map((child) => (
            <CategorySidebarItem
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              selectedCategoryId={selectedCategoryId}
              selectedCategories={selectedCategories}
              onToggle={onToggle}
              onSelect={onSelect}
              onToggleSelection={onToggleSelection}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
