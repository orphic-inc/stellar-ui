import { Link } from 'react-router-dom';
import Time from '../../layout/Time';
import type { ForumPost } from '../../../types';

interface Props {
  post: ForumPost;
}

const ForumTopicPost = ({ post }: Props) => {
  const { id, author, body, createdAt } = post;

  return (
    <div className="forum_post" id={`post${id}`}>
      <table className="forum_post wrap_overflow box vertical_margin">
        <tbody>
          <tr className="colhead_dark">
            <td colSpan={2}>
              <div style={{ float: 'left' }}>
                <Link className="post_id" to={`#post${id}`}>
                  #{id}
                </Link>{' '}
                <strong>
                  <Link to={`/private/user/${author?.id}`}>
                    {author?.username}
                  </Link>
                </strong>{' '}
                <Time date={createdAt} />
                {' — '}
                <Link to="#quickpost" className="brackets">
                  Quote
                </Link>
              </div>
              <div style={{ float: 'right' }}>
                <Link to="#" className="brackets">
                  Report
                </Link>{' '}
                <Link to="#top">↑</Link>
              </div>
            </td>
          </tr>
          <tr>
            <td className="avatar" valign="top">
              <div className="avatar_container">
                <img
                  className="avatar_0"
                  src={author?.avatar ?? '/static/common/avatars/default.png'}
                  alt={`${author?.username}'s avatar`}
                  width={150}
                />
              </div>
            </td>
            <td className="body" valign="top">
              <div
                className="post_content"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ForumTopicPost;
