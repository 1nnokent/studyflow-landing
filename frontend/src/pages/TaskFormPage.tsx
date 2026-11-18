import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { selectSubjects, useAppDispatch, useAppSelector } from '../app/store';
import { createTask, errorMessage, updateTask } from '../state/actions';
import { notify } from '../state/uiSlice';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Task,
  type TaskInput,
} from '../domain/types';
import { validateTask, type TaskErrors } from '../domain/validation';
import { Button, ButtonLink, Field, PageHeader } from '../components/ui';
import { SubjectDialog } from '../components/SubjectDialog';
import { Icon } from '../components/Icon';
import { NotFoundPage } from './NotFoundPage';

function TaskForm({ task }: { task?: Task }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const subjects = useAppSelector(selectSubjects);
  const busy = useAppSelector((state) =>
    task ? state.tasks.pendingIds.includes(task.id) : state.tasks.saving,
  );
  const [input, setInput] = useState<TaskInput>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    subjectId: task?.subjectId ?? '',
    dueDate: task?.dueDate ?? null,
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
  });
  const [errors, setErrors] = useState<TaskErrors>({});
  const [requestError, setRequestError] = useState('');
  const [addSubject, setAddSubject] = useState(false);
  function change<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setInput((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateTask(input, subjects);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`task-${first}`)?.focus();
      return;
    }
    setRequestError('');
    try {
      const result = task
        ? await dispatch(updateTask({ id: task.id, changes: input })).unwrap()
        : await dispatch(createTask(input)).unwrap();
      dispatch(notify(task ? 'Изменения сохранены' : 'Задача добавлена в план'));
      navigate(`/tasks/${result.id}`, { replace: true });
    } catch (error) {
      setRequestError(errorMessage(error));
    }
  }
  return (
    <>
      <PageHeader
        eyebrow={task ? 'Задачи / Редактирование' : 'Задачи / Новый шаг'}
        title={task ? 'Редактировать задачу' : 'Что добавим в план?'}
        description={
          task
            ? 'Уточни детали или пересмотри сроки. План принадлежит тебе.'
            : 'Начни с названия. Остальные детали помогут выбрать следующий шаг.'
        }
      />
      <div className="form-layout">
        <form
          className="panel task-form"
          onSubmit={(event) => {
            void submit(event);
          }}
          noValidate
        >
          <Field
            id="task-title"
            label="Название задачи"
            required
            error={errors.title}
            hint={`${input.title.length} / 120 символов`}
          >
            <input
              id="task-title"
              placeholder="Например, подготовиться к семинару"
              value={input.title}
              onChange={(event) => change('title', event.target.value)}
              maxLength={120}
              disabled={busy}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'task-title-error' : 'task-title-hint'}
              autoFocus
            />
          </Field>
          <Field
            id="task-description"
            label="Описание"
            error={errors.description}
            hint="Что нужно сделать, где найти материалы и на что обратить внимание."
          >
            <textarea
              id="task-description"
              rows={5}
              placeholder="Несколько деталей, чтобы проще было начать…"
              value={input.description}
              onChange={(event) => change('description', event.target.value)}
              maxLength={3000}
              disabled={busy}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? 'task-description-error' : 'task-description-hint'
              }
            />
          </Field>
          <div className="subject-field-heading">
            <span>
              Предмет <span className="required">*</span>
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => setAddSubject(true)}
              disabled={busy}
            >
              <Icon name="plus" />
              Новый предмет
            </button>
          </div>
          <div className={`field ${errors.subjectId ? 'field-invalid' : ''}`}>
            <label className="sr-only" htmlFor="task-subjectId">
              Предмет
            </label>
            <select
              id="task-subjectId"
              value={input.subjectId}
              onChange={(event) => change('subjectId', event.target.value)}
              disabled={busy}
              aria-invalid={Boolean(errors.subjectId)}
              aria-describedby={errors.subjectId ? 'task-subjectId-error' : undefined}
            >
              <option value="">Выбери предмет</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p id="task-subjectId-error" className="field-error" role="alert">
                {errors.subjectId}
              </p>
            )}
          </div>
          <div className="form-row">
            <Field
              id="task-dueDate"
              label="Срок выполнения"
              error={errors.dueDate}
              hint="Можно оставить без срока."
            >
              <input
                id="task-dueDate"
                type="date"
                value={input.dueDate ?? ''}
                onChange={(event) => change('dueDate', event.target.value || null)}
                disabled={busy}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={errors.dueDate ? 'task-dueDate-error' : 'task-dueDate-hint'}
              />
            </Field>
            <Field id="task-priority" label="Приоритет" error={errors.priority}>
              <select
                id="task-priority"
                value={input.priority}
                onChange={(event) =>
                  change('priority', event.target.value as TaskInput['priority'])
                }
                disabled={busy}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="task-status" label="Статус" error={errors.status}>
            <select
              id="task-status"
              value={input.status}
              onChange={(event) => change('status', event.target.value as TaskInput['status'])}
              disabled={busy}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
          {requestError && (
            <p className="error-message" role="alert">
              {requestError}
            </p>
          )}
          <div className="form-actions">
            <ButtonLink to={task ? `/tasks/${task.id}` : '/tasks'} secondary>
              Отмена
            </ButtonLink>
            <Button type="submit" busy={busy}>
              {busy ? 'Сохраняем…' : task ? 'Сохранить изменения' : 'Добавить задачу'}
              <Icon name="arrow" />
            </Button>
          </div>
        </form>
        <aside className="form-tip">
          <span className="tip-icon">
            <Icon name="spark" />
          </span>
          <h2>
            Маленький шаг —<br />
            тоже хороший план.
          </h2>
          <p>
            Сформулируй задачу так, чтобы было понятно, с чего начать. Большую работу можно
            разделить на несколько отдельных заданий.
          </p>
          <div className="tip-example">
            <span>Например</span>
            <p>«Прочитать главу 3 и выписать пять основных идей»</p>
          </div>
          <p className="local-form-note">
            <Icon name="shield" />
            Изменения сохраняются в этом браузере.
          </p>
        </aside>
      </div>
      {addSubject && (
        <SubjectDialog
          onClose={() => setAddSubject(false)}
          onSaved={(subject) => change('subjectId', subject.id)}
        />
      )}
    </>
  );
}

export function TaskFormPage() {
  const { id } = useParams();
  const task = useAppSelector((state) => state.tasks.items.find((entry) => entry.id === id));
  if (id && !task) return <NotFoundPage />;
  return (
    <>
      <Link className="back-link" to={task ? `/tasks/${task.id}` : '/tasks'}>
        <Icon name="back" />
        {task ? 'К задаче' : 'К списку задач'}
      </Link>
      <TaskForm key={id ?? 'new'} task={task} />
    </>
  );
}
