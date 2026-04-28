import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import CommentsSection from '../layout/CommentsSection';
import {
  useGetReleaseByIdQuery,
  useGetCommunityByIdQuery
} from '../../store/services/communityApi';
import { useReportContributionMutation } from '../../store/services/downloadApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import DownloadButton from './DownloadButton';
import LinkStatusBadge from './LinkStatusBadge';
import { formatBytes } from '../../utils';
import type { LinkHealthStatus } from '../../types';

interface ReportModalProps {
  contributionId: number;
  onClose: () => void;
}

const ReportModal = ({ contributionId, onClose }: ReportModalProps) => {
  const [reason, setReason] = useState('');
  const dispatch = useAppDispatch();
  const [reportContribution, { isLoading }] = useReportContributionMutation();

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    try {
      await reportContribution({ contributionId, reason }).unwrap();
      dispatch(addAlert('Report submitted. Thank you.', 'success'));
      onClose();
    } catch {
      dispatch(addAlert('Failed to submit report.', 'danger'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded w-full max-w-md mx-4">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t text-sm font-semibold text-gray-200">
          Report Dead / Misleading Link
        </div>
        <div className="p-4">
          <label
            className="block text-sm text-gray-400 mb-1"
            htmlFor="report-reason"
          >
            Reason
          </label>
          <textarea
            id="report-reason"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the problem (dead link, misleading content, etc.)"
          />
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReleasePage = () => {
  const { communityId, releaseId } = useParams<{
    communityId: string;
    releaseId: string;
  }>();
  const cId = parseInt(communityId ?? '0');
  const rId = parseInt(releaseId ?? '0');
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [reportingId, setReportingId] = useState<number | null>(null);

  const {
    data: release,
    isLoading,
    error
  } = useGetReleaseByIdQuery({
    communityId: cId,
    releaseId: rId
  });
  const { data: community } = useGetCommunityByIdQuery(cId);

  if (isLoading) return <Spinner />;
  if (error || !release)
    return <div className="p-4 text-red-400">Release not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
          Communities
        </Link>
        {' › '}
        <Link
          to={`/private/communities/${communityId}`}
          className="hover:text-gray-300"
        >
          {community?.name ?? 'Community'}
        </Link>
        {' › '}
        <strong className="text-gray-200">{release.title}</strong>
      </nav>

      <div className="rounded border border-gray-700 bg-gray-900 mb-4">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t text-sm font-semibold text-gray-200">
          {release.artist && <span>{release.artist.name} — </span>}
          {release.title}
          {release.year && <span> ({release.year})</span>}
        </div>
        <div className="p-4">
          {release.image && (
            <div className="flex justify-center mb-4">
              <img
                src={release.image}
                alt={release.title}
                className="max-w-[200px] rounded"
              />
            </div>
          )}
          {release.type && (
            <p className="text-sm text-gray-400 mb-1">
              <span className="text-gray-300 font-medium">Type:</span>{' '}
              {release.type}
            </p>
          )}
          {release.tags && release.tags.length > 0 && (
            <p className="text-sm text-gray-400 mb-1">
              <span className="text-gray-300 font-medium">Tags:</span>{' '}
              {release.tags.map((t) => t.name).join(', ')}
            </p>
          )}
          {release.description && (
            <p className="text-sm text-gray-400 mt-2">{release.description}</p>
          )}
        </div>
      </div>

      <div className="rounded border border-gray-700 bg-gray-900 mb-4">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-200">
            Contributions
          </span>
          <button
            type="button"
            className="text-xs text-indigo-400 hover:text-indigo-300"
            onClick={() =>
              navigate(
                `/private/communities/${communityId}/releases/${releaseId}/contribute`
              )
            }
          >
            + Add your version
          </button>
        </div>
        {release.contributions && release.contributions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="px-4 py-2 font-medium">Contributor</th>
                <th className="px-4 py-2 font-medium">Format</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Collaborators</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {release.contributions.map((c) => {
                const linkStatus = ((c as { linkStatus?: string }).linkStatus ??
                  'UNKNOWN') as LinkHealthStatus;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${c.user.username}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {c.user.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {c.type}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                      {c.sizeInBytes ? formatBytes(Number(c.sizeInBytes)) : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {c.collaborators.map((a) => a.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {c.releaseDescription ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <LinkStatusBadge status={linkStatus} />
                    </td>
                    <td className="px-4 py-2 flex gap-2 items-center">
                      <DownloadButton
                        contributionId={c.id}
                        canDownload={user?.canDownload ?? false}
                      />
                      <button
                        type="button"
                        className="text-xs text-gray-500 hover:text-gray-300"
                        title="Report dead or misleading link"
                        onClick={() => setReportingId(c.id)}
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-4 text-sm text-gray-500">
            No contributions yet.{' '}
            <button
              type="button"
              className="text-indigo-400 hover:text-indigo-300"
              onClick={() =>
                navigate(
                  `/private/communities/${communityId}/releases/${releaseId}/contribute`
                )
              }
            >
              Be the first to contribute a file.
            </button>
          </div>
        )}
      </div>

      <CommentsSection page="release" pageId={rId} />

      {reportingId !== null && (
        <ReportModal
          contributionId={reportingId}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
};

export default ReleasePage;
