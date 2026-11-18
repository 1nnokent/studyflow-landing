import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { selectFilteredTasks, selectSubjects, selectTasks, useAppSelector } from '../app/store';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type TaskFilters,
} from '../domain/types';
import { taskCount } from '../domain/tasks';
import { Button, ButtonLink, EmptyState, PageHeader } from '../components/ui';
import { TaskRow } from '../components/TaskRow';
import { Icon } from '../components/Icon';

const PAGE_SIZE = 8;
export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const subjects = useAppSelector(selectSubjects);
  const allTasks = useAppSelector(selectTasks);
  const filters = useMemo<TaskFilters>(
    () => ({
      search: params.get('search') ?? '',
      subjectId: params.get('subject') ?? '',
      status: STATUSES.includes(params.get('status') as (typeof STATUSES)[number])
        ? params.get('status')!
        : '',
      priority: PRIORITIES.includes(params.get('priority') as (typeof PRIORITIES)[number])
        ? params.get('priority')!
        : '',
      period: ['today', 'week', 'overdue'].includes(params.get('period') ?? '')
        ? (params.get('period') as TaskFilters['period'])
        : 'all',
      sort: ['newest', 'priority'].includes(params.get('sort') ?? '')
        ? (params.get('sort') as TaskFilters['sort'])
        : 'due',
    }),
    [params],
  );
  const tasks = useAppSelector((state) => selectFilteredTasks(state, filters));
  const maxPage = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const page = Math.min(maxPage, Math.max(1, Number(params.get('page')) || 1));
  const visible = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(
    filters.search ||
    filters.subjectId ||
    filters.status ||
    filters.priority ||
    filters.period !== 'all',
  );
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: key === 'search' });
  }
  return (
    <>
      <PageHeader
        eyebrow="Моё пространство"
        title="Все задачи"
        description="Планы меняются. Здесь легко держать их в порядке."
        action={
          <ButtonLink to="/tasks/new">
            <Icon name="plus" />
            Новая задача
          </ButtonLink>
        }
      />
      <section className="panel tasks-panel" aria-label="Список задач">
        <div className="task-toolbar">
          <div className="search-field">
            <Icon name="search" />
            <label className="sr-only" htmlFor="task-search">
              Поиск по названию
            </label>
            <input
              id="task-search"
              type="search"
              placeholder="Найти задачу…"
              value={filters.search}
              onChange={(event) => change('search', event.target.value)}
            />
          </div>
          <label className="sort-label">
            <span className="sr-only">Сортировка задач</span>
            <select value={filters.sort} onChange={(event) => change('sort', event.target.value)}>
              <option value="due">Сначала ближайшие</option>
              <option value="newest">Сначала новые</option>
              <option value="priority">По приоритету</option>
            </select>
          </label>
        </div>
        <div className="task-filter-row">
          <div className="filter-tabs" role="group" aria-label="Срок задач">
            {(
              [
                ['all', 'Все'],
                ['today', 'Сегодня'],
                ['week', 'На неделе'],
                ['overdue', 'Просрочены'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.period === value}
                onClick={() => change('period', value === 'all' ? '' : value)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="result-count" aria-live="polite">
            {taskCount(tasks.length)}
          </span>
        </div>
        <div className="select-filters">
          <label>
            Предмет
            <select
              aria-label="Предмет"
              value={filters.subjectId}
              onChange={(event) => change('subject', event.target.value)}
            >
              <option value="">Все предметы</option>
              {subjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select
              aria-label="Статус"
              value={filters.status}
              onChange={(event) => change('status', event.target.value)}
            >
              <option value="">Любой статус</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Приоритет
            <select
              aria-label="Приоритет"
              value={filters.priority}
              onChange={(event) => change('priority', event.target.value)}
            >
              <option value="">Любой приоритет</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <button className="reset-filters" type="button" onClick={() => setParams({})}>
              <Icon name="close" />
              Сбросить
            </button>
          )}
        </div>
        {visible.length ? (
          <>
            <ul className="task-list">
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  subject={subjects.find((subject) => subject.id === task.subjectId)}
                />
              ))}
            </ul>
            {maxPage > 1 && (
              <nav className="pagination" aria-label="Страницы списка">
                <Button
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => change('page', String(page - 1))}
                >
                  <Icon name="back" />
                  Назад
                </Button>
                <span>
                  {page} из {maxPage}
                </span>
                <Button
                  variant="ghost"
                  disabled={page >= maxPage}
                  onClick={() => change('page', String(page + 1))}
                >
                  Дальше
                  <Icon name="arrow" />
                </Button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            title={allTasks.length ? 'Ничего не нашлось' : 'Начнём с одной задачи'}
            description={
              allTasks.length
                ? 'Попробуй другой запрос или сбрось фильтры.'
                : 'Запиши ближайшее задание. Укажи предмет и срок, а к остальному вернёшься позже.'
            }
            icon={allTasks.length ? 'search' : 'list'}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={() => setParams({})}>
                  Сбросить фильтры
                </Button>
              ) : (
                <ButtonLink to="/tasks/new">Добавить первую задачу</ButtonLink>
              )
            }
          />
        )}
      </section>
    </>
  );
}
