import { PRIORITIES, STATUSES, type Subject, type Task, type Workspace } from './types';
import { validateSubject, validateTask } from './validation';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9_-]{1,100}$/i.test(value);
}

export function parseWorkspace(text: string): Workspace {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Файл не содержит корректный JSON');
  }
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    !['demo', 'personal'].includes(String(value.mode)) ||
    !timestamp(value.updatedAt) ||
    !Array.isArray(value.subjects) ||
    !Array.isArray(value.tasks)
  )
    throw new Error('Неподдерживаемый формат плана');
  const subjects: Subject[] = [];
  for (const item of value.subjects) {
    if (
      !record(item) ||
      !identifier(item.id) ||
      typeof item.name !== 'string' ||
      typeof item.color !== 'string' ||
      !timestamp(item.createdAt)
    )
      throw new Error('В файле есть некорректный предмет');
    const subject: Subject = {
      id: item.id,
      name: item.name.trim(),
      color: item.color,
      createdAt: item.createdAt,
    };
    if (
      subjects.some((entry) => entry.id === subject.id) ||
      Object.keys(validateSubject(subject, subjects)).length
    )
      throw new Error('В файле есть повторяющийся или некорректный предмет');
    subjects.push(subject);
  }
  const tasks: Task[] = [];
  for (const item of value.tasks) {
    if (
      !record(item) ||
      !identifier(item.id) ||
      typeof item.title !== 'string' ||
      typeof item.description !== 'string' ||
      typeof item.subjectId !== 'string' ||
      !(item.dueDate === null || typeof item.dueDate === 'string') ||
      !STATUSES.includes(item.status as Task['status']) ||
      !PRIORITIES.includes(item.priority as Task['priority']) ||
      !timestamp(item.createdAt) ||
      !timestamp(item.updatedAt)
    )
      throw new Error('В файле есть некорректная задача');
    const task: Task = {
      id: item.id,
      title: item.title.trim(),
      description: item.description,
      subjectId: item.subjectId,
      dueDate: item.dueDate,
      status: item.status as Task['status'],
      priority: item.priority as Task['priority'],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
    if (
      tasks.some((entry) => entry.id === task.id) ||
      Object.keys(validateTask(task, subjects)).length
    )
      throw new Error(
        'Задача повторяется, содержит неверные поля или ссылается на отсутствующий предмет',
      );
    tasks.push(task);
  }
  return {
    schemaVersion: 1,
    mode: value.mode as Workspace['mode'],
    updatedAt: value.updatedAt,
    subjects,
    tasks,
  };
}

export function emptyWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    mode: 'personal',
    updatedAt: new Date().toISOString(),
    subjects: [],
    tasks: [],
  };
}
