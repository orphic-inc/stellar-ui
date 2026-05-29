import { Link } from 'react-router-dom';
import { useGetForumCategoriesQuery } from '../../store/services/forumApi';
import Spinner from '../layout/Spinner';

const ForumCategoryPage = () => {
  const { data: categories, isLoading, error } = useGetForumCategoriesQuery();

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load forums.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Forums</h2>
      {categories?.map((category) => (
        <div
          key={category.id}
          className="rounded border border-gray-700 bg-gray-900 mb-4"
        >
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t text-sm font-semibold text-gray-200">
            {category.name}
          </div>
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-48" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="px-4 py-2 font-medium">Forum</th>
                <th className="px-4 py-2 font-medium text-right">Topics</th>
                <th className="px-4 py-2 font-medium text-right">Posts</th>
                <th className="px-4 py-2 font-medium">Latest</th>
              </tr>
            </thead>
            <tbody>
              {category.forums?.map((forum) => (
                <tr
                  key={forum.id}
                  className="border-b border-gray-800 hover:bg-gray-800/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/private/forums/${forum.id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {forum.name}
                    </Link>
                    {forum.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {forum.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-right">
                    {forum.numTopics}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-right">
                    {forum.numPosts}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {forum.lastTopic ? (
                      <Link
                        to={`/private/forums/${forum.id}/topics/${forum.lastTopic.id}`}
                        className="text-gray-300 hover:text-gray-100"
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
