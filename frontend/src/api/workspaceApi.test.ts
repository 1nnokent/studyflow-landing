import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalWorkspaceApi, STORAGE_KEY } from './workspaceApi';
import { demoWorkspace } from '../data/demo';

describe('Локальный адаптер данных', () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(demoWorkspace('2026-11-19'))));
  const api = () => createLocalWorkspaceApi({ delayMs: 0 });
  it('сохраняет создание, изменение и удаление между экземплярами адаптера', async () => {
    const task = await api().createTask({
      title: '  Новая задача  ',
      description: '',
      subjectId: 'frontend',
      dueDate: null,
      status: 'todo',
      priority: 'medium',
    });
    expect((await api().load()).tasks.find((entry) => entry.id === task.id)?.title).toBe(
      'Новая задача',
    );
    await api().updateTask(task.id, { status: 'done' });
    expect((await api().load()).tasks.find((entry) => entry.id === task.id)?.status).toBe('done');
    await api().deleteTask(task.id);
    expect((await api().load()).tasks.some((entry) => entry.id === task.id)).toBe(false);
  });
  it('не теряет изменения при параллельных операциях над разными задачами', async () => {
    const instance = api();
    await Promise.all([
      instance.updateTask('layout', { status: 'done' }),
      instance.updateTask('integrals', { status: 'in_progress' }),
    ]);
    const document = await instance.load();
    expect(document.tasks.find((task) => task.id === 'layout')?.status).toBe('done');
    expect(document.tasks.find((task) => task.id === 'integrals')?.status).toBe('in_progress');
  });
  it('защищает предмет с задачами от удаления', async () => {
    await expect(api().deleteSubject('frontend')).rejects.toThrow(/Сначала перенесите/);
    expect((await api().load()).subjects.some((subject) => subject.id === 'frontend')).toBe(true);
  });
  it('не заменяет повреждённые данные демонстрационными', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    await expect(api().load()).rejects.toThrow(/повреждён/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken');
  });
  it('сообщает об ошибке записи и сохраняет исходные данные', async () => {
    const before = localStorage.getItem(STORAGE_KEY);
    const failing = createLocalWorkspaceApi({
      delayMs: 0,
      storage: () => ({
        getItem: (key) => localStorage.getItem(key),
        setItem: () => {
          throw new Error('quota');
        },
      }),
    });
    await expect(failing.updateTask('layout', { status: 'done' })).rejects.toThrow(
      /Не удалось сохранить/,
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });
});
