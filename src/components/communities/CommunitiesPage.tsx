import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
import CommunitiesTable from './CommunitiesTable';

const CommunitiesPage = () => {
  const { data: communities, isLoading, error } = useGetCommunitiesQuery();

  if (isLoading) return <Spinner />;
  if (error) return <div className="error">Failed to load communities.</div>;

  return (
    <div className="thin">
      <h2>Communities</h2>
      <CommunitiesTable communities={communities?.data ?? []} />
    </div>
  );
};

export default CommunitiesPage;
