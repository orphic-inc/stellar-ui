import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetCommunitiesQuery,
  useCreateContributionMutation
} from '../../store/services/communityApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import type { Collaborator } from '../../types';

const ARTIST_TYPES = [
  'Main artist',
  'Guest artist',
  'Remixer',
  'Composer',
  'Conductor',
  'DJ',
  'Producer'
];
const CONTENT_TYPES = [
  'Music',
  'Applications',
  'EBooks',
  'ELearningVideos',
  'Audiobooks',
  'Comedy',
  'Comics'
] as const;
type ContentType = (typeof CONTENT_TYPES)[number];
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

const inputClass =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';
const fieldWrap = 'space-y-1';

const ContributeForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: communities, isLoading: loadingCommunities } =
    useGetCommunitiesQuery(1);
  const [createContribution, { isLoading }] = useCreateContributionMutation();

  const [community, setCommunity] = useState('');
  const [type, setType] = useState<ContentType>('Music');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fileType, setFileType] = useState<FileType>('mp3');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sizeMB, setSizeMB] = useState('');
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { artist: '', importance: 'Main artist' }
  ]);

  useEffect(() => {
    if (type === 'Music') {
      setCollaborators([{ artist: '', importance: 'Main artist' }]);
    } else {
      setCollaborators([{ artist: '', importance: 'Creator' }]);
    }
  }, [type]);

  const addCollaborator = (e: React.MouseEvent) => {
    e.preventDefault();
    setCollaborators([
      ...collaborators,
      { artist: '', importance: 'Main artist' }
    ]);
  };

  const removeCollaborator = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setCollaborators(collaborators.filter((_, i) => i !== index));
  };

  const updateCollaborator = (
    index: number,
    field: keyof Collaborator,
    value: string
  ) => {
    const updated = [...collaborators];
    updated[index] = { ...updated[index], [field]: value };
    setCollaborators(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createContribution({
        communityId: parseInt(community),
        type,
        title: type === 'Music' ? album : title,
        year: parseInt(year, 10),
        fileType,
        downloadUrl,
        sizeInBytes: sizeMB
          ? Math.round(parseFloat(sizeMB) * 1_048_576)
          : undefined,
        tags,
        image,
        description,
        releaseDescription: type === 'Music' ? releaseDescription : undefined,
        collaborators
      }).unwrap();
      navigate('/private/contribute/list');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ??
            'Failed to submit contribution. Please try again.',
          'danger'
        )
      );
    }
  };

  if (loadingCommunities) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">
        Upload a release
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className={fieldWrap}>
          <label htmlFor="contribute-community" className={labelClass}>
            Community <span className="text-red-500">*</span>
          </label>
          <select
            id="contribute-community"
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Select a community</option>
            {communities?.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Can&apos;t find your community?{' '}
            <Link
              to="/private/requests"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Submit a request.
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={fieldWrap}>
            <label htmlFor="contribute-type" className={labelClass}>
              Content type <span className="text-red-500">*</span>
            </label>
            <select
              id="contribute-type"
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
              className={inputClass}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldWrap}>
            <label htmlFor="contribute-year" className={labelClass}>
              Year <span className="text-red-500">*</span>
            </label>
            <input
              id="contribute-year"
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className={fieldWrap}>
          <label className={labelClass}>
            {type === 'Music' ? 'Artist(s)' : 'Creator(s)'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {collaborators.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={c.artist}
                  onChange={(e) =>
                    updateCollaborator(i, 'artist', e.target.value)
                  }
                  placeholder={
                    type === 'Music' ? 'Artist name' : 'Creator name'
                  }
                  required
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={c.importance}
                  onChange={(e) =>
                    updateCollaborator(i, 'importance', e.target.value)
                  }
                  className="px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  {(type === 'Music'
                    ? ARTIST_TYPES
                    : ['Creator', 'Contributor', 'Editor']
                  ).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={(e) => removeCollaborator(e, i)}
                    className="text-gray-500 hover:text-red-400 text-sm px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCollaborator}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              + Add {type === 'Music' ? 'artist' : 'creator'}
            </button>
          </div>
        </div>

        <div className={fieldWrap}>
          <label htmlFor="contribute-album" className={labelClass}>
            {type === 'Music' ? 'Album title' : 'Title'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="contribute-album"
            type="text"
            value={type === 'Music' ? album : title}
            onChange={(e) =>
              type === 'Music'
                ? setAlbum(e.target.value)
                : setTitle(e.target.value)
            }
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={fieldWrap}>
            <label htmlFor="contribute-filetype" className={labelClass}>
              File type <span className="text-red-500">*</span>
            </label>
            <select
              id="contribute-filetype"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className={inputClass}
            >
              {FILE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldWrap}>
            <label htmlFor="contribute-size" className={labelClass}>
              File size (MB) <span className="text-red-500">*</span>
            </label>
            <input
              id="contribute-size"
              type="number"
              min="0.01"
              step="0.01"
              value={sizeMB}
              onChange={(e) => setSizeMB(e.target.value)}
              placeholder="e.g. 85.4"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className={fieldWrap}>
          <label htmlFor="contribute-url" className={labelClass}>
            Download URL <span className="text-red-500">*</span>
          </label>
          <input
            id="contribute-url"
            type="url"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            placeholder="https://example.com/files/my-release.zip"
            required
            className={inputClass}
          />
          <p className="text-xs text-gray-500">
            Link to where the file is hosted (e.g. GitHub, Google Drive, your
            own server)
          </p>
        </div>

        <div className={fieldWrap}>
          <label htmlFor="contribute-tags" className={labelClass}>
            Tags
          </label>
          <input
            id="contribute-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="rock, jazz, ambient (comma-separated)"
            className={inputClass}
          />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="contribute-image" className={labelClass}>
            Cover image URL (optional)
          </label>
          <input
            id="contribute-image"
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className={inputClass}
          />
        </div>

        {type === 'Music' ? (
          <div className={fieldWrap}>
            <label htmlFor="contribute-reldesc" className={labelClass}>
              Release description (optional)
            </label>
            <input
              id="contribute-reldesc"
              type="text"
              value={releaseDescription}
              onChange={(e) => setReleaseDescription(e.target.value)}
              placeholder="e.g. 24-bit remaster, limited edition…"
              className={inputClass}
            />
          </div>
        ) : (
          <div className={fieldWrap}>
            <label htmlFor="contribute-desc" className={labelClass}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contribute-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className={inputClass + ' resize-y'}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded disabled:opacity-50"
          >
            {isLoading ? 'Submitting…' : 'Contribute release'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContributeForm;
