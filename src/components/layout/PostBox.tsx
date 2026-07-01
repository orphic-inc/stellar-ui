import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreatePostMutation } from '../../store/services/forumApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';

interface Props {
  forumId: string;
  topicId: string;
  quoteText?: string;
  onQuoteConsumed?: () => void;
}

const PostBox = ({ forumId, topicId, quoteText, onQuoteConsumed }: Props) => {
  const [body, setBody] = useState('');
  const [createPost, { isLoading }] = useCreatePostMutation();
  const dispatch = useDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (quoteText) {
      setBody((prev) => prev + quoteText);
      onQuoteConsumed?.();
      textareaRef.current?.focus();
    }
  }, [quoteText, onQuoteConsumed]);

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
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to post reply.', 'danger')
      );
    }
  };

  return (
    <div id="quickpost" data-st="panel" className="mt-4 overflow-hidden">
      <div data-st="colhead">
        <span data-st="prose" data-st-strong className="text-sm">
          Post Reply
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-3 space-y-2">
        <textarea
          ref={textareaRef}
          data-st="field"
          className="w-full text-sm px-3 py-2 resize-y"
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your reply… BBCode supported: [b]bold[/b] [i]italic[/i] [quote=user]…[/quote]"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            data-st="control"
            data-st-primary
            className="text-sm font-medium"
            disabled={isLoading || !body.trim()}
          >
            {isLoading ? 'Posting…' : 'Post Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostBox;
