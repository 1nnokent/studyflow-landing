export const STATUSES = ['todo', 'in_progress', 'done'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskStatus = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}
export interface Task {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: string | null;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}
export type TaskInput = Pick<
  Task,
  'title' | 'description' | 'subjectId' | 'dueDate' | 'status' | 'priority'
>;
export type SubjectInput = Pick<Subject, 'name' | 'color'>;
export interface Workspace {
  schemaVersion: 1;
  mode: 'demo' | 'personal';
  updatedAt: string;
  tasks: Task[];
  subjects: Subject[];
}
export interface TaskFilters {
  search: string;
  subjectId: string;
  status: string;
  priority: string;
  period: 'all' | 'today' | 'week' | 'overdue';
  sort: 'due' | 'newest' | 'priority';
}
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Запланировано',
  in_progress: 'В работе',
  done: 'Выполнено',
};
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Обычный',
  high: 'Высокий',
};
export const SUBJECT_COLORS = ['#b97850', '#668c9e', '#8d7aa2', '#73915c', '#b28636', '#b27284'];
