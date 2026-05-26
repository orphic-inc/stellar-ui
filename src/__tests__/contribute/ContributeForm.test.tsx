import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ContributeForm from '../../components/contribute/ContributeForm';

const mockGetCommunitiesQuery = jest.fn();
const mockCreateContribution = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

let mockIsSubmitting = false;
let mockUser: {
  id: number;
  username: string;
  avatar: null;
  userRank: { level: number; name: string; color: string };
} | null = null;

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: (...args: unknown[]) =>
    mockGetCommunitiesQuery(...args),
  useCreateContributionMutation: () => [
    mockCreateContribution,
    { isLoading: mockIsSubmitting }
  ],
  useGetDncListQuery: () => ({ data: undefined })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockUser,
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const communities = [
  { id: 1, name: 'Jazz Community' },
  { id: 2, name: 'Rock Community' }
];

const fillMusicForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(
    screen.getByLabelText(/community/i),
    'Jazz Community'
  );
  fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
    target: { value: 'Miles Davis' }
  });
  fireEvent.change(screen.getByLabelText(/album title/i), {
    target: { value: 'Kind of Blue' }
  });
  fireEvent.change(screen.getByLabelText(/year/i), {
    target: { value: '1959' }
  });
  fireEvent.change(screen.getByLabelText(/file size/i), {
    target: { value: '500' }
  });
  fireEvent.change(screen.getByLabelText(/download url/i), {
    target: { value: 'https://example.com/kob.flac' }
  });
};

describe('ContributeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSubmitting = false;
    mockUser = {
      id: 1,
      username: 'testuser',
      avatar: null,
      userRank: { level: 100, name: 'User', color: '#fff' }
    };
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
    expect(
      screen.getByRole('option', { name: 'Jazz Community' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Rock Community' })
    ).toBeInTheDocument();
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
    await user.selectOptions(screen.getByLabelText(/content type/i), 'EBooks');
    expect(screen.getByPlaceholderText(/creator name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/release description/i)
    ).not.toBeInTheDocument();
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

    await fillMusicForm(user);

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

    await user.selectOptions(
      screen.getByLabelText(/community/i),
      'Jazz Community'
    );
    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: 'Artist' }
    });
    fireEvent.change(screen.getByLabelText(/album title/i), {
      target: { value: 'Album' }
    });
    fireEvent.change(screen.getByLabelText(/file size/i), {
      target: { value: '100' }
    });
    fireEvent.change(screen.getByLabelText(/download url/i), {
      target: { value: 'https://example.com/a.flac' }
    });
    await user.click(
      screen.getByRole('button', { name: /contribute release/i })
    );

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

    await user.selectOptions(
      screen.getByLabelText(/community/i),
      'Jazz Community'
    );
    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: 'Artist' }
    });
    fireEvent.change(screen.getByLabelText(/album title/i), {
      target: { value: 'Album' }
    });
    fireEvent.change(screen.getByLabelText(/file size/i), {
      target: { value: '100' }
    });
    fireEvent.change(screen.getByLabelText(/download url/i), {
      target: { value: 'https://example.com/a.flac' }
    });
    await user.click(
      screen.getByRole('button', { name: /contribute release/i })
    );

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

  it('changes collaborator importance select and file type select', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.selectOptions(
      screen.getByDisplayValue('Main artist'),
      'Remixer'
    );
    await user.selectOptions(screen.getByLabelText(/file type/i), 'flac');
    expect(
      (screen.getByDisplayValue('Remixer') as HTMLSelectElement).value
    ).toBe('Remixer');
  });

  it('types in tags, image, and release description fields', async () => {
    renderWithProviders(<ContributeForm />);
    fireEvent.change(screen.getByLabelText(/tags/i), {
      target: { value: 'jazz, blues' }
    });
    fireEvent.change(screen.getByLabelText(/cover image url/i), {
      target: { value: 'https://img.example.com/cover.jpg' }
    });
    fireEvent.change(screen.getByLabelText(/release description/i), {
      target: { value: '24-bit remaster' }
    });
    expect((screen.getByLabelText(/tags/i) as HTMLInputElement).value).toBe(
      'jazz, blues'
    );
  });

  it('types in description textarea after switching to non-Music type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.selectOptions(screen.getByLabelText(/content type/i), 'EBooks');
    await user.type(screen.getByLabelText(/^description/i), 'A great ebook.');
    expect(
      (screen.getByLabelText(/^description/i) as HTMLTextAreaElement).value
    ).toBe('A great ebook.');
  });

  it('submits EBooks type and covers non-Music title, undefined sizeInBytes, and undefined releaseDescription', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.selectOptions(screen.getByLabelText(/content type/i), 'EBooks');
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      expect(mockCreateContribution).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'EBooks',
          sizeInBytes: undefined,
          releaseDescription: undefined
        })
      );
    });
  });

  it('does not submit when user is null', () => {
    mockUser = null;
    renderWithProviders(<ContributeForm />);
    fireEvent.submit(document.querySelector('form')!);
    expect(mockCreateContribution).not.toHaveBeenCalled();
  });

  it('dispatches fallback danger alert when submit fails with no API message', async () => {
    mockCreateContribution.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.selectOptions(
      screen.getByLabelText(/community/i),
      'Jazz Community'
    );
    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: 'Artist' }
    });
    fireEvent.change(screen.getByLabelText(/album title/i), {
      target: { value: 'Album' }
    });
    fireEvent.change(screen.getByLabelText(/file size/i), {
      target: { value: '100' }
    });
    fireEvent.change(screen.getByLabelText(/download url/i), {
      target: { value: 'https://example.com/a.flac' }
    });
    await user.click(
      screen.getByRole('button', { name: /contribute release/i })
    );
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Failed to submit contribution. Please try again.'
          })
        })
      );
    });
  });

  it('types in title field for non-Music type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContributeForm />);
    await user.selectOptions(screen.getByLabelText(/content type/i), 'EBooks');
    const titleInput = screen.getByLabelText(/title \*/i);
    await user.type(titleInput, 'My EBook');
    expect((titleInput as HTMLInputElement).value).toBe('My EBook');
  });

  it('shows Submitting… when isLoading is true', () => {
    mockIsSubmitting = true;
    renderWithProviders(<ContributeForm />);
    expect(
      screen.getByRole('button', { name: /submitting…/i })
    ).toBeInTheDocument();
  });

  it('shows submit request link when community not found', () => {
    renderWithProviders(<ContributeForm />);
    expect(
      screen.getByRole('link', { name: /submit a request/i })
    ).toBeInTheDocument();
  });
});
