import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetTopicByIdQuery,
  useGetPostsByTopicQuery,
  useMarkTopicReadMutation
} from '../../../store/services/forumApi';
import Spinner from '../../layout/Spinner';
import PostBox from '../../layout/PostBox';
import ForumTopicPost from './ForumTopicPost';
import ErrorBoundary from '../../layout/ErrorBoundary';
import FallbackComponent from '../../layout/FallbackComponent';

const ForumTopicPage = () => {
  const { forumId, forumTopicId } = useParams<{
    forumId: string;
    forumTopicId: string;
  }>();
  const fId = parseInt(forumId!);
  const tId = parseInt(forumTopicId!);

  const { data: topic, isLoading: topicLoading } = useGetTopicByIdQuery({
    forumId: fId,
    topicId: tId
  });
  const { data: posts, isLoading: postsLoading } = useGetPostsByTopicQuery({
    forumId: fId,
    topicId: tId
  });
  const [markRead] = useMarkTopicReadMutation();

  useEffect(() => {
    if (posts?.length) {
      markRead({ forumTopicId: tId, forumPostId: posts[posts.length - 1].id });
    }
  }, [posts, tId, markRead]);

  if (topicLoading || postsLoading) return <Spinner />;
  if (!topic) return <div className="error">Topic not found.</div>;

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
        <div className="head colhead_dark">
          <span>{topic.title}</span>
          {topic.isLocked && <span className="topic-locked">[Locked]</span>}
          {topic.isSticky && <span className="topic-sticky">[Sticky]</span>}
        </div>
      </div>

      {posts?.map((post) => (
        <ErrorBoundary key={post.id} FallbackComponent={FallbackComponent}>
          <ForumTopicPost
            post={post}
            forumId={forumId!}
            topicId={forumTopicId!}
          />
        </ErrorBoundary>
      ))}

      {!topic.isLocked && (
        <PostBox forumId={forumId!} topicId={forumTopicId!} />
      )}
    </div>
  );
};

export default ForumTopicPage;
