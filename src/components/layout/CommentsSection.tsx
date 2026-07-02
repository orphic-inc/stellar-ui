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
  const { data: comments, isLoading } = useGetCommentsQuery({
    context,
    pageId
  });
  const [createComment, { isLoading: posting }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const [body, setBody] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [subscribeComments, { isLoading: subscribing }] =
    useSubscribeCommentsMutation();
  const canSubscribe =
    SUBSCRIBABLE_PAGES.includes(context) && !alreadySubscribed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      if (context === 'communities') {
        await createComment({
          page: context,
          body,
          communityId: pageId
        }).unwrap();
      } else if (context === 'artist') {
        await createComment({ page: context, body, artistId: pageId }).unwrap();
      } else if (context === 'release') {
        await createComment({
          page: context,
          body,
          releaseId: pageId
        }).unwrap();
      } else if (context === 'collages') {
        await createComment({
          page: context,
          body,
          collageId: pageId
        }).unwrap();
      } else if (context === 'contributions') {
        await createComment({
          page: context,
          body,
          contributionId: pageId
        }).unwrap();
      } else {
        await createComment({
          page: context,
          body,
          requestId: pageId
        }).unwrap();
      }

      if (subscribe && canSubscribe) {
        await subscribeComments({
          page: context,
          pageId,
          action: 'subscribe'
        }).unwrap();
      }

      setBody('');
      setSubscribe(false);
    } catch {
      return;
    }
  };

  return (
    <div data-st="panel">
      <div data-st="colhead">Comments</div>

      {isLoading ? (
        <div data-st="meta" className="px-3 py-2 text-xs">
          Loading…
        </div>
      ) : !comments?.length ? (
        <div data-st="meta" className="px-3 py-2 text-xs">
          No comments yet.
        </div>
      ) : (
        <div data-st="list">
          {comments.map((c) => (
            <div
              key={c.id}
              className="px-3 py-2 text-xs border-t border-[var(--st-border-subtle)] first:border-0"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span data-st="prose" data-st-strong className="truncate">
                  {c.author?.username ?? 'Unknown'}
                </span>
                <span data-st="meta" className="shrink-0">
                  <Time date={c.createdAt} />
                </span>
              </div>
              <div
                data-st="prose"
                className="leading-relaxed break-words bbcode-content"
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
                    className="text-xs text-[var(--st-text-faint)] hover:text-[var(--st-text-muted)]"
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
                    className="text-xs text-[var(--st-text-faint)] hover:text-[var(--st-danger)]"
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
          className="px-3 py-2 border-t border-[var(--st-border-subtle)]"
          onSubmit={handleSubmit}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            data-st="field"
            className="w-full rounded text-xs px-2 py-1.5 resize-none h-20"
            placeholder="Add a comment…"
            required
          />
          {canSubscribe && (
            <label
              data-st="meta"
              className="flex items-center gap-1.5 text-xs mt-1.5 mb-1"
            >
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
                data-st="field"
              />
              Subscribe to comments
            </label>
          )}
          <button
            type="submit"
            disabled={posting || subscribing}
            data-st="control"
            data-st-primary
            className="mt-1.5 text-xs"
          >
            Post comment
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentsSection;
