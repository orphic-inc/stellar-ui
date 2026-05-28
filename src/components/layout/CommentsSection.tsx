import { useState } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useSelector } from 'react-redux';
import {
  type CommentPage,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation
} from '../../store/services/commentApi';
import { useSubscribeCommentsMutation } from '../../store/services/subscriptionApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { parseBBCode } from '../../utils/bbcode';
import Time from './Time';

const SUBSCRIBABLE_PAGES: CommentPage[] = [
  'release',
  'artist',
  'collages',
  'communities',
  'contributions',
  'requests'
];

interface Props {
  context: CommentPage;
  pageId: number;
  alreadySubscribed?: boolean;
}

const CommentsSection = ({
  context,
  pageId,
  alreadySubscribed = false
}: Props) => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: comments, isLoading } = useGetCommentsQuery({ context, pageId });
  const [createComment, { isLoading: posting }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const [body, setBody] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [subscribeComments, { isLoading: subscribing }] =
    useSubscribeCommentsMutation();
  const canSubscribe = SUBSCRIBABLE_PAGES.includes(context) && !alreadySubscribed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      if (context === 'communities') {
        await createComment({ page: context, body, communityId: pageId }).unwrap();
      } else if (context === 'artist') {
        await createComment({ page: context, body, artistId: pageId }).unwrap();
      } else if (context === 'release') {
        await createComment({ page: context, body, releaseId: pageId }).unwrap();
      } else if (context === 'collages') {
        await createComment({ page: context, body, collageId: pageId }).unwrap();
      } else if (context === 'contributions') {
        await createComment({ page: context, body, contributionId: pageId }).unwrap();
      } else {
        await createComment({ page: context, body, requestId: pageId }).unwrap();
      }

      if (subscribe && canSubscribe) {
        await subscribeComments({ page: context, pageId, action: 'subscribe' }).unwrap();
      }

      setBody('');
      setSubscribe(false);
    } catch {
      return;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Comments
      </div>

      {isLoading ? (
        <div className="px-3 py-2 text-xs text-gray-500">Loading…</div>
      ) : !comments?.length ? (
        <div className="px-3 py-2 text-xs text-gray-500">No comments yet.</div>
      ) : (
        <div className="divide-y divide-gray-700/40">
          {comments.map((c) => (
            <div key={c.id} className="px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-gray-200 truncate">
                  {c.author?.username ?? 'Unknown'}
                </span>
                <span className="text-gray-500 shrink-0">
                  <Time date={c.createdAt} />
                </span>
              </div>
              <div
                className="text-gray-300 leading-relaxed break-words bbcode-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(parseBBCode(c.body), {
                    ADD_TAGS: [
                      'blockquote',
                      'cite',
                      'u',
                      's',
                      'pre',
                      'code',
                      'ul',
                      'li'
                    ],
                    ADD_ATTR: ['style', 'class', 'rel', 'target']
                  })
                }}
              />
              <div className="flex gap-2 mt-1">
                {currentUser && currentUser.id !== c.authorId && (
                  <Link
                    to={`/private/reports/new?targetType=Comment&targetId=${c.id}`}
                    className="text-gray-600 hover:text-gray-400 text-xs"
                    aria-label="Report comment"
                    title="Report this comment"
                  >
                    [!]
                  </Link>
                )}
                {currentUser?.id === c.authorId && (
                  <button
                    type="button"
                    onClick={() => deleteComment(c.id)}
                    className="text-gray-600 hover:text-red-400 text-xs"
                    aria-label="Delete comment"
                  >
                    [×]
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <form
          className="px-3 py-2 border-t border-gray-700/40"
          onSubmit={handleSubmit}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-indigo-500 resize-none h-20"
            placeholder="Add a comment…"
            required
          />
          {canSubscribe && (
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5 mb-1">
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
                className="accent-indigo-500"
              />
              Subscribe to comments
            </label>
          )}
          <button
            type="submit"
            disabled={posting || subscribing}
            className="mt-1.5 px-3 py-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs rounded transition-colors"
          >
            Post comment
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentsSection;
