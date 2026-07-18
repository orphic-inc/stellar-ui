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
      <h1 data-st="prose" data-st-strong className="text-3xl mb-6">
        Rules
      </h1>

      {/* The six Golden Rules (GET /api/rules/tree). Bodies are verbatim; the
          ${...} tokens are resolved against the variables map at render time. */}
      {treeError ? (
        <div className="text-red-400 mb-8">Failed to load the rules.</div>
      ) : rules.length === 0 ? (
        <p data-st="prose" data-st-muted className="mb-8">
          No rules content has been published yet.
        </p>
      ) : (
        <div className="space-y-8 mb-10">
          {rules.map((rule) => (
            <section key={rule.id} className="space-y-3">
              <h2 data-st="prose" data-st-strong className="text-xl">
                <span data-st="meta" className="mr-2">
                  {rule.code}.
                </span>
                {rule.title}
              </h2>
              {rule.description && (
                <p data-st="prose">
                  {renderRuleText(rule.description, variables)}
                </p>
              )}
              {rule.subRules.length > 0 && (
                <ul className="space-y-3 border-l border-[var(--st-border)] pl-4">
                  {rule.subRules.map((sub) => (
                    <li key={sub.id} data-st="prose">
                      <span
                        data-st="prose"
                        data-st-strong
                        className="font-semibold"
                      >
                        <span data-st="meta" className="mr-2">
                          {sub.code}
                        </span>
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
          className="prose prose-invert max-w-none mb-8 text-[var(--st-text)]"
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
          <h2 data-st="prose" data-st-strong className="text-xl mb-4">
            Rule Categories
          </h2>
          <ul className="space-y-2">
            {pages.map((page) => (
              <li key={page.id}>
                <Link to={`/rules/${page.slug}`} data-st="control">
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
