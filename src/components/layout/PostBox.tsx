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
    <div
      id="quickpost"
      className="mt-4 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
    >
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <span className="text-sm font-semibold text-gray-200">Post Reply</span>
      </div>

      <form onSubmit={handleSubmit} className="p-3 space-y-2">
        <textarea
          ref={textareaRef}
          className="w-full bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 px-3 py-2 focus:outline-none focus:border-indigo-500 resize-y placeholder-gray-600"
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your reply… BBCode supported: [b]bold[/b] [i]italic[/i] [quote=user]…[/quote]"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
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
