import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, createTestStore } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import StylesheetPage from '../../components/stylesheets/StylesheetPage';

const mockGet = jest.fn();
const mockAdopt = jest.fn();
const mockProfile = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/stylesheetApi', () => ({
  useGetAuthorStylesheetQuery: (...args: unknown[]) => mockGet(...args),
  useAdoptAuthorStylesheetMutation: () => [mockAdopt, { isLoading: false }]
}));

jest.mock('../../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => mockProfile()
}));

jest.mock('../../store/hooks', () => ({
  ...jest.requireActual('../../store/hooks'),
  useAppDispatch: () => mockDispatch
}));

const SHEET = {
  id: 12,
  authorId: 5,
  name: 'Dusk',
  source: 'body { color: #ccc; }',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z'
};

const renderAt = (viewerId = 7) => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: viewerId,
      username: 'kai',
      userRank: { name: 'User', level: 100, permissions: {} }
    } as never)
  );
  renderWithProviders(
    <Routes>
      <Route path="/stylesheets/:id" element={<StylesheetPage />} />
    </Routes>,
    { store, initialEntries: ['/stylesheets/12'] }
  );
};

const adopted = (id: number | null) =>
  mockProfile.mockReturnValue({
    data: { userSettings: { activeAuthorStylesheetId: id } }
  });

describe('StylesheetPage (#451)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({ data: SHEET, isLoading: false, isError: false });
    mockAdopt.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    adopted(null);
  });

  it("shows the sheet's name, its CSS read-only, and its author's profile", () => {
    renderAt();
    expect(mockGet).toHaveBeenCalledWith(12);
    expect(screen.getByRole('heading', { name: 'Dusk' })).toBeInTheDocument();
    expect(screen.getByLabelText('CSS')).toHaveTextContent(
      'body { color: #ccc; }'
    );
    expect(screen.getByLabelText('CSS').tagName).toBe('PRE');
    expect(
      screen.getByRole('link', { name: /author.s profile/i })
    ).toHaveAttribute('href', '/user/5');
  });

  it('adopts it and says the site now uses it, without mentioning reputation', async () => {
    const user = userEvent.setup();
    mockAdopt.mockReturnValue({
      unwrap: () => Promise.resolve({ authorStylesheet: SHEET, scored: true })
    });
    renderAt();
    await user.click(screen.getByRole('button', { name: 'Adopt' }));
    expect(mockAdopt).toHaveBeenCalledWith(12);
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Adopted — your site now uses Dusk.',
            alertType: 'success'
          })
        })
      )
    );
  });

  it('shows "In use", disabled, when this is the adopted sheet', () => {
    adopted(12);
    renderAt();
    expect(screen.getByRole('button', { name: 'In use' })).toBeDisabled();
  });

  it("offers Edit only to the sheet's author", () => {
    renderAt(5);
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/stylesheets/12/edit'
    );
  });

  it('offers no Edit to anyone else', () => {
    renderAt(7);
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull();
  });

  it('says a missing or deleted sheet is not available', () => {
    mockGet.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true
    });
    renderAt();
    expect(
      screen.getByText("This stylesheet isn't available.")
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adopt' })).toBeNull();
  });
});
