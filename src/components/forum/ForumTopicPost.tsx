import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Time from '../layout/Time';
import type { ForumPost } from '../../types';

interface Props {
  post: ForumPost;
}

const ForumTopicPost = ({ post }: Props) => {
  const { id, author, body, createdAt } = post;

  return (
    <div
      id={`post${id}`}
      className="rounded border border-gray-700 bg-gray-900 mb-3"
    >
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Link to={`#post${id}`} className="text-gray-500 hover:text-gray-300">
            #{id}
          </Link>
          <Link
            to={`/private/user/${author?.username}`}
            className="font-semibold text-gray-200 hover:text-white"
          >
            {author?.username}
          </Link>
          <Time date={createdAt} />
          <Link to="#quickpost" className="text-gray-500 hover:text-gray-300">
            Quote
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/private/reports/new?targetType=ForumPost&targetId=${id}`}
            className="hover:text-gray-200"
          >
            Report
          </Link>
          <Link to="#top" className="hover:text-gray-200">
            ↑
          </Link>
        </div>
      </div>
      <div className="flex gap-4 p-4">
        <div className="flex-shrink-0">
          <img
            src={author?.avatar ?? '/static/common/avatars/default.png'}
            alt={`${author?.username}'s avatar`}
            className="w-16 h-16 rounded object-cover"
          />
        </div>
        <div
          className="flex-1 text-sm text-gray-300 prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
        />
      </div>
    </div>
  );
};

export default ForumTopicPost;
