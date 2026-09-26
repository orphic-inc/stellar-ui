import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../store/api';
import authReducer from '../store/slices/authSlice';
import alertReducer from '../store/slices/alertSlice';
import type { AuthorRef } from '../types';

export const createTestStore = () =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
      alert: alertReducer
    },
    middleware: (getDefault) => getDefault().concat(api.middleware)
  });

export type TestStore = ReturnType<typeof createTestStore>;

interface RenderOptions {
  initialEntries?: MemoryRouterProps['initialEntries'];
  store?: TestStore;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { initialEntries = ['/'], store = createTestStore() }: RenderOptions = {}
): RenderResult & { store: TestStore } => {
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </Provider>
  );
  return { ...result, store };
};

/**
 * An AuthorRef carrying both signs (#103): an active donor tier and an active
 * warning. Surfaces assert `Donor: Patron` and `Warned` render beside the name.
 */
export const makeAuthorRef = (
  overrides: Partial<AuthorRef> = {}
): AuthorRef => ({
  id: 42,
  username: 'signed',
  avatar: null,
  isDonor: true,
  donorRank: { name: 'Patron', badge: '★', color: '#ffcc00' },
  warned: '2026-09-01T00:00:00.000Z',
  ...overrides
});
