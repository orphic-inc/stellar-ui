import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import { useReportContributionMutation } from '../../store/services/downloadApi';
import { Modal } from '../ui';

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
    <Modal
      title="Report Dead / Misleading Link"
      size="sm"
      onClose={onClose}
      dismissable={!isLoading}
    >
      <label
        data-st="meta"
        className="block text-sm mb-1"
        htmlFor="report-reason"
      >
        Reason
      </label>
      <textarea
        id="report-reason"
        data-st="field"
        className="w-full"
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the problem (dead link, misleading content, etc.)"
      />
      <div className="mt-3 flex gap-2 justify-end">
        <button
          type="button"
          data-st="control"
          className="text-sm"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          data-st="control"
          data-st-primary
          className="text-sm"
          onClick={handleSubmit}
          disabled={isLoading || !reason.trim()}
        >
          {isLoading ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </Modal>
  );
};

export default ReportContributionModal;
