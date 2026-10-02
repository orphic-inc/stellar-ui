import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useAnswerLeaderOfferMutation,
  useOfferCommunityLeadershipMutation,
  useWithdrawLeaderOfferMutation
} from '../../store/services/communityApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDate } from '../../utils';
import type { Community } from '../../types';

type Offer = NonNullable<Community['leaderOffer']>;

/**
 * A community's leadership handoff (stellar-api#896, ADR-0053). The leader
 * offers leadership to a curator and can withdraw it; the named successor
 * accepts or declines. The api sends `leaderOffer` only to the leader, the
 * successor and staff, and only while it is live, so everyone else sees
 * nothing here.
 */
const LeaderOfferPanel = ({
  community,
  userId,
  leaderName
}: {
  community: Community;
  userId: number | undefined;
  leaderName: string;
}) => {
  const body = viewFor(community, userId, leaderName);
  if (!body) return null;
  return (
    <div data-st="panel" className="mb-4">
      <div data-st="colhead">
        <span>Leadership</span>
      </div>
      <div className="px-4 py-3 text-sm">{body}</div>
    </div>
  );
};

/** Which part of the handoff this viewer acts on, if any. */
const viewFor = (
  community: Community,
  userId: number | undefined,
  leaderName: string
) => {
  const offer = community.leaderOffer ?? null;
  if (offer && offer.to.id === userId)
    return (
      <SuccessorView
        communityId={community.id}
        offer={offer}
        leaderName={leaderName}
      />
    );
  if (userId == null || community.leaderId !== userId)
    return offer && <PendingOffer communityId={community.id} offer={offer} />;
  return offer ? (
    <PendingOffer communityId={community.id} offer={offer} canWithdraw />
  ) : (
    <OfferForm community={community} />
  );
};

/** Say a refused write rather than drop it (stellar-ui#456). */
const useFailAlert = () => {
  const dispatch = useDispatch();
  return (err: unknown, fallback: string) =>
    dispatch(addAlert(getApiErrorMessage(err) ?? fallback, 'danger'));
};

const SuccessorView = ({
  communityId,
  offer,
  leaderName
}: {
  communityId: number;
  offer: Offer;
  leaderName: string;
}) => {
  const dispatch = useDispatch();
  const fail = useFailAlert();
  const [answerOffer, { isLoading }] = useAnswerLeaderOfferMutation();

  const answer = async (choice: 'accept' | 'decline') => {
    if (
      choice === 'accept' &&
      !window.confirm('Become the leader of this community?')
    )
      return;
    try {
      await answerOffer({ communityId, answer: choice }).unwrap();
      dispatch(
        addAlert(
          choice === 'accept'
            ? 'You now lead this community.'
            : 'Offer declined.',
          'success'
        )
      );
    } catch (err) {
      fail(err, `Failed to ${choice} the offer.`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span data-st="meta">
        {leaderName} offered you leadership of this community on{' '}
        {formatDate(offer.offeredAt)}.
      </span>
      <button
        type="button"
        data-st="control"
        data-st-primary
        disabled={isLoading}
        onClick={() => answer('accept')}
      >
        Accept
      </button>
      <button
        type="button"
        data-st="control"
        disabled={isLoading}
        onClick={() => answer('decline')}
      >
        Decline
      </button>
    </div>
  );
};

const PendingOffer = ({
  communityId,
  offer,
  canWithdraw = false
}: {
  communityId: number;
  offer: Offer;
  canWithdraw?: boolean;
}) => {
  const fail = useFailAlert();
  const [withdraw, { isLoading }] = useWithdrawLeaderOfferMutation();

  const handleWithdraw = async () => {
    try {
      await withdraw(communityId).unwrap();
    } catch (err) {
      fail(err, 'Failed to withdraw the offer.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span data-st="meta">
        Leadership offered to {offer.to.username} on{' '}
        {formatDate(offer.offeredAt)}, awaiting their answer. It lapses after 7
        days.
      </span>
      {canWithdraw && (
        <button
          type="button"
          data-st="control"
          disabled={isLoading}
          onClick={handleWithdraw}
        >
          Withdraw
        </button>
      )}
    </div>
  );
};

/** Only a current curator can be offered leadership (ADR-0053 §4). */
const OfferForm = ({ community }: { community: Community }) => {
  const fail = useFailAlert();
  const [offerLeadership, { isLoading }] =
    useOfferCommunityLeadershipMutation();
  const candidates = (community.curators ?? []).filter(
    (c) => c.id !== community.leaderId
  );
  const [targetId, setTargetId] = useState('');

  if (candidates.length === 0)
    return (
      <span data-st="meta">
        To hand off leadership, make a member a curator first.
      </span>
    );

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = candidates.find((c) => String(c.id) === targetId);
    if (
      !target ||
      !window.confirm(
        `Offer leadership to ${target.username}? You stay leader until they accept.`
      )
    )
      return;
    try {
      await offerLeadership({
        communityId: community.id,
        userId: target.id
      }).unwrap();
      setTargetId('');
    } catch (err) {
      fail(err, 'Failed to offer leadership.');
    }
  };

  return (
    <form onSubmit={handleOffer} className="flex flex-wrap items-center gap-2">
      <label htmlFor="leader-offer-target" data-st="meta">
        Hand off leadership to
      </label>
      <select
        id="leader-offer-target"
        data-st="field"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
      >
        <option value="">Choose a curator…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.username}
          </option>
        ))}
      </select>
      <button
        type="submit"
        data-st="control"
        data-st-primary
        disabled={isLoading || !targetId}
      >
        Offer leadership
      </button>
    </form>
  );
};

export default LeaderOfferPanel;
