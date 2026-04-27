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
  'Collage',
  'Post'
] as const;

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  User: ['Harassment', 'Spam account', 'Impersonation', 'Other'],
  Release: ['Bad metadata', 'Duplicate', 'Improper format', 'Other'],
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
  Collage: ['Inappropriate content', 'Duplicate', 'Other'],
  Post: ['Spam', 'Inappropriate content', 'Other']
};

const ReportForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const defaultType =
    (searchParams.get('targetType') as (typeof TARGET_TYPES)[number]) ??
    'ForumPost';
  const defaultId = searchParams.get('targetId') ?? '';
  // When both params arrive from a contextual link, lock the target fields
  // so users never interact with raw numeric IDs.
  const lockedFromUrl = !!(
    searchParams.get('targetType') && searchParams.get('targetId')
  );

  const [targetType, setTargetType] = useState<string>(defaultType);
  const [targetId, setTargetId] = useState(defaultId);
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');

  const categories = CATEGORIES_BY_TYPE[targetType] ?? ['Other'];

  const [fileReport, { isLoading }] = useFileReportMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(targetId, 10);
    if (!id || id <= 0) {
      dispatch(addAlert('Target ID must be a positive number.', 'danger'));
      return;
    }
    if (!category) {
      dispatch(addAlert('Please select a category.', 'danger'));
      return;
    }
    try {
      await fileReport({
        targetType,
        targetId: id,
        category,
        reason,
        evidence: evidence || undefined
      }).unwrap();
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
                  setTargetType(e.target.value);
                  setCategory('');
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

        <div>
          <label htmlFor="reason" className="block text-sm text-gray-400 mb-1">
            Reason <span className="text-red-500">*</span>
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
            Evidence <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <textarea
            id="evidence"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Links, quotes, or other evidence…"
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
