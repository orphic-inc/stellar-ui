import { Link } from 'react-router-dom';
import { useGetForumCategoriesQuery } from '../../../store/services/forumApi';
import Spinner from '../../layout/Spinner';

const ForumCategoryPage = () => {
  const { data: categories, isLoading, error } = useGetForumCategoriesQuery();

  if (isLoading) return <Spinner />;
  if (error) return <div className="error">Failed to load forums.</div>;

  return (
    <div className="thin">
      <h2>Forums</h2>
      {categories?.map((category) => (
        <div key={category.id} className="forum-category box">
          <div className="head colhead_dark">{category.name}</div>
          <table className="forum_index m_table">
            <thead>
              <tr className="colhead">
                <td className="forum-name">Forum</td>
                <td className="forum-stats">Topics</td>
                <td className="forum-stats">Posts</td>
                <td className="forum-latest">Latest</td>
              </tr>
            </thead>
            <tbody>
              {category.forums?.map((forum) => (
                <tr key={forum.id} className="forum-row">
                  <td>
                    <Link
                      to={`/private/forums/${forum.id}`}
                      className="forum-title"
                    >
                      {forum.name}
                    </Link>
                    {forum.description && (
                      <div className="forum-description">
                        {forum.description}
                      </div>
                    )}
                  </td>
                  <td className="forum-stats">{forum.numTopics}</td>
                  <td className="forum-stats">{forum.numPosts}</td>
                  <td className="forum-latest">
                    {forum.lastTopic ? (
                      <Link
                        to={`/private/forums/${forum.id}/topics/${forum.lastTopic.id}`}
                      >
                        {forum.lastTopic.title}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ForumCategoryPage;
