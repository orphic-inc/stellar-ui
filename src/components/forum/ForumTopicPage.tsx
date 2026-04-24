import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetTopicByIdQuery,
  useGetPostsByTopicQuery,
  useMarkTopicReadMutation,
  useGetPollByTopicQuery,
  useVotePollMutation
} from '../../store/services/forumApi';
import {
  useGetSubscriptionsQuery,
  useSubscribeMutation
} from '../../store/services/subscriptionApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import Spinner from '../layout/Spinner';
import PostBox from '../layout/PostBox';
import ForumTopicPost from './ForumTopicPost';
import ErrorBoundary from '../layout/ErrorBoundary';
import FallbackComponent from '../layout/FallbackComponent';

const ForumTopicPage = () => {
  const { forumId, forumTopicId } = useParams<{
    forumId: string;
    forumTopicId: string;
  }>();
  const fId = parseInt(forumId ?? '0');
  const tId = parseInt(forumTopicId ?? '0');
  const currentUser = useSelector(selectCurrentUser);

  const { data: topic, isLoading: topicLoading } = useGetTopicByIdQuery({
    forumId: fId,
    topicId: tId
  });
  const { data: posts, isLoading: postsLoading } = useGetPostsByTopicQuery({
    forumId: fId,
    topicId: tId
  });
  const { data: poll } = useGetPollByTopicQuery(tId);
  const { data: subscriptions } = useGetSubscriptionsQuery();
  const [markRead] = useMarkTopicReadMutation();
  const [votePoll, { isLoading: voting }] = useVotePollMutation();
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const isSubscribed = subscriptions?.some((s) => s.topicId === tId) ?? false;

  useEffect(() => {
    if (posts?.data?.length) {
      markRead({
        forumTopicId: tId,
        forumPostId: posts.data[posts.data.length - 1].id
      });
    }
  }, [posts, tId, markRead]);

  if (topicLoading || postsLoading) return <Spinner />;
  if (!topic) return <div className="error">Topic not found.</div>;

  let answers: string[] = [];
  let pollParseError = false;
  if (poll) {
    try {
      answers = JSON.parse(poll.answers);
    } catch {
      pollParseError = true;
    }
  }

  const myVote = poll?.votes.find((v) => v.userId === currentUser?.id);
  const totalVotes = poll?.votes.length ?? 0;

  const voteCounts = answers.map(
    (_, i) => poll?.votes.filter((v) => v.vote === i).length ?? 0
  );

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnswer === null || !poll) return;
    await votePoll({
      forumPollId: poll.id,
      vote: selectedAnswer,
      topicId: tId
    });
  };

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/forums">Forums</Link>
        {' › '}
        <Link to={`/private/forums/${forumId}`}>Forum</Link>
        {' › '}
        <strong>{topic.title}</strong>
      </div>

      <div className="box topic-header">
        <div
          className="head colhead_dark"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>
            {topic.title}
            {topic.isLocked && <span className="topic-locked"> [Locked]</span>}
            {topic.isSticky && <span className="topic-sticky"> [Sticky]</span>}
          </span>
          <button
            type="button"
            onClick={() =>
              subscribe({
                topicId: tId,
                action: isSubscribed ? 'unsubscribe' : 'subscribe'
              })
            }
            disabled={subscribing}
            className="brackets btn-link"
            style={{ fontSize: '0.85em' }}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
      </div>

      {poll && pollParseError && (
        <div className="box pad error">Poll data is unavailable.</div>
      )}

      {poll && !pollParseError && answers.length > 0 && (
        <div className="box pad">
          <strong>{poll.question}</strong>
          {myVote !== undefined || poll.closed ? (
            <table className="m_table" style={{ marginTop: '0.5em' }}>
              <tbody>
                {answers.map((answer, i) => {
                  const count = voteCounts[i];
                  const pct =
                    totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <tr key={i} className={myVote?.vote === i ? 'row1' : ''}>
                      <td>{answer}</td>
                      <td style={{ width: '60%' }}>
                        <div
                          style={{
                            background: '#334',
                            height: 14,
                            borderRadius: 3
                          }}
                        >
                          <div
                            style={{
                              background: '#6366f1',
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: 3
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {count} ({pct}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <form onSubmit={handleVote} style={{ marginTop: '0.5em' }}>
              {answers.map((answer, i) => (
                <div key={i}>
                  <label>
                    <input
                      type="radio"
                      name="poll-answer"
                      value={i}
                      onChange={() => setSelectedAnswer(i)}
                      checked={selectedAnswer === i}
                    />{' '}
                    {answer}
                  </label>
                </div>
              ))}
              <div style={{ marginTop: '0.5em' }}>
                <input
                  type="submit"
                  value="Vote"
                  disabled={selectedAnswer === null || voting}
                />
                <span className="small" style={{ marginLeft: '0.5em' }}>
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </span>
              </div>
            </form>
          )}
        </div>
      )}

      {posts?.data?.map((post) => (
        <ErrorBoundary key={post.id} FallbackComponent={FallbackComponent}>
          <ForumTopicPost post={post} />
        </ErrorBoundary>
      ))}

      {!topic.isLocked && (
        <PostBox forumId={forumId!} topicId={forumTopicId!} />
      )}
    </div>
  );
};

export default ForumTopicPage;
