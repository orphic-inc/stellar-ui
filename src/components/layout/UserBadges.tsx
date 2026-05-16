interface UserBadgesProps {
  disabled?: boolean | null;
  warned?: string | boolean | null;
  isDonor?: boolean | null;
  className?: string;
}

const UserBadges = ({
  disabled,
  warned,
  isDonor,
  className = ''
}: UserBadgesProps) => {
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
    badges.push(
      <span
        key="warned"
        title="User has active warning"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-900/70 text-yellow-400 text-[10px] font-bold leading-none"
        aria-label="Warned"
      >
        ⚠
      </span>
    );
  }

  if (isDonor) {
    badges.push(
      <span
        key="donor"
        title="Donor"
        className="text-pink-400 text-[11px] leading-none"
        aria-label="Donor"
      >
        ♥
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

export default UserBadges;
