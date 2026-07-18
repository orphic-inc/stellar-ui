import { Link, useSearchParams } from 'react-router-dom';
import { useSearchLogQuery } from '../../store/services/searchApi';
import type {
  LogSearchResponse,
  TopicSearchResult,
  PostSearchResult,
  PaginatedMeta
} from '../../store/services/searchApi';
import Spinner from '../layout/Spinner';

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';
const checkboxCls =
  'rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800';

function hasSplitLists(d: LogSearchResponse): d is {
  topics: { data: TopicSearchResult[]; meta: PaginatedMeta };
  posts: { data: PostSearchResult[]; meta: PaginatedMeta };
} {
  return 'topics' in d;
}

const LogBrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? undefined;
  const type = (searchParams.get('type') ?? 'all') as 'topic' | 'post' | 'all';
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading, error } = useSearchLogQuery({
    q,
    type,
    order,
    page
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const qv = fd.get('q');
    if (qv && String(qv).trim()) next.set('q', String(qv).trim());
    const tv = fd.get('type');
    if (tv && tv !== 'all') next.set('type', String(tv));
    const ov = fd.get('order');
    if (ov && ov !== 'desc') next.set('order', String(ov));
    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  // Pagination has no contract Role (active-page paint is deferred table-era
  // work); it stays inline Tailwind and sits below the result panel.
  const renderPager = (meta: PaginatedMeta) =>
    meta.totalPages > 1 ? (
      <div className="flex gap-1 flex-wrap pt-2">
        {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-2.5 py-1 text-xs rounded ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    ) : null;

  const renderTopics = (topics: TopicSearchResult[], meta: PaginatedMeta) => (
    <>
      <div data-st="panel">
        <div data-st="colhead">
          <span>Topics</span>
          <span>{meta.total} total</span>
        </div>
        <div data-st="list">
          {topics.map((t) => (
            <div key={t.id} data-st="row">
              <Link
                to={`/forums/topics/${t.id}`}
                data-st="title"
                className="text-sm"
              >
                {t.title}
              </Link>
              <span data-st="meta" className="text-xs">
                by {t.author.username} ·{' '}
                {new Date(t.createdAt).toLocaleDateString()} · {t.numPosts}{' '}
                posts
              </span>
            </div>
          ))}
        </div>
      </div>
      {renderPager(meta)}
    </>
  );

  const renderPosts = (posts: PostSearchResult[], meta: PaginatedMeta) => (
    <>
      <div data-st="panel">
        <div data-st="colhead">
          <span>Posts</span>
          <span>{meta.total} total</span>
        </div>
        <div data-st="list">
          {posts.map((p) => (
            <div key={p.id} data-st="row">
              {/* stacked: title+date over body — the block parent makes title's
                  flex:1 inert so the two-line layout holds (CollageDetail gotcha) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <Link
                    to={`/forums/topics/${p.forumTopicId}#post-${p.id}`}
                    data-st="title"
                    className="text-sm"
                  >
                    Post by {p.author.username}
                  </Link>
                  <span data-st="meta" data-st-num className="text-xs">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p data-st="meta" className="text-xs mt-1 line-clamp-2">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {renderPager(meta)}
    </>
  );

  const renderResults = (results: LogSearchResponse) => {
    if (hasSplitLists(results)) {
      return (
        <div className="space-y-8">
          {renderTopics(results.topics.data, results.topics.meta)}
          {renderPosts(results.posts.data, results.posts.meta)}
        </div>
      );
    }

    if (type === 'topic') {
      return renderTopics(results.data as TopicSearchResult[], results.meta);
    }

    return renderPosts(results.data as PostSearchResult[], results.meta);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Forum Log</h1>

      <div data-st="panel" className="p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-48">
            <label htmlFor="log-q" className={labelCls}>
              Search
            </label>
            <input
              id="log-q"
              name="q"
              defaultValue={q}
              className={inputCls}
              placeholder="Search topics and posts…"
            />
          </div>
          <fieldset>
            <legend className={labelCls}>Type</legend>
            <div className="flex gap-3 mt-1">
              {(['all', 'topic', 'post'] as const).map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="type"
                    value={v}
                    defaultChecked={type === v}
                    className={checkboxCls}
                  />
                  {v === 'all' ? 'All' : v === 'topic' ? 'Topics' : 'Posts'}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="log-order" className={labelCls}>
              Order
            </label>
            <select
              id="log-order"
              name="order"
              defaultValue={order}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors"
          >
            Reset
          </button>
        </form>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && renderResults(data)}
    </div>
  );
};

export default LogBrowsePage;
