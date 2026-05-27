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
      navigate(`/private/forums/${forumId}/topics/${topic.id}`);
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
      <nav className="text-sm text-gray-500">
        <Link to="/private/forums" className="hover:text-gray-300">
          Forums
        </Link>
        {' › '}
        <Link to={`/private/forums/${forumId}`} className="hover:text-gray-300">
          {forum?.name ?? 'Forum'}
        </Link>
        {' › '}
        <span className="text-gray-300">New Topic</span>
      </nav>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-lg border border-gray-700 p-5 space-y-4"
      >
        <div>
          <label
            htmlFor="new-topic-title"
            className="block text-sm text-gray-300 mb-1"
          >
            Title
          </label>
          <input
            id="new-topic-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="new-topic-body"
            className="block text-sm text-gray-300 mb-1"
          >
            Body
          </label>
          <textarea
            id="new-topic-body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="border-t border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowPoll(!showPoll)}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            {showPoll ? 'Remove poll' : 'Add a poll'}
          </button>
        </div>

        {showPoll && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="new-topic-poll-question"
                className="block text-sm text-gray-300 mb-1"
              >
                Poll question
              </label>
              <input
                id="new-topic-poll-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <p className="block text-sm text-gray-300 mb-1">Poll answers</p>
              <div className="space-y-2">
                {answers.map((answer, index) => (
                  <input
                    key={index}
                    type="text"
                    value={answer}
                    onChange={(e) => handleAnswerChange(e, index)}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="px-3 py-1 text-xs rounded border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Add answer
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAnswer}
                  disabled={answers.length <= 1}
                  className="px-3 py-1 text-xs rounded border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Creating…' : 'Create thread'}
        </button>
      </form>
    </div>
  );
};

export default NewTopicForm;
