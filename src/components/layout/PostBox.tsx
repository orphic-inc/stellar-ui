import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreatePostMutation } from '../../store/services/forumApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';

interface Props {
  forumId: string;
  topicId: string;
}

export interface PostBoxHandle {
  appendQuote(text: string): void;
}

// Quoting is an event, so the parent calls it directly rather than passing the
// text down as a prop for an effect to notice and then hand back as consumed.
const PostBox = forwardRef<PostBoxHandle, Props>(
  ({ forumId, topicId }, ref) => {
    const [body, setBody] = useState('');
    const [createPost, { isLoading }] = useCreatePostMutation();
    const dispatch = useDispatch();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      appendQuote: (text: string) => {
        setBody((prev) => prev + text);
        textareaRef.current?.focus();
      }
    }));

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
  }
);

PostBox.displayName = 'PostBox';

export default PostBox;
