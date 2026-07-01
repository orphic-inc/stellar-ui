import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetReportQuery,
  useClaimReportMutation,
  useUnclaimReportMutation,
  useResolveReportMutation,
  useAddReportNoteMutation
} from '../../store/services/reportsApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import { canUseReportActions } from '../staff/staffAffordances';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const RESOLUTION_ACTIONS = [
  { value: 'Dismissed', label: 'Dismissed — no action taken' },
  { value: 'ContentRemoved', label: 'Content removed' },
  { value: 'UserWarned', label: 'User warned' },
  { value: 'UserDisabled', label: 'User disabled' },
  { value: 'MetadataFixed', label: 'Metadata fixed' },
  { value: 'MarkedDuplicate', label: 'Marked as duplicate' },
  { value: 'Other', label: 'Other' }
];

const STATUS_TONE: Record<string, BadgeVariant> = {
  Open: 'warning',
  Claimed: 'info',
  Resolved: 'default'
};

function buildSourceLink(
  sourceUrl: string | null,
  targetType: string,
  targetId: number
): { href: string; label: string } | { label: string } {
  const label = `${targetType} #${targetId}`;
  return sourceUrl ? { href: sourceUrl, label } : { label };
}

const ReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const canModerateReport = canUseReportActions(currentUser);

  const { data: report, isLoading, error } = useGetReportQuery(reportId);
  const [claimReport, { isLoading: claiming }] = useClaimReportMutation();
  const [unclaimReport, { isLoading: unclaiming }] = useUnclaimReportMutation();
  const [resolveReport, { isLoading: resolving }] = useResolveReportMutation();
  const [addNote, { isLoading: addingNote }] = useAddReportNoteMutation();

  const [noteBody, setNoteBody] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolutionAction, setResolutionAction] = useState('Dismissed');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const handleClaim = async () => {
    try {
      await claimReport(reportId).unwrap();
    } catch {
      dispatch(addAlert('Failed to claim report.', 'danger'));
    }
  };

  const handleUnclaim = async () => {
    try {
      await unclaimReport(reportId).unwrap();
    } catch {
      dispatch(addAlert('Failed to unclaim report.', 'danger'));
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution.trim()) return;
    try {
      await resolveReport({
        id: reportId,
        resolution,
        resolutionAction
      }).unwrap();
      setShowResolveForm(false);
    } catch {
      dispatch(addAlert('Failed to resolve report.', 'danger'));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    try {
      await addNote({ id: reportId, body: noteBody }).unwrap();
      setNoteBody('');
    } catch {
      dispatch(addAlert('Failed to add note.', 'danger'));
    }
  };

  useEffect(() => {
    if (
      error &&
      'status' in error &&
      error.status === 403 &&
      !canModerateReport
    ) {
      navigate('/private/reports/mine', { replace: true });
    }
  }, [error, canModerateReport, navigate]);

  if (isLoading) return <Spinner />;
  if (error || !report)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Report not found or access denied.
      </div>
    );

  const isResolved = report.status === 'Resolved';
  const isClaimedByMe = report.claimedById === currentUser?.id;

  return (
    <div className="thin">
      <div className="mb-4">
        {canModerateReport ? (
          <Link
            to="/private/staff/reports"
            data-st="control"
            className="text-sm"
          >
            ← Reports Queue
          </Link>
        ) : (
          <Link
            to="/private/reports/mine"
            data-st="control"
            className="text-sm"
          >
            ← My Reports
          </Link>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 data-st="prose" data-st-strong className="text-xl">
            {report.targetType} Report — {report.category}
          </h2>
          <div
            data-st="meta"
            className="flex flex-wrap items-center gap-3 mt-1 text-sm"
          >
            <span>
              Filed by{' '}
              <span data-st="prose" data-st-strong>
                {report.reporter.username}
              </span>
            </span>
            {(() => {
              const src = buildSourceLink(
                report.sourceUrl,
                report.targetType,
                report.targetId
              );
              return 'href' in src ? (
                <Link to={src.href} data-st="control">
                  {src.label} →
                </Link>
              ) : (
                <span>{src.label}</span>
              );
            })()}
            <Badge variant={STATUS_TONE[report.status] ?? 'default'}>
              {report.status}
            </Badge>
            {report.claimedBy && (
              <span>
                Claimed by{' '}
                <span data-st="prose" data-st-strong>
                  {report.claimedBy.username}
                </span>
              </span>
            )}
          </div>
        </div>

        {canModerateReport && !isResolved && (
          <div className="flex gap-2 text-sm shrink-0">
            {!report.claimedById && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                data-st="control"
                data-st-primary
              >
                Claim
              </button>
            )}
            {isClaimedByMe && (
              <button
                onClick={handleUnclaim}
                disabled={unclaiming}
                data-st="control"
                className="px-3 py-1.5 rounded border border-[var(--st-border)] disabled:opacity-50"
              >
                Unclaim
              </button>
            )}
            <button
              onClick={() => setShowResolveForm((v) => !v)}
              data-st="control"
              data-st-primary
              data-st-success
            >
              Resolve
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div data-st="panel" className="p-4">
          <p data-st="meta" className="text-xs uppercase mb-2">
            Reason
          </p>
          <p data-st="prose" className="whitespace-pre-wrap">
            {report.reason}
          </p>
        </div>

        {report.evidence && (
          <div data-st="panel" className="p-4">
            <p data-st="meta" className="text-xs uppercase mb-2">
              Evidence
            </p>
            <p data-st="prose" className="whitespace-pre-wrap">
              {report.evidence}
            </p>
          </div>
        )}

        {isResolved && (
          <div data-st="panel" className="p-4">
            <p data-st="meta" className="text-xs uppercase mb-2">
              Resolution
            </p>
            <p data-st="meta" className="text-sm mb-1">
              Action:{' '}
              <span data-st="prose" data-st-strong>
                {report.resolutionAction}
              </span>
            </p>
            <p data-st="prose" className="whitespace-pre-wrap">
              {report.resolution}
            </p>
            {report.resolvedBy && (
              <p data-st="meta" className="text-xs mt-2">
                Resolved by {report.resolvedBy.username} on{' '}
                {new Date(report.resolvedAt!).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {canModerateReport && showResolveForm && !isResolved && (
        <form
          onSubmit={handleResolve}
          data-st="panel"
          className="mb-6 p-4 space-y-3"
        >
          <h3 data-st="prose" data-st-strong className="text-sm">
            Resolve Report
          </h3>
          <div>
            <label
              htmlFor="resolution-action"
              data-st="meta"
              className="block text-sm mb-1"
            >
              Action taken
            </label>
            <select
              id="resolution-action"
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
              data-st="field"
              className="w-full px-3 py-2 text-sm"
            >
              {RESOLUTION_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="resolution-text"
              data-st="meta"
              className="block text-sm mb-1"
            >
              Resolution notes
            </label>
            <textarea
              id="resolution-text"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              required
              rows={3}
              data-st="field"
              className="w-full px-3 py-2 text-sm resize-y"
              placeholder="Describe what was done…"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={resolving}
              data-st="control"
              data-st-primary
              data-st-success
              className="text-sm"
            >
              {resolving ? 'Resolving…' : 'Confirm Resolve'}
            </button>
            <button
              type="button"
              onClick={() => setShowResolveForm(false)}
              data-st="control"
              className="px-4 py-2 rounded border border-[var(--st-border)] text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {canModerateReport && report.notes.length > 0 && (
        <div className="mb-6">
          <h3 data-st="prose" data-st-strong className="text-sm mb-3">
            Moderator Notes
          </h3>
          <div className="space-y-3">
            {report.notes.map((note) => (
              <div key={note.id} data-st="panel" className="p-3">
                <div
                  data-st="meta"
                  className="flex items-center gap-2 mb-1 text-xs"
                >
                  <span data-st="prose" data-st-strong>
                    {note.author.username}
                  </span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p data-st="prose" className="text-sm whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {canModerateReport && (
        <form onSubmit={handleAddNote} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="note-body"
              data-st="meta"
              className="block text-sm mb-1"
            >
              Add moderator note
            </label>
            <textarea
              id="note-body"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              data-st="field"
              className="w-full px-3 py-2 text-sm resize-y"
              placeholder="Internal note visible to staff only…"
            />
          </div>
          <button
            type="submit"
            disabled={addingNote || !noteBody.trim()}
            data-st="control"
            data-st-primary
            className="self-start text-sm"
          >
            {addingNote ? 'Adding…' : 'Add Note'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReportDetailPage;
