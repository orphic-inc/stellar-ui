import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, AuthState } from '../../types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<AuthUser>) => {
      state.user = payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export const selectCurrentUser = (state: {
  auth: AuthState;
}): AuthUser | null => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }): boolean =>
  state.auth.isAuthenticated;
export default authSlice.reducer;
