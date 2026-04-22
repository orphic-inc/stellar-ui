import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreatePostMutation } from '../../store/services/forumApi';
import { addAlert } from '../../store/slices/alertSlice';

interface Props {
  forumId: string;
  topicId: string;
}

const PostBox = ({ forumId, topicId }: Props) => {
  const [body, setBody] = useState('');
  const [createPost, { isLoading }] = useCreatePostMutation();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await createPost({
        forumId: parseInt(forumId),
        topicId: parseInt(topicId),
        body
      }).unwrap();
      setBody('');
    } catch {
      dispatch(addAlert('Failed to post reply.', 'danger'));
    }
  };

  return (
    <form className="postbox" onSubmit={handleSubmit}>
      <div className="head colhead_dark">Post Reply</div>
      <textarea
        className="post-body"
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply…"
        disabled={isLoading}
      />
      <div className="postbox-footer">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !body.trim()}
        >
          {isLoading ? 'Posting…' : 'Post Reply'}
        </button>
      </div>
    </form>
  );
};

export default PostBox;
