import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { parseBBCode } from '../../utils/bbcode';
import { useGetStaffQuery } from '../../store/services/staffApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const StaffPage = () => {
  const { data, isLoading, isError } = useGetStaffQuery();

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );

  if (isError)
    return (
      <div className="text-sm text-red-400">Failed to load staff list.</div>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Staff</h2>
        <Link
          to="/private/messages/tickets/new"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded transition-colors"
        >
          Contact Staff
        </Link>
      </div>

      {data?.groups.length === 0 && (
        <p className="text-sm text-gray-500">No staff groups configured.</p>
      )}

      {data?.groups.map((group) => (
        <section key={group.id ?? 'ungrouped'}>
          <h3
            className={`text-base font-semibold mb-3 pb-1 border-b border-gray-700 ${
              group.id === null ? 'text-gray-500 italic' : 'text-gray-200'
            }`}
          >
            {group.name}
          </h3>

          {group.members.length === 0 ? (
            <p className="text-xs text-gray-600 pl-1">No members.</p>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[1fr_auto_auto_2fr] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <span>Username</span>
                <span>Rank</span>
                <span>Last Seen</span>
                <span>Bio</span>
              </div>
              <div className="divide-y divide-gray-700/40">
                {group.members.map((m) => (
                  <div
                    key={m.userId}
                    className="px-4 py-2 grid grid-cols-[1fr_auto_auto_2fr] gap-4 items-start text-sm"
                  >
                    <Link
                      to={`/private/user/${m.userId}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {m.username}
                    </Link>
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: m.rankColor || undefined }}
                    >
                      {m.rankName}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {m.lastSeen ? (
                        <Time date={m.lastSeen} />
                      ) : (
                        <span className="text-gray-600">Never</span>
                      )}
                    </span>
                    {m.staffBio ? (
                      <span
                        className="text-xs text-gray-400 bbcode-content"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(parseBBCode(m.staffBio), {
                            ALLOWED_TAGS: ['b', 'i', 'u', 's', 'a', 'br']
                          })
                        }}
                      />
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default StaffPage;
