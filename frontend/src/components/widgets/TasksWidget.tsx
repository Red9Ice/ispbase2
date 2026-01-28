/**
 * @file: TasksWidget.tsx
 * @description: Виджет канбан-доски задач
 * @created: 2026-01-27
 */

import type { WidgetProps } from '../../types/widgets';
import { TasksBoard } from '../TasksBoard';
import type { TaskStatus } from '../../services/api';
import './TasksWidget.css';

interface TasksWidgetProps extends WidgetProps {
  onTaskClick?: (taskId: number) => void;
  onCreateTask?: (status: TaskStatus) => void;
  refreshTrigger?: number;
}

export function TasksWidget({ 
  onTaskClick,
  onCreateTask,
  refreshTrigger
}: TasksWidgetProps) {
  return (
    <div className="tasks-widget">
      <TasksBoard
        onTaskClick={onTaskClick || (() => {})}
        onCreateTask={onCreateTask || (() => {})}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
