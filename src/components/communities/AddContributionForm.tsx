import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetReleaseByIdQuery,
  useAddContributionToReleaseMutation
} from '../../store/services/communityApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const FILE_TYPES = [
  'mp3',
  'flac',
  'wav',
  'ogg',
  'aac',
  'm4a',
  'm4b',
  'mp4',
  'mkv',
  'avi',
  'mov',
  'zip',
  'exe',
  'dmg',
  'apk',
  'pdf',
  'epub',
  'mobi',
  'cbz',
  'cbr',
  'jpg',
  'png',
  'gif',
  'txt'
] as const;
type FileType = (typeof FILE_TYPES)[number];

const AddContributionForm = () => {
  const { communityId, releaseId } = useParams<{
    communityId: string;
    releaseId: string;
  }>();
  const cId = parseInt(communityId ?? '0');
  const rId = parseInt(releaseId ?? '0');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: release, isLoading: releaseLoading } = useGetReleaseByIdQuery({
    communityId: cId,
    releaseId: rId
  });
  const [addContribution, { isLoading }] =
    useAddContributionToReleaseMutation();

  const [fileType, setFileType] = useState<FileType>('mp3');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sizeInBytes, setSizeInBytes] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContribution({
        communityId: cId,
        releaseId: rId,
        fileType,
        downloadUrl,
        sizeInBytes: sizeInBytes ? parseInt(sizeInBytes, 10) : undefined,
        releaseDescription: releaseDescription || undefined
      }).unwrap();
      dispatch(addAlert('Contribution added.', 'success'));
      navigate(`/private/communities/${communityId}/releases/${releaseId}`);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to add contribution.',
          'danger'
        )
      );
    }
  };

  if (releaseLoading) return <Spinner />;
  if (!release) return <div className="error">Release not found.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/communities">Communities</Link>
        {' › '}
        <Link to={`/private/communities/${communityId}`}>Community</Link>
        {' › '}
        <Link to={`/private/communities/${communityId}/releases/${releaseId}`}>
          {release.title}
        </Link>
        {' › '}
        <strong>Add your version</strong>
      </div>

      <div className="box">
        <div className="head colhead_dark">
          Add your version —{' '}
          {release.artist?.name && `${release.artist.name} — `}
          {release.title}
        </div>
        <div className="pad">
          <p className="small">
            Contribute a different file format or edition of this release. The
            release metadata already exists — just provide your download link.
          </p>
        </div>
      </div>

      <form className="create_form" onSubmit={handleSubmit}>
        <table className="layout border" width="100%">
          <tbody>
            <tr>
              <td className="label">File type</td>
              <td>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as FileType)}
                >
                  {FILE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="label">Download URL</td>
              <td>
                <input
                  type="url"
                  size={60}
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://example.com/files/my-version.flac"
                  required
                />
                <div className="small">
                  Link to where your file is hosted (e.g. GitHub, Google Drive,
                  your own server)
                </div>
              </td>
            </tr>
            <tr>
              <td className="label">File size (bytes, optional)</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={sizeInBytes}
                  onChange={(e) => setSizeInBytes(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="label">Notes (optional)</td>
              <td>
                <textarea
                  cols={60}
                  rows={4}
                  value={releaseDescription}
                  onChange={(e) => setReleaseDescription(e.target.value)}
                  placeholder="e.g. 24-bit remaster, includes bonus tracks, EU edition..."
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="center">
                <input
                  type="submit"
                  value="Add contribution"
                  disabled={isLoading}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default AddContributionForm;
