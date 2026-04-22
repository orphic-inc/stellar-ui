import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  useGetForumByIdQuery,
  useCreateTopicMutation
} from '../../../store/services/forumApi';

const NewTopicForm = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const { data: forum } = useGetForumByIdQuery(parseInt(forumId!));
  const [createTopic, { isLoading }] = useCreateTopicMutation();

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
    const payload: Parameters<typeof createTopic>[0] = {
      forumId: parseInt(forumId!),
      title,
      body
    };
    if (showPoll && question) {
      payload.poll = { question, answers: answers.filter((a) => a.trim()) };
    }
    try {
      const topic = await createTopic(payload).unwrap();
      navigate(`/private/forums/${forumId}/topics/${topic.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/forums">Forums</Link>
        {' › '}
        <Link to={`/private/forums/${forumId}`}>{forum?.name ?? 'Forum'}</Link>
        {' › '}
        <span>New Topic</span>
      </div>

      <div className="box pad">
        <form className="create_form" onSubmit={handleSubmit}>
          <table className="layout">
            <tbody>
              <tr>
                <td className="label">Title:</td>
                <td>
                  <input
                    type="text"
                    style={{ width: '98%' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Body:</td>
                <td>
                  <textarea
                    style={{ width: '98%' }}
                    rows={10}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="center">
                  <strong>Poll Settings</strong>{' '}
                  <button
                    type="button"
                    onClick={() => setShowPoll(!showPoll)}
                    className="brackets btn-link"
                  >
                    {showPoll ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
              {showPoll && (
                <>
                  <tr>
                    <td className="label">Poll Question:</td>
                    <td>
                      <input
                        type="text"
                        style={{ width: '98%' }}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Poll Answers:</td>
                    <td>
                      {answers.map((answer, index) => (
                        <div key={index}>
                          <input
                            type="text"
                            style={{ width: '90%' }}
                            value={answer}
                            onChange={(e) => handleAnswerChange(e, index)}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddAnswer}
                        className="brackets btn-link"
                      >
                        +
                      </button>{' '}
                      <button
                        type="button"
                        onClick={handleRemoveAnswer}
                        className="brackets btn-link"
                      >
                        −
                      </button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          <div className="center">
            <input type="submit" value="Create thread" disabled={isLoading} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTopicForm;
