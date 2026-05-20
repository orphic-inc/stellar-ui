import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DOMPurify from 'dompurify';
import {
  useGetWikiRevisionsQuery,
  useGetWikiRevisionQuery,
  useCompareWikiRevisionsQuery,
  useRollbackWikiPageMutation
} from '../../store/services/wikiApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const ALLOWED_WIKI_TAGS = [
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
  'span',
  'h1',
  'h2',
  'h3'
];

const DIFF_CLASS: Record<string, string> = {
  deleted: 'bg-red-900/40 text-red-300',
  added: 'bg-green-900/40 text-green-300',
  unchanged: 'text-gray-400'
};
const DIFF_PREFIX: Record<string, string> = {
  deleted: '−',
  added: '+',
  unchanged: ' '
};

// Compute a simple line-level diff to mirror Gazelle's compare.php output.
function diffLines(
  oldText: string,
  newText: string
): Array<{ type: 'unchanged' | 'deleted' | 'added'; text: string }> {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: Array<{
    type: 'unchanged' | 'deleted' | 'added';
    text: string;
  }> = [];

  let oi = 0;
  let ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi >= oldLines.length) {
      result.push({ type: 'added', text: newLines[ni++] });
    } else if (ni >= newLines.length) {
      result.push({ type: 'deleted', text: oldLines[oi++] });
    } else if (oldLines[oi] === newLines[ni]) {
      result.push({ type: 'unchanged', text: oldLines[oi] });
      oi++;
      ni++;
    } else {
      result.push({ type: 'deleted', text: oldLines[oi++] });
      result.push({ type: 'added', text: newLines[ni++] });
    }
  }
  return result;
}

