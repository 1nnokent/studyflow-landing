import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store';
import { updateTask, errorMessage } from '../state/actions';
import { notify } from '../state/uiSlice';
import { formatDate, isOverdue } from '../domain/dates';
import { PRIORITY_LABELS, STATUS_LABELS, type Subject, type Task } from '../domain/types';
import { Icon } from './Icon';

export function StatusBadge({ status }: { status: Task['status'] }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span />
      {STATUS_LABELS[status]}
    </span>
  );
}
export function TaskRow({ task, subject }: { task: Task; subject?: Subject }) {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((state) => state.tasks.pendingIds.includes(task.id));
  async function toggle() {
    try {
      await dispatch(
        updateTask({ id: task.id, changes: { status: task.status === 'done' ? 'todo' : 'done' } }),
      ).unwrap();
    } catch (error) {
      dispatch(notify(errorMessage(error), 'error'));
    }
  }
  const overdue = isOverdue(task);
  return (
    <li
      className={`task-row ${task.status === 'done' ? 'task-done' : ''} ${pending ? 'task-pending' : ''}`}
    >
      <label
        className="task-check"
        title={task.status === 'done' ? 'Вернуть в план' : 'Отметить выполненной'}
      >
        <input
          type="checkbox"
          checked={task.status === 'done'}
          disabled={pending}
          onChange={() => {
            void toggle();
          }}
          aria-label={`${task.status === 'done' ? 'Вернуть в план' : 'Выполнить'}: ${task.title}`}
        />
        <span>
          <Icon name="check" />
        </span>
      </label>
      <div className="task-row-main">
        <Link to={`/tasks/${task.id}`} className="task-title">
          {task.title}
        </Link>
        <div className="task-meta">
          <span className="subject-label">
            <span style={{ background: subject?.color ?? '#73915c' }} />
            {subject?.name ?? 'Предмет'}
          </span>
          <span className={`priority-label priority-${task.priority}`}>
            <span />
            {PRIORITY_LABELS[task.priority]} приоритет
          </span>
        </div>
      </div>
      <StatusBadge status={task.status} />
      <span className={`task-deadline ${overdue ? 'overdue' : ''}`}>
        <Icon name={overdue ? 'alert' : 'calendar'} />
        {overdue ? `Просрочено · ${formatDate(task.dueDate)}` : formatDate(task.dueDate)}
      </span>
      <Link
        to={`/tasks/${task.id}/edit`}
        className="icon-button task-edit"
        aria-label={`Редактировать: ${task.title}`}
      >
        <Icon name="edit" />
      </Link>
    </li>
  );
}
