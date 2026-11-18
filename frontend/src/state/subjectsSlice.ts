import { createSlice } from '@reduxjs/toolkit';
import {
  createSubject,
  deleteSubject,
  loadWorkspace,
  replaceWorkspace,
  updateSubject,
} from './actions';
import type { Subject } from '../domain/types';

export interface SubjectsState {
  items: Subject[];
  saving: boolean;
  error: string | null;
}
const initialState: SubjectsState = { items: [], saving: false, error: null };
const subjectsSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(loadWorkspace.fulfilled, (state, action) => {
        state.items = action.payload.subjects;
      })
      .addCase(replaceWorkspace.fulfilled, (state, action) => {
        state.items = action.payload.subjects;
        state.error = null;
      })
      .addCase(createSubject.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createSubject.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.saving = false;
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Не удалось создать предмет';
      })
      .addCase(updateSubject.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSubject.fulfilled, (state, action) => {
        const index = state.items.findIndex((subject) => subject.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.saving = false;
      })
      .addCase(updateSubject.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Не удалось изменить предмет';
      })
      .addCase(deleteSubject.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteSubject.fulfilled, (state, action) => {
        state.items = state.items.filter((subject) => subject.id !== action.payload);
        state.saving = false;
      })
      .addCase(deleteSubject.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Не удалось удалить предмет';
      }),
});
export default subjectsSlice.reducer;