const CompareModal = ({
  pageId,
  oldRev,
  newRev,
  onClose
}: {
  pageId: number;
  oldRev: number;
  newRev: number;
  onClose: () => void;
}) => {
  const { data, isLoading, error } = useCompareWikiRevisionsQuery({
    id: pageId,
    old: oldRev,
    new: newRev
  });

  const lines = data ? diffLines(data.old.body, data.new.body) : [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">
            Compare r{oldRev} → r{newRev}
            {data ? ` — ${data.title}` : ''}
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        {isLoading && (
          <div className="p-6">
            <Spinner />
          </div>
        )}
        {error && (
          <div className="p-4 text-red-400 text-sm">
            Failed to load comparison.
          </div>
        )}
        {data && (
          <div className="p-5 font-mono text-xs overflow-x-auto">
            {lines.map((line, i) => (
              <div key={i} className={DIFF_CLASS[line.type]}>
                <span className="select-none mr-2">
                  {DIFF_PREFIX[line.type]}
                </span>
                {line.text || ' '}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RevisionViewer = ({
  pageId,
  rev,
  onClose
}: {
  pageId: number;
  rev: number;
  onClose: () => void;
}) => {
  const { data, isLoading } = useGetWikiRevisionQuery({ id: pageId, rev });
  const dispatch = useDispatch();
  const { data: user } = useGetMeQuery();
  const [rollback, { isLoading: isRollingBack }] =
    useRollbackWikiPageMutation();

  const canEdit = hasAnyPermission(user, [
    'wiki_edit',
    'wiki_manage',
    'admin',
    'staff'
  ]);

  const handleRollback = async () => {
    if (
      !confirm(`Roll back to revision ${rev}? This will create a new revision.`)
    )
      return;
    try {
      await rollback({ id: pageId, rev }).unwrap();
      dispatch(addAlert(`Rolled back to revision ${rev}.`, 'success'));
      onClose();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Rollback failed.', 'danger')
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">
            Revision {rev}
            {isLoading ? '' : data ? ` — ${data.title}` : ''}
          </h3>
          <div className="flex gap-2">
            {canEdit && data && (
              <button
                onClick={handleRollback}
                disabled={isRollingBack}
                className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded transition-colors"
              >
                {isRollingBack ? 'Rolling back…' : 'Rollback to this revision'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="p-6">
            <Spinner />
          </div>
        )}

        {data && (
          <>
            <div className="px-5 py-2 border-b border-gray-700 text-xs text-gray-400">
              By {data.author.username} on{' '}
              {new Date(data.createdAt).toLocaleString()}
            </div>
            <div
              className="p-5 text-sm text-gray-200 prose prose-invert prose-sm max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(data.body, {
                  ALLOWED_TAGS: ALLOWED_WIKI_TAGS,
                  ALLOWED_ATTR: ['href', 'class', 'rel', 'target']
                })
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

const WikiHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const pageId = Number(id);
  const [viewingRev, setViewingRev] = useState<number | null>(null);
  const [compareOld, setCompareOld] = useState<number | null>(null);
  const [compareNew, setCompareNew] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const { data, isLoading, error } = useGetWikiRevisionsQuery(pageId);
  const { data: user } = useGetMeQuery();

  const canEdit = hasAnyPermission(user, [
    'wiki_edit',
    'wiki_manage',
    'admin',
    'staff'
  ]);

  if (isLoading) return <Spinner />;
  if (error || !data)
    return (
      <div className="p-4 text-red-400">Failed to load revision history.</div>
    );

  const allRevNums = [
    data.currentRevision,
    ...data.revisions.map((r) => r.revision)
  ].sort((a, b) => a - b);

  const handleCompare = () => {
    if (compareOld !== null && compareNew !== null && compareOld < compareNew) {
      setShowCompare(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {viewingRev !== null && !showCompare && (
        <RevisionViewer
          pageId={pageId}
          rev={viewingRev}
          onClose={() => setViewingRev(null)}
        />
      )}

      {showCompare && compareOld !== null && compareNew !== null && (
        <CompareModal
          pageId={pageId}
          oldRev={compareOld}
          newRev={compareNew}
          onClose={() => setShowCompare(false)}
        />
      )}

      <div className="mb-4">
        <Link
          to={`/private/wiki/${pageId}`}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Back to page
        </Link>
        <h1 className="text-xl font-bold text-white mt-1">Revision History</h1>
        <p className="text-sm text-gray-400">
          Current revision: {data.currentRevision}
        </p>
      </div>

      {/* Compare form */}
      {canEdit && allRevNums.length >= 2 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400">Compare:</span>
          <select
            value={compareOld ?? ''}
            onChange={(e) =>
              setCompareOld(
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            className="rounded bg-gray-800 border border-gray-600 text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Old rev…</option>
            {allRevNums.map((r) => (
              <option key={r} value={r}>
                r{r}
              </option>
            ))}
          </select>
          <span className="text-gray-500 text-xs">→</span>
          <select
            value={compareNew ?? ''}
            onChange={(e) =>
              setCompareNew(
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            className="rounded bg-gray-800 border border-gray-600 text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">New rev…</option>
            {allRevNums.map((r) => (
              <option key={r} value={r}>
                r{r}
              </option>
            ))}
          </select>
          <button
            onClick={handleCompare}
            disabled={
              compareOld === null ||
              compareNew === null ||
              compareOld >= compareNew
            }
            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded transition-colors"
          >
            Compare
          </button>
        </div>
      )}

      {data.revisions.length === 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-10 text-center">
          <p className="text-gray-500 text-sm">No prior revisions.</p>
        </div>
      )}

      <div className="space-y-2">
        {/* Current revision row */}
        <div className="bg-gray-900 border border-indigo-700 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-400 mr-2">
              Current (rev {data.currentRevision})
            </span>
          </div>
          <button
            onClick={() => setViewingRev(data.currentRevision)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View
          </button>
        </div>

        {data.revisions.map((rev) => (
          <div
            key={rev.id}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div>
              <span className="text-sm text-gray-200">{rev.title}</span>
              <div className="text-xs text-gray-500 mt-0.5">
                Rev {rev.revision} · by{' '}
                <Link
                  to={`/private/user/${rev.author.id}`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {rev.author.username}
                </Link>{' '}
                · {new Date(rev.createdAt).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => setViewingRev(rev.revision)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WikiHistoryPage;
