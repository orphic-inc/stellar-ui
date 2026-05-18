import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankFormPage from '../../components/admin/UserRankFormPage';

const mockGetUserRankByIdQuery = jest.fn();
const mockCreateUserRank = jest.fn();
const mockUpdateUserRank = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockUseParams = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetUserRankByIdQuery: (...args: unknown[]) =>
    mockGetUserRankByIdQuery(...args),
  useCreateUserRankMutation: () => [mockCreateUserRank],
  useUpdateUserRankMutation: () => [mockUpdateUserRank]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

describe('UserRankFormPage — create mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: undefined });
    mockGetUserRankByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    mockCreateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders "New User Rank" heading and Create button', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByText(/new user rank/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^create$/i })
    ).toBeInTheDocument();
  });

  it('shows Name and Level fields', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^level$/i)).toBeInTheDocument();
  });

  it('shows permission checkboxes', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByText(/forums read/i)).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('calls createUserRank with form data and navigates on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'Veteran');
    await user.clear(screen.getByLabelText(/^level$/i));
    await user.type(screen.getByLabelText(/^level$/i), '300');
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() => {
      expect(mockCreateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Veteran' })
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/private/staff/tools/user-ranks'
      );
    });
  });

  it('dispatches danger alert on create failure', async () => {
    mockCreateUserRank.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'Broken');
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });
});

describe('UserRankFormPage — edit mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '3' });
    mockGetUserRankByIdQuery.mockReturnValue({
      data: {
        id: 3,
        level: 500,
        name: 'Staff',
        permissions: { staff: true, forums_moderate: true }
      },
      isLoading: false
    });
    mockUpdateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders "Edit User Rank" heading and Save Changes button', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByText(/edit user rank/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save changes/i })
    ).toBeInTheDocument();
  });

  it('prefills name and level from existing rank', async () => {
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() => {
      expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
        'Staff'
      );
    });
  });

  it('calls updateUserRank and navigates on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
        'Staff'
      )
    );
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(mockUpdateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3 })
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/private/staff/tools/user-ranks'
      );
    });
  });
});
