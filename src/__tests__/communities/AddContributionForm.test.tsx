import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import AddContributionForm from '../../components/communities/AddContributionForm';

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ communityId: '3', releaseId: '7' }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const mockNavigate = jest.fn();
const mockAddContribution = jest.fn();
const mockDispatch = jest.fn();

let mockRelease:
  | { id: number; title: string; artist?: { name: string } }
  | undefined = {
  id: 7,
  title: 'Kind of Blue',
  artist: { name: 'Miles Davis' }
};
let mockReleaseLoading = false;
let mockMutationIsLoading = false;

jest.mock('../../store/services/communityApi', () => ({
  useGetReleaseByIdQuery: () => ({
    data: mockRelease,
    isLoading: mockReleaseLoading
  }),
  useAddContributionToReleaseMutation: () => [
    mockAddContribution,
    { isLoading: mockMutationIsLoading }
  ]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

describe('AddContributionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRelease = {
      id: 7,
      title: 'Kind of Blue',
      artist: { name: 'Miles Davis' }
    };
    mockReleaseLoading = false;
    mockMutationIsLoading = false;
    mockAddContribution.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows spinner when release is loading', () => {
    mockReleaseLoading = true;
    mockRelease = undefined;
    renderWithProviders(<AddContributionForm />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error when release is not found', () => {
    mockRelease = undefined;
    renderWithProviders(<AddContributionForm />);
    expect(screen.getByText(/release not found/i)).toBeInTheDocument();
  });

  it('renders release title in breadcrumb link', () => {
    renderWithProviders(<AddContributionForm />);
    expect(
      screen.getByRole('link', { name: 'Kind of Blue' })
    ).toBeInTheDocument();
  });

  it('renders file type select, download URL, file size, and notes fields', () => {
    renderWithProviders(<AddContributionForm />);
    expect(screen.getByLabelText(/file type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/download url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('shows audio-specific rip fields when file type is mp3 (default)', () => {
    renderWithProviders(<AddContributionForm />);
    expect(screen.getByLabelText(/bitrate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/media/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/has log/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/has cue/i)).toBeInTheDocument();
  });

  it('hides rip fields when non-audio file type is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddContributionForm />);
    await user.selectOptions(screen.getByLabelText(/file type/i), 'pdf');
    expect(screen.queryByLabelText(/bitrate/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/has log/i)).not.toBeInTheDocument();
  });

  it('calls addContribution with correct payload on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddContributionForm />);
    await user.type(
      screen.getByLabelText(/download url/i),
      'https://example.com/file.flac'
    );
    await user.type(screen.getByLabelText(/file size/i), '85');
    await user.click(screen.getByRole('button', { name: /add contribution/i }));
    await waitFor(() => {
      expect(mockAddContribution).toHaveBeenCalledWith(
        expect.objectContaining({
          communityId: 3,
          releaseId: 7,
          fileType: 'mp3',
          downloadUrl: 'https://example.com/file.flac',
          sizeInBytes: expect.any(Number)
        })
      );
    });
  });

  it('navigates to release page after successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddContributionForm />);
    await user.type(
      screen.getByLabelText(/download url/i),
      'https://example.com/file.flac'
    );
    await user.click(screen.getByRole('button', { name: /add contribution/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/private/communities/3/releases/7'
      );
    });
  });

  it('submits with all audio rip fields filled in', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddContributionForm />);

    await user.type(screen.getByLabelText(/download url/i), 'https://example.com/file.flac');
    await user.clear(screen.getByLabelText(/file size/i));
    await user.type(screen.getByLabelText(/file size/i), '500');
    await user.type(screen.getByLabelText(/bitrate/i), '320');
    await user.type(screen.getByLabelText(/media/i), 'CD');
    await user.click(screen.getByLabelText(/has log/i));
    await user.click(screen.getByLabelText(/has cue/i));
    await user.click(screen.getByLabelText(/scene release/i));
    await user.type(screen.getByLabelText(/notes/i), 'Perfect rip');

    await user.click(screen.getByRole('button', { name: /add contribution/i }));

    await waitFor(() => {
      expect(mockAddContribution).toHaveBeenCalledWith(
        expect.objectContaining({
          communityId: 3,
          releaseId: 7,
          bitrate: '320',
          media: 'CD',
          hasLog: true,
          hasCue: true,
          isScene: true,
          releaseDescription: 'Perfect rip'
        })
      );
    });
  });

  it('dispatches danger alert with API message on failure', async () => {
    mockAddContribution.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Duplicate format.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<AddContributionForm />);
    await user.type(
      screen.getByLabelText(/download url/i),
      'https://example.com/file.flac'
    );
    await user.click(screen.getByRole('button', { name: /add contribution/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Duplicate format.',
            alertType: 'danger'
          })
        })
      );
    });
  });

  it('shows "Adding…" label when mutation is loading', () => {
    mockMutationIsLoading = true;
    renderWithProviders(<AddContributionForm />);
    expect(screen.getByRole('button', { name: /adding…/i })).toBeInTheDocument();
  });

  it('dispatches fallback error message when rejection has no API message', async () => {
    mockAddContribution.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<AddContributionForm />);
    await user.type(
      screen.getByLabelText(/download url/i),
      'https://example.com/file.flac'
    );
    await user.click(screen.getByRole('button', { name: /add contribution/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Failed to add contribution.',
            alertType: 'danger'
          })
        })
      );
    });
  });
});
