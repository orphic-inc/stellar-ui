import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
import CommunitiesTable from './CommunitiesTable';

const CommunitiesPage = () => {
  const { data: communities, isLoading, error } = useGetCommunitiesQuery();

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load communities.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Communities</h2>
      <CommunitiesTable communities={communities?.data ?? []} />
    </div>
  );
};

export default CommunitiesPage;
