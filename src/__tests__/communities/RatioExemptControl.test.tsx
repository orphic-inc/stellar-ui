import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import RatioExemptControl from '../../components/communities/RatioExemptControl';
import type { AuthUser, ReleaseContributionDetail } from '../../types';

const mockSetRatioExempt = jest.fn();
const mockDispatch = jest.fn();
let mockUser: AuthUser | null = null;
let mockIsLoading = false;

jest.mock('../../store/services/ratioExemptApi', () => ({
  useSetContributionRatioExemptMutation: () => [
    mockSetRatioExempt,
    { isLoading: mockIsLoading }
  ]
}));
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockUser,
  useDispatch: () => mockDispatch
}));

/** An RTK mutation trigger resolving (or rejecting) with `result`. */
const trigger = (result: unknown, fails = false) => ({
  unwrap: () => (fails ? Promise.reject(result) : Promise.resolve(result))
});

const userWith = (permissions: Record<string, boolean>) =>
  ({
    id: 7,
    username: 'me',
    userRank: { level: 100, name: 'Staff', color: '', permissions }
  }) as unknown as AuthUser;

const STAFF = userWith({ contributions_manage: true });

const flac = {
  id: 5,
  releaseId: 3,
  type: 'flac',
  ratioExempt: 'NONE'
} as ReleaseContributionDetail;

const control = () =>
  screen.getByRole('combobox', { name: 'Ratio exemption for FLAC' });

beforeEach(() => {
  mockUser = STAFF;
  mockIsLoading = false;
});

describe('RatioExemptControl', () => {
  it('renders nothing without contributions_manage', () => {
    mockUser = userWith({ staff: true, communities_manage: true });
    const { container } = renderWithProviders(
      <RatioExemptControl contribution={flac} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a signed-out viewer', () => {
    mockUser = null;
    const { container } = renderWithProviders(
      <RatioExemptControl contribution={flac} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['contributions_manage', { contributions_manage: true }],
    ['admin', { admin: true }]
  ])('shows the saved value to %s', (_name, permissions) => {
    mockUser = userWith(permissions);
    renderWithProviders(
      <RatioExemptControl contribution={{ ...flac, ratioExempt: 'FREEPASS' }} />
    );
    expect(control()).toHaveValue('FREEPASS');
  });

  it('applies a change at once, naming the contribution and its release', async () => {
    mockSetRatioExempt.mockReturnValue(
      trigger({ id: 5, ratioExempt: 'NEUTRALPASS' })
    );
    renderWithProviders(<RatioExemptControl contribution={flac} />);

    await userEvent.selectOptions(control(), 'NEUTRALPASS');

    expect(mockSetRatioExempt).toHaveBeenCalledWith({
      contributionId: 5,
      releaseId: 3,
      ratioExempt: 'NEUTRALPASS'
    });
    expect(control()).toHaveValue('NEUTRALPASS');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('is disabled while a change is in flight', () => {
    mockIsLoading = true;
    renderWithProviders(<RatioExemptControl contribution={flac} />);
    expect(control()).toBeDisabled();
  });

  it('alerts and returns to the saved value when the change fails', async () => {
    mockSetRatioExempt.mockReturnValue(
      trigger({ status: 404, data: { msg: 'Contribution not found' } }, true)
    );
    renderWithProviders(<RatioExemptControl contribution={flac} />);

    await userEvent.selectOptions(control(), 'FREEPASS');

    await waitFor(() => expect(control()).toHaveValue('NONE'));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Contribution not found',
          alertType: 'danger'
        })
      })
    );
  });

  it('lets the refetched row supersede the value it chose', async () => {
    mockSetRatioExempt.mockReturnValue(
      trigger({ id: 5, ratioExempt: 'NEUTRALPASS' })
    );
    // Plain `render`: its `rerender` keeps this instance and its pending
    // state, where renderWithProviders' would remount it. The hooks are mocked,
    // so no provider is needed.
    const { rerender } = render(<RatioExemptControl contribution={flac} />);
    await userEvent.selectOptions(control(), 'NEUTRALPASS');
    expect(control()).toHaveValue('NEUTRALPASS');

    // Another member of staff changed it again before the refetch landed.
    rerender(
      <RatioExemptControl contribution={{ ...flac, ratioExempt: 'FREEPASS' }} />
    );
    expect(control()).toHaveValue('FREEPASS');
  });
});
