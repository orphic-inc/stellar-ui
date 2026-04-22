import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetAnnouncementsQuery } from '../../../store/services/miscApi';
import Time from '../../layout/Time';
import Spinner from '../../layout/Spinner';

const PrivateHomepage = () => {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading } = useGetAnnouncementsQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back,{' '}
          <span className="text-indigo-400">{user?.username}</span>.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
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
              ) : !data?.data?.announcements?.length ? (
                <p className="p-4 text-sm text-gray-500">No announcements.</p>
              ) : (
                data.data.announcements.map((n) => (
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

          {/* Blog */}
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
              ) : !data?.data?.blogPosts?.length ? (
                <p className="p-4 text-sm text-gray-500">No blog posts.</p>
              ) : (
                data.data.blogPosts.map((b) => (
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Quick Links
              </h2>
            </div>
            <div className="p-2">
              {[
                { label: 'Forums', to: '/private/forums' },
                { label: 'Communities', to: '/private/communities' },
                { label: 'Upload', to: '/private/contribute' },
                { label: 'Invite a Friend', to: '/private/invite' }
              ].map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="block px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Your Stats
              </h2>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Rank</span>
                <span className="text-gray-200">
                  {user?.userRank?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Invites</span>
                <span className="text-gray-200">{user?.inviteCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member since</span>
                <span className="text-gray-200">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateHomepage;
