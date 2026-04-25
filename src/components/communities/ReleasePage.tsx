import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import CommentsSection from '../layout/CommentsSection';
import { useGetReleaseByIdQuery } from '../../store/services/communityApi';
import { useReportContributionMutation } from '../../store/services/downloadApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import DownloadButton from './DownloadButton';
import LinkStatusBadge from './LinkStatusBadge';
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
    <div className="overlay">
      <div className="overlay_box" style={{ maxWidth: 480 }}>
        <div className="head colhead_dark">Report Dead / Misleading Link</div>
        <div className="pad">
          <label className="label" htmlFor="report-reason">
            Reason
          </label>
          <textarea
            id="report-reason"
            className="input_text w-full"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the problem (dead link, misleading content, etc.)"
          />
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn_cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn_primary"
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

  if (isLoading) return <Spinner />;
  if (error || !release) return <div className="error">Release not found.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/communities">Communities</Link>
        {' › '}
        <Link to={`/private/communities/${communityId}`}>
          {release.communityId ? 'Community' : 'Community'}
        </Link>
        {' › '}
        <strong>{release.title}</strong>
      </div>

      <div className="box">
        <div className="head colhead_dark">
          {release.artist && <span>{release.artist.name} — </span>}
          {release.title}
          {release.year && <span> ({release.year})</span>}
        </div>
        <div className="pad">
          {release.image && (
            <div className="center" style={{ marginBottom: '1em' }}>
              <img
                src={release.image}
                alt={release.title}
                style={{ maxWidth: 200 }}
              />
            </div>
          )}
          {release.type && (
            <p>
              <strong>Type:</strong> {release.type}
            </p>
          )}
          {release.tags && release.tags.length > 0 && (
            <p>
              <strong>Tags:</strong>{' '}
              {release.tags.map((t) => t.name).join(', ')}
            </p>
          )}
          {release.description && <p>{release.description}</p>}
        </div>
      </div>

      <div className="box">
        <div
          className="head colhead_dark"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Contributions</span>
          <button
            type="button"
            className="brackets btn-link"
            style={{ fontSize: '0.85em' }}
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
          <table className="m_table">
            <thead>
              <tr className="colhead">
                <td>Contributor</td>
                <td>Format</td>
                <td>Collaborators</td>
                <td>Notes</td>
                <td>Status</td>
                <td>Download</td>
              </tr>
            </thead>
            <tbody>
              {release.contributions.map((c) => {
                const linkStatus = ((c as { linkStatus?: string }).linkStatus ??
                  'UNKNOWN') as LinkHealthStatus;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/private/user/${c.user.id}`}>
                        {c.user.username}
                      </Link>
                    </td>
                    <td className="small">{c.type}</td>
                    <td>
                      {c.collaborators.map((a) => a.name).join(', ') || '—'}
                    </td>
                    <td>{c.releaseDescription ?? '—'}</td>
                    <td>
                      <LinkStatusBadge status={linkStatus} />
                    </td>
                    <td
                      style={{
                        display: 'flex',
                        gap: '0.4em',
                        alignItems: 'center'
                      }}
                    >
                      <DownloadButton
                        contributionId={c.id}
                        canDownload={user?.canDownload ?? false}
                      />
                      <button
                        type="button"
                        className="btn-link small text-gray-400"
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
          <div className="pad small">
            No contributions yet.{' '}
            <button
              type="button"
              className="btn-link"
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
