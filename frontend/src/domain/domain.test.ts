import { describe, expect, it } from 'vitest';
import { addDays, isOverdue, isThisWeek, isValidDate } from './dates';
import { DEFAULT_FILTERS, filterTasks, getProgress, taskCount } from './tasks';
import { validateSubject, validateTask } from './validation';
import { parseWorkspace } from './workspace';
import { demoWorkspace } from '../data/demo';

describe('Календарные сроки', () => {
  it('проверяет реальные даты и високосный год', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-04-31')).toBe(false);
    expect(isValidDate('19.11.2026')).toBe(false);
  });
  it('прибавляет дни через границу месяца и года', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });
  it('не считает сегодняшние и выполненные задачи просроченными', () => {
    expect(isOverdue({ dueDate: '2026-11-18', status: 'todo' }, '2026-11-19')).toBe(true);
    expect(isOverdue({ dueDate: '2026-11-19', status: 'todo' }, '2026-11-19')).toBe(false);
    expect(isOverdue({ dueDate: '2026-11-18', status: 'done' }, '2026-11-19')).toBe(false);
    expect(isOverdue({ dueDate: null, status: 'todo' }, '2026-11-19')).toBe(false);
  });
  it('ограничивает ближайшую неделю семью календарными днями', () => {
    expect(isThisWeek({ dueDate: '2026-11-25', status: 'todo' }, '2026-11-19')).toBe(true);
    expect(isThisWeek({ dueDate: '2026-11-26', status: 'todo' }, '2026-11-19')).toBe(false);
    expect(isThisWeek({ dueDate: '2026-11-20', status: 'done' }, '2026-11-19')).toBe(false);
  });
});

describe('Фильтры и прогресс', () => {
  const document = demoWorkspace('2026-11-19');
  it('совместно применяет предмет, приоритет и срок', () => {
    const result = filterTasks(
      document.tasks,
      { ...DEFAULT_FILTERS, subjectId: 'math', priority: 'high', period: 'overdue' },
      '2026-11-19',
    );
    expect(result.map((task) => task.id)).toEqual(['math-practice']);
  });
  it('нормализует регистр и букву ё в поиске', () => {
    const task = { ...document.tasks[0]!, title: '  Ещё один конспект' };
    expect(filterTasks([task], { ...DEFAULT_FILTERS, search: 'ЕЩЕ' })).toEqual([task]);
  });
  it('оставляет задачи без срока в конце сортировки', () => {
    const result = filterTasks(document.tasks, DEFAULT_FILTERS);
    expect(result.at(-1)?.id).toBe('personal-project');
    expect(document.tasks[0]?.id).toBe('layout');
  });
  it('вычисляет прогресс и корректно обрабатывает пустой план', () => {
    expect(getProgress(document.tasks)).toEqual({ done: 3, total: 10, percent: 30 });
    expect(getProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
    expect(taskCount(11)).toBe('11 задач');
    expect(taskCount(22)).toBe('22 задачи');
  });
});

describe('Валидация и резервная копия', () => {
  const document = demoWorkspace('2026-11-19');
  it('проверяет обязательные поля, дату и существование предмета', () => {
    const errors = validateTask(
      { ...document.tasks[0]!, title: ' ', subjectId: 'missing', dueDate: '2026-02-30' },
      document.subjects,
    );
    expect(Object.keys(errors)).toEqual(['title', 'subjectId', 'dueDate']);
  });
  it('находит дубликаты предметов после удаления пробелов и изменения регистра', () => {
    expect(
      validateSubject({ name: ' FRONTEND ', color: '#b97850' }, document.subjects).name,
    ).toBeDefined();
    expect(
      validateSubject({ name: 'Frontend', color: '#b97850' }, document.subjects, 'frontend'),
    ).toEqual({});
  });
  it('восстанавливает корректную копию', () => {
    expect(parseWorkspace(JSON.stringify(document))).toEqual(document);
  });
  it('отклоняет нарушенную связь с предметом', () => {
    const copy = structuredClone(document);
    copy.tasks[0]!.subjectId = 'missing';
    expect(() => parseWorkspace(JSON.stringify(copy))).toThrow(/отсутствующий предмет/);
  });
  it('отклоняет повторяющиеся и небезопасные идентификаторы', () => {
    const duplicate = structuredClone(document);
    duplicate.tasks.push(duplicate.tasks[0]!);
    expect(() => parseWorkspace(JSON.stringify(duplicate))).toThrow(/повторяется/);
    const invalidId = structuredClone(document);
    invalidId.tasks[0]!.id = '../tasks';
    expect(() => parseWorkspace(JSON.stringify(invalidId))).toThrow(/некорректная задача/);
  });
});
