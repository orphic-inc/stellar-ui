import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import WikiEditPage from '../../components/wiki/WikiEditPage';

const mockUseGetMeQuery = jest.fn();
const mockUseGetWikiPageQuery = jest.fn();
const mockCreateWikiPage = jest.fn();
const mockUpdateWikiPage = jest.fn();
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

let mockIsCreating = false;
let mockIsUpdating = false;

jest.mock('../../store/services/wikiApi', () => ({
  useGetWikiPageQuery: (...args: unknown[]) => mockUseGetWikiPageQuery(...args),
  useCreateWikiPageMutation: () => [
    mockCreateWikiPage,
    { isLoading: mockIsCreating }
  ],
  useUpdateWikiPageMutation: () => [
    mockUpdateWikiPage,
    { isLoading: mockIsUpdating }
  ]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}));

describe('WikiEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCreating = false;
    mockIsUpdating = false;
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { wiki_manage: true } }
      }
    });
    mockCreateWikiPage.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 33 })
    });
    mockUpdateWikiPage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('creates a new wiki page with manager-only fields', async () => {
    mockUseParams.mockReturnValue({});
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });

    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiEditPage />, { store });

    await user.type(screen.getByLabelText(/^title$/i), 'New Page');
    await user.type(screen.getByLabelText(/slug/i), 'new slug!');
    await user.type(screen.getByLabelText(/body/i), '<p>Body</p>');
    await user.clear(screen.getByLabelText(/min rank level to read/i));
    await user.type(screen.getByLabelText(/min rank level to read/i), '100');
    await user.clear(screen.getByLabelText(/min rank level to edit/i));
    await user.type(screen.getByLabelText(/min rank level to edit/i), '200');
    await user.click(screen.getByRole('button', { name: /create page/i }));

    await waitFor(() => {
      expect(mockCreateWikiPage).toHaveBeenCalledWith({
        title: 'New Page',
        body: '<p>Body</p>',
        slug: 'newslug',
        minReadLevel: 100,
        minEditLevel: 200
      });
      expect(mockNavigate).toHaveBeenCalledWith('/wiki/33');
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Page created.')).toBe(true);
    });
  });

  it('updates an existing page', async () => {
    mockUseParams.mockReturnValue({ id: '12' });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Existing',
        body: '<p>Old</p>',
        slug: 'existing',
        minReadLevel: 0,
        minEditLevel: 0
      },
      isLoading: false,
      error: undefined
    });

    const user = userEvent.setup();
    renderWithProviders(<WikiEditPage />);

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), 'Updated');
    await user.clear(screen.getByLabelText(/body/i));
    await user.type(screen.getByLabelText(/body/i), '<p>Updated</p>');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateWikiPage).toHaveBeenCalledWith({
        id: 12,
        title: 'Updated',
        body: '<p>Updated</p>',
        minReadLevel: 0,
        minEditLevel: 0
      });
      expect(mockNavigate).toHaveBeenCalledWith('/wiki/12');
    });
  });

  it('does not send manager-only fields for a plain wiki editor', async () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 15,
        username: 'editor',
        userRank: { permissions: { wiki_edit: true } }
      }
    });
    mockUseParams.mockReturnValue({});
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });

    const user = userEvent.setup();
    renderWithProviders(<WikiEditPage />);

    await user.type(screen.getByLabelText(/^title$/i), 'Editor Page');
    await user.type(screen.getByLabelText(/body/i), '<p>Editor Body</p>');
    await user.click(screen.getByRole('button', { name: /create page/i }));

    await waitFor(() => {
      expect(mockCreateWikiPage).toHaveBeenCalledWith({
        title: 'Editor Page',
        body: '<p>Editor Body</p>',
        slug: undefined
      });
      expect(
        screen.queryByLabelText(/min rank level to read/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/min rank level to edit/i)
      ).not.toBeInTheDocument();
    });
  });

  it('shows "Back" as back label when existing page data is unavailable in edit mode', () => {
    mockUseParams.mockReturnValue({ id: '12' });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderWithProviders(<WikiEditPage />);
    expect(screen.getByRole('link', { name: /← back/i })).toBeInTheDocument();
  });

  it('shows spinner when loading existing page (edit mode + isLoading=true)', () => {
    mockUseParams.mockReturnValue({ id: '12' });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<WikiEditPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows "Saving…" when isSaving is true', () => {
    mockIsCreating = true;
    mockUseParams.mockReturnValue({});
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<WikiEditPage />);
    expect(
      screen.getByRole('button', { name: /saving…/i })
    ).toBeInTheDocument();
  });

  it('dispatches fallback danger alert when save fails with no API message', async () => {
    mockUseParams.mockReturnValue({ id: '12' });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Existing',
        body: '<p>Old</p>',
        slug: 'existing',
        minReadLevel: 0,
        minEditLevel: 0
      },
      isLoading: false,
      error: undefined
    });
    mockUpdateWikiPage.mockReturnValue({ unwrap: () => Promise.reject({}) });
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiEditPage />, { store });
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to save.')).toBe(true);
    });
  });

  it('omits manager fields in update when user is not a manager', async () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 5,
        username: 'editor',
        userRank: { permissions: { wiki_edit: true } }
      }
    });
    mockUseParams.mockReturnValue({ id: '12' });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Existing',
        body: '<p>Old</p>',
        slug: 'existing',
        minReadLevel: 0,
        minEditLevel: 0
      },
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiEditPage />);
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(mockUpdateWikiPage).toHaveBeenCalledWith(
        expect.not.objectContaining({ minReadLevel: expect.anything() })
      );
    });
  });

  it('shows an error alert when save fails', async () => {
    mockUseParams.mockReturnValue({ id: '12' });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Existing',
        body: '<p>Old</p>',
        slug: 'existing',
        minReadLevel: 0,
        minEditLevel: 0
      },
      isLoading: false,
      error: undefined
    });
    mockUpdateWikiPage.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Save failed' } })
    });

    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiEditPage />, { store });

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), 'Broken Save');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Save failed')).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalledWith('/wiki/12');
    });
  });

  it('paints the form from the data-st contract', () => {
    mockUseParams.mockReturnValue({});
    const { container } = renderWithProviders(<WikiEditPage />, {
      store: createTestStore()
    });
    // CRUD form: fields → field, labels → meta, panel surface, Save → primary
    // control.
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      container.querySelector('input[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('textarea[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('label[data-st="meta"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
  });
});
