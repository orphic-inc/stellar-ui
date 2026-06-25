import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  useGetRulesIndexQuery,
  useGetRulesTreeQuery
} from '../../store/services/rulesApi';
import { renderRuleText } from '../../utils/rulesText';
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
  const {
    data: tree,
    isLoading: treeLoading,
    error: treeError
  } = useGetRulesTreeQuery();
  const { data: index } = useGetRulesIndexQuery();

  if (treeLoading) return <Spinner />;

  const variables = tree?.variables ?? {};
  const rules = tree?.rules ?? [];
  const { main, pages } = index ?? { main: null, pages: [] };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Rules</h1>

      {/* The six Golden Rules (GET /api/rules/tree). Bodies are verbatim; the
          ${...} tokens are resolved against the variables map at render time. */}
      {treeError ? (
        <div className="text-red-400 mb-8">Failed to load the rules.</div>
      ) : rules.length === 0 ? (
        <p className="text-gray-400 mb-8">
          No rules content has been published yet.
        </p>
      ) : (
        <div className="space-y-8 mb-10">
          {rules.map((rule) => (
            <section key={rule.id} className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                <span className="text-gray-500 mr-2">{rule.code}.</span>
                {rule.title}
              </h2>
              {rule.description && (
                <p className="text-gray-300">
                  {renderRuleText(rule.description, variables)}
                </p>
              )}
              {rule.subRules.length > 0 && (
                <ul className="space-y-3 border-l border-gray-700 pl-4">
                  {rule.subRules.map((sub) => (
                    <li key={sub.id} className="text-gray-300">
                      <span className="font-semibold text-gray-100">
                        <span className="text-gray-500 mr-2">{sub.code}</span>
                        {sub.title}
                      </span>{' '}
                      {renderRuleText(sub.description, variables)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Supplementary prose pages (GET /api/rules), shown when published. */}
      {main && (
        <div
          className="prose prose-invert max-w-none mb-8 text-gray-200"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(main.body, {
              ALLOWED_TAGS,
              ALLOWED_ATTR: ['href', 'class']
            })
          }}
        />
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
