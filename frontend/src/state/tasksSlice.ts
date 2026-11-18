import { createSlice } from '@reduxjs/toolkit';
import { createTask, deleteTask, loadWorkspace, replaceWorkspace, updateTask } from './actions';
import type { LoadStatus, Task, Workspace } from '../domain/types';

export interface TasksState {
  items: Task[];
  status: LoadStatus;
  error: string | null;
  mutationError: string | null;
  saving: boolean;
  replacing: boolean;
  pendingIds: string[];
  mode: Workspace['mode'];
}
export const initialTasksState: TasksState = {
  items: [],
  status: 'idle',
  error: null,
  mutationError: null,
  saving: false,
  replacing: false,
  pendingIds: [],
  mode: 'personal',
};
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: initialTasksState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(loadWorkspace.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadWorkspace.fulfilled, (state, action) => {
        state.items = action.payload.tasks;
        state.mode = action.payload.mode;
        state.status = 'succeeded';
      })
      .addCase(loadWorkspace.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Не удалось загрузить план';
      })
      .addCase(createTask.pending, (state) => {
        state.saving = true;
        state.mutationError = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.saving = false;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.saving = false;
        state.mutationError = action.payload ?? 'Не удалось создать задачу';
      })
      .addCase(updateTask.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg.id);
        state.mutationError = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.items.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.pendingIds = state.pendingIds.filter((id) => id !== action.payload.id);
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id);
        state.mutationError = action.payload ?? 'Не удалось изменить задачу';
      })
      .addCase(deleteTask.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg);
        state.mutationError = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((task) => task.id !== action.payload);
        state.pendingIds = state.pendingIds.filter((id) => id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg);
        state.mutationError = action.payload ?? 'Не удалось удалить задачу';
      })
      .addCase(replaceWorkspace.pending, (state) => {
        state.replacing = true;
        state.mutationError = null;
      })
      .addCase(replaceWorkspace.fulfilled, (state, action) => {
        state.items = action.payload.tasks;
        state.mode = action.payload.mode;
        state.replacing = false;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(replaceWorkspace.rejected, (state, action) => {
        state.replacing = false;
        state.mutationError = action.payload ?? 'Не удалось заменить план';
      }),
});
export default tasksSlice.reducer;
