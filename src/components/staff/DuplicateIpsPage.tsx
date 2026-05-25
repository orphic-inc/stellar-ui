import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetDuplicateIpsQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const DuplicateIpsPage = () => {
  const { data: groups, isLoading } = useGetDuplicateIpsQuery();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (ip: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) next.delete(ip);
      else next.add(ip);
      return next;
    });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">Duplicate IP Detection</h2>

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>IP Address</span>
          <span className="text-right">Users</span>
          <span />
        </div>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !groups?.length ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No duplicate IPs found.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/40">
            {groups.map((group) => (
              <div key={group.ip}>
                <div className="px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-4 items-center text-sm">
                  <span className="font-mono text-gray-200">{group.ip}</span>
                  <span className="text-gray-400 text-right">
                    {group.count}
                  </span>
                  <button
                    onClick={() => toggle(group.ip)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {expanded.has(group.ip) ? 'Hide' : 'Show'}
                  </button>
                </div>
                {expanded.has(group.ip) && (
                  <div className="bg-gray-950 border-t border-gray-700/40 px-6 py-2 space-y-1">
                    {group.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 text-xs py-1"
                      >
                        <Link
                          to={`/private/users/${user.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {user.username}
                        </Link>
                        <span className="text-gray-500">
                          Registered{' '}
                          {new Date(user.dateRegistered).toLocaleDateString()}
                        </span>
                        {user.disabled && (
                          <span className="px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded text-xs">
                            Disabled
                          </span>
                        )}
                        {user.lastLogin && (
                          <span className="text-gray-600">
                            Last login{' '}
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateIpsPage;
