import { useState } from 'react';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
import { Pagination } from '../ui';
import CommunitiesTable from './CommunitiesTable';

const CommunitiesPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetCommunitiesQuery(page);

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load communities.</div>;

  const communities = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const pageSize = data?.meta?.limit ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h2 data-st="prose" data-st-strong className="text-xl font-semibold mb-4">
        Communities
      </h2>
      <CommunitiesTable communities={communities} />

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        className="mt-4"
      />
    </div>
  );
};

export default CommunitiesPage;
