import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { formatDate } from '../../utils';
import type { AuthorRef, DonorRankRef } from '../../types';

interface UserBadgesProps {
  /** Whose name this is: on the viewer's own, the warning sign says when it ends. */
  userId?: number;
  disabled?: boolean | null;
  warned?: string | boolean | null;
  /**
   * The active donor tier, and the only donor input: `isDonor` can lag an
   * expired grant until the hourly sweep, so it is not read here (#103).
   */
  donorRank?: DonorRankRef | null;
  className?: string;
}

const UserBadges = ({
  userId,
  disabled,
  warned,
  donorRank,
  className = ''
}: UserBadgesProps) => {
  const viewer = useAppSelector(selectCurrentUser);
  const badges: React.ReactNode[] = [];

  if (disabled) {
    badges.push(
      <span
        key="disabled"
        title="Account disabled"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-900/70 text-red-400 text-[10px] font-bold leading-none"
        aria-label="Disabled"
      >
        ✕
      </span>
    );
  }

  if (warned) {
    // Only the member's own expiry is known here: the session carries it, and
    // AuthorRef never does (api#719).
    const ownName = userId !== undefined && viewer?.id === userId;
    const until = viewer?.warnedUntil;
    const title = !ownName
      ? 'Warned'
      : until
        ? `Warned — expires ${formatDate(until)}`
        : 'Warned — no expiry';
    badges.push(
      <Link key="warned" to="/rules" data-st="control">
        <span
          title={title}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-900/70 text-yellow-400 text-[10px] font-bold leading-none"
          aria-label="Warned"
        >
          ⚠
        </span>
      </Link>
    );
  }

  if (donorRank) {
    badges.push(
      <span
        key="donor"
        title={donorRank.name}
        className="text-[11px] leading-none"
        style={{ color: donorRank.color || undefined }}
        aria-label={`Donor: ${donorRank.name}`}
      >
        {donorRank.badge}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 ml-1 ${className}`}>
      {badges}
    </span>
  );
};

/** The donor and warning signs for a post, comment, PM or ticket author (#103). */
export const AuthorBadges = ({
  author,
  className
}: {
  author?: AuthorRef | null;
  className?: string;
}) =>
  author ? (
    <UserBadges
      userId={author.id}
      warned={author.warned}
      donorRank={author.donorRank}
      className={className}
    />
  ) : null;

export default UserBadges;
