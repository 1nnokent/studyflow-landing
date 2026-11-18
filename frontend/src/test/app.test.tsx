import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { createAppStore } from '../app/store';
import { createLocalWorkspaceApi, STORAGE_KEY, type WorkspaceApi } from '../api/workspaceApi';
import { demoWorkspace } from '../data/demo';
import { emptyWorkspace } from '../domain/workspace';
import type { Workspace } from '../domain/types';

function renderApp(route = '/', api: WorkspaceApi = createLocalWorkspaceApi({ delayMs: 0 })) {
  const store = createAppStore(api);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

describe('Форма и пользовательские состояния', () => {
  it('показывает ошибки обязательных полей', async () => {
    const user = userEvent.setup();
    renderApp('/tasks/new');
    await screen.findByRole('heading', { name: 'Что добавим в план?' });
    await user.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    expect(screen.getByText('Введите название задачи')).toBeVisible();
    expect(screen.getByText('Выберите существующий предмет')).toBeVisible();
    expect(screen.getByLabelText(/Название задачи/)).toHaveFocus();
  });
  it('создаёт предмет из формы и сохраняет новую задачу', async () => {
    const user = userEvent.setup();
    const store = renderApp('/tasks/new');
    await screen.findByRole('heading', { name: 'Что добавим в план?' });
    await user.type(screen.getByLabelText(/Название задачи/), 'Подготовить доклад');
    await user.click(screen.getByRole('button', { name: 'Новый предмет' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый предмет' });
    await user.type(within(dialog).getByLabelText(/Название предмета/), 'Физика');
    await user.click(within(dialog).getByRole('button', { name: 'Добавить предмет' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    await screen.findByRole('heading', { name: 'Подготовить доклад' });
    const task = store.getState().tasks.items.find((entry) => entry.title === 'Подготовить доклад');
    expect(task).toBeDefined();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Workspace;
    expect(saved.tasks.some((entry) => entry.id === task?.id)).toBe(true);
    expect(saved.subjects.find((subject) => subject.id === task?.subjectId)?.name).toBe('Физика');
  });
  it('сохраняет введённый текст при ошибке записи', async () => {
    const user = userEvent.setup();
    const api = createLocalWorkspaceApi({ delayMs: 0 });
    vi.spyOn(api, 'createTask').mockRejectedValue(new Error('Хранилище заполнено'));
    renderApp('/tasks/new', api);
    await screen.findByRole('heading', { name: 'Что добавим в план?' });
    await user.type(screen.getByLabelText(/Название задачи/), 'Важная работа');
    await user.selectOptions(screen.getByLabelText('Предмет', { exact: true }), 'frontend');
    await user.click(screen.getByRole('button', { name: 'Добавить задачу' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Хранилище заполнено');
    expect(screen.getByLabelText(/Название задачи/)).toHaveValue('Важная работа');
  });
  it('показывает пустой результат и позволяет сбросить поиск', async () => {
    const user = userEvent.setup();
    renderApp('/tasks');
    await screen.findByRole('heading', { name: 'Все задачи' });
    await user.type(screen.getByRole('searchbox'), 'несуществующеезадание');
    expect(screen.getByRole('heading', { name: 'Ничего не нашлось' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(screen.getByRole('link', { name: 'Сверстать страницу проекта' })).toBeVisible();
  });
  it('показывает пустой план без демонстрационных задач', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyWorkspace()));
    renderApp('/tasks');
    expect(await screen.findByRole('heading', { name: 'Начнём с одной задачи' })).toBeVisible();
  });
  it('показывает загрузку до завершения запроса', async () => {
    let resolve: (value: Workspace) => void = () => {};
    const api = createLocalWorkspaceApi({ delayMs: 0 });
    vi.spyOn(api, 'load').mockImplementation(
      () =>
        new Promise<Workspace>((done) => {
          resolve = done;
        }),
    );
    renderApp('/', api);
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка плана');
    await act(async () => resolve(demoWorkspace()));
    expect(await screen.findByRole('heading', { name: 'Всё по плану.' })).toBeVisible();
  });
  it('позволяет повторить неудачную загрузку', async () => {
    const user = userEvent.setup();
    const api = createLocalWorkspaceApi({ delayMs: 0 });
    vi.spyOn(api, 'load')
      .mockRejectedValueOnce(new Error('Не удалось прочитать данные'))
      .mockResolvedValue(demoWorkspace());
    renderApp('/', api);
    await screen.findByRole('heading', { name: 'Не получилось открыть план' });
    await user.click(screen.getByRole('button', { name: 'Попробовать снова' }));
    expect(await screen.findByRole('heading', { name: 'Всё по плану.' })).toBeVisible();
  });
});
