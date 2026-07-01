import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import CreateRequestForm from '../../components/requests/CreateRequestForm';

const mockUseGetCommunitiesQuery = jest.fn();
const mockCreateRequest = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: (...args: unknown[]) =>
    mockUseGetCommunitiesQuery(...args)
}));

jest.mock('../../store/services/requestApi', () => ({
  useCreateRequestMutation: () => [mockCreateRequest, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('CreateRequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: {
        data: [
          { id: 1, name: 'Main' },
          { id: 2, name: 'Jazz' }
        ]
      }
    });
    mockCreateRequest.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 55 })
    });
  });

  it('emits the data-st theming hooks', () => {
    const { container } = renderWithProviders(<CreateRequestForm />);
    expect(container.querySelector('input[data-st="field"]')).toBeTruthy();
    expect(container.querySelector('select[data-st="field"]')).toBeTruthy();
    expect(
      container.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeTruthy();
  });

  it('blocks invalid input before calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateRequestForm />);

    await user.type(screen.getByLabelText(/^year/i), '1800');
    await user.type(screen.getByLabelText(/bounty/i), '12');
    fireEvent.submit(
      screen.getByRole('button', { name: /create request/i }).closest('form')!
    );

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('Community is required')).toBeInTheDocument();
      expect(
        screen.getByText(/minimum bounty is 100 mib/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/year must be between 1900 and 2100/i)
      ).toBeInTheDocument();
    });
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });

  it('submits a valid request, trims values, and raises a success alert', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<CreateRequestForm />, { store });

    await user.type(screen.getByLabelText(/^title$/i), '  Giant Steps  ');
    await user.type(
      screen.getByLabelText(/description/i),
      '  Looking for a clean copy of this album.  '
    );
    await user.selectOptions(screen.getByLabelText(/community/i), '2');
    await user.type(screen.getByLabelText(/^year/i), '1960');
    await user.type(screen.getByLabelText(/bounty/i), '104857600');
    await user.type(screen.getByLabelText(/cover image url/i), 'https://img');
    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        title: 'Giant Steps',
        description: 'Looking for a clean copy of this album.',
        communityId: 2,
        type: 'Music',
        bounty: '104857600',
        year: 1960,
        image: 'https://img'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/requests/55');
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Request created.')).toBe(true);
    });
  });

  it('surfaces backend creation errors', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockCreateRequest.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'Insufficient upload balance' } })
    });

    renderWithProviders(<CreateRequestForm />, { store });

    await user.type(screen.getByLabelText(/^title$/i), 'Request');
    await user.type(screen.getByLabelText(/description/i), 'Need this release');
    await user.selectOptions(screen.getByLabelText(/community/i), '1');
    await user.type(screen.getByLabelText(/bounty/i), '104857600');
    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Insufficient upload balance')).toBe(
        true
      );
    });
  });
});
