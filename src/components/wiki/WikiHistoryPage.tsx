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
import { Modal } from '../ui';

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

// Diff line paint from the status tokens (danger removed / success added), so
// the diff recolors with the theme instead of staying fixed red/green washes.
const DIFF_CLASS: Record<string, string> = {
  deleted:
    'bg-[color-mix(in_oklch,var(--st-danger)_22%,transparent)] text-[var(--st-danger)]',
  added:
    'bg-[color-mix(in_oklch,var(--st-success)_22%,transparent)] text-[var(--st-success)]',
  unchanged: 'text-[var(--st-text-muted)]'
};
const DIFF_PREFIX: Record<string, string> = {
  deleted: '−',
  added: '+',
  unchanged: ' '
};

// Compute a simple line-level diff showing added/removed lines between revisions.
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
    <Modal
      title={`Compare r${oldRev} → r${newRev}${data ? ` — ${data.title}` : ''}`}
      size="xl"
      onClose={onClose}
      bodyClassName="p-0"
    >
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
              <span className="select-none mr-2">{DIFF_PREFIX[line.type]}</span>
              {line.text || ' '}
            </div>
          ))}
        </div>
      )}
    </Modal>
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
    <Modal
      title={`Revision ${rev}${isLoading ? '' : data ? ` — ${data.title}` : ''}`}
      size="xl"
      onClose={onClose}
      headerActions={
        canEdit && data ? (
          <button
            onClick={handleRollback}
            disabled={isRollingBack}
            data-st="control"
            data-st-primary
            data-st-warning
            className="text-xs"
          >
            {isRollingBack ? 'Rolling back…' : 'Rollback to this revision'}
          </button>
        ) : undefined
      }
      bodyClassName="p-0"
    >
      {isLoading && (
        <div className="p-6">
          <Spinner />
        </div>
      )}

      {data && (
        <>
          <div
            data-st="meta"
            className="px-5 py-2 border-b border-[var(--st-border)] text-xs"
          >
            By {data.author.username} on{' '}
            {new Date(data.createdAt).toLocaleString()}
          </div>
          <div
            className="p-5 text-sm text-[var(--st-text)] prose prose-invert prose-sm max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(data.body, {
                ALLOWED_TAGS: ALLOWED_WIKI_TAGS,
                ALLOWED_ATTR: ['href', 'class', 'rel', 'target']
              })
            }}
          />
        </>
      )}
    </Modal>
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
          data-st="control"
          className="text-xs"
        >
          ← Back to page
        </Link>
        <h1 data-st="prose" data-st-strong className="text-xl mt-1">
          Revision History
        </h1>
        <p data-st="prose" data-st-muted className="text-sm">
          Current revision: {data.currentRevision}
        </p>
      </div>

      {/* Compare form */}
      {canEdit && allRevNums.length >= 2 && (
        <div
          data-st="panel"
          className="p-4 mb-4 flex items-center gap-3 flex-wrap"
        >
          <span data-st="meta" className="text-xs">
            Compare:
          </span>
          <select
            value={compareOld ?? ''}
            onChange={(e) =>
              setCompareOld(
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            data-st="field"
            className="text-xs"
          >
            <option value="">Old rev…</option>
            {allRevNums.map((r) => (
              <option key={r} value={r}>
                r{r}
              </option>
            ))}
          </select>
          <span data-st="meta" className="text-xs">
            →
          </span>
          <select
            value={compareNew ?? ''}
            onChange={(e) =>
              setCompareNew(
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            data-st="field"
            className="text-xs"
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
            data-st="control"
            data-st-primary
            className="text-xs"
          >
            Compare
          </button>
        </div>
      )}

      {data.revisions.length === 0 && (
        <div data-st="panel" className="px-6 py-10 text-center">
          <p data-st="meta" className="text-sm">
            No prior revisions.
          </p>
        </div>
      )}

      <div data-st="panel">
        <div data-st="list">
          {/* Current revision row — accent wash marks it as the live one */}
          <div data-st="row" data-st-open className="justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--st-accent)] mr-2">
                Current (rev {data.currentRevision})
              </span>
            </div>
            <button
              onClick={() => setViewingRev(data.currentRevision)}
              data-st="control"
              className="text-xs"
            >
              View
            </button>
          </div>

          {data.revisions.map((rev) => (
            <div key={rev.id} data-st="row" className="justify-between">
              <div>
                <span data-st="prose">{rev.title}</span>
                <div data-st="meta" className="text-xs mt-0.5">
                  Rev {rev.revision} · by{' '}
                  <Link to={`/private/user/${rev.author.id}`} data-st="control">
                    {rev.author.username}
                  </Link>{' '}
                  · {new Date(rev.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setViewingRev(rev.revision)}
                data-st="control"
                className="text-xs"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WikiHistoryPage;
