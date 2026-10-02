import { useGetCommunityByIdQuery } from '../../store/services/communityApi';
import { formatDate } from '../../utils';

/**
 * A community's pending leadership handoff, for staff editing it in Community
 * Manager (stellar-api#896, ADR-0053 §8). The list carries no offer, so this
 * reads the community's detail. A changed leader cancels the offer api-side.
 */
const PendingLeaderOffer = ({ communityId }: { communityId: number }) => {
  const { data } = useGetCommunityByIdQuery(communityId);
  const offer = data?.leaderOffer;
  if (!offer) return null;
  return (
    <p data-st="meta" className="text-sm">
      {`Leadership offered to ${offer.to.username} on ${formatDate(offer.offeredAt)}, awaiting their answer. Changing the leader here cancels the offer.`}
    </p>
  );
};

export default PendingLeaderOffer;
