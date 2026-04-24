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
  'txt',
  'wav',
  'pdf',
  'wmv',
  'ogg',
  'lua',
  'jpg',
  'png'
] as const;
type FileType = (typeof FILE_TYPES)[number];

const ContributeForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: communities, isLoading: loadingCommunities } =
    useGetCommunitiesQuery();
  const [createContribution, { isLoading }] = useCreateContributionMutation();

  const [community, setCommunity] = useState('');
  const [type, setType] = useState<ContentType>('Music');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fileType, setFileType] = useState<FileType>('wav');
  const [sizeInBytes, setSizeInBytes] = useState('');
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
        sizeInBytes: parseInt(sizeInBytes, 10),
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
    <div className="thin">
      <h2>Upload</h2>
      <form className="create_form" onSubmit={handleSubmit}>
        <table className="layout border" width="100%">
          <tbody>
            <tr>
              <td className="label">Community</td>
              <td>
                <select
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  required
                >
                  <option value="">Select a community</option>
                  {communities?.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="small" style={{ float: 'right' }}>
                  Can&apos;t find your community?{' '}
                  <Link to="/private/requests">Submit a request!</Link>
                </div>
              </td>
            </tr>
            <tr>
              <td className="label">Type</td>
              <td>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ContentType)}
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="label">Year</td>
              <td>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="label">File type</td>
              <td>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as FileType)}
                >
                  {FILE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="label">File size (bytes)</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={sizeInBytes}
                  onChange={(e) => setSizeInBytes(e.target.value)}
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="label">
                {type === 'Music' ? 'Artist(s)' : 'Creator(s)'}
              </td>
              <td>
                {collaborators.map((c, i) => (
                  <div key={i}>
                    <input
                      type="text"
                      value={c.artist}
                      size={40}
                      onChange={(e) =>
                        updateCollaborator(i, 'artist', e.target.value)
                      }
                      placeholder={
                        type === 'Music' ? 'Artist name' : 'Creator name'
                      }
                      required
                    />
                    <select
                      value={c.importance}
                      onChange={(e) =>
                        updateCollaborator(i, 'importance', e.target.value)
                      }
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
                        className="brackets btn-link"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCollaborator}
                  className="brackets btn-link"
                >
                  +
                </button>
              </td>
            </tr>
            {type === 'Music' ? (
              <>
                <tr>
                  <td className="label">Album title</td>
                  <td>
                    <input
                      type="text"
                      size={60}
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      required
                    />
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td className="label">Title</td>
                <td>
                  <input
                    type="text"
                    size={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </td>
              </tr>
            )}
            <tr>
              <td className="label">Tags</td>
              <td>
                <input
                  type="text"
                  size={60}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="label">Image (optional)</td>
              <td>
                <input
                  type="text"
                  size={60}
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </td>
            </tr>
            {type === 'Music' ? (
              <tr>
                <td className="label">Release description (optional)</td>
                <td>
                  <input
                    type="text"
                    size={60}
                    value={releaseDescription}
                    onChange={(e) => setReleaseDescription(e.target.value)}
                  />
                </td>
              </tr>
            ) : (
              <tr>
                <td className="label">Description</td>
                <td>
                  <textarea
                    cols={60}
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2} className="center">
                <input
                  type="submit"
                  value="Contribute release"
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

export default ContributeForm;
