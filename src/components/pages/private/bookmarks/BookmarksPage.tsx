import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetArtistBookmarksQuery,
  useGetReleaseBookmarksQuery,
  useGetCommunityBookmarksQuery,
  useGetRequestBookmarksQuery
} from '../../../../store/services/bookmarkApi';
import Spinner from '../../../layout/Spinner';

type Tab = 'artists' | 'releases' | 'communities' | 'requests';

const EmptyState = ({ label }: { label: string }) => (
  <div className="px-6 py-10 text-center">
    <p className="text-gray-500 text-sm">No bookmarked {label} yet.</p>
  </div>
);

const ArtistsTab = () => {
  const { data, isLoading, error } = useGetArtistBookmarksQuery();
  if (isLoading) return <Spinner />;
  if (error) return <p className="p-4 text-red-400 text-sm">Failed to load.</p>;
  if (!data || data.length === 0) return <EmptyState label="artists" />;
  return (
    <ul className="divide-y divide-gray-800">
      {data.map((item) => (
        <li
          key={item.artistId}
          className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
        >
          <Link
            to={`/private/artists/${item.artistId}`}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            {item.artist.name}
          </Link>
          <span className="text-gray-600 text-xs ml-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
};

const ReleasesTab = () => {
  const { data, isLoading, error } = useGetReleaseBookmarksQuery();
  if (isLoading) return <Spinner />;
  if (error) return <p className="p-4 text-red-400 text-sm">Failed to load.</p>;
  if (!data || data.length === 0) return <EmptyState label="releases" />;
  return (
    <ul className="divide-y divide-gray-800">
      {data.map((item) => (
        <li
          key={item.releaseId}
          className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
        >
          {item.release.communityId ? (
            <Link
              to={`/private/communities/${item.release.communityId}/releases/${item.releaseId}`}
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              {item.release.title}
            </Link>
          ) : (
            <span className="text-gray-300 text-sm">{item.release.title}</span>
          )}
          <span className="text-gray-600 text-xs ml-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
};

const CommunitiesTab = () => {
  const { data, isLoading, error } = useGetCommunityBookmarksQuery();
  if (isLoading) return <Spinner />;
  if (error) return <p className="p-4 text-red-400 text-sm">Failed to load.</p>;
  if (!data || data.length === 0) return <EmptyState label="communities" />;
  return (
    <ul className="divide-y divide-gray-800">
      {data.map((item) => (
        <li
          key={item.communityId}
          className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
        >
          <Link
            to={`/private/communities/${item.communityId}`}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            {item.community.name}
          </Link>
          <span className="text-gray-600 text-xs ml-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
};

const RequestsTab = () => {
  const { data, isLoading, error } = useGetRequestBookmarksQuery();
  if (isLoading) return <Spinner />;
  if (error) return <p className="p-4 text-red-400 text-sm">Failed to load.</p>;
  if (!data || data.length === 0) return <EmptyState label="requests" />;
  return (
    <ul className="divide-y divide-gray-800">
      {data.map((item) => (
        <li
          key={item.requestId}
          className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
        >
          <Link
            to={`/private/requests/${item.requestId}`}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            {item.request.title}
          </Link>
          <span className="text-gray-600 text-xs ml-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'artists', label: 'Artists' },
  { key: 'releases', label: 'Releases' },
  { key: 'communities', label: 'Communities' },
  { key: 'requests', label: 'Requests' }
];

const BookmarksPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('artists');

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-indigo-500 text-white'
        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
    }`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-white mb-6">Bookmarks</h2>

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="border-b border-gray-700 flex">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={tabClass(key)}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'artists' && <ArtistsTab />}
        {activeTab === 'releases' && <ReleasesTab />}
        {activeTab === 'communities' && <CommunitiesTab />}
        {activeTab === 'requests' && <RequestsTab />}
      </div>
    </div>
  );
};

export default BookmarksPage;
