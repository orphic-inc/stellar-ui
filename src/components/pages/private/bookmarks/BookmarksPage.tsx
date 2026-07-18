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
    <p data-st="prose" data-st-muted className="text-sm">
      No bookmarked {label} yet.
    </p>
  </div>
);

const ArtistsTab = () => {
  const { data, isLoading, error } = useGetArtistBookmarksQuery();
  if (isLoading) return <Spinner />;
  if (error)
    return (
      <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load.
      </p>
    );
  if (!data || data.length === 0) return <EmptyState label="artists" />;
  return (
    <ul data-st="list">
      {data.map((item) => (
        <li key={item.artistId} data-st="row">
          <Link
            to={`/artists/${item.artistId}`}
            data-st="control"
            className="text-sm"
          >
            {item.artist.name}
          </Link>
          <span data-st="meta" className="text-xs ml-2">
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
  if (error)
    return (
      <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load.
      </p>
    );
  if (!data || data.length === 0) return <EmptyState label="releases" />;
  return (
    <ul data-st="list">
      {data.map((item) => (
        <li key={item.releaseId} data-st="row">
          {item.release.communityId ? (
            <Link
              to={`/communities/${item.release.communityId}/releases/${item.releaseId}`}
              data-st="control"
              className="text-sm"
            >
              {item.release.title}
            </Link>
          ) : (
            <span data-st="prose" className="text-sm">
              {item.release.title}
            </span>
          )}
          <span data-st="meta" className="text-xs ml-2">
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
  if (error)
    return (
      <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load.
      </p>
    );
  if (!data || data.length === 0) return <EmptyState label="communities" />;
  return (
    <ul data-st="list">
      {data.map((item) => (
        <li key={item.communityId} data-st="row">
          <Link
            to={`/communities/${item.communityId}`}
            data-st="control"
            className="text-sm"
          >
            {item.community.name}
          </Link>
          <span data-st="meta" className="text-xs ml-2">
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
  if (error)
    return (
      <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load.
      </p>
    );
  if (!data || data.length === 0) return <EmptyState label="requests" />;
  return (
    <ul data-st="list">
      {data.map((item) => (
        <li key={item.requestId} data-st="row">
          <Link
            to={`/requests/${item.requestId}`}
            data-st="control"
            className="text-sm"
          >
            {item.request.title}
          </Link>
          <span data-st="meta" className="text-xs ml-2">
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

  // Tab strip: active/idle painted from tokens, not a Role.
  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
        : 'border-transparent text-[var(--st-text-muted)] hover:text-[var(--st-text)] hover:border-[var(--st-border-strong)]'
    }`;

  return (
    <div>
      <h2 data-st="prose" data-st-strong className="text-xl mb-6">
        Bookmarks
      </h2>

      <div data-st="panel">
        <div className="border-b border-[var(--st-border)] flex">
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
