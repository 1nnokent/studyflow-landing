import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { selectTasks, useAppDispatch, useAppSelector } from '../app/store';
import { errorMessage, loadWorkspace, replaceWorkspace } from '../state/actions';
import { dismissNotification } from '../state/uiSlice';
import { emptyWorkspace } from '../domain/workspace';
import { Icon, Logo, type IconName } from './Icon';
import { Button, ConfirmDialog, LoadingState } from './ui';

const navigation: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Обзор', icon: 'grid' },
  { to: '/tasks', label: 'Все задачи', icon: 'list' },
  { to: '/subjects', label: 'Предметы', icon: 'book' },
  { to: '/about', label: 'О приложении', icon: 'info' },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const tasks = useAppSelector(selectTasks);
  const active = tasks.filter((task) => task.status !== 'done').length;
  return (
    <>
      <Link to="/" onClick={onNavigate} aria-label="StudyFlow — обзор">
        <Logo />
      </Link>
      <p className="sidebar-caption">МОЁ ПРОСТРАНСТВО</p>
      <nav aria-label="Разделы приложения">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.to === '/tasks' && active > 0 && <span className="nav-count">{active}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="local-data-note">
          <Icon name="shield" />
          <div>
            <strong>На этом устройстве</strong>
            <span>Твой план сохраняется здесь</span>
          </div>
        </div>
        <a
          className="landing-link"
          href="https://1nnokent.github.io/studyflow-landing/"
          target="_blank"
          rel="noreferrer"
        >
          Открыть лендинг
          <Icon name="external" />
        </a>
      </div>
    </>
  );
}

function LoadError() {
  const dispatch = useAppDispatch();
  const message = useAppSelector((state) => state.tasks.error);
  const busy = useAppSelector((state) => state.tasks.replacing);
  const [confirm, setConfirm] = useState(false);
  const [resetError, setResetError] = useState('');
  async function reset() {
    try {
      await dispatch(replaceWorkspace(emptyWorkspace())).unwrap();
      setConfirm(false);
    } catch (error) {
      setResetError(errorMessage(error));
    }
  }
  return (
    <div className="load-error" role="alert">
      <span className="empty-icon">
        <Icon name="alert" />
      </span>
      <h1>Не получилось открыть план</h1>
      <p>{message}</p>
      <div className="button-row">
        <Button
          onClick={() => {
            void dispatch(loadWorkspace());
          }}
        >
          Попробовать снова
        </Button>
        <Button variant="secondary" onClick={() => setConfirm(true)}>
          Начать новый план
        </Button>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Начать новый план?"
          description="Текущие сохранённые данные будут заменены пустым планом. Это действие нельзя отменить без резервной копии."
          confirmLabel="Начать новый план"
          onConfirm={() => {
            void reset();
          }}
          onClose={() => setConfirm(false)}
          busy={busy}
          error={resetError}
        />
      )}
    </div>
  );
}

export function AppShell() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.tasks.status);
  const notification = useAppSelector((state) => state.ui.notification);
  const location = useLocation();
  const menu = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (status === 'idle') void dispatch(loadWorkspace());
  }, [dispatch, status]);
  useEffect(() => {
    menu.current?.close();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(() => dispatch(dismissNotification(notification.id)), 4500);
    return () => window.clearTimeout(timeout);
  }, [dispatch, notification]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <aside className="sidebar">
        <Sidebar />
      </aside>
      <header className="mobile-header">
        <Link to="/" aria-label="StudyFlow — обзор">
          <Logo />
        </Link>
        <button
          className="icon-button"
          type="button"
          aria-label="Открыть меню"
          onClick={() => menu.current?.showModal()}
        >
          <Icon name="menu" />
        </button>
      </header>
      <dialog
        className="mobile-navigation"
        ref={menu}
        onClick={(event) => {
          if (event.target === event.currentTarget) menu.current?.close();
        }}
      >
        <div className="mobile-sidebar">
          <button
            className="icon-button mobile-menu-close"
            aria-label="Закрыть меню"
            onClick={() => menu.current?.close()}
          >
            <Icon name="close" />
          </button>
          <Sidebar onNavigate={() => menu.current?.close()} />
        </div>
      </dialog>
      <div className="app-body">
        <div className="topbar">
          <span>МОЙ УЧЕБНЫЙ ПЛАН</span>
          <span className="local-badge">
            <span />
            Сохранение в браузере
          </span>
        </div>
        <main className="main-content" id="main-content">
          {status === 'idle' || status === 'loading' ? (
            <LoadingState />
          ) : status === 'failed' ? (
            <LoadError />
          ) : (
            <Outlet />
          )}
        </main>
        <footer className="app-footer">
          <span>StudyFlow</span>
          <span>Одна задача за другой.</span>
        </footer>
      </div>
      {notification && (
        <div
          role={notification.kind === 'error' ? 'alert' : 'status'}
          className={`toast toast-${notification.kind}`}
        >
          <Icon name={notification.kind === 'error' ? 'alert' : 'check'} />
          <span>{notification.text}</span>
          <button
            aria-label="Закрыть уведомление"
            className="icon-button"
            onClick={() => dispatch(dismissNotification(notification.id))}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </div>
  );
}
