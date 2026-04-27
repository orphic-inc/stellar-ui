import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetReportQuery,
  useClaimReportMutation,
  useUnclaimReportMutation,
  useResolveReportMutation,
  useAddReportNoteMutation
} from '../../store/services/reportsApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { hasAnyPermission } from '../../utils/permissions';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';

const RESOLUTION_ACTIONS = [
  { value: 'Dismissed', label: 'Dismissed — no action taken' },
  { value: 'ContentRemoved', label: 'Content removed' },
  { value: 'UserWarned', label: 'User warned' },
  { value: 'UserDisabled', label: 'User disabled' },
  { value: 'MetadataFixed', label: 'Metadata fixed' },
  { value: 'MarkedDuplicate', label: 'Marked as duplicate' },
  { value: 'Other', label: 'Other' }
];

const STATUS_BADGE: Record<string, string> = {
  Open: 'bg-yellow-800 text-yellow-200',
  Claimed: 'bg-blue-800 text-blue-200',
  Resolved: 'bg-gray-700 text-gray-400'
};

const ReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isStaff = hasAnyPermission(currentUser, ['staff', 'admin']);

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

  if (isLoading) return <Spinner />;
  if (error || !report)
    return (
      <div className="p-4 text-red-400">Report not found or access denied.</div>
    );

  const isResolved = report.status === 'Resolved';
  const isClaimedByMe = report.claimedById === currentUser?.id;

  return (
    <div className="thin">
      <div className="mb-4">
        {isStaff ? (
          <Link
            to="/private/staff/reports"
            className="text-blue-400 text-sm hover:underline"
          >
            ← Reports Queue
          </Link>
        ) : (
          <Link
            to="/private/reports/mine"
            className="text-blue-400 text-sm hover:underline"
          >
            ← My Reports
          </Link>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">
            {report.targetType} Report — {report.category}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-400">
            <span>
              Filed by{' '}
              <span className="text-gray-200">{report.reporter.username}</span>
            </span>
            <span>Target ID: {report.targetId}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                STATUS_BADGE[report.status] ?? 'bg-gray-700 text-gray-400'
              }`}
            >
              {report.status}
            </span>
            {report.claimedBy && (
              <span>
                Claimed by{' '}
                <span className="text-gray-200">
                  {report.claimedBy.username}
                </span>
              </span>
            )}
          </div>
        </div>

        {isStaff && !isResolved && (
          <div className="flex gap-2 text-sm shrink-0">
            {!report.claimedById && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Claim
              </button>
            )}
            {isClaimedByMe && (
              <button
                onClick={handleUnclaim}
                disabled={unclaiming}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50"
              >
                Unclaim
              </button>
            )}
            <button
              onClick={() => setShowResolveForm((v) => !v)}
              className="px-3 py-1.5 bg-green-800 hover:bg-green-700 text-white rounded"
            >
              Resolve
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <p className="text-xs text-gray-500 uppercase mb-2">Reason</p>
          <p className="text-gray-200 whitespace-pre-wrap">{report.reason}</p>
        </div>

        {report.evidence && (
          <div className="bg-gray-900 border border-gray-700 rounded p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Evidence</p>
            <p className="text-gray-200 whitespace-pre-wrap">
              {report.evidence}
            </p>
          </div>
        )}

        {isResolved && (
          <div className="bg-gray-900 border border-green-900 rounded p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Resolution</p>
            <p className="text-sm text-gray-400 mb-1">
              Action:{' '}
              <span className="text-gray-200">{report.resolutionAction}</span>
            </p>
            <p className="text-gray-200 whitespace-pre-wrap">
              {report.resolution}
            </p>
            {report.resolvedBy && (
              <p className="text-xs text-gray-500 mt-2">
                Resolved by {report.resolvedBy.username} on{' '}
                {new Date(report.resolvedAt!).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {isStaff && showResolveForm && !isResolved && (
        <form
          onSubmit={handleResolve}
          className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded space-y-3"
        >
          <h3 className="text-sm font-semibold text-gray-300">
            Resolve Report
          </h3>
          <div>
            <label
              htmlFor="resolution-action"
              className="block text-sm text-gray-400 mb-1"
            >
              Action taken
            </label>
            <select
              id="resolution-action"
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
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
              className="block text-sm text-gray-400 mb-1"
            >
              Resolution notes
            </label>
            <textarea
              id="resolution-text"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
              placeholder="Describe what was done…"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={resolving}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded disabled:opacity-50"
            >
              {resolving ? 'Resolving…' : 'Confirm Resolve'}
            </button>
            <button
              type="button"
              onClick={() => setShowResolveForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isStaff && report.notes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Moderator Notes
          </h3>
          <div className="space-y-3">
            {report.notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-800 border border-gray-700 rounded p-3"
              >
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                  <span className="text-gray-300">{note.author.username}</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isStaff && (
        <form onSubmit={handleAddNote} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="note-body"
              className="block text-sm text-gray-400 mb-1"
            >
              Add moderator note
            </label>
            <textarea
              id="note-body"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
              placeholder="Internal note visible to staff only…"
            />
          </div>
          <button
            type="submit"
            disabled={addingNote || !noteBody.trim()}
            className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
          >
            {addingNote ? 'Adding…' : 'Add Note'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReportDetailPage;
