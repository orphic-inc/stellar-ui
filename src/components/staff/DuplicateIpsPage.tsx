import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetDuplicateIpsQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button, Badge } from '../ui';

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

  // Master-detail (each IP expands to its users), so this stays a hand-built
  // list rather than a flat DataTable — but it adopts the kit's shell, panel,
  // Button, and Badge, and paints from the contract.
  return (
    <PageShell title="Duplicate IP Detection">
      <Panel className="overflow-hidden">
        <div data-st="colhead" className="grid grid-cols-[1fr_auto_auto] gap-4">
          <span>IP Address</span>
          <span className="text-right">Users</span>
          <span />
        </div>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !groups?.length ? (
          <div className="px-4 py-6 text-sm text-center text-[var(--st-text-faint)]">
            No duplicate IPs found.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.ip}>
              <div
                data-st="row"
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-sm"
              >
                <span className="font-mono">{group.ip}</span>
                <span data-st="meta" className="text-right">
                  {group.count}
                </span>
                <Button variant="link" onClick={() => toggle(group.ip)}>
                  {expanded.has(group.ip) ? 'Hide' : 'Show'}
                </Button>
              </div>
              {expanded.has(group.ip) && (
                <div className="px-6 py-2 space-y-1 bg-[var(--st-base)] border-t border-[var(--st-border-subtle)]">
                  {group.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 text-xs py-1"
                    >
                      <Link
                        to={`/private/user/${user.id}`}
                        data-st="control"
                        className="font-medium"
                      >
                        {user.username}
                      </Link>
                      <span data-st="meta">
                        Registered{' '}
                        {new Date(user.dateRegistered).toLocaleDateString()}
                      </span>
                      {user.disabled && (
                        <Badge variant="danger">Disabled</Badge>
                      )}
                      {user.lastLogin && (
                        <span data-st="meta">
                          Last login{' '}
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </Panel>
    </PageShell>
  );
};

export default DuplicateIpsPage;
