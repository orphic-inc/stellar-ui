import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetVanityHouseArtistsQuery,
  useSetVanityHouseMutation
} from '../../store/services/adminApi';
import { PageShell, DataTable, Pagination, Button, type Column } from '../ui';

type VanityArtist = NonNullable<
  ReturnType<typeof useGetVanityHouseArtistsQuery>['data']
>['data'][number];

const VanityHousePage = () => {
  const [page, setPage] = useState(1);
  const [artistIdInput, setArtistIdInput] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useGetVanityHouseArtistsQuery(page);
  const [setVanityHouse, { isLoading: isSetting }] =
    useSetVanityHouseMutation();

  const handleRemove = async (id: number) => {
    await setVanityHouse({ id, vanityHouse: false });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = parseInt(artistIdInput, 10);
    if (isNaN(id) || id <= 0) {
      setError('Enter a valid artist ID.');
      return;
    }
    try {
      await setVanityHouse({ id, vanityHouse: true }).unwrap();
      setArtistIdInput('');
    } catch {
      setError('Failed to add artist. Check the ID and try again.');
    }
  };

  const columns: Column<VanityArtist>[] = [
    { header: 'ID', cell: (a) => a.id, tdClassName: 'font-mono text-xs' },
    {
      header: 'Artist',
      cell: (a) => (
        <Link to={`/private/artist/${a.id}`} data-st="control">
          {a.name}
        </Link>
      )
    },
    {
      header: 'Releases',
      cell: (a) => a._count.releases,
      tdClassName: 'text-xs'
    },
    {
      header: '',
      tdClassName: 'text-right',
      cell: (a) => (
        <Button
          variant="link-danger"
          disabled={isSetting}
          onClick={() => handleRemove(a.id)}
        >
          Remove
        </Button>
      )
    }
  ];

  return (
    <PageShell
      title="Vanity House Artists"
      width="lg"
      backTo="/private/staff/tools"
    >
      <form onSubmit={handleAdd} className="flex gap-2 items-start">
        <div className="flex flex-col gap-1">
          <input
            type="number"
            value={artistIdInput}
            onChange={(e) => setArtistIdInput(e.target.value)}
            placeholder="Artist ID"
            data-st="field"
            className="w-36"
          />
          {error && (
            <span className="text-[var(--st-danger)] text-xs">{error}</span>
          )}
        </div>
        <Button type="submit" variant="primary" disabled={isSetting}>
          Add Artist
        </Button>
      </form>

      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        empty="No vanity house artists."
      />
      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default VanityHousePage;
