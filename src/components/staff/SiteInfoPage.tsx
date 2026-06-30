import {
  useGetSiteInfoQuery,
  type SiteInfoData
} from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import { PageShell, Panel } from '../ui';

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
    <PageShell title="Site Info" width="lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {STAT_LABELS.map(({ key, label }) => (
          <Panel key={key} className="p-4 text-center">
            <div data-st="prose" data-st-strong className="text-2xl font-bold">
              {data?.[key] != null ? Number(data[key]).toLocaleString() : '—'}
            </div>
            <div data-st="meta" className="text-xs mt-1">
              {label}
            </div>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
};

export default SiteInfoPage;
