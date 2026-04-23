import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetAnnouncementsQuery } from '../../../store/services/announcementApi';
import { useGetHomepageFeaturedQuery } from '../../../store/services/homeApi';
import { useGetSiteStatsQuery } from '../../../store/services/miscApi';
import { Link } from 'react-router-dom';
import Time from '../../layout/Time';
import Spinner from '../../layout/Spinner';

const StatRow = ({
  label,
  value
}: {
  label: string;
  value?: number | string;
}) => (
  <div className="flex justify-between py-1 border-b border-gray-700/40 last:border-0">
    <span className="text-gray-400 text-xs">{label}</span>
    <span className="text-gray-200 text-xs font-medium">{value ?? '—'}</span>
  </div>
);

const PrivateHomepage = () => {
  const user = useSelector(selectCurrentUser);
  const { data: announcements, isLoading } = useGetAnnouncementsQuery();
  const { data: stats } = useGetSiteStatsQuery();
  const { data: featured } = useGetHomepageFeaturedQuery();

  const blogPosts = announcements?.data?.blogPosts ?? [];
  const aotm = featured?.albumOfTheMonth;
  const vanityHouse = featured?.vanityHouse;

  const releaseLink = (communityId?: number | null, releaseId?: number) =>
    communityId && releaseId
      ? `/private/communities/${communityId}/groups/${releaseId}`
      : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">
        Welcome back, <span className="text-indigo-400">{user?.username}</span>.
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — announcements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Announcements
              </h2>
            </div>
            <div className="divide-y divide-gray-700/50">
              {isLoading ? (
                <div className="p-4">
                  <Spinner />
                </div>
              ) : !announcements?.data?.announcements?.length ? (
                <p className="p-4 text-sm text-gray-500">No announcements.</p>
              ) : (
                announcements.data.announcements.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
                  >
                    <span className="font-medium text-gray-200 text-sm">
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0 ml-4">
                      <Time date={n.createdAt} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Blog
              </h2>
            </div>
            <div className="divide-y divide-gray-700/50">
              {isLoading ? (
                <div className="p-4">
                  <Spinner />
                </div>
              ) : !blogPosts.length ? (
                <p className="p-4 text-sm text-gray-500">No blog posts.</p>
              ) : (
                blogPosts.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-gray-200">
                        {b.title}
                      </span>
                      {b.user && (
                        <span className="text-gray-500 ml-2">
                          — {b.user.username}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-4">
                      <Time date={b.createdAt} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Stats
              </h2>
            </div>
            <div className="px-4 py-3">
              <StatRow label="Maximum users" value={stats?.maxUsers} />
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
              <StatRow label="Seeders" value={stats?.seeders} />
              <StatRow label="Leechers" value={stats?.leechers} />
              <StatRow
                label="S/L Ratio"
                value={
                  stats?.seeders && stats?.leechers
                    ? (stats.seeders / Math.max(stats.leechers, 1)).toFixed(2)
                    : undefined
                }
              />
              <StatRow label="Peers" value={stats?.peers} />
            </div>
          </div>

          {/* Album of the Month */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Album of the Month
              </h2>
              {aotm &&
                releaseLink(aotm.release.communityId, aotm.release.id) && (
                  <Link
                    to={releaseLink(aotm.release.communityId, aotm.release.id)!}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    View release
                  </Link>
                )}
            </div>
            <div className="p-3">
              {aotm ? (
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded shrink-0 overflow-hidden flex items-center justify-center text-gray-600 text-xs">
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
                    <div className="text-sm text-gray-200 font-medium truncate">
                      {aotm.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {aotm.release.artist?.name ?? 'Unknown artist'}
                      {aotm.release.year ? ` • ${aotm.release.year}` : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 italic">Not set.</p>
              )}
            </div>
          </div>

          {/* Vanity House */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Vanity House
              </h2>
              {vanityHouse &&
                releaseLink(vanityHouse.communityId, vanityHouse.id) && (
                  <Link
                    to={releaseLink(vanityHouse.communityId, vanityHouse.id)!}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    View release
                  </Link>
                )}
            </div>
            <div className="p-3">
              {vanityHouse ? (
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded shrink-0 overflow-hidden flex items-center justify-center text-gray-600 text-xs">
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
                    <div className="text-sm text-gray-200 font-medium truncate">
                      {vanityHouse.artist?.name ?? 'Unknown artist'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {vanityHouse.title}
                      {vanityHouse.year ? ` • ${vanityHouse.year}` : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 italic">Not set.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateHomepage;
