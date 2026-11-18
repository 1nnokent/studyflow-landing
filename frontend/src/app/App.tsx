import { Component, type ReactNode } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';
import { TaskFormPage } from '../pages/TaskFormPage';
import { TaskDetailsPage } from '../pages/TaskDetailsPage';
import { SubjectsPage } from '../pages/SubjectsPage';
import { AboutPage } from '../pages/AboutPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-error">
          <h1>Что-то пошло не так</h1>
          <p>Попробуй обновить страницу. Сохранённый план останется в браузере.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
        </main>
      );
    return this.props.children;
  }
}
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/new" element={<TaskFormPage />} />
        <Route path="tasks/:id" element={<TaskDetailsPage />} />
        <Route path="tasks/:id/edit" element={<TaskFormPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
export function App() {
  return (
    <AppErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppErrorBoundary>
  );
}
