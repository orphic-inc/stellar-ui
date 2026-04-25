import { useGrantAccessMutation } from '../../store/services/downloadApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';

interface Props {
  contributionId: number;
  canDownload: boolean;
}

const DownloadButton = ({ contributionId, canDownload }: Props) => {
  const dispatch = useAppDispatch();
  const [grantAccess, { isLoading }] = useGrantAccessMutation();

  const handleClick = async () => {
    try {
      const result = await grantAccess({ contributionId }).unwrap();
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ??
        'Failed to access download.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  if (!canDownload) {
    return (
      <span className="text-gray-500 text-sm" title="Download access disabled">
        [disabled]
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="brackets btn-link disabled:opacity-40"
    >
      {isLoading ? 'Loading…' : 'Download'}
    </button>
  );
};

export default DownloadButton;
