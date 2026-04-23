import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetAnnouncementsQuery } from '../../../store/services/announcementApi';
import { useGetSiteStatsQuery } from '../../../store/services/miscApi';
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

  const blogPosts = announcements?.data?.blogPosts ?? [];
  const aotm = blogPosts[0];
  const vh = blogPosts[1];

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
              {aotm && (
                <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
                  Discuss
                </span>
              )}
            </div>
            <div className="p-3">
              {aotm ? (
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded shrink-0 flex items-center justify-center text-gray-600 text-xs">
                    ♪
                  </div>
                  <span className="text-sm text-gray-300">{aotm.title}</span>
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
              {vh && (
                <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
                  Discuss
                </span>
              )}
            </div>
            <div className="p-3">
              {vh ? (
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded shrink-0 flex items-center justify-center text-gray-600 text-xs">
                    ♪
                  </div>
                  <span className="text-sm text-gray-300">{vh.title}</span>
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
