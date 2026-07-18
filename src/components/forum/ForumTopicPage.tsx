import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetTopicSessionQuery,
  useMarkTopicReadMutation,
  useVotePollMutation,
  useUpdateTopicMutation,
  useTrashTopicMutation,
  useCatchupForumMutation
} from '../../store/services/forumApi';
import { useSubscribeMutation } from '../../store/services/subscriptionApi';
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
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const { data: session, isLoading } = useGetTopicSessionQuery({
    forumId: fId,
    topicId: tId
  });

  const [markRead] = useMarkTopicReadMutation();
  const [votePoll, { isLoading: voting }] = useVotePollMutation();
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const [updateTopic, { isLoading: updatingTopic }] = useUpdateTopicMutation();
  const [trashTopic, { isLoading: trashing }] = useTrashTopicMutation();
  const [catchupForum] = useCatchupForumMutation();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quoteText, setQuoteText] = useState('');

  // Mark the last visible post as read whenever the posts list refreshes.
  useEffect(() => {
    const lastPostId = session?.readState.lastVisiblePostId;
    if (lastPostId != null) {
      markRead({ forumTopicId: tId, forumPostId: lastPostId });
    }
  }, [session?.readState.lastVisiblePostId, tId, markRead]);

  if (isLoading) return <Spinner />;
  if (!session) return <div className="p-4 text-red-400">Topic not found.</div>;

  const { forum, topic, posts, poll, subscription, affordances } = session;

  // Poll answer parsing
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

  const handleTrash = async () => {
    if (!window.confirm('Move this thread to the Trash board?')) return;
    try {
      await trashTopic({ forumId: fId, topicId: tId }).unwrap();
      navigate(`/forums/${fId}`);
    } catch {
      return;
    }
  };

  // Show results when poll is closed or user has already voted (canVoteInPoll=false + poll exists)
  const showPollResults =
    !!poll && (!poll.closed ? !affordances.canVoteInPoll : true);

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/forums" className="hover:text-gray-300">
          Forums
        </Link>
        {forum.forumCategory && (
          <>
            {' › '}
            <span>{forum.forumCategory.name}</span>
          </>
        )}
        {' › '}
        <Link to={`/forums/${fId}`} className="hover:text-gray-300">
          {forum.name}
        </Link>
        {' › '}
        <strong className="text-gray-200">{topic.title}</strong>
      </nav>

      <div data-st="panel" className="mb-4">
        {/* colhead -title: a content title (the thread subject), so it is not
            uppercased like a structural label. Actions are `control` hooks so
            they recolor with the theme instead of going gray-on-light. */}
        <div data-st="colhead" data-st-title>
          <span className="flex items-center gap-2">
            {topic.title}
            {topic.isLocked && <span data-st="chip">[Locked]</span>}
            {topic.isSticky && <span data-st="chip">[Sticky]</span>}
          </span>
          <div className="flex items-center gap-3 text-xs">
            {affordances.canModerate && (
              <>
                <button
                  type="button"
                  data-st="control"
                  onClick={() =>
                    updateTopic({
                      forumId: fId,
                      topicId: tId,
                      isLocked: !topic.isLocked
                    })
                  }
                  disabled={updatingTopic}
                >
                  {topic.isLocked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  data-st="control"
                  onClick={() =>
                    updateTopic({
                      forumId: fId,
                      topicId: tId,
                      isSticky: !topic.isSticky
                    })
                  }
                  disabled={updatingTopic}
                >
                  {topic.isSticky ? 'Unsticky' : 'Sticky'}
                </button>
                <button
                  type="button"
                  data-st="control"
                  data-st-danger
                  onClick={handleTrash}
                  disabled={trashing}
                >
                  Trash
                </button>
              </>
            )}
            <button
              type="button"
              data-st="control"
              onClick={() =>
                subscribe({
                  topicId: tId,
                  action: subscription.isSubscribed
                    ? 'unsubscribe'
                    : 'subscribe'
                })
              }
              disabled={subscribing}
            >
              {subscription.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
            <button
              type="button"
              data-st="control"
              onClick={() => catchupForum(fId)}
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
        <div data-st="panel" className="mb-4 p-4">
          <strong data-st="prose" data-st-strong className="text-sm">
            {poll.question}
          </strong>
          {showPollResults ? (
            // Each answer is a row backed by the `bar` Role (--st-w = pct); the
            // voter's own choice leads (brighter fill), mirroring CollageDetail.
            <div data-st="list" className="mt-3">
              {answers.map((answer, i) => {
                const count = voteCounts[i];
                const pct =
                  totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const mine = myVote?.vote === i;
                return (
                  <div
                    key={i}
                    data-st="row"
                    data-st-lead={mine ? '' : undefined}
                  >
                    <div
                      data-st="bar"
                      data-st-lead={mine ? '' : undefined}
                      style={{ '--st-w': pct } as CSSProperties}
                    />
                    <span
                      data-st="prose"
                      className={`flex-1 min-w-0 text-sm ${mine ? 'font-medium' : ''}`}
                    >
                      {answer}
                    </span>
                    <span
                      data-st="meta"
                      data-st-num
                      className="text-xs whitespace-nowrap"
                    >
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleVote} className="mt-3 space-y-1">
              {answers.map((answer, i) => (
                <label
                  key={i}
                  data-st="prose"
                  className="flex items-center gap-2 text-sm cursor-pointer"
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
                  data-st="control"
                  data-st-primary
                  className="text-sm"
                  disabled={selectedAnswer === null || voting}
                >
                  Vote
                </button>
                <span data-st="meta" data-st-num className="text-xs">
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </span>
              </div>
            </form>
          )}
        </div>
      )}

      {posts.data.map((post) => (
        <ErrorBoundary key={post.id} FallbackComponent={FallbackComponent}>
          <ForumTopicPost
            post={post}
            forumId={fId}
            topicId={tId}
            currentUserId={currentUser?.id}
            canModerate={affordances.canModerate}
            onQuote={(text) => setQuoteText((prev) => prev + text)}
          />
        </ErrorBoundary>
      ))}

      {affordances.canReply && (
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
