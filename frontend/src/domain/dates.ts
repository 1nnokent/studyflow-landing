import type { Task } from './types';

export function dateOnly(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && dateOnly(date) === value;
}

export function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dateOnly(date);
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>, today = dateOnly()): boolean {
  return task.status !== 'done' && task.dueDate !== null && task.dueDate < today;
}

export function isThisWeek(task: Pick<Task, 'dueDate' | 'status'>, today = dateOnly()): boolean {
  return (
    task.status !== 'done' &&
    task.dueDate !== null &&
    task.dueDate >= today &&
    task.dueDate < addDays(today, 7)
  );
}

export function formatDate(value: string | null, relative = true, today = dateOnly()): string {
  if (!value) return 'Без срока';
  if (relative && value === today) return 'Сегодня';
  if (relative && value === addDays(today, 1)) return 'Завтра';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(value.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
  }).format(new Date(`${value}T12:00:00`));
}
