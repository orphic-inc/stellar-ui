import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import { useReportContributionMutation } from '../../store/services/downloadApi';

interface Props {
  contributionId: number;
  onClose: () => void;
}

const ReportContributionModal = ({ contributionId, onClose }: Props) => {
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

export default ReportContributionModal;
