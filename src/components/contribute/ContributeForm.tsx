import { useState, useEffect, useRef, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetCommunitiesQuery,
  useCreateContributionMutation,
  useGetDncListQuery
} from '../../store/services/communityApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { parseSize, SIZE_INPUT_UNITS } from '../../utils';
import Spinner from '../layout/Spinner';
import type { Collaborator } from '../../types';
import type { BinarySizeUnit } from '../../utils';

const ARTIST_TYPES = [
  'Main artist',
  'Guest artist',
  'Remixer',
  'Composer',
  'Conductor',
  'DJ',
  'Producer',
  'Arranger'
];
const CREATOR_TYPES = ['Creator', 'Contributor', 'Editor'];

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

// Release identity categories — values mirror the API ReleaseCategory enum;
// labels are humanised for the dropdown.
const RELEASE_CATEGORIES = [
  { value: 'Album', label: 'Album' },
  { value: 'Single', label: 'Single' },
  { value: 'EP', label: 'EP' },
  { value: 'Anthology', label: 'Anthology' },
  { value: 'Compilation', label: 'Compilation' },
  { value: 'DJMix', label: 'DJ Mix' },
  { value: 'Live', label: 'Live album' },
  { value: 'Remix', label: 'Remix' },
  { value: 'Bootleg', label: 'Bootleg' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Mixtape', label: 'Mixtape' },
  { value: 'Demo', label: 'Demo' },
  { value: 'ConcertRecording', label: 'Concert recording' },
  { value: 'Unknown', label: 'Unknown' }
] as const;
type ReleaseCategoryValue = (typeof RELEASE_CATEGORIES)[number]['value'];

// Encoding / bitrate — values mirror the API Bitrate enum.
const BITRATES = [
  { value: 'Lossless', label: 'Lossless' },
  { value: 'Lossless24', label: 'Lossless (24-bit)' },
  { value: 'Kbps320', label: '320 kbps' },
  { value: 'Kbps256', label: '256 kbps' },
  { value: 'KbpsV0', label: 'V0 (VBR)' },
  { value: 'Kbps192', label: '192 kbps' },
  { value: 'KbpsV2', label: 'V2 (VBR)' },
  { value: 'Kbps128', label: '128 kbps' },
  { value: 'Other', label: 'Other' }
] as const;
type BitrateValue = (typeof BITRATES)[number]['value'];

// Source media — values mirror the API ReleaseMedia enum.
const MEDIA = [
  { value: 'CD', label: 'CD' },
  { value: 'WEB', label: 'WEB' },
  { value: 'Vinyl', label: 'Vinyl' },
  { value: 'SACD', label: 'SACD' },
  { value: 'DVD', label: 'DVD' },
  { value: 'Cassette', label: 'Cassette' },
  { value: 'BluRay', label: 'Blu-ray' },
  { value: 'DAT', label: 'DAT' },
  { value: 'Soundboard', label: 'Soundboard' },
  { value: 'Other', label: 'Other' }
] as const;
type MediaValue = (typeof MEDIA)[number]['value'];

const inputClass =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';
const fieldWrap = 'space-y-1';
const fieldsetClass =
  'border border-gray-700/70 rounded-lg p-4 space-y-5 min-w-0';
const legendClass = 'px-2 text-sm font-semibold text-gray-100 uppercase';
const helpClass = 'text-xs text-gray-500';
const checkboxRowClass = 'flex items-start gap-2';
const checkboxLabelClass = 'text-sm text-gray-300';
const srOnly = 'sr-only';

// Visual-only required mark; requirement is conveyed to assistive tech via the
// input's `required` / `aria-required`, so the asterisk is hidden from the a11y
// tree to avoid "Title star" announcements.
const RequiredMark = () => (
  <span className="text-red-500" aria-hidden="true">
    {' '}
    *
  </span>
);

const ContributeForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: communities, isLoading: loadingCommunities } =
    useGetCommunitiesQuery(1);
  const [createContribution, { isLoading }] = useCreateContributionMutation();

  const [community, setCommunity] = useState('');
  const [type, setType] = useState<ContentType>('Music');
  const [releaseCategory, setReleaseCategory] =
    useState<ReleaseCategoryValue>('Album');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fileType, setFileType] = useState<FileType>('mp3');
  const [bitrate, setBitrate] = useState<BitrateValue | ''>('');
  const [media, setMedia] = useState<MediaValue | ''>('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sizeValue, setSizeValue] = useState('');
  const [sizeUnit, setSizeUnit] = useState<BinarySizeUnit>('MiB');
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('');
  const [recordLabel, setRecordLabel] = useState('');
  const [catalogueNumber, setCatalogueNumber] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');
  const [isScene, setIsScene] = useState(false);
  const [hasLog, setHasLog] = useState(false);
  const [hasCue, setHasCue] = useState(false);
  const [editionEnabled, setEditionEnabled] = useState(false);
  const [editionTitle, setEditionTitle] = useState('');
  const [editionYear, setEditionYear] = useState('');
  const [isRemaster, setIsRemaster] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { artist: '', importance: 'Main artist' }
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs to each artist-name input so focus can follow add/remove operations.
  const artistInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocus = useRef<number | null>(null);

  const isMusic = type === 'Music';
  const errorId = useId();
  const mbHintId = useId();
  const albumGuidanceId = useId();
  const urlHelpId = useId();

  const { data: dncList } = useGetDncListQuery(
    community ? parseInt(community, 10) : 0,
    { skip: !community }
  );

  useEffect(() => {
    if (type === 'Music') {
      setCollaborators([{ artist: '', importance: 'Main artist' }]);
    } else {
      setCollaborators([{ artist: '', importance: 'Creator' }]);
    }
  }, [type]);

  // Move focus to the row requested by the last add/remove action.
  useEffect(() => {
    if (pendingFocus.current === null) return;
    const target = artistInputRefs.current[pendingFocus.current];
    target?.focus();
    pendingFocus.current = null;
  }, [collaborators]);

  const addCollaborator = (e: React.MouseEvent) => {
    e.preventDefault();
    pendingFocus.current = collaborators.length;
    setCollaborators([
      ...collaborators,
      { artist: '', importance: isMusic ? 'Main artist' : 'Creator' }
    ]);
  };

  const removeCollaborator = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    pendingFocus.current = Math.max(0, index - 1);
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

  const trimmedSize = sizeValue.trim();
  const sizeInBytes = trimmedSize
    ? parseSize(trimmedSize, sizeUnit)
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitError(null);
    if (trimmedSize && sizeInBytes === null) {
      setSubmitError('Enter a valid file size (e.g. 85.4 MiB or 4.5 GiB).');
      return;
    }
    try {
      await createContribution({
        communityId: parseInt(community),
        type,
        title: isMusic ? album : title,
        year: parseInt(year, 10),
        fileType,
        downloadUrl,
        sizeInBytes: sizeInBytes ?? undefined,
        tags,
        image,
        description,
        releaseDescription: isMusic ? releaseDescription : undefined,
        collaborators,
        releaseCategory: isMusic ? releaseCategory : undefined,
        recordLabel: isMusic ? recordLabel || undefined : undefined,
        catalogueNumber: isMusic ? catalogueNumber || undefined : undefined,
        bitrate: isMusic ? bitrate || undefined : undefined,
        media: isMusic ? media || undefined : undefined,
        isScene,
        hasLog: isMusic ? hasLog : undefined,
        hasCue: isMusic ? hasCue : undefined,
        editionTitle:
          isMusic && editionEnabled ? editionTitle || undefined : undefined,
        editionYear:
          isMusic && editionEnabled && editionYear
            ? parseInt(editionYear, 10)
            : undefined,
        isRemaster: isMusic && editionEnabled ? isRemaster : undefined
      }).unwrap();
      navigate('/private/contribute/list');
    } catch (err) {
      const message =
        getApiErrorMessage(err) ??
        'Failed to submit contribution. Please try again.';
      setSubmitError(message);
      dispatch(addAlert(message, 'danger'));
    }
  };

  if (loadingCommunities) return <Spinner />;

  const roleOptions = isMusic ? ARTIST_TYPES : CREATOR_TYPES;
  const creatorWord = isMusic ? 'artist' : 'creator';

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-100 mb-6">
        Upload a release
      </h2>

      <p className={helpClass + ' mb-4'}>
        Fields marked <span className="text-red-500">*</span> are required.
      </p>

      {submitError && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="mb-5 rounded-lg border border-red-600/50 bg-red-900/20 p-3 text-sm text-red-300"
        >
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* ─── Release information ─────────────────────────────────────── */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Release information</legend>

          <div className={fieldWrap}>
            <label htmlFor="contribute-community" className={labelClass}>
              Community
              <RequiredMark />
            </label>
            <select
              id="contribute-community"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              required
              aria-required="true"
              className={inputClass}
            >
              <option value="">Select a community</option>
              {communities?.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className={helpClass}>
              Can&apos;t find your community?{' '}
              <Link
                to="/private/requests"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Submit a request.
              </Link>
            </p>
          </div>

          {dncList && dncList.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-yellow-600/50 bg-yellow-900/20 p-4 space-y-2"
            >
              <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
                Do Not Contribute List
              </h3>
              <p className="text-xs text-yellow-300/80">
                The following artists, labels, and releases must not be
                contributed to this community:
              </p>
              <ul className="space-y-1">
                {dncList.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap gap-x-2 text-sm">
                    <span className="text-yellow-200 font-medium">
                      {entry.name}
                    </span>
                    {entry.comment && (
                      <span className="text-yellow-300/60 text-xs self-center">
                        — {entry.comment}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldWrap}>
              <label htmlFor="contribute-type" className={labelClass}>
                Content type
                <RequiredMark />
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

            {isMusic && (
              <div className={fieldWrap}>
                <label htmlFor="contribute-category" className={labelClass}>
                  Release type
                  <RequiredMark />
                </label>
                <select
                  id="contribute-category"
                  value={releaseCategory}
                  onChange={(e) =>
                    setReleaseCategory(e.target.value as ReleaseCategoryValue)
                  }
                  className={inputClass}
                >
                  {RELEASE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Artists / creators */}
          <fieldset className="space-y-2 min-w-0">
            <legend className={labelClass}>
              {isMusic ? 'Artist(s)' : 'Creator(s)'}
              <RequiredMark />
            </legend>
            {collaborators.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  ref={(el) => {
                    artistInputRefs.current[i] = el;
                  }}
                  type="text"
                  value={c.artist}
                  onChange={(e) =>
                    updateCollaborator(i, 'artist', e.target.value)
                  }
                  placeholder={isMusic ? 'Artist name' : 'Creator name'}
                  aria-label={`${isMusic ? 'Artist' : 'Creator'} name ${i + 1}`}
                  required
                  aria-required="true"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={c.importance}
                  onChange={(e) =>
                    updateCollaborator(i, 'importance', e.target.value)
                  }
                  aria-label={`Role for ${creatorWord} ${i + 1}`}
                  className="px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  {roleOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={(e) => removeCollaborator(e, i)}
                    aria-label={`Remove ${creatorWord} ${i + 1}`}
                    className="text-gray-500 hover:text-red-400 text-sm px-1"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCollaborator}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              + Add {creatorWord}
            </button>
          </fieldset>

          <div className={fieldWrap}>
            <label htmlFor="contribute-album" className={labelClass}>
              {isMusic ? 'Album title' : 'Title'}
              <RequiredMark />
            </label>
            <div className="flex gap-2 items-start">
              <input
                id="contribute-album"
                type="text"
                value={isMusic ? album : title}
                onChange={(e) =>
                  isMusic ? setAlbum(e.target.value) : setTitle(e.target.value)
                }
                required
                aria-required="true"
                aria-describedby={isMusic ? albumGuidanceId : undefined}
                className={inputClass}
              />
              {isMusic && (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Coming soon"
                  aria-describedby={mbHintId}
                  className="whitespace-nowrap px-3 py-2 bg-gray-700 text-gray-400 text-sm rounded cursor-not-allowed"
                >
                  Find info
                  <span id={mbHintId} className={srOnly}>
                    MusicBrainz lookup — coming soon
                  </span>
                </button>
              )}
            </div>
            {isMusic && (
              <p id={albumGuidanceId} className={helpClass}>
                Don&apos;t include remaster, re-issue, edition or
                country-specific info here — use the Edition fields below.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={fieldWrap}>
              <label htmlFor="contribute-year" className={labelClass}>
                Year
                <RequiredMark />
              </label>
              <input
                id="contribute-year"
                type="number"
                min="1900"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                aria-required="true"
                className={inputClass}
              />
            </div>

            {isMusic && (
              <>
                <div className={fieldWrap}>
                  <label htmlFor="contribute-label" className={labelClass}>
                    Record label
                  </label>
                  <input
                    id="contribute-label"
                    type="text"
                    value={recordLabel}
                    onChange={(e) => setRecordLabel(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className={fieldWrap}>
                  <label htmlFor="contribute-catno" className={labelClass}>
                    Catalogue number
                  </label>
                  <input
                    id="contribute-catno"
                    type="text"
                    value={catalogueNumber}
                    onChange={(e) => setCatalogueNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}
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

          {isMusic ? (
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
                Description
                <RequiredMark />
              </label>
              <textarea
                id="contribute-desc"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                aria-required="true"
                className={inputClass + ' resize-y'}
              />
            </div>
          )}
        </fieldset>

        {/* ─── Edition information (Music only) ────────────────────────── */}
        {isMusic && (
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Edition information</legend>

            <div className={checkboxRowClass}>
              <input
                id="contribute-edition-toggle"
                type="checkbox"
                checked={editionEnabled}
                onChange={(e) => setEditionEnabled(e.target.checked)}
                className="mt-0.5"
              />
              <label
                htmlFor="contribute-edition-toggle"
                className={checkboxLabelClass}
              >
                This is a specific edition (remaster, reissue, special or
                country-specific edition).
              </label>
            </div>

            {editionEnabled && (
              <div className="space-y-5 pl-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label
                      htmlFor="contribute-edition-title"
                      className={labelClass}
                    >
                      Edition title
                    </label>
                    <input
                      id="contribute-edition-title"
                      type="text"
                      value={editionTitle}
                      onChange={(e) => setEditionTitle(e.target.value)}
                      placeholder="e.g. Deluxe Edition"
                      className={inputClass}
                    />
                  </div>
                  <div className={fieldWrap}>
                    <label
                      htmlFor="contribute-edition-year"
                      className={labelClass}
                    >
                      Edition year
                    </label>
                    <input
                      id="contribute-edition-year"
                      type="number"
                      min="1900"
                      max="2100"
                      value={editionYear}
                      onChange={(e) => setEditionYear(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className={checkboxRowClass}>
                  <input
                    id="contribute-remaster"
                    type="checkbox"
                    checked={isRemaster}
                    onChange={(e) => setIsRemaster(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="contribute-remaster"
                    className={checkboxLabelClass}
                  >
                    This edition is a remaster.
                  </label>
                </div>
              </div>
            )}
          </fieldset>
        )}

        {/* ─── File information ────────────────────────────────────────── */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>File information</legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={fieldWrap}>
              <label htmlFor="contribute-filetype" className={labelClass}>
                {isMusic ? 'Format' : 'File type'}
                <RequiredMark />
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

            {isMusic && (
              <>
                <div className={fieldWrap}>
                  <label htmlFor="contribute-bitrate" className={labelClass}>
                    Bitrate
                  </label>
                  <select
                    id="contribute-bitrate"
                    value={bitrate}
                    onChange={(e) =>
                      setBitrate(e.target.value as BitrateValue | '')
                    }
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {BITRATES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={fieldWrap}>
                  <label htmlFor="contribute-media" className={labelClass}>
                    Media
                  </label>
                  <select
                    id="contribute-media"
                    value={media}
                    onChange={(e) =>
                      setMedia(e.target.value as MediaValue | '')
                    }
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {MEDIA.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldWrap}>
              <label htmlFor="contribute-size" className={labelClass}>
                File size
                <RequiredMark />
              </label>
              <div className="flex gap-2">
                <input
                  id="contribute-size"
                  type="text"
                  inputMode="decimal"
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                  placeholder="e.g. 85.4 or 4.5 GiB"
                  required
                  aria-required="true"
                  className={inputClass}
                />
                <select
                  aria-label="Size unit"
                  value={sizeUnit}
                  onChange={(e) =>
                    setSizeUnit(e.target.value as BinarySizeUnit)
                  }
                  className={inputClass + ' w-24'}
                >
                  {SIZE_INPUT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={fieldWrap}>
              <label htmlFor="contribute-url" className={labelClass}>
                Download URL
                <RequiredMark />
              </label>
              <input
                id="contribute-url"
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://example.com/files/my-release.zip"
                required
                aria-required="true"
                aria-describedby={urlHelpId}
                className={inputClass}
              />
              <p id={urlHelpId} className={helpClass}>
                Link to where the file is hosted (e.g. GitHub, Google Drive,
                your own server).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className={checkboxRowClass}>
              <input
                id="contribute-scene"
                type="checkbox"
                checked={isScene}
                onChange={(e) => setIsScene(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="contribute-scene" className={checkboxLabelClass}>
                This is a Scene release. If you ripped it yourself, it is{' '}
                <strong>not</strong> a Scene release.
              </label>
            </div>

            {isMusic && (
              <>
                <div className={checkboxRowClass}>
                  <input
                    id="contribute-haslog"
                    type="checkbox"
                    checked={hasLog}
                    onChange={(e) => setHasLog(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="contribute-haslog"
                    className={checkboxLabelClass}
                  >
                    Includes a rip log.
                  </label>
                </div>
                <div className={checkboxRowClass}>
                  <input
                    id="contribute-hascue"
                    type="checkbox"
                    checked={hasCue}
                    onChange={(e) => setHasCue(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="contribute-hascue"
                    className={checkboxLabelClass}
                  >
                    Includes a cue sheet.
                  </label>
                </div>
              </>
            )}
          </div>
        </fieldset>

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
