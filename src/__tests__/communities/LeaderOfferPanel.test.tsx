import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import LeaderOfferPanel from '../../components/communities/LeaderOfferPanel';
import type { Community } from '../../types';

// Triggers return `{ unwrap }`, as RTK's do: a bare promise would make the
// component's `.unwrap()` throw into its own catch and pass a success test for
// the wrong reason.
const mockOffer = jest.fn();
const mockWithdraw = jest.fn();
const mockAnswer = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useOfferCommunityLeadershipMutation: () => [mockOffer, { isLoading: false }],
  useWithdrawLeaderOfferMutation: () => [mockWithdraw, { isLoading: false }],
  useAnswerLeaderOfferMutation: () => [mockAnswer, { isLoading: false }]
}));

const ok = () => ({ unwrap: () => Promise.resolve(undefined) });
const refused = (msg: string) => ({
  unwrap: () => Promise.reject({ status: 409, data: { msg } })
});

const makeCommunity = (overrides: Partial<Community> = {}): Community =>
  ({
    id: 3,
    name: 'Jazz Vault',
    type: 'Music',
    registrationStatus: 'open',
    allowDuplicateFormats: true,
    leaderId: 1,
    curators: [
      { id: 1, username: 'lead' },
      { id: 2, username: 'heir' }
    ],
    leaderOffer: null,
    ...overrides
  }) as Community;

const pending = {
  to: { id: 2, username: 'heir' },
  offeredAt: '2026-10-01T00:00:00.000Z'
};

const renderFor = (userId: number, community = makeCommunity()) =>
  renderWithProviders(
    <LeaderOfferPanel community={community} userId={userId} leaderName="lead" />
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => jest.restoreAllMocks());

describe('the leader', () => {
  it('offers leadership to a curator, never to themselves', async () => {
    mockOffer.mockReturnValue(ok());
    const { store } = renderFor(1);

    const select = screen.getByLabelText(/hand off leadership to/i);
    expect(
      screen.queryByRole('option', { name: 'lead' })
    ).not.toBeInTheDocument();
    await userEvent.selectOptions(select, 'heir');
    await userEvent.click(
      screen.getByRole('button', { name: /offer leadership/i })
    );

    expect(mockOffer).toHaveBeenCalledWith({ communityId: 3, userId: 2 });
    expect(store.getState().alert).toEqual([]);
  });

  it('sends nothing when the confirm is cancelled', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderFor(1);

    await userEvent.selectOptions(
      screen.getByLabelText(/hand off leadership to/i),
      'heir'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /offer leadership/i })
    );

    expect(mockOffer).not.toHaveBeenCalled();
  });

  it("says the api's reason when an offer is refused", async () => {
    mockOffer.mockReturnValue(
      refused('Leadership can be offered only to a current curator')
    );
    const { store } = renderFor(1);

    await userEvent.selectOptions(
      screen.getByLabelText(/hand off leadership to/i),
      'heir'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /offer leadership/i })
    );

    expect(store.getState().alert).toEqual([
      expect.objectContaining({
        alertType: 'danger',
        msg: 'Leadership can be offered only to a current curator'
      })
    ]);
  });

  it('asks for a curator first when there is no one to offer to', () => {
    renderFor(1, makeCommunity({ curators: [{ id: 1, username: 'lead' }] }));

    expect(screen.getByText(/make a member a curator first/i)).toBeVisible();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('sees a pending offer and withdraws it', async () => {
    mockWithdraw.mockReturnValue(ok());
    const { store } = renderFor(1, makeCommunity({ leaderOffer: pending }));

    expect(screen.getByText(/leadership offered to heir/i)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

    expect(mockWithdraw).toHaveBeenCalledWith(3);
    expect(store.getState().alert).toEqual([]);
  });
});

describe('the successor', () => {
  it('accepts', async () => {
    mockAnswer.mockReturnValue(ok());
    const { store } = renderFor(2, makeCommunity({ leaderOffer: pending }));

    expect(
      screen.getByText(/lead offered you leadership of this community/i)
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /accept/i }));

    expect(mockAnswer).toHaveBeenCalledWith({
      communityId: 3,
      answer: 'accept'
    });
    expect(store.getState().alert).toEqual([
      expect.objectContaining({ alertType: 'success' })
    ]);
  });

  it('declines without a confirm', async () => {
    const confirm = jest.spyOn(window, 'confirm');
    mockAnswer.mockReturnValue(ok());
    renderFor(2, makeCommunity({ leaderOffer: pending }));

    await userEvent.click(screen.getByRole('button', { name: /decline/i }));

    expect(confirm).not.toHaveBeenCalled();
    expect(mockAnswer).toHaveBeenCalledWith({
      communityId: 3,
      answer: 'decline'
    });
  });

  it('is told when the offer has lapsed', async () => {
    mockAnswer.mockReturnValue(refused('No pending leadership offer to you'));
    const { store } = renderFor(2, makeCommunity({ leaderOffer: pending }));

    await userEvent.click(screen.getByRole('button', { name: /accept/i }));

    expect(store.getState().alert).toEqual([
      expect.objectContaining({
        alertType: 'danger',
        msg: 'No pending leadership offer to you'
      })
    ]);
  });
});

describe('anyone else', () => {
  it('sees the offer read-only when the api sends it (staff)', () => {
    renderFor(9, makeCommunity({ leaderOffer: pending }));

    expect(screen.getByText(/leadership offered to heir/i)).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sees nothing without an offer', () => {
    const { container } = renderFor(9);

    expect(container).toBeEmptyDOMElement();
  });
});
