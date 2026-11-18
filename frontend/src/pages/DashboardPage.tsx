import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { selectSubjects, selectTasks, useAppSelector } from '../app/store';
import { dateOnly, isOverdue, isThisWeek } from '../domain/dates';
import { DEFAULT_FILTERS, filterTasks, getProgress, taskCount } from '../domain/tasks';
import { Icon } from '../components/Icon';
import { ButtonLink, EmptyState, PageHeader, Progress } from '../components/ui';
import { TaskRow } from '../components/TaskRow';

export function DashboardPage() {
  const tasks = useAppSelector(selectTasks);
  const subjects = useAppSelector(selectSubjects);
  const mode = useAppSelector((state) => state.tasks.mode);
  const today = dateOnly();
  const progress = getProgress(tasks);
  const active = tasks.filter((task) => task.status !== 'done');
  const dueToday = active.filter((task) => task.dueDate === today).length;
  const overdue = active.filter((task) => isOverdue(task, today)).length;
  const upcoming = useMemo(
    () =>
      filterTasks(
        tasks.filter((task) => isOverdue(task) || isThisWeek(task)),
        DEFAULT_FILTERS,
      ).slice(0, 5),
    [tasks],
  );
  const day = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return (
    <>
      <PageHeader
        eyebrow={day}
        title="Всё по плану."
        description="Твои предметы, ближайшие сроки и маленькие победы."
        action={
          <ButtonLink to="/tasks/new">
            <Icon name="plus" />
            Новая задача
          </ButtonLink>
        }
      />
      {mode === 'demo' && (
        <div className="demo-banner">
          <Icon name="spark" />
          <p>
            <strong>Начнём с примера.</strong> Здесь можно менять задачи и знакомиться с
            планировщиком.
          </p>
          <Link to="/about#data">
            Начать свой план <Icon name="arrow" />
          </Link>
        </div>
      )}
      <section className="stats-grid" aria-label="Краткая сводка">
        <Link to="/tasks" className="stat-card">
          <span className="stat-icon">
            <Icon name="list" />
          </span>
          <span className="stat-label">В твоём плане</span>
          <strong>
            {active.length}
            <span>{taskCount(active.length).split(' ').slice(1).join(' ')}</span>
          </strong>
          <span className="stat-hint">Ещё немного — и готово</span>
        </Link>
        <Link to="/tasks?period=today" className="stat-card">
          <span className="stat-icon">
            <Icon name="calendar" />
          </span>
          <span className="stat-label">На сегодня</span>
          <strong>
            {dueToday}
            <span>{taskCount(dueToday).split(' ').slice(1).join(' ')}</span>
          </strong>
          <span className="stat-hint">Один понятный следующий шаг</span>
        </Link>
        <Link to="/tasks?period=overdue" className={`stat-card ${overdue ? 'stat-attention' : ''}`}>
          <span className="stat-icon">
            <Icon name="clock" />
          </span>
          <span className="stat-label">Ждут внимания</span>
          <strong>
            {overdue}
            <span>{taskCount(overdue).split(' ').slice(1).join(' ')}</span>
          </strong>
          <span className="stat-hint">
            {overdue ? 'Можно пересмотреть сроки' : 'Просроченных задач нет'}
          </span>
        </Link>
      </section>
      <div className="dashboard-columns">
        <section className="panel upcoming-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ближайшие семь дней</p>
              <h2>Что на очереди</h2>
            </div>
            <Link to="/tasks" className="text-link">
              Все задачи <Icon name="arrow" />
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="task-list compact-list">
              {upcoming.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  subject={subjects.find((subject) => subject.id === task.subjectId)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Можно выдохнуть"
              description={
                tasks.length
                  ? 'На ближайшую неделю срочных задач нет. Остальные задания ждут в общем списке.'
                  : 'Добавь первое задание, и здесь появятся ближайшие сроки.'
              }
              icon="spark"
              action={
                <ButtonLink to="/tasks/new" secondary>
                  Добавить задачу
                </ButtonLink>
              }
            />
          )}
        </section>
        <aside className="dashboard-aside">
          <section className="progress-panel">
            <Icon name="spark" className="progress-decoration" />
            <p className="eyebrow">Твой прогресс</p>
            <h2>
              Маленькие шаги
              <br />
              тоже считаются.
            </h2>
            <div className="progress-number">
              {progress.percent}
              <span>%</span>
            </div>
            <Progress done={progress.done} total={progress.total} label="Выполнено в твоём плане" />
            <p className="muted small">Каждая отметка — ещё одно дело позади.</p>
          </section>
          <section className="panel subject-summary">
            <div className="panel-heading">
              <h2>По предметам</h2>
              <Link to="/subjects" className="icon-button" aria-label="Перейти к предметам">
                <Icon name="arrow" />
              </Link>
            </div>
            {subjects.length ? (
              subjects.slice(0, 4).map((subject) => {
                const summary = getProgress(tasks.filter((task) => task.subjectId === subject.id));
                return (
                  <Link
                    key={subject.id}
                    className="subject-summary-row"
                    to={`/tasks?subject=${subject.id}`}
                  >
                    <span className="subject-symbol" style={{ color: subject.color }}>
                      <Icon name="book" />
                    </span>
                    <span>
                      <strong>{subject.name}</strong>
                      <span>
                        {summary.done} из {summary.total} выполнено
                      </span>
                    </span>
                    <Icon name="chevron" />
                  </Link>
                );
              })
            ) : (
              <p className="muted small">Добавь предмет, чтобы собирать задания по темам.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
