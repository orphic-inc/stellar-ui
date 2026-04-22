import { Link, useParams } from 'react-router-dom';
import { useGetForumByIdQuery } from '../../../store/services/forumApi';
import Spinner from '../../layout/Spinner';
import Time from '../../layout/Time';

const ForumPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const {
    data: forum,
    isLoading,
    error
  } = useGetForumByIdQuery(parseInt(forumId!));

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
            {forum.topics && forum.topics.length > 0 ? (
              forum.topics.map((topic) => (
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
      </div>
    </div>
  );
};

export default ForumPage;
