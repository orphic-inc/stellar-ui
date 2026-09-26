import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NotificationFiltersPage from '../../components/notificationFilters/NotificationFiltersPage';
import type { NotificationFilter } from '../../store/services/notificationFilterApi';

const mockGetFilters = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock('../../store/services/notificationFilterApi', () => ({
  useGetNotificationFiltersQuery: () => mockGetFilters(),
  useCreateNotificationFilterMutation: () => [mockCreate, { isLoading: false }],
  useUpdateNotificationFilterMutation: () => [mockUpdate, { isLoading: false }],
  useDeleteNotificationFilterMutation: () => [mockRemove]
}));

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: () => ({
    data: { data: [{ id: 1, name: 'Jazz' }] }
  })
}));

jest.mock('../../store/services/searchApi', () => ({
  useSearchArtistsQuery: () => ({ data: undefined, isFetching: false })
}));
jest.mock('../../store/services/tagApi', () => ({
  useSearchTagsQuery: () => ({ data: undefined, isFetching: false })
}));

const makeFilter = (
  over: Partial<NotificationFilter> = {}
): NotificationFilter => ({
  id: 12,
  label: 'Dubstep',
  artistIds: [4, 9],
  // Artist 9 has been withdrawn, so the response no longer names it.
  artists: [{ id: 4, name: 'Burial' }],
  tags: ['dubstep'],
  notTags: [],
  communityIds: [1, 99],
  releaseTypes: [],
  releaseCategories: [],
  fileTypes: [],
  bitrates: ['Lossless'],
  media: [],
  fromYear: 2005,
  toYear: null,
  newReleasesOnly: true,
  excludeCompilations: false,
  mainCreditsOnly: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...over
});

const withFilters = (filters: NotificationFilter[], limit: number | null) =>
  mockGetFilters.mockReturnValue({
    data: { filters, limit },
    isLoading: false,
    error: undefined
  });

const resolved = () => ({ unwrap: () => Promise.resolve({}) });

describe('NotificationFiltersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReturnValue(resolved());
    mockUpdate.mockReturnValue(resolved());
    mockRemove.mockReturnValue(resolved());
  });

  it('lists each filter with what it sets and paints from data-st', () => {
    withFilters([makeFilter()], 3);
    const { container } = renderWithProviders(<NotificationFiltersPage />);

    expect(container.querySelector('ul[data-st="list"]')).toBeTruthy();
    expect(screen.getByText('1 of 3 filters used', { exact: false }));
    expect(
      screen.getByText('Artists: Burial, Removed artist #9')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Communities: Jazz, Unavailable community #99')
    ).toBeInTheDocument();
    expect(screen.getByText('2005 or later')).toBeInTheDocument();
    expect(screen.getByText('New releases only')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Matches for Dubstep' })
    ).toHaveAttribute('href', '/notification-filters/12/hits');
    expect(screen.getByRole('link', { name: 'All matches' })).toHaveAttribute(
      'href',
      '/notification-filters/hits'
    );
  });

  it('says there is no limit when the rank is unlimited', () => {
    withFilters([], null);
    renderWithProviders(<NotificationFiltersPage />);
    expect(
      screen.getByText('0 filters, no limit', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New filter' })).toBeEnabled();
  });

  it('disables New filter at the limit', () => {
    withFilters([makeFilter()], 1);
    renderWithProviders(<NotificationFiltersPage />);
    expect(screen.getByRole('button', { name: 'New filter' })).toBeDisabled();
  });

  it('shows the api refusal rather than an empty page', () => {
    mockGetFilters.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 403, data: { msg: 'Your rank has no filters' } }
    });
    renderWithProviders(<NotificationFiltersPage />);
    expect(screen.getByText('Your rank has no filters')).toBeInTheDocument();
  });

  describe('delete', () => {
    afterEach(() => jest.restoreAllMocks());

    it('asks first, and does nothing when declined', async () => {
      withFilters([makeFilter()], null);
      const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();
      renderWithProviders(<NotificationFiltersPage />);

      await user.click(screen.getByRole('button', { name: 'Delete Dubstep' }));
      expect(confirm).toHaveBeenCalledWith(
        expect.stringMatching(/matched is removed too/)
      );
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('deletes once confirmed', async () => {
      withFilters([makeFilter()], null);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();
      renderWithProviders(<NotificationFiltersPage />);

      await user.click(screen.getByRole('button', { name: 'Delete Dubstep' }));
      expect(mockRemove).toHaveBeenCalledWith(12);
    });
  });

  it('edits a filter, keeping a removed artist by id', async () => {
    withFilters([makeFilter()], null);
    const user = userEvent.setup();
    renderWithProviders(<NotificationFiltersPage />);

    await user.click(screen.getByRole('button', { name: 'Edit Dubstep' }));
    const form = screen.getByRole('form', { name: 'Edit Dubstep' });
    expect(within(form).getByLabelText(/^label/i)).toHaveValue('Dubstep');
    expect(within(form).getByText('Removed artist #9')).toBeInTheDocument();
    expect(
      within(form).getByRole('checkbox', { name: 'Unavailable community #99' })
    ).toBeChecked();

    await user.click(within(form).getByRole('button', { name: 'Save filter' }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 12,
          label: 'Dubstep',
          artistIds: [4, 9],
          communityIds: [1, 99],
          bitrates: ['Lossless'],
          fromYear: 2005,
          toYear: null,
          newReleasesOnly: true
        })
      )
    );
    expect(mockUpdate.mock.calls[0][0]).not.toHaveProperty('artists');
  });

  it('creates a filter from the ticked criteria', async () => {
    withFilters([], 5);
    const user = userEvent.setup();
    const { store } = renderWithProviders(<NotificationFiltersPage />);

    await user.click(screen.getByRole('button', { name: 'New filter' }));
    const form = screen.getByRole('form', { name: 'New filter' });
    await user.type(within(form).getByLabelText(/^label/i), '  Jazz CDs ');
    await user.click(within(form).getByRole('checkbox', { name: 'Jazz' }));
    await user.click(within(form).getByRole('checkbox', { name: 'CD' }));
    await user.type(within(form).getByLabelText('To year'), '1970');
    await user.click(
      within(form).getByRole('button', { name: 'Create filter' })
    );

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Jazz CDs',
          artistIds: [],
          communityIds: [1],
          media: ['CD'],
          fromYear: null,
          toYear: 1970
        })
      )
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('form', { name: 'New filter' })
      ).not.toBeInTheDocument()
    );
    expect(store.getState().alert[0]).toMatchObject({
      msg: 'Filter created.',
      alertType: 'success'
    });
  });

  it('keeps the form open and says why when the api refuses', async () => {
    withFilters([], 5);
    mockCreate.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 400,
          data: { msg: 'A filter must set something' }
        })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<NotificationFiltersPage />);

    await user.click(screen.getByRole('button', { name: 'New filter' }));
    const form = screen.getByRole('form', { name: 'New filter' });
    await user.type(within(form).getByLabelText(/^label/i), 'Empty');
    await user.click(
      within(form).getByRole('button', { name: 'Create filter' })
    );

    await waitFor(() =>
      expect(store.getState().alert[0]).toMatchObject({
        msg: 'A filter must set something',
        alertType: 'danger'
      })
    );
    expect(
      screen.getByRole('form', { name: 'New filter' })
    ).toBeInTheDocument();
  });
});
