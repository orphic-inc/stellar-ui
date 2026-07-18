import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useGetRulesPageQuery } from '../../store/services/rulesApi';
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

const RulesSubPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useGetRulesPageQuery(slug!);

  if (isLoading) return <Spinner />;

  if (error || !page)
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/rules"
          className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block"
        >
          ← Back to Rules
        </Link>
        <p className="text-red-400 mt-4">Page not found.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/rules"
        className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block"
      >
        ← Back to Rules
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">{page.title}</h1>
      <div
        className="prose prose-invert max-w-none text-gray-200"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(page.body, {
            ALLOWED_TAGS,
            ALLOWED_ATTR: ['href', 'class']
          })
        }}
      />
    </div>
  );
};

export default RulesSubPage;
