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
  if (error || !forum) return <div className="error">Forum not found.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/forums">Forums</Link>
        {' › '}
        <span>{forum.forumCategory?.name}</span>
        {' › '}
        <strong>{forum.name}</strong>
      </div>

      <div className="box">
        <div className="head colhead_dark">
          <span>{forum.name}</span>
          <Link
            to={`/private/forums/${forumId}/new`}
            className="btn btn-small float-right"
          >
            New Topic
          </Link>
        </div>

        <table className="forum_index m_table">
          <thead>
            <tr className="colhead">
              <td className="forum-status" />
              <td className="forum-topic">Topic</td>
              <td className="forum-replies">Replies</td>
              <td className="forum-author">Author</td>
              <td className="forum-latest">Latest</td>
            </tr>
          </thead>
          <tbody>
            {topicsPage && topicsPage.data.length > 0 ? (
              topicsPage.data.map((topic) => (
                <tr
                  key={topic.id}
                  className={`forum-row${topic.isSticky ? ' sticky' : ''}`}
                >
                  <td className="forum-status">
                    {topic.isLocked && <span title="Locked">🔒</span>}
                    {topic.isSticky && <span title="Sticky">📌</span>}
                  </td>
                  <td>
                    <Link
                      to={`/private/forums/${forumId}/topics/${topic.id}`}
                      className="topic-title"
                    >
                      {topic.title}
                    </Link>
                  </td>
                  <td className="forum-replies">{topic.numPosts}</td>
                  <td className="forum-author">
                    <Link to={`/private/user/${topic.author?.id}`}>
                      {topic.author?.username}
                    </Link>
                  </td>
                  <td className="forum-latest">
                    {topic.lastPost && <Time date={topic.lastPost.createdAt} />}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="forum-empty">
                  No topics yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {topicsPage && topicsPage.meta.totalPages > 1 && (
          <div className="linkbox" style={{ textAlign: 'center' }}>
            <button
              className="brackets btn-link"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              &laquo; Prev
            </button>{' '}
            Page {page} of {topicsPage.meta.totalPages}{' '}
            <button
              className="brackets btn-link"
              disabled={page >= topicsPage.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPage;
