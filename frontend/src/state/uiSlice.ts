import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
interface Notification {
  text: string;
  kind: 'success' | 'error';
  id: string;
}
const uiSlice = createSlice({
  name: 'ui',
  initialState: { notification: null as Notification | null },
  reducers: {
    notify: {
      reducer(state, action: PayloadAction<Notification>) {
        state.notification = action.payload;
      },
      prepare(text: string, kind: Notification['kind'] = 'success') {
        return { payload: { text, kind, id: crypto.randomUUID() } };
      },
    },
    dismissNotification(state, action: PayloadAction<string>) {
      if (state.notification?.id === action.payload) state.notification = null;
    },
  },
});
export const { notify, dismissNotification } = uiSlice.actions;
export default uiSlice.reducer;
