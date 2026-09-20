import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetHomepageFeaturedQuery } from '../../../store/services/homeApi';
import { useGetSiteStatsQuery } from '../../../store/services/siteApi';
import { Link } from 'react-router-dom';
import NewsPanel from './NewsPanel';

const StatRow = ({
  label,
  value
}: {
  label: string;
  value?: number | string;
}) => (
  <div className="flex justify-between py-1 border-b border-[var(--st-border-subtle)] last:border-0">
    <span data-st="meta" className="text-xs">
      {label}
    </span>
    <span data-st="prose" data-st-strong className="text-xs">
      {value ?? '—'}
    </span>
  </div>
);

const PrivateHomepage = () => {
  const user = useSelector(selectCurrentUser);
  const { data: stats } = useGetSiteStatsQuery();
  const { data: featured } = useGetHomepageFeaturedQuery();

  const aotm = featured?.albumOfTheMonth;
  const vanityHouse = featured?.vanityHouse;

  const releaseLink = (communityId?: number | null, releaseId?: number) =>
    communityId && releaseId
      ? `/communities/${communityId}/releases/${releaseId}`
      : undefined;

  return (
    <div className="space-y-6">
      <h1 data-st="prose" data-st-strong className="text-2xl">
        Welcome back,{' '}
        <span className="text-[var(--st-accent)]">{user?.username}</span>.
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — announcements */}
        <div className="lg:col-span-2 space-y-6">
          <NewsPanel />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div data-st="panel">
            <div data-st="colhead">
              <h2>Stats</h2>
            </div>
            <div className="px-4 py-3">
              <StatRow label="Max users" value={stats?.maxUsers} />
              <StatRow label="Total users" value={stats?.totalUsers} />
              <StatRow label="Enabled users" value={stats?.enabledUsers} />
              <StatRow label="Active today" value={stats?.activeToday} />
              <StatRow label="Active this week" value={stats?.activeThisWeek} />
              <StatRow
                label="Active this month"
                value={stats?.activeThisMonth}
              />
              <StatRow label="Communities" value={stats?.communities} />
              <StatRow label="Releases" value={stats?.releases} />
              <StatRow label="Artists" value={stats?.artists} />
              <StatRow
                label="Contributed links"
                value={stats?.contributedLinks}
              />
              <StatRow
                label="Link downloads"
                value={stats?.contributedLinkDownloads}
              />
              <StatRow label="Announcements" value={stats?.announcements} />
              <StatRow label="Blog posts" value={stats?.blogPosts} />
              <StatRow label="Comments" value={stats?.comments} />
            </div>
            <div className="px-4 pb-3 text-right">
              <Link to="/stats/history" data-st="control" className="text-xs">
                Details
              </Link>
            </div>
          </div>

          {/* Album of the Month */}
          <div data-st="panel">
            <div data-st="colhead">
              <h2>Album of the Month</h2>
              {aotm &&
                releaseLink(aotm.release.communityId, aotm.release.id) && (
                  <Link
                    to={releaseLink(aotm.release.communityId, aotm.release.id)!}
                    data-st="control"
                    className="text-xs"
                  >
                    View release
                  </Link>
                )}
            </div>
            <div className="p-3">
              {aotm ? (
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-[var(--st-raised)] rounded shrink-0 overflow-hidden flex items-center justify-center text-[var(--st-text-faint)] text-xs">
                    {aotm.release.image ? (
                      <img
                        src={aotm.release.image}
                        alt={aotm.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      '♪'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div
                      data-st="prose"
                      data-st-strong
                      className="text-sm truncate"
                    >
                      {aotm.title}
                    </div>
                    <div data-st="meta" className="text-xs truncate">
                      {aotm.release.artist?.name ?? 'Unknown artist'}
                      {aotm.release.year ? ` • ${aotm.release.year}` : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <p data-st="prose" data-st-muted className="text-xs italic">
                  Not set.
                </p>
              )}
            </div>
          </div>

          {/* Vanity House */}
          <div data-st="panel">
            <div data-st="colhead">
              <h2>Vanity House</h2>
              {vanityHouse &&
                releaseLink(vanityHouse.communityId, vanityHouse.id) && (
                  <Link
                    to={releaseLink(vanityHouse.communityId, vanityHouse.id)!}
                    data-st="control"
                    className="text-xs"
                  >
                    View release
                  </Link>
                )}
            </div>
            <div className="p-3">
              {vanityHouse ? (
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-[var(--st-raised)] rounded shrink-0 overflow-hidden flex items-center justify-center text-[var(--st-text-faint)] text-xs">
                    {vanityHouse.image ? (
                      <img
                        src={vanityHouse.image}
                        alt={vanityHouse.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      '♪'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div
                      data-st="prose"
                      data-st-strong
                      className="text-sm truncate"
                    >
                      {vanityHouse.artist?.name ?? 'Unknown artist'}
                    </div>
                    <div data-st="meta" className="text-xs truncate">
                      <span>{vanityHouse.title}</span>
                      {vanityHouse.year ? (
                        <span> • {vanityHouse.year}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <p data-st="prose" data-st-muted className="text-xs italic">
                  Not set.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateHomepage;
