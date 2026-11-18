import { addDays, dateOnly } from '../domain/dates';
import type { Task, Workspace } from '../domain/types';

export function demoWorkspace(today = dateOnly()): Workspace {
  const createdAt = new Date(`${addDays(today, -5)}T12:00:00`).toISOString();
  const makeTask = (
    id: string,
    title: string,
    subjectId: string,
    offset: number | null,
    status: Task['status'],
    priority: Task['priority'] = 'medium',
    description = '',
  ): Task => ({
    id,
    title,
    subjectId,
    dueDate: offset === null ? null : addDays(today, offset),
    status,
    priority,
    description,
    createdAt,
    updatedAt: createdAt,
  });
  return {
    schemaVersion: 1,
    mode: 'demo',
    updatedAt: new Date().toISOString(),
    subjects: [
      { id: 'frontend', name: 'Frontend', color: '#b97850', createdAt },
      { id: 'math', name: 'Математика', color: '#668c9e', createdAt },
      { id: 'algorithms', name: 'Алгоритмы', color: '#8d7aa2', createdAt },
      { id: 'english', name: 'Английский', color: '#73915c', createdAt },
    ],
    tasks: [
      makeTask(
        'layout',
        'Сверстать страницу проекта',
        'frontend',
        0,
        'in_progress',
        'high',
        'Проверить адаптивную вёрстку, подписи полей и навигацию с клавиатуры.',
      ),
      makeTask(
        'integrals',
        'Разобрать определённые интегралы',
        'math',
        1,
        'todo',
        'high',
        'Повторить конспект и решить задания 1–5 из практикума.',
      ),
      makeTask(
        'sorting',
        'Реализовать сортировку слиянием',
        'algorithms',
        2,
        'todo',
        'medium',
        'Описать сложность алгоритма и проверить граничные случаи.',
      ),
      makeTask('vocabulary', 'Повторить лексику к семинару', 'english', 0, 'todo', 'low'),
      makeTask('math-practice', 'Решить задачи по производным', 'math', -1, 'todo', 'high'),
      makeTask('typescript', 'Изучить типизацию компонентов', 'frontend', 3, 'todo', 'medium'),
      makeTask('article', 'Прочитать статью на английском', 'english', -1, 'done', 'low'),
      makeTask('complexity', 'Повторить оценку сложности', 'algorithms', -2, 'done'),
      makeTask('react', 'Разобраться с React-хуками', 'frontend', -2, 'done'),
      makeTask(
        'personal-project',
        'Собрать идеи для личного проекта',
        'frontend',
        null,
        'todo',
        'low',
      ),
    ],
  };
}
