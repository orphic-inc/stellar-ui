import { Link } from 'react-router-dom';
import { useGetDonorRanksQuery } from '../../store/services/userApi';
import Spinner from '../layout/Spinner';

const PERK_LABELS: Record<string, string> = {
  iconMouseOverText: 'Custom icon mouseover text',
  avatarMouseOverText: 'Donor avatar mouseover text',
  customIcon: 'Custom donor icon',
  customIconLink: 'Custom icon link',
  secondAvatar: 'Second (donor) avatar',
  forumTitle: 'Custom forum title prefix and suffix',
  profileInfo1: 'Profile info block 1',
  profileInfo2: 'Profile info block 2',
  profileInfo3: 'Profile info block 3',
  profileInfo4: 'Profile info block 4'
};

const Section = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 text-sm text-gray-300 leading-relaxed">
      {children}
    </div>
  </div>
);

const DonatePage = () => {
  const { data: ranks, isLoading } = useGetDonorRanksQuery();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Donate</h1>

      <Section title="Why donate?">
        <p>
          This site has no advertisements, is not sponsored, and provides its
          services free of charge. For these reasons, its financial obligations
          can only be met with the help of voluntary user donations. Supporting
          the site is and will always remain voluntary. If you are financially
          able, help pay the site&apos;s bills by donating. The site&apos;s
          survival is up to you.
        </p>
        <p className="mt-3">
          All voluntary donations are used exclusively to cover the costs of
          running the site and tracker — server hardware, hosting, bandwidth,
          and related operating expenses. No staff member or other individual
          responsible for the site&apos;s operation personally profits from user
          donations.
        </p>
        <p className="mt-3">
          When you donate you aren&apos;t paying the staff, purchasing upload
          credit, or buying the ability to download. When you donate you are
          paying the site&apos;s bills.
        </p>
      </Section>

      <Section title="How to donate">
        <p>
          To make a donation, contact a staff member via private message. You
          can find the current staff list on the{' '}
          <Link
            to="/private/staff"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Staff page
          </Link>
          . A staff member will provide payment details and process your
          donation manually.
        </p>
      </Section>

      <Section title="What you will receive">
        <p>
          Donors are granted a Donor Rank by staff after a donation is
          processed. Each rank comes with a set of cosmetic and customization
          perks.
        </p>

        {isLoading ? (
          <div className="mt-4">
            <Spinner />
          </div>
        ) : ranks && ranks.length > 0 ? (
          <div className="mt-4 space-y-4">
            {ranks.map((rank) => {
              const perks =
                (rank.perks as Record<string, boolean> | null) ?? {};
              const enabledPerks = Object.entries(perks)
                .filter(([, enabled]) => enabled)
                .map(([key]) => PERK_LABELS[key] ?? key);

              return (
                <div
                  key={rank.id}
                  className="rounded border border-gray-700 bg-gray-800/60 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {rank.badge && (
                      <span className="text-base">{rank.badge}</span>
                    )}
                    <span
                      className="font-semibold text-white"
                      style={{ color: rank.color || undefined }}
                    >
                      {rank.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      ${rank.minDonation} minimum
                      {rank.expiresAfterDays != null &&
                        ` · expires after ${rank.expiresAfterDays} days`}
                    </span>
                  </div>
                  {enabledPerks.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                      {enabledPerks.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">
                      No additional perks configured for this rank.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-gray-500">
            No donor ranks are currently configured.
          </p>
        )}

        <p className="mt-4 text-gray-400">
          All donor perks are cosmetic or customization options. They are
          subject to change or cancellation at any time without notice.
        </p>
      </Section>

      <Section title="What you won't receive">
        <ul className="list-disc list-inside space-y-1">
          <li>Immunity from the rules</li>
          <li>Additional upload credit</li>
          <li>The ability to break or circumvent site policies</li>
        </ul>
      </Section>
    </div>
  );
};

export default DonatePage;
