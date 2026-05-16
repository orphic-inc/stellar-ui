import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetTopicByIdQuery,
  useGetPostsByTopicQuery,
  useGetForumByIdQuery,
  useMarkTopicReadMutation,
  useGetPollByTopicQuery,
  useVotePollMutation,
  useUpdateTopicMutation,
  useCatchupForumMutation
} from '../../store/services/forumApi';
import {
  useGetSubscriptionsQuery,
  useSubscribeMutation
} from '../../store/services/subscriptionApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { hasAnyPermission } from '../../utils/permissions';
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

  const { data: forum } = useGetForumByIdQuery(fId);
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
  const [updateTopic, { isLoading: updatingTopic }] = useUpdateTopicMutation();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quoteText, setQuoteText] = useState('');

  const [catchupForum] = useCatchupForumMutation();

  const isSubscribed = subscriptions?.some((s) => s.topicId === tId) ?? false;
  const canModerate = hasAnyPermission(currentUser, [
    'forums_moderate',
    'forums_manage',
    'staff',
    'admin'
  ]);

  useEffect(() => {
    if (posts?.data?.length) {
      markRead({
        forumTopicId: tId,
        forumPostId: posts.data[posts.data.length - 1].id
      });
    }
  }, [posts, tId, markRead]);

  if (topicLoading || postsLoading) return <Spinner />;
  if (!topic) return <div className="p-4 text-red-400">Topic not found.</div>;

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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/forums" className="hover:text-gray-300">
          Forums
        </Link>
        {' › '}
        <Link to={`/private/forums/${forumId}`} className="hover:text-gray-300">
          {forum?.name ?? 'Forum'}
        </Link>
        {' › '}
        <strong className="text-gray-200">{topic.title}</strong>
      </nav>

      <div className="rounded border border-gray-700 bg-gray-900 mb-4">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-200">
            {topic.title}
            {topic.isLocked && (
              <span className="ml-2 text-xs text-yellow-500 font-normal">
                [Locked]
              </span>
            )}
            {topic.isSticky && (
              <span className="ml-2 text-xs text-blue-400 font-normal">
                [Sticky]
              </span>
            )}
          </span>
          <div className="flex items-center gap-3">
            {canModerate && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    updateTopic({
                      forumId: fId,
                      topicId: tId,
                      isLocked: !topic.isLocked
                    })
                  }
                  disabled={updatingTopic}
                  className="text-xs text-gray-400 hover:text-yellow-400 disabled:opacity-50"
                >
                  {topic.isLocked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateTopic({
                      forumId: fId,
                      topicId: tId,
                      isSticky: !topic.isSticky
                    })
                  }
                  disabled={updatingTopic}
                  className="text-xs text-gray-400 hover:text-blue-400 disabled:opacity-50"
                >
                  {topic.isSticky ? 'Unsticky' : 'Sticky'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() =>
                subscribe({
                  topicId: tId,
                  action: isSubscribed ? 'unsubscribe' : 'subscribe'
                })
              }
              disabled={subscribing}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
            <button
              type="button"
              onClick={() => catchupForum(fId)}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Catch Up
            </button>
          </div>
        </div>
      </div>

      {poll && pollParseError && (
        <div className="rounded border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400 mb-4">
          Poll data is unavailable.
        </div>
      )}

      {poll && !pollParseError && answers.length > 0 && (
        <div className="rounded border border-gray-700 bg-gray-900 mb-4 p-4">
          <strong className="text-sm text-gray-200">{poll.question}</strong>
          {myVote !== undefined || poll.closed ? (
            <table className="w-full text-sm mt-3">
              <tbody>
                {answers.map((answer, i) => {
                  const count = voteCounts[i];
                  const pct =
                    totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <tr
                      key={i}
                      className={myVote?.vote === i ? 'font-medium' : ''}
                    >
                      <td className="py-1 pr-3 text-gray-300 w-40">{answer}</td>
                      <td className="py-1 pr-3">
                        <div className="bg-gray-700 h-3 rounded overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-1 text-gray-400 text-right whitespace-nowrap text-xs">
                        {count} ({pct}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <form onSubmit={handleVote} className="mt-3 space-y-1">
              {answers.map((answer, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="poll-answer"
                    value={i}
                    onChange={() => setSelectedAnswer(i)}
                    checked={selectedAnswer === i}
                    className="accent-indigo-500"
                  />
                  {answer}
                </label>
              ))}
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                  disabled={selectedAnswer === null || voting}
                >
                  Vote
                </button>
                <span className="text-xs text-gray-500">
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </span>
              </div>
            </form>
          )}
        </div>
      )}

      {posts?.data?.map((post) => (
        <ErrorBoundary key={post.id} FallbackComponent={FallbackComponent}>
          <ForumTopicPost
            post={post}
            forumId={fId}
            topicId={tId}
            currentUserId={currentUser?.id}
            canModerate={canModerate}
            onQuote={(text) => setQuoteText((prev) => prev + text)}
          />
        </ErrorBoundary>
      ))}

      {(!topic.isLocked || canModerate) && (
        <PostBox
          forumId={forumId!}
          topicId={forumTopicId!}
          quoteText={quoteText}
          onQuoteConsumed={() => setQuoteText('')}
        />
      )}
    </div>
  );
};

export default ForumTopicPage;
