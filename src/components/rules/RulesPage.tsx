import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useGetRulesIndexQuery } from '../../store/services/rulesApi';
import Spinner from '../layout/Spinner';

const ALLOWED_TAGS = [
  'b',
  'i',
  'u',
  'em',
  'strong',
  'a',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'span'
];

const RulesPage = () => {
  const { data, isLoading, error } = useGetRulesIndexQuery();

  if (isLoading) return <Spinner />;

  if (error)
    return <div className="text-red-400 p-4">Failed to load rules.</div>;

  const { main, pages } = data ?? { main: null, pages: [] };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Rules</h1>

      {main ? (
        <div
          className="prose prose-invert max-w-none mb-8 text-gray-200"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(main.body, {
              ALLOWED_TAGS,
              ALLOWED_ATTR: ['href', 'class']
            })
          }}
        />
      ) : (
        <p className="text-gray-400 mb-8">
          No rules content has been published yet.
        </p>
      )}

      {pages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Rule Categories
          </h2>
          <ul className="space-y-2">
            {pages.map((page) => (
              <li key={page.id}>
                <Link
                  to={`/private/rules/${page.slug}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
