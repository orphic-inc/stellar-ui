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
      <h2 data-st="prose" data-st-strong className="text-xl mb-4">
        Forums
      </h2>
      {categories?.map((category) => (
        <div key={category.id} data-st="panel" className="mb-4">
          <div data-st="colhead">{category.name}</div>
          {/* Genuine columnar data: keep the <table> + colgroup so the stat
              columns stay aligned. The contract's row/colhead table variant
              paints it (ADR-0006); column alignment is the whole reason this
              surface stays a table rather than div-converting like ForumPage. */}
          <table data-st="grid" className="text-sm table-fixed">
            <colgroup>
              <col />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-48" />
            </colgroup>
            <thead data-st="colhead">
              <tr>
                <th>Forum</th>
                <th data-st-num>Topics</th>
                <th data-st-num>Posts</th>
                <th>Latest</th>
              </tr>
            </thead>
            <tbody>
              {category.forums?.map((forum) => (
                <tr key={forum.id} data-st="row">
                  <td>
                    <Link to={`/forums/${forum.id}`} data-st="title">
                      {forum.name}
                    </Link>
                    {forum.description && (
                      <div data-st="meta" className="text-xs mt-0.5">
                        {forum.description}
                      </div>
                    )}
                  </td>
                  <td data-st-num>{forum.numTopics}</td>
                  <td data-st-num>{forum.numPosts}</td>
                  <td>
                    {forum.lastTopic ? (
                      <Link
                        to={`/forums/${forum.id}/topics/${forum.lastTopic.id}`}
                        data-st="control"
                        className="text-xs"
                      >
                        {forum.lastTopic.title}
                      </Link>
                    ) : (
                      <span data-st="meta" className="text-xs">
                        —
                      </span>
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
