import { useState } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Time from '../layout/Time';
import {
  useLazyGetPostEditHistoryQuery,
  useUpdatePostMutation,
  useDeletePostMutation
} from '../../store/services/forumApi';
import { parseBBCode, quotePost } from '../../utils/bbcode';
import { avatarSrc, onAvatarError } from '../../utils/avatar';
import type { ForumPost, ForumPostEdit } from '../../types';

interface Props {
  post: ForumPost;
  forumId: number;
  topicId: number;
  currentUserId?: number;
  canModerate?: boolean;
  onQuote?: (text: string) => void;
}

const ForumTopicPost = ({
  post,
  forumId,
  topicId,
  currentUserId,
  canModerate = false,
  onQuote
}: Props) => {
  const { id, author, body, createdAt, lastEdit } = post;
  const [editing, setEditing] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editBody, setEditBody] = useState(body);

  const [
    loadEditHistory,
    { data: editHistory, isFetching: loadingEditHistory }
  ] = useLazyGetPostEditHistoryQuery();
  const [updatePost, { isLoading: saving }] = useUpdatePostMutation();
  const [deletePost] = useDeletePostMutation();

  const isOwner = !!currentUserId && currentUserId === author?.id;
  const canEdit = isOwner || canModerate;
  const canDelete = isOwner || canModerate;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBody.trim()) return;
    await updatePost({ forumId, topicId, postId: id, body: editBody });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await deletePost({ forumId, topicId, postId: id });
  };

  const handleQuote = () => {
    onQuote?.(quotePost(author?.username ?? 'unknown', body));
  };

  const renderedBody = DOMPurify.sanitize(parseBBCode(body), {
    ADD_TAGS: ['blockquote', 'cite', 'u', 's', 'pre', 'code', 'ul', 'li'],
    ADD_ATTR: ['style', 'class', 'rel', 'target']
  });

  const renderedEdits: ForumPostEdit[] = editHistory?.data ?? [];

  const toggleEditHistory = async () => {
    if (showEditHistory) {
      setShowEditHistory(false);
      return;
    }

    setShowEditHistory(true);
    if (!editHistory) {
      await loadEditHistory({ forumId, topicId, postId: id });
    }
  };

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
          <button
            type="button"
            onClick={handleQuote}
            className="text-gray-500 hover:text-gray-300"
          >
            Quote
          </button>
          {canEdit && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-gray-500 hover:text-gray-300"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-400"
            >
              Delete
            </button>
          )}
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

      {editing ? (
        <form onSubmit={handleSave} className="p-4 space-y-2">
          <textarea
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-y"
            rows={6}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !editBody.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditBody(body);
              }}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-4 p-4">
          <div className="flex-shrink-0">
            <img
              src={avatarSrc(author?.avatar)}
              onError={onAvatarError}
              alt={`${author?.username}'s avatar`}
              className="w-16 h-16 rounded object-cover"
            />
          </div>
          <div
            className="flex-1 text-sm text-gray-300 bbcode-content"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
        </div>
      )}

      {lastEdit &&
        !editing &&
        new Date(lastEdit.editedAt).getTime() !==
          new Date(createdAt).getTime() && (
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-500">
              Last edited by{' '}
              {lastEdit.editor ? (
                <Link
                  to={`/private/user/${lastEdit.editor.username}`}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {lastEdit.editor.username}
                </Link>
              ) : (
                'Unknown'
              )}{' '}
              <Time date={lastEdit.editedAt} />
            </div>

            {canModerate && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={toggleEditHistory}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  {showEditHistory ? 'Hide edit history' : 'View edit history'}
                </button>

                {showEditHistory && (
                  <div className="mt-3 space-y-3 rounded border border-gray-800 bg-gray-950/60 p-3">
                    {loadingEditHistory && (
                      <div className="text-xs text-gray-500">
                        Loading edit history…
                      </div>
                    )}
                    {!loadingEditHistory && renderedEdits.length === 0 && (
                      <div className="text-xs text-gray-500">
                        No edit history available.
                      </div>
                    )}
                    {!loadingEditHistory &&
                      renderedEdits.map((edit, index) => (
                        <div
                          key={edit.id}
                          className={
                            index === renderedEdits.length - 1
                              ? ''
                              : 'border-b border-gray-800 pb-3'
                          }
                        >
                          <div className="mb-2 text-xs text-gray-500">
                            Edited by{' '}
                            {edit.editor ? (
                              <Link
                                to={`/private/user/${edit.editor.username}`}
                                className="text-gray-400 hover:text-gray-200"
                              >
                                {edit.editor.username}
                              </Link>
                            ) : (
                              'Unknown'
                            )}{' '}
                            <Time date={edit.editedAt} />
                          </div>
                          <pre className="whitespace-pre-wrap break-words rounded bg-gray-900/80 p-3 text-sm text-gray-300">
                            {edit.previousBody}
                          </pre>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default ForumTopicPost;
