import {
  useGetIpBansQuery,
  useCreateIpBanMutation,
  useDeleteIpBanMutation,
  type IpBan
} from '../../store/services/adminApi';
import Blacklist from './Blacklist';

const IpBansPage = () => {
  const { data: bans, isLoading } = useGetIpBansQuery();
  const [createBan, { isLoading: isCreating }] = useCreateIpBanMutation();
  const [deleteBan] = useDeleteIpBanMutation();

  return (
    <Blacklist<IpBan>
      title="IP Address Bans"
      noun="ban"
      emptyMessage="No IP bans configured."
      entries={bans}
      isLoading={isLoading}
      isCreating={isCreating}
      entryKey={(ban) => ban.id}
      fields={[
        {
          name: 'fromIp',
          label: 'From IP',
          required: true,
          placeholder: '192.168.1.1'
        },
        {
          name: 'toIp',
          label: 'To IP',
          hint: '(optional — for ranges)',
          placeholder: '192.168.1.255'
        }
      ]}
      columns={[
        {
          header: 'From IP',
          cell: (ban) => ban.fromIp,
          tdClassName: 'font-mono'
        },
        { header: 'To IP', cell: (ban) => ban.toIp, tdClassName: 'font-mono' }
      ]}
      onCreate={(v) =>
        createBan({ fromIp: v.fromIp, toIp: v.toIp || undefined }).unwrap()
      }
      onDelete={(ban) => deleteBan(ban.id).unwrap()}
      messages={{
        created: 'IP ban added.',
        createFailed: 'Failed to add ban.',
        deleted: 'IP ban removed.',
        deleteFailed: 'Failed to remove ban.'
      }}
    />
  );
};

export default IpBansPage;
