import { dateOnly, isOverdue, isThisWeek } from './dates';
import type { Task, TaskFilters } from './types';

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  subjectId: '',
  status: '',
  priority: '',
  period: 'all',
  sort: 'due',
};
const priorityOrder = { high: 0, medium: 1, low: 2 };

export function filterTasks(
  tasks: readonly Task[],
  filters: TaskFilters,
  today = dateOnly(),
): Task[] {
  const search = filters.search.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е');
  return tasks
    .filter((task) => {
      if (search && !task.title.toLocaleLowerCase('ru').replace(/ё/g, 'е').includes(search))
        return false;
      if (filters.subjectId && task.subjectId !== filters.subjectId) return false;
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.period === 'today' && task.dueDate !== today) return false;
      if (filters.period === 'week' && !isThisWeek(task, today)) return false;
      if (filters.period === 'overdue' && !isOverdue(task, today)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'newest')
        return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
      if (filters.sort === 'priority')
        return priorityOrder[a.priority] - priorityOrder[b.priority] || compareDue(a, b);
      return compareDue(a, b);
    });
}

function compareDue(a: Task, b: Task): number {
  return (
    (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') || a.id.localeCompare(b.id)
  );
}

export function getProgress(tasks: readonly Task[]): {
  done: number;
  total: number;
  percent: number;
} {
  const done = tasks.filter((task) => task.status === 'done').length;
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

export function taskCount(count: number): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} задач`;
  if (count % 10 === 1) return `${count} задача`;
  if ([2, 3, 4].includes(count % 10)) return `${count} задачи`;
  return `${count} задач`;
}
