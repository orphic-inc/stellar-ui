import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFileReportMutation } from '../../store/services/reportsApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';

const TARGET_TYPES = [
  'User',
  'Release',
  'Artist',
  'Contribution',
  'ForumTopic',
  'ForumPost',
  'Comment',
  'Collage'
] as const;

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  User: ['Harassment', 'Spam account', 'Impersonation', 'Other'],
  Artist: ['Bad metadata', 'Duplicate', 'Other'],
  Contribution: [
    'Dead link',
    'Duplicate format',
    'Misleading content',
    'Other'
  ],
  ForumTopic: ['Spam', 'Off-topic', 'Harassment', 'Other'],
  ForumPost: ['Spam', 'Harassment', 'Rules violation', 'Other'],
  Comment: ['Spam', 'Harassment', 'Rules violation', 'Other'],
  Collage: ['Inappropriate content', 'Duplicate', 'Other']
};

const RELEASE_CATEGORIES = [
  { value: 'Dupe', label: 'Dupe' },
  { value: 'Trump', label: 'Trump' },
  { value: 'BadFileNamesTrump', label: 'Bad File Names Trump' },
  { value: 'BadFolderNameTrump', label: 'Bad Folder Name Trump' },
  { value: 'TagTrump', label: 'Tag Trump' },
  { value: 'VinylTrump', label: 'Vinyl Trump' },
  { value: 'AudienceRecording', label: 'Audience Recording' },
  { value: 'BadFileNames', label: 'Bad File Names' },
  { value: 'BadFolderNames', label: 'Bad Folder Names' },
  { value: 'BadTagNoTag', label: 'Bad Tag / No Tag at All' },
  { value: 'BonusTracksOnly', label: 'Bonus Tracks Only' },
  { value: 'DisallowedFormat', label: 'Disallowed Format' },
  { value: 'DiscsMissing', label: 'Disc(s) Missing' },
  { value: 'Discography', label: 'Discography' },
  { value: 'MqaBanned', label: 'MQA Banned' },
  { value: 'EditedLog', label: 'Edited Log' },
  { value: 'InaccurateBitrate', label: 'Inaccurate Bitrate' },
  { value: 'LogRescoreRequest', label: 'Log Rescore Request' },
  {
    value: 'LossyMasterApprovalRequest',
    label: 'Lossy Master Approval Request'
  },
  {
    value: 'ContributionContestApprovalRequest',
    label: 'Contribution Contest Approval Request'
  },
  { value: 'LowBitrate', label: 'Low Bitrate' },
  { value: 'MuttRip', label: 'Mutt Rip' },
  { value: 'NoLineageInfo', label: 'No Lineage Info' },
  { value: 'Other', label: 'Other' },
  { value: 'RadioTvFmWebRip', label: 'Radio/TV/FM/WEB Rip' },
  { value: 'SkipsEncodeErrors', label: 'Skips / Encode Errors' },
  { value: 'SpecificallyBanned', label: 'Specifically Banned' },
  { value: 'TracksMissing', label: 'Track(s) Missing' },
  { value: 'Transcode', label: 'Transcode' },
  { value: 'UnsplitAlbumRip', label: 'Unsplit Album Rip' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'UserCompilation', label: 'User Compilation' },
  { value: 'WrongSpecifiedFormat', label: 'Wrong Specified Format' },
  { value: 'WrongSpecifiedMedia', label: 'Wrong Specified Media' }
] as const;

const TRUMP_CATEGORIES = new Set([
  'Dupe',
  'Trump',
  'BadFileNamesTrump',
  'BadFolderNameTrump',
  'TagTrump',
  'VinylTrump'
]);

const GUIDELINES: Partial<Record<(typeof TARGET_TYPES)[number], string>> = {
  User: 'Use this to report a user account for harassment, spam, impersonation, or conduct violations. Do not use this to report content — releases, forum posts, and other content have their own report pages.',
  Release:
    'Use this to report a release for quality or policy violations (bad tags, transcode, duplicate, disallowed format, etc.). Select the most specific reason from the list.',
  Artist:
    'Use this to report an artist entry for bad metadata, duplicates, or vandalism.',
  Contribution:
    'Use this to report a specific file contribution (dead link, wrong content, duplicate format, etc.).',
  ForumTopic:
    'Use this to report a forum thread for spam, off-topic content, or rule violations.',
  ForumPost:
    'Use this to report a specific forum post for spam, harassment, or rule violations.',
  Comment:
    'Use this to report a comment for spam, harassment, or rule violations.',
  Collage:
    'Use this to report a collage for inappropriate content or duplicates.'
};

const ReportForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const defaultType =
    (searchParams.get('targetType') as (typeof TARGET_TYPES)[number]) ??
    'ForumPost';
  const defaultId = searchParams.get('targetId') ?? '';
  const lockedFromUrl = !!(
    searchParams.get('targetType') && searchParams.get('targetId')
  );

  const [targetType, setTargetType] =
    useState<(typeof TARGET_TYPES)[number]>(defaultType);
  const [targetId, setTargetId] = useState(defaultId);
  const [category, setCategory] = useState('');
  const [releaseCategory, setReleaseCategory] = useState<
    (typeof RELEASE_CATEGORIES)[number]['value'] | ''
  >('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');

  const isRelease = targetType === 'Release';
  const categories = CATEGORIES_BY_TYPE[targetType] ?? ['Other'];
  const showEvidenceAsPermalink =
    isRelease && TRUMP_CATEGORIES.has(releaseCategory);

  const [fileReport, { isLoading }] = useFileReportMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(targetId, 10);
    if (!id || id <= 0) {
      dispatch(addAlert('Target ID must be a positive number.', 'danger'));
      return;
    }
    if (isRelease && !releaseCategory) {
      dispatch(addAlert('Please select a release report category.', 'danger'));
      return;
    }
    if (!isRelease && !category) {
      dispatch(addAlert('Please select a category.', 'danger'));
      return;
    }
    try {
      if (isRelease) {
        await fileReport({
          targetType: 'Release',
          targetId: id,
          releaseCategory:
            releaseCategory as (typeof RELEASE_CATEGORIES)[number]['value'],
          reason,
          evidence: evidence || undefined
        }).unwrap();
      } else {
        await fileReport({
          targetType,
          targetId: id,
          category,
          reason,
          evidence: evidence || undefined
        }).unwrap();
      }
      dispatch(addAlert('Report submitted.', 'success'));
      navigate('/private/reports/mine');
    } catch {
      dispatch(addAlert('Failed to submit report.', 'danger'));
    }
  };

  return (
    <div className="thin">
      <h2 className="text-xl font-semibold mb-4">File a Report</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {lockedFromUrl ? (
          <p className="text-sm text-gray-400">
            Reporting:{' '}
            <span className="text-gray-200 font-medium">{targetType}</span>
          </p>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="target-type"
                className="block text-sm text-gray-400 mb-1"
              >
                Report type
              </label>
              <select
                id="target-type"
                value={targetType}
                onChange={(e) => {
                  setTargetType(
                    e.target.value as (typeof TARGET_TYPES)[number]
                  );
                  setCategory('');
                  setReleaseCategory('');
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="target-id"
                className="block text-sm text-gray-400 mb-1"
              >
                Target ID
              </label>
              <input
                id="target-id"
                type="number"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                min={1}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. 42"
              />
            </div>
          </div>
        )}

        {GUIDELINES[targetType] && (
          <p className="text-sm text-gray-500 bg-gray-800/50 border border-gray-700 rounded px-3 py-2">
            {GUIDELINES[targetType]}
          </p>
        )}

        {isRelease ? (
          <div>
            <label
              htmlFor="release-category"
              className="block text-sm text-gray-400 mb-1"
            >
              Reason
            </label>
            <select
              id="release-category"
              value={releaseCategory}
              onChange={(e) =>
                setReleaseCategory(
                  e.target.value as
                    | (typeof RELEASE_CATEGORIES)[number]['value']
                    | ''
                )
              }
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">— Select a reason —</option>
              {RELEASE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label
              htmlFor="category"
              className="block text-sm text-gray-400 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">— Select a category —</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="reason" className="block text-sm text-gray-400 mb-1">
            Comments <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Explain why you are reporting this content…"
          />
        </div>

        <div>
          <label
            htmlFor="evidence"
            className="block text-sm text-gray-400 mb-1"
          >
            {showEvidenceAsPermalink
              ? 'Permalink to related release(s)'
              : 'Evidence'}{' '}
            <span className="text-gray-600 text-xs">
              {showEvidenceAsPermalink ? '(recommended)' : '(optional)'}
            </span>
          </label>
          <textarea
            id="evidence"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder={
              showEvidenceAsPermalink
                ? 'Link(s) to the release(s) this supersedes…'
                : 'Links, quotes, or other evidence…'
            }
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
          >
            {isLoading ? 'Submitting…' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
