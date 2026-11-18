import { isValidDate } from './dates';
import { PRIORITIES, STATUSES, type Subject, type SubjectInput, type TaskInput } from './types';

export type TaskErrors = Partial<Record<keyof TaskInput, string>>;
export function validateTask(input: TaskInput, subjects: readonly Subject[]): TaskErrors {
  const errors: TaskErrors = {};
  if (!input.title.trim()) errors.title = 'Введите название задачи';
  else if (input.title.trim().length > 120)
    errors.title = 'Название должно быть не длиннее 120 символов';
  if (input.description.length > 3000)
    errors.description = 'Описание должно быть не длиннее 3000 символов';
  if (!subjects.some((subject) => subject.id === input.subjectId))
    errors.subjectId = 'Выберите существующий предмет';
  if (input.dueDate !== null && !isValidDate(input.dueDate))
    errors.dueDate = 'Укажите корректную дату';
  if (!STATUSES.includes(input.status)) errors.status = 'Выберите статус';
  if (!PRIORITIES.includes(input.priority)) errors.priority = 'Выберите приоритет';
  return errors;
}

export function validateSubject(
  input: SubjectInput,
  subjects: readonly Subject[],
  excludeId?: string,
): Partial<Record<keyof SubjectInput, string>> {
  const name = input.name.trim();
  if (!name) return { name: 'Введите название предмета' };
  if (name.length > 60) return { name: 'Название должно быть не длиннее 60 символов' };
  if (
    subjects.some(
      (subject) =>
        subject.id !== excludeId &&
        subject.name.trim().toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru'),
    )
  )
    return { name: 'Предмет с таким названием уже существует' };
  if (!/^#[0-9a-f]{6}$/i.test(input.color)) return { color: 'Выберите цвет предмета' };
  return {};
}
