import { describe, expect, it } from 'vitest';
import tasksReducer from './tasksSlice';
import subjectsReducer from './subjectsSlice';
import {
  createSubject,
  deleteSubject,
  loadWorkspace,
  replaceWorkspace,
  updateTask,
} from './actions';
import { demoWorkspace } from '../data/demo';
import { emptyWorkspace } from '../domain/workspace';

describe('Редьюсер задач', () => {
  const document = demoWorkspace('2026-11-19');
  it('обрабатывает загрузку, успех и ошибку', () => {
    const pending = tasksReducer(undefined, loadWorkspace.pending('load', undefined));
    expect(pending.status).toBe('loading');
    const fulfilled = tasksReducer(pending, loadWorkspace.fulfilled(document, 'load', undefined));
    expect(fulfilled.status).toBe('succeeded');
    expect(fulfilled.items).toHaveLength(10);
    const rejected = tasksReducer(
      pending,
      loadWorkspace.rejected(new Error(), 'load', undefined, 'Нет доступа'),
    );
    expect(rejected.status).toBe('failed');
    expect(rejected.error).toBe('Нет доступа');
  });
  it('при неудачном сохранении оставляет задачу без изменений', () => {
    const loaded = tasksReducer(undefined, loadWorkspace.fulfilled(document, 'load', undefined));
    const arg = { id: 'layout', changes: { status: 'done' as const } };
    const pending = tasksReducer(loaded, updateTask.pending('save', arg));
    expect(pending.pendingIds).toContain('layout');
    const failed = tasksReducer(
      pending,
      updateTask.rejected(new Error(), 'save', arg, 'Ошибка записи'),
    );
    expect(failed.items.find((task) => task.id === 'layout')?.status).toBe('in_progress');
    expect(failed.pendingIds).toEqual([]);
    expect(failed.mutationError).toBe('Ошибка записи');
  });
  it('полностью заменяет план после явного сброса', () => {
    const loaded = tasksReducer(undefined, loadWorkspace.fulfilled(document, 'load', undefined));
    const empty = emptyWorkspace();
    const replaced = tasksReducer(loaded, replaceWorkspace.fulfilled(empty, 'replace', empty));
    expect(replaced.items).toEqual([]);
    expect(replaced.mode).toBe('personal');
  });
});

describe('Редьюсер предметов', () => {
  const document = demoWorkspace('2026-11-19');
  it('добавляет предмет после успешного сохранения', () => {
    const subject = {
      id: 'physics',
      name: 'Физика',
      color: '#668c9e',
      createdAt: new Date().toISOString(),
    };
    const pending = subjectsReducer(undefined, createSubject.pending('create', subject));
    expect(pending.saving).toBe(true);
    const fulfilled = subjectsReducer(pending, createSubject.fulfilled(subject, 'create', subject));
    expect(fulfilled.items).toEqual([subject]);
    expect(fulfilled.saving).toBe(false);
  });
  it('сохраняет предмет и сообщение при отказе в удалении', () => {
    const loaded = subjectsReducer(undefined, loadWorkspace.fulfilled(document, 'load', undefined));
    const rejected = subjectsReducer(
      loaded,
      deleteSubject.rejected(new Error(), 'delete', 'frontend', 'Есть задачи'),
    );
    expect(rejected.items).toHaveLength(4);
    expect(rejected.error).toBe('Есть задачи');
    expect(rejected.saving).toBe(false);
  });
});
