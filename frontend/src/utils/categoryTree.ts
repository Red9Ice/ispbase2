/**
 * @file: categoryTree.ts
 * @description: Утилиты для дерева категорий оборудования.
 * @dependencies: services/api (EquipmentCategoryDto)
 * @created: 2026-01-27
 */

import type { EquipmentCategoryDto } from '../services/api';

export interface CategoryTreeNode {
  id: number;
  name: string;
  description?: string;
  parentId: number | null;
  children: CategoryTreeNode[];
  /** Исходная запись для форм/действий */
  raw: EquipmentCategoryDto;
}

/**
 * Строит дерево категорий из плоского списка.
 */
export function buildCategoryTree(flat: EquipmentCategoryDto[]): CategoryTreeNode[] {
  const byId = new Map<number, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  flat.forEach((c) => {
    const id = c.id!;
    const node: CategoryTreeNode = {
      id,
      name: c.name,
      description: c.description,
      parentId: c.parentId ?? null,
      children: [],
      raw: c,
    };
    byId.set(id, node);
  });

  flat.forEach((c) => {
    const id = c.id!;
    const node = byId.get(id)!;
    const pid = c.parentId ?? null;
    if (pid == null) {
      roots.push(node);
    } else {
      const parent = byId.get(pid);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });

  const sortByName = (a: CategoryTreeNode, b: CategoryTreeNode) => a.name.localeCompare(b.name);
  roots.sort(sortByName);
  byId.forEach((n) => n.children.sort(sortByName));

  return roots;
}

/**
 * Возвращает путь категории вида "Родитель › Дочерняя" для отображения в селектах.
 */
export function categoryPath(
  flat: EquipmentCategoryDto[],
  categoryId: number,
  sep = ' › '
): string {
  const byId = new Map<number, EquipmentCategoryDto>();
  flat.forEach((c) => {
    if (c.id != null) byId.set(c.id, c);
  });

  const parts: string[] = [];
  let curr: EquipmentCategoryDto | undefined = byId.get(categoryId);
  while (curr) {
    parts.unshift(curr.name);
    const pid = curr.parentId ?? null;
    curr = pid != null ? byId.get(pid) : undefined;
  }
  return parts.join(sep);
}

/**
 * Плоский список категорий с путём для селектов. Порядок: корень → дети (рекурсивно).
 */
export interface CategoryOption {
  id: number;
  path: string;
  raw: EquipmentCategoryDto;
}

export function categoryOptions(flat: EquipmentCategoryDto[]): CategoryOption[] {
  const tree = buildCategoryTree(flat);
  const out: CategoryOption[] = [];

  function walk(nodes: CategoryTreeNode[], prefix: string) {
    for (const n of nodes) {
      const path = prefix ? `${prefix} › ${n.name}` : n.name;
      out.push({ id: n.id, path, raw: n.raw });
      walk(n.children, path);
    }
  }
  walk(tree, '');
  return out;
}
