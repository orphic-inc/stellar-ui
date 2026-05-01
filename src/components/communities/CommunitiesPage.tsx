import { useState } from 'react';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Communities</h2>
      <CommunitiesTable communities={communities} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
