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

const AUDIO_FILE_TYPES: FileType[] = [
  'mp3',
  'flac',
  'wav',
  'ogg',
  'aac',
  'm4a'
];

const inputClass =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500';
const labelClass = 'block text-sm text-gray-400 mb-1';
const checkboxClass =
  'rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800';

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
  const [sizeMB, setSizeMB] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');
  const [bitrate, setBitrate] = useState('');
  const [media, setMedia] = useState('');
  const [hasLog, setHasLog] = useState(false);
  const [hasCue, setHasCue] = useState(false);
  const [isScene, setIsScene] = useState(false);

  const isAudio = AUDIO_FILE_TYPES.includes(fileType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContribution({
        communityId: cId,
        releaseId: rId,
        fileType,
        downloadUrl,
        sizeInBytes: sizeMB
          ? Math.round(parseFloat(sizeMB) * 1_048_576)
          : undefined,
        releaseDescription: releaseDescription || undefined,
        bitrate: isAudio && bitrate ? bitrate : undefined,
        media: isAudio && media ? media : undefined,
        hasLog: isAudio ? hasLog : false,
        hasCue: isAudio ? hasCue : false,
        isScene: isAudio ? isScene : false
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
  if (!release)
    return <div className="p-4 text-red-400">Release not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
          Communities
        </Link>
        {' › '}
        <Link
          to={`/private/communities/${communityId}`}
          className="hover:text-gray-300"
        >
          Community
        </Link>
        {' › '}
        <Link
          to={`/private/communities/${communityId}/releases/${releaseId}`}
          className="hover:text-gray-300"
        >
          {release.title}
        </Link>
        {' › '}
        <strong className="text-gray-200">Add your version</strong>
      </nav>

      <div className="rounded border border-gray-700 bg-gray-900 mb-6">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t text-sm font-semibold text-gray-200">
          Add your version —{' '}
          {release.artist?.name && `${release.artist.name} — `}
          {release.title}
        </div>
        <p className="px-4 py-3 text-sm text-gray-400">
          Contribute a different file format or edition of this release. The
          release metadata already exists — just provide your download link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="add-file-type" className={labelClass}>
            File type
          </label>
          <select
            id="add-file-type"
            value={fileType}
            onChange={(e) => setFileType(e.target.value as FileType)}
            className={inputClass}
          >
            {FILE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="add-download-url" className={labelClass}>
            Download URL <span className="text-red-500">*</span>
          </label>
          <input
            id="add-download-url"
            type="url"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            placeholder="https://example.com/files/my-version.flac"
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">
            Link to where your file is hosted (e.g. GitHub, Google Drive, your
            own server)
          </p>
        </div>

        <div>
          <label htmlFor="add-size-mb" className={labelClass}>
            File size (MB, optional)
          </label>
          <input
            id="add-size-mb"
            type="number"
            min="0"
            step="0.01"
            value={sizeMB}
            onChange={(e) => setSizeMB(e.target.value)}
            placeholder="e.g. 85.4"
            className={inputClass}
          />
        </div>

        {/* Rip-specific fields — audio only */}
        {isAudio && (
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Rip details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="add-bitrate" className={labelClass}>
                  Bitrate
                </label>
                <input
                  id="add-bitrate"
                  type="text"
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  placeholder="e.g. 320, V0, Lossless"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="add-media" className={labelClass}>
                  Media
                </label>
                <input
                  id="add-media"
                  type="text"
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                  placeholder="e.g. CD, Vinyl, WEB"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLog}
                  onChange={(e) => setHasLog(e.target.checked)}
                  className={checkboxClass}
                />
                Has log
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCue}
                  onChange={(e) => setHasCue(e.target.checked)}
                  className={checkboxClass}
                />
                Has cue
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScene}
                  onChange={(e) => setIsScene(e.target.checked)}
                  className={checkboxClass}
                />
                Scene release
              </label>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="add-notes" className={labelClass}>
            Notes (optional)
          </label>
          <textarea
            id="add-notes"
            rows={4}
            value={releaseDescription}
            onChange={(e) => setReleaseDescription(e.target.value)}
            placeholder="e.g. 24-bit remaster, includes bonus tracks, EU edition…"
            className={inputClass + ' resize-y'}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded disabled:opacity-50"
          >
            {isLoading ? 'Adding…' : 'Add contribution'}
          </button>
          <Link
            to={`/private/communities/${communityId}/releases/${releaseId}`}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AddContributionForm;
