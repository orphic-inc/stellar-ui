import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetForumByIdQuery,
  useGetTopicsByForumQuery
} from '../../store/services/forumApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const ForumPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const [page, setPage] = useState(1);
  const fId = parseInt(forumId ?? '0');
  const {
    data: forum,
    isLoading: forumLoading,
    error
  } = useGetForumByIdQuery(fId);
  const { data: topicsPage, isLoading: topicsLoading } =
    useGetTopicsByForumQuery({ forumId: fId, page });
  const isLoading = forumLoading || topicsLoading;

  if (isLoading) return <Spinner />;
  if (error || !forum)
    return <div className="p-4 text-red-400">Forum not found.</div>;

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/forums" className="hover:text-gray-300">
          Forums
        </Link>
        {' › '}
        {forum.forumCategory && (
          <>
            <span className="text-gray-400">{forum.forumCategory.name}</span>
            {' › '}
          </>
        )}
        <strong className="text-gray-200">{forum.name}</strong>
      </nav>

      <div data-st="panel">
        <div data-st="colhead">
          <span>{forum.name}</span>
          {/* New Topic is interactive chrome — no contract Role covers a CTA
              yet, so it keeps its utility paint (deferred, per CommunityPage). */}
          <Link
            to={`/forums/${forumId}/new`}
            className="text-xs text-indigo-400 hover:text-indigo-300 normal-case tracking-normal"
          >
            + New Topic
          </Link>
        </div>

        <div data-st="list">
          {topicsPage && topicsPage.data.length > 0 ? (
            topicsPage.data.map((topic) => (
              <div key={topic.id} data-st="row">
                {topic.isLocked && <span data-st="chip">[Locked]</span>}
                {topic.isSticky && <span data-st="chip">[Sticky]</span>}
                <Link
                  to={`/forums/${forumId}/topics/${topic.id}`}
                  data-st="title"
                  className="text-sm"
                >
                  {topic.title}
                </Link>
                <span data-st="meta" data-st-num className="text-xs">
                  {topic.numPosts} replies
                </span>
                <Link
                  to={`/user/${topic.author?.username}`}
                  data-st="meta"
                  className="text-xs"
                >
                  by {topic.author?.username}
                </Link>
                {topic.lastPost && (
                  <span data-st="meta" data-st-num className="text-xs">
                    <Time date={topic.lastPost.createdAt} />
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <span data-st="meta">No topics yet.</span>
            </div>
          )}
        </div>
      </div>

      {/* Pagination has no contract Role (active-state paint is deferred); it
          stays inline Tailwind and sits below the result panel, per WS4·2. */}
      {topicsPage && topicsPage.meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-3 text-sm text-gray-400">
          <button
            className="hover:text-gray-200 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          <span>
            Page {page} of {topicsPage.meta.totalPages}
          </span>
          <button
            className="hover:text-gray-200 disabled:opacity-40"
            disabled={page >= topicsPage.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default ForumPage;
