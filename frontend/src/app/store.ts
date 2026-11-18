import { configureStore, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { createLocalWorkspaceApi, type WorkspaceApi } from '../api/workspaceApi';
import tasks from '../state/tasksSlice';
import subjects from '../state/subjectsSlice';
import ui from '../state/uiSlice';
import { filterTasks } from '../domain/tasks';
import type { TaskFilters } from '../domain/types';

export function createAppStore(api: WorkspaceApi = createLocalWorkspaceApi()) {
  return configureStore({
    reducer: { tasks, subjects, ui },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { api } } }),
    devTools: import.meta.env.DEV,
  });
}
export const store = createAppStore();
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const selectTasks = (state: RootState) => state.tasks.items;
export const selectSubjects = (state: RootState) => state.subjects.items;
export const selectFilteredTasks = createSelector(
  [selectTasks, (_: RootState, filters: TaskFilters) => filters],
  filterTasks,
);
