import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useGetRegistrationLogQuery } from '../../store/services/adminApi';
import { PageShell, DataTable, Pagination, Badge, type Column } from '../ui';

type LogUser = NonNullable<
  ReturnType<typeof useGetRegistrationLogQuery>['data']
>['data'][number];
type LogAccount = LogUser | NonNullable<LogUser['inviter']>;

/**
 * Each cell shows the new account's value with its inviter's beneath, muted
 * (#412), so a row reads as the pair. A row with no inviter shows one line.
 */
const Pair = ({
  user,
  render
}: {
  user: LogUser;
  render: (account: LogAccount) => ReactNode;
}) => (
  <div className="space-y-0.5">
    <div>{render(user)}</div>
    {user.inviter && <div data-st="meta">{render(user.inviter)}</div>}
  </div>
);

const Account = ({ account }: { account: LogAccount }) => (
  <span className="flex items-center gap-2">
    <Link to={`/user/${account.id}`} data-st="control" className="font-medium">
      {account.username}
    </Link>
    {account.disabled && <Badge variant="danger">Disabled</Badge>}
  </span>
);

/** The current IP, with how many accounts hold it now. */
const Ip = ({ account }: { account: LogAccount }) =>
  account.lastIp ? (
    <span>
      {account.lastIp}
      {account.lastIpAccounts != null && (
        <span
          data-st="meta"
          title={`${account.lastIpAccounts} account(s) on this IP now`}
        >
          {' '}
          ({account.lastIpAccounts})
        </span>
      )}
    </span>
  ) : (
    '—'
  );

const RegistrationLogPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetRegistrationLogQuery(page);

  const columns: Column<LogUser>[] = [
    {
      header: 'Username / inviter',
      cell: (user) => (
        <Pair user={user} render={(a) => <Account account={a} />} />
      )
    },
    {
      header: 'Email',
      cell: (user) => <Pair user={user} render={(a) => a.email ?? '—'} />,
      tdClassName: 'truncate'
    },
    {
      header: 'Rank',
      cell: (user) => (
        <Pair user={user} render={(a) => a.userRank?.name ?? '—'} />
      )
    },
    {
      header: 'Registered',
      cell: (user) => (
        <Pair
          user={user}
          render={(a) => new Date(a.dateRegistered).toLocaleDateString()}
        />
      ),
      tdClassName: 'whitespace-nowrap'
    },
    {
      // Both IPs are where each account is now, not where it registered from:
      // the api compares and counts current addresses (api#850).
      header: (
        <span title="Where each account is now, not where it registered from">
          Current IP
        </span>
      ),
      cell: (user) => (
        <span className="flex items-start gap-2">
          <Pair user={user} render={(a) => <Ip account={a} />} />
          {user.sameIp && <Badge variant="warning">Same IP</Badge>}
        </span>
      ),
      tdClassName: 'font-mono'
    }
  ];

  return (
    <PageShell title="Registration Log" width="lg">
      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        empty="No users found."
        rowActive={(user) => user.sameIp}
      />
      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default RegistrationLogPage;
