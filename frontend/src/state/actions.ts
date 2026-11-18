import { createAsyncThunk } from '@reduxjs/toolkit';
import type { WorkspaceApi } from '../api/workspaceApi';
import type { Subject, SubjectInput, Task, TaskInput, Workspace } from '../domain/types';

type Config = { extra: { api: WorkspaceApi }; rejectValue: string };
export function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  return error instanceof Error
    ? error.message
    : 'Не получилось выполнить действие. Попробуйте снова.';
}
export const loadWorkspace = createAsyncThunk<Workspace, void, Config>(
  'workspace/load',
  async (_, { extra, rejectWithValue }) => {
    try {
      return await extra.api.load();
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
  {
    condition: (_, { getState }) =>
      (getState() as { tasks: { status: string } }).tasks.status !== 'loading',
  },
);

export const createTask = createAsyncThunk<Task, TaskInput, Config>(
  'tasks/create',
  async (input, { extra, rejectWithValue }) => {
    try {
      return await extra.api.createTask(input);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const updateTask = createAsyncThunk<
  Task,
  { id: string; changes: Partial<TaskInput> },
  Config
>('tasks/update', async ({ id, changes }, { extra, rejectWithValue }) => {
  try {
    return await extra.api.updateTask(id, changes);
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});
export const deleteTask = createAsyncThunk<string, string, Config>(
  'tasks/delete',
  async (id, { extra, rejectWithValue }) => {
    try {
      return await extra.api.deleteTask(id);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const createSubject = createAsyncThunk<Subject, SubjectInput, Config>(
  'subjects/create',
  async (input, { extra, rejectWithValue }) => {
    try {
      return await extra.api.createSubject(input);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const updateSubject = createAsyncThunk<Subject, { id: string; input: SubjectInput }, Config>(
  'subjects/update',
  async ({ id, input }, { extra, rejectWithValue }) => {
    try {
      return await extra.api.updateSubject(id, input);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const deleteSubject = createAsyncThunk<string, string, Config>(
  'subjects/delete',
  async (id, { extra, rejectWithValue }) => {
    try {
      return await extra.api.deleteSubject(id);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const replaceWorkspace = createAsyncThunk<Workspace, Workspace, Config>(
  'workspace/replace',
  async (document, { extra, rejectWithValue }) => {
    try {
      return await extra.api.replace(document);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
