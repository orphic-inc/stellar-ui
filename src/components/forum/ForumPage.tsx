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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/forums" className="hover:text-gray-300">
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

      <div className="rounded border border-gray-700 bg-gray-900">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-200">
            {forum.name}
          </span>
          <Link
            to={`/private/forums/${forumId}/new`}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            + New Topic
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="px-4 py-2 font-medium w-8" />
              <th className="px-4 py-2 font-medium">Topic</th>
              <th className="px-4 py-2 font-medium text-right">Replies</th>
              <th className="px-4 py-2 font-medium">Author</th>
              <th className="px-4 py-2 font-medium">Latest</th>
            </tr>
          </thead>
          <tbody>
            {topicsPage && topicsPage.data.length > 0 ? (
              topicsPage.data.map((topic) => (
                <tr
                  key={topic.id}
                  className={`border-b border-gray-800 hover:bg-gray-800/30 ${
                    topic.isSticky ? 'bg-gray-800/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    {topic.isLocked && (
                      <span title="Locked" className="text-xs">
                        🔒
                      </span>
                    )}
                    {topic.isSticky && (
                      <span title="Sticky" className="text-xs">
                        📌
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/private/forums/${forumId}/topics/${topic.id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {topic.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-right">
                    {topic.numPosts}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <Link
                      to={`/private/user/${topic.author?.username}`}
                      className="hover:text-gray-200"
                    >
                      {topic.author?.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {topic.lastPost && <Time date={topic.lastPost.createdAt} />}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-gray-500 text-center">
                  No topics yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {topicsPage && topicsPage.meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 px-4 py-3 border-t border-gray-800 text-sm text-gray-400">
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
    </div>
  );
};

export default ForumPage;
