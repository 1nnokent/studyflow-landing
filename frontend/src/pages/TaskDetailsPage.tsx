import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { selectSubjects, useAppDispatch, useAppSelector } from '../app/store';
import { deleteTask, errorMessage, updateTask } from '../state/actions';
import { notify } from '../state/uiSlice';
import { formatDate, isOverdue } from '../domain/dates';
import { PRIORITY_LABELS, STATUSES, STATUS_LABELS, type TaskStatus } from '../domain/types';
import { Button, ButtonLink, ConfirmDialog, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/TaskRow';
import { NotFoundPage } from './NotFoundPage';

export function TaskDetailsPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const task = useAppSelector((state) => state.tasks.items.find((entry) => entry.id === id));
  const subjects = useAppSelector(selectSubjects);
  const busy = useAppSelector((state) => state.tasks.pendingIds.includes(id ?? ''));
  const [confirm, setConfirm] = useState(false);
  const [requestError, setRequestError] = useState('');
  if (!task) return <NotFoundPage />;
  const subject = subjects.find((entry) => entry.id === task.subjectId);
  async function setStatus(status: TaskStatus) {
    if (!task) return;
    setRequestError('');
    try {
      await dispatch(updateTask({ id: task.id, changes: { status } })).unwrap();
      dispatch(notify(status === 'done' ? 'Ещё одно дело позади!' : 'Статус задачи обновлён'));
    } catch (error) {
      setRequestError(errorMessage(error));
    }
  }
  async function remove() {
    if (!task) return;
    setRequestError('');
    try {
      await dispatch(deleteTask(task.id)).unwrap();
      dispatch(notify('Задача удалена'));
      navigate('/tasks', { replace: true });
    } catch (error) {
      setRequestError(errorMessage(error));
    }
  }
  return (
    <>
      <Link to="/tasks" className="back-link">
        <Icon name="back" />К списку задач
      </Link>
      <PageHeader
        eyebrow={subject?.name ?? 'Задача'}
        title={task.title}
        action={
          <ButtonLink to={`/tasks/${task.id}/edit`} secondary>
            <Icon name="edit" />
            Редактировать
          </ButtonLink>
        }
      />
      <div className="detail-layout">
        <article className="panel detail-main">
          <div className="detail-top">
            <StatusBadge status={task.status} />
            <span className={`priority-label priority-${task.priority}`}>
              <span />
              {PRIORITY_LABELS[task.priority]} приоритет
            </span>
          </div>
          <h2>Что нужно сделать</h2>
          <p className={`task-description ${!task.description ? 'muted' : ''}`}>
            {task.description ||
              'Описание пока не добавлено. Можно записать детали при редактировании задачи.'}
          </p>
          <div className="detail-complete">
            <span>
              <Icon name="spark" />
              {task.status === 'done'
                ? 'Готово. Можно двигаться дальше.'
                : 'Каждая выполненная задача освобождает немного места в голове.'}
            </span>
            <Button
              busy={busy}
              variant={task.status === 'done' ? 'secondary' : 'primary'}
              onClick={() => {
                void setStatus(task.status === 'done' ? 'todo' : 'done');
              }}
            >
              <Icon name={task.status === 'done' ? 'back' : 'check'} />
              {task.status === 'done' ? 'Вернуть в план' : 'Отметить выполненной'}
            </Button>
          </div>
          {requestError && !confirm && (
            <p role="alert" className="error-message">
              {requestError}
            </p>
          )}
        </article>
        <aside className="panel detail-info">
          <h2>Детали задачи</h2>
          <dl>
            <div>
              <dt>Предмет</dt>
              <dd>
                <Link to={`/tasks?subject=${task.subjectId}`} className="subject-label">
                  <span style={{ background: subject?.color }} />
                  {subject?.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Срок</dt>
              <dd className={isOverdue(task) ? 'overdue' : ''}>
                <Icon name="calendar" />
                {formatDate(task.dueDate, false)}
                {isOverdue(task) && <small>Срок прошёл. Можно перенести.</small>}
              </dd>
            </div>
            <div>
              <dt>
                <label htmlFor="detail-status">Статус</label>
              </dt>
              <dd>
                <select
                  id="detail-status"
                  value={task.status}
                  disabled={busy}
                  onChange={(event) => {
                    void setStatus(event.target.value as TaskStatus);
                  }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div>
              <dt>Добавлена</dt>
              <dd>
                {new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(task.createdAt))}
              </dd>
            </div>
          </dl>
          <button
            className="delete-task-button"
            type="button"
            onClick={() => {
              setRequestError('');
              setConfirm(true);
            }}
            disabled={busy}
          >
            <Icon name="trash" />
            Удалить задачу
          </button>
        </aside>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Удалить задачу?"
          description={`«${task.title}» исчезнет из плана. Вернуть её можно будет только из заранее сохранённой копии.`}
          confirmLabel="Удалить задачу"
          onConfirm={() => {
            void remove();
          }}
          onClose={() => setConfirm(false)}
          busy={busy}
          error={requestError}
        />
      )}
    </>
  );
}
