import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';
import type { Alert, AlertType } from '../../types';

const alertSlice = createSlice({
  name: 'alert',
  initialState: [] as Alert[],
  reducers: {
    addAlert: {
      reducer: (state, { payload }: PayloadAction<Alert>) => {
        state.push(payload);
      },
      prepare: (msg: string, alertType: AlertType = 'info') => ({
        payload: { id: nanoid(), msg, alertType }
      })
    },
    removeAlert: (state, { payload }: PayloadAction<string>) =>
      state.filter((a) => a.id !== payload)
  }
});

export const { addAlert, removeAlert } = alertSlice.actions;
export const selectAlerts = (state: { alert: Alert[] }): Alert[] => state.alert;
export default alertSlice.reducer;
