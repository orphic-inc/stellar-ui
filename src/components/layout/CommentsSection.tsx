import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useSelector } from 'react-redux';
import {
  type CommentPage,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation
} from '../../store/services/commentApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import Time from './Time';

interface Props {
  page: CommentPage;
  pageId: number;
}

const CommentsSection = ({ page, pageId }: Props) => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: comments, isLoading } = useGetCommentsQuery({ page, pageId });
  const [createComment, { isLoading: posting }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (page === 'communities') {
      await createComment({ page, body, communityId: pageId });
    } else if (page === 'artist') {
      await createComment({ page, body, artistId: pageId });
    } else if (page === 'release') {
      await createComment({ page, body, releaseId: pageId });
    } else {
      await createComment({ page, body, contributionId: pageId });
    }
    setBody('');
  };

  return (
    <div className="box">
      <div className="head colhead_dark">Comments</div>
      {isLoading ? (
        <div className="pad">Loading…</div>
      ) : !comments?.length ? (
        <div className="pad small">No comments yet.</div>
      ) : (
        <table className="m_table">
          <tbody>
            {comments.map((c) => (
              <tr key={c.id}>
                <td
                  style={{ width: 120, verticalAlign: 'top' }}
                  className="small"
                >
                  <strong>{c.author?.username ?? 'Unknown'}</strong>
                  <br />
                  <span className="time">
                    <Time date={c.createdAt} />
                  </span>
                </td>
                <td
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(c.body)
                  }}
                />
                <td
                  style={{
                    width: 40,
                    textAlign: 'center',
                    verticalAlign: 'top'
                  }}
                >
                  {currentUser?.id === c.authorId && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="brackets btn-link"
                      aria-label="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {currentUser && (
        <form className="pad" onSubmit={handleSubmit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            cols={60}
            placeholder="Add a comment…"
            required
          />
          <br />
          <input type="submit" value="Post comment" disabled={posting} />
        </form>
      )}
    </div>
  );
};

export default CommentsSection;
