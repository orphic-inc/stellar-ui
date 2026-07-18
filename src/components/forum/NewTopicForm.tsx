import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetForumByIdQuery,
  useCreateTopicMutation,
  type CreateTopicArgs
} from '../../store/services/forumApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';

const NewTopicForm = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const { data: forum } = useGetForumByIdQuery(parseInt(forumId ?? '0'));
  const [createTopic, { isLoading }] = useCreateTopicMutation();
  const dispatch = useDispatch();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['']);
  const [showPoll, setShowPoll] = useState(false);

  const handleAddAnswer = () => setAnswers([...answers, '']);
  const handleRemoveAnswer = () => setAnswers(answers.slice(0, -1));
  const handleAnswerChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const updated = [...answers];
    updated[index] = e.target.value;
    setAnswers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTopicArgs = {
      forumId: parseInt(forumId ?? '0'),
      title,
      body
    };
    const filteredAnswers = answers.filter((answer) => answer.trim());
    if (showPoll && question && filteredAnswers.length > 0) {
      payload.question = question;
      payload.answers = JSON.stringify(filteredAnswers);
    }
    try {
      const topic = await createTopic(payload).unwrap();
      navigate(`/forums/${forumId}/topics/${topic.id}`);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ??
            'Failed to create topic. Please try again.',
          'danger'
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link to="/forums" data-st="control">
          Forums
        </Link>
        <span data-st="meta">{' › '}</span>
        <Link to={`/forums/${forumId}`} data-st="control">
          {forum?.name ?? 'Forum'}
        </Link>
        <span data-st="meta">{' › '}</span>
        <span data-st="meta">New Topic</span>
      </nav>

      <form onSubmit={handleSubmit} data-st="panel" className="p-5 space-y-4">
        <div>
          <label
            htmlFor="new-topic-title"
            data-st="meta"
            className="block mb-1"
          >
            Title
          </label>
          <input
            id="new-topic-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-st="field"
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="new-topic-body" data-st="meta" className="block mb-1">
            Body
          </label>
          <textarea
            id="new-topic-body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            data-st="field"
            className="w-full"
          />
        </div>

        {/* Token-based divider so the section line recolors with the theme
            (no divider Role exists; this is the smallest correct call). */}
        <div className="border-t border-[var(--st-border)] pt-4">
          <button
            type="button"
            onClick={() => setShowPoll(!showPoll)}
            data-st="control"
            className="text-sm font-medium"
          >
            {showPoll ? 'Remove poll' : 'Add a poll'}
          </button>
        </div>

        {showPoll && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="new-topic-poll-question"
                data-st="meta"
                className="block mb-1"
              >
                Poll question
              </label>
              <input
                id="new-topic-poll-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                data-st="field"
                className="w-full"
              />
            </div>

            <div>
              <p data-st="meta" className="block mb-1">
                Poll answers
              </p>
              <div className="space-y-2">
                {answers.map((answer, index) => (
                  <input
                    key={index}
                    type="text"
                    value={answer}
                    onChange={(e) => handleAnswerChange(e, index)}
                    data-st="field"
                    className="w-full"
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  data-st="control"
                  className="text-xs"
                >
                  Add answer
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAnswer}
                  disabled={answers.length <= 1}
                  data-st="control"
                  className="text-xs"
                >
                  Remove answer
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          data-st="control"
          data-st-primary
          className="w-full text-sm"
        >
          {isLoading ? 'Creating…' : 'Create thread'}
        </button>
      </form>
    </div>
  );
};

export default NewTopicForm;
