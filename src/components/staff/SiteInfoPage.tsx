import { Link } from 'react-router-dom';
import {
  useGetSiteInfoQuery,
  type SiteInfoData
} from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const STAT_LABELS: { key: keyof SiteInfoData; label: string }[] = [
  { key: 'totalUsers', label: 'Total Users' },
  { key: 'enabledUsers', label: 'Enabled Users' },
  { key: 'disabledUsers', label: 'Disabled Users' },
  { key: 'releases', label: 'Releases' },
  { key: 'artists', label: 'Artists' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'communities', label: 'Communities' },
  { key: 'forumTopics', label: 'Forum Topics' },
  { key: 'forumPosts', label: 'Forum Posts' },
  { key: 'collages', label: 'Collages' },
  { key: 'wikiPages', label: 'Wiki Pages' }
];

const SiteInfoPage = () => {
  const { data, isLoading } = useGetSiteInfoQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Site Info</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {STAT_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center"
          >
            <div className="text-2xl font-bold text-white">
              {data?.[key] != null ? Number(data[key]).toLocaleString() : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteInfoPage;
