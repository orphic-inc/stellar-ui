import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { useDeleteReleaseMutation } from '../../store/services/communityApi';
import { hasPermission } from '../../utils/permissions';
import { getApiErrorMessage } from '../../utils/apiError';

interface DeleteReleaseButtonProps {
  communityId: number;
  releaseId: number;
  /** Undefined while the release's contributions load. */
  contributionCount: number | undefined;
}

/**
 * Delete a release that has no contributions (#429). The api refuses one with
 * any (stellar-api#793), so this shows only to `communities_manage` once the
 * contributions have loaded and there are none.
 */
const DeleteReleaseButton = ({
  communityId,
  releaseId,
  contributionCount
}: DeleteReleaseButtonProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [deleteRelease, { isLoading }] = useDeleteReleaseMutation();

  if (contributionCount !== 0 || !hasPermission(user, 'communities_manage'))
    return null;

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this release? Its editions, credits, comments and bookmarks are deleted with it.'
      )
    )
      return;
    try {
      await deleteRelease({ communityId, releaseId }).unwrap();
      dispatch(addAlert('Release deleted.', 'success'));
      navigate(`/communities/${communityId}`);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to delete the release.',
          'danger'
        )
      );
    }
  };

  return (
    <button
      type="button"
      data-st="control"
      data-st-danger
      onClick={handleDelete}
      disabled={isLoading}
      className="disabled:opacity-50"
    >
      [Delete release]
    </button>
  );
};

export default DeleteReleaseButton;
