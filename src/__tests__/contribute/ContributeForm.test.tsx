import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ContributeForm from '../../components/contribute/ContributeForm';

const mockGetCommunitiesQuery = jest.fn();
const mockCreateContribution = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: (...args: unknown[]) =>
    mockGetCommunitiesQuery(...args),
  useCreateContributionMutation: () => [
    mockCreateContribution,
    { isLoading: false }
  ]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({
    id: 1,
    username: 'testuser',
    avatar: null,
    userRank: { level: 100, name: 'User', color: '#fff' }
  }),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({
    to,
    children
  }: {
    to: string;
    children: React.ReactNode;
  }) => <a href={to}>{children}</a>
}));

const communities = [
  { id: 1, name: 'Jazz Community' },
  { id: 2, name: 'Rock Community' }
];

describe('ContributeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: communities },
      isLoading: false
    });
    mockCreateContribution.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 42 })
    });
  });

  it('shows spinner while communities are loading', () => {
    mockGetCommunitiesQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<ContributeForm />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders community dropdown with options', () => {
    renderWithProviders(<ContributeForm />);
    expect(
      screen.getByRole('combobox', { name: /community/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Jazz Community' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Rock Community' })).toBeInTheDocument();
  });

  it('renders all key fields by default (Music type)', () => {
    renderWithProviders(<ContributeForm />);
    expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/album title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/download url/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/artist name/i)).toBeInTheDocument();
  });

  it('shows release description field for Music type', () => {
    renderWithProviders(<ContributeForm />);
    expect(screen.getByLabelText(/release description/i)).toBeInTheDocument();
  });

  it('switches to Creator label and Description textarea on non-Music type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.selectOptions(
      screen.getByLabelText(/content type/i),
      'EBooks'
    );
    expect(screen.getByPlaceholderText(/creator name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/release description/i)).not.toBeInTheDocument();
  });

  it('can add a second collaborator row', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.click(screen.getByRole('button', { name: /add artist/i }));
    expect(screen.getAllByPlaceholderText(/artist name/i).length).toBe(2);
  });

  it('can remove a collaborator row (not the first)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.click(screen.getByRole('button', { name: /add artist/i }));
    const removeBtn = screen.getByRole('button', { name: '✕' });
    await user.click(removeBtn);
    expect(screen.getAllByPlaceholderText(/artist name/i).length).toBe(1);
  });

  it('submits with correct payload for Music type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);

    await user.selectOptions(
      screen.getByLabelText(/community/i),
      'Jazz Community'
    );
    await user.type(screen.getByPlaceholderText(/artist name/i), 'Miles Davis');
    await user.clear(screen.getByLabelText(/album title/i));
    await user.type(screen.getByLabelText(/album title/i), 'Kind of Blue');
    await user.clear(screen.getByLabelText(/year/i));
    await user.type(screen.getByLabelText(/year/i), '1959');
    await user.type(screen.getByLabelText(/file size/i), '500');
    await user.type(
      screen.getByLabelText(/download url/i),
      'https://example.com/kob.flac'
    );

    await user.click(
      screen.getByRole('button', { name: /contribute release/i })
    );

    await waitFor(() => {
      expect(mockCreateContribution).toHaveBeenCalledWith(
        expect.objectContaining({
          communityId: 1,
          title: 'Kind of Blue',
          type: 'Music',
          downloadUrl: 'https://example.com/kob.flac',
          collaborators: expect.arrayContaining([
            expect.objectContaining({ artist: 'Miles Davis' })
          ])
        })
      );
    });
  });

  it('navigates to /private/contribute/list on successful submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);

    await user.selectOptions(screen.getByLabelText(/community/i), 'Jazz Community');
    await user.type(screen.getByPlaceholderText(/artist name/i), 'Artist');
    await user.type(screen.getByLabelText(/album title/i), 'Album');
    await user.type(screen.getByLabelText(/file size/i), '100');
    await user.type(screen.getByLabelText(/download url/i), 'https://example.com/a.flac');
    await user.click(screen.getByRole('button', { name: /contribute release/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private/contribute/list');
    });
  });

  it('dispatches danger alert on submit failure', async () => {
    mockCreateContribution.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Duplicate contribution.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);

    await user.selectOptions(screen.getByLabelText(/community/i), 'Jazz Community');
    await user.type(screen.getByPlaceholderText(/artist name/i), 'Artist');
    await user.type(screen.getByLabelText(/album title/i), 'Album');
    await user.type(screen.getByLabelText(/file size/i), '100');
    await user.type(screen.getByLabelText(/download url/i), 'https://example.com/a.flac');
    await user.click(screen.getByRole('button', { name: /contribute release/i }));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('navigates back on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows submit request link when community not found', () => {
    renderWithProviders(<ContributeForm />);
    expect(
      screen.getByRole('link', { name: /submit a request/i })
    ).toBeInTheDocument();
  });
});
