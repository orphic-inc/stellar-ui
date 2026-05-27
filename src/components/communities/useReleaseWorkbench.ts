import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetReleaseByIdQuery,
  useGetCommunityByIdQuery,
  useGetReleaseHistoryQuery,
  useVoteOnReleaseMutation,
  useRemoveVoteOnReleaseMutation,
  useAddTagToReleaseMutation,
  useVoteOnReleaseTagMutation,
  useRemoveTagFromReleaseMutation,
  useRevertReleaseHistoryMutation,
  useUpdateReleaseMutation
} from '../../store/services/communityApi';
import type {
  MyVote,
  ReleaseTag,
  VoteAggregate
} from '../../store/services/communityApi';
import { addAlert } from '../../store/slices/alertSlice';

type ReleaseWithVote = {
  myVote?: MyVote;
  voteAggregate?: VoteAggregate | null;
  releaseTags?: ReleaseTag[];
  isContributor?: boolean;
  isEdition?: boolean;
  title?: string;
  description?: string;
  year?: number;
  image?: string | null;
};

type ReleaseWorkbenchParams = {
  communityId: number;
  releaseId: number;
  user: {
    userRank?: {
      permissions?: Record<string, boolean>;
    };
  } | null;
};

export const useReleaseWorkbench = ({
  communityId,
  releaseId,
  user
}: ReleaseWorkbenchParams) => {
  const dispatch = useDispatch();
  const [pendingTag, setPendingTag] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revertingId, setRevertingId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    year: 0,
    image: '',
    isEdition: false,
    editSummary: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  const {
    data: release,
    isLoading,
    error
  } = useGetReleaseByIdQuery({ communityId, releaseId });
  const { data: community } = useGetCommunityByIdQuery(communityId);
  const { data: historyData, isLoading: historyLoading } =
    useGetReleaseHistoryQuery(
      { communityId, releaseId },
      { skip: !historyOpen }
    );
  const [voteOn, { isLoading: voting }] = useVoteOnReleaseMutation();
  const [removeVote, { isLoading: unvoting }] =
    useRemoveVoteOnReleaseMutation();
  const [addTag, { isLoading: addingTag }] = useAddTagToReleaseMutation();
  const [voteTag, { isLoading: votingTag }] = useVoteOnReleaseTagMutation();
  const [removeTag, { isLoading: removingTag }] =
    useRemoveTagFromReleaseMutation();
  const [revertHistory] = useRevertReleaseHistoryMutation();
  const [updateRelease, { isLoading: saving }] = useUpdateReleaseMutation();

  const releaseView = release as (typeof release & ReleaseWithVote) | undefined;
  const tags = releaseView?.releaseTags ?? [];
  const myVote = releaseView?.myVote ?? null;
  const agg = releaseView?.voteAggregate ?? null;
  const historyEntries = historyData?.data ?? [];
  const canManageTags = Boolean(
    user?.userRank?.permissions?.communities_manage ||
      user?.userRank?.permissions?.staff ||
      user?.userRank?.permissions?.admin
  );
  const canEdit = canManageTags || Boolean(releaseView?.isContributor);

  const handleVote = async (positive: boolean) => {
    const alreadyThis =
      (positive && myVote === 'up') || (!positive && myVote === 'down');
    try {
      if (alreadyThis) {
        await removeVote({ communityId, releaseId }).unwrap();
      } else {
        await voteOn({ communityId, releaseId, positive }).unwrap();
      }
    } catch {
      dispatch(addAlert('Failed to record vote.', 'danger'));
    }
  };

  const handleAddTag = async () => {
    const name = pendingTag.trim().toLowerCase();
    if (!name) return;
    try {
      await addTag({ communityId, releaseId, name }).unwrap();
      setPendingTag('');
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ?? 'Failed to add tag.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTag({ communityId, releaseId, tagId }).unwrap();
    } catch {
      dispatch(addAlert('Failed to remove tag.', 'danger'));
    }
  };

  const handleVoteTag = async (tagId: number, direction: 'up' | 'down') => {
    try {
      await voteTag({ communityId, releaseId, tagId, direction }).unwrap();
    } catch {
      dispatch(addAlert('Failed to record tag vote.', 'danger'));
    }
  };

  const handleEditOpen = () => {
    setEditForm({
      title: releaseView?.title ?? '',
      description: releaseView?.description ?? '',
      year: releaseView?.year ?? new Date().getFullYear(),
      image: releaseView?.image ?? '',
      isEdition: Boolean(releaseView?.isEdition),
      editSummary: ''
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditError(null);
    try {
      await updateRelease({
        communityId,
        releaseId,
        title: editForm.title.trim() || undefined,
        description: editForm.description.trim() || undefined,
        year: editForm.year || undefined,
        image: editForm.image.trim() || undefined,
        isEdition: editForm.isEdition,
        editSummary: editForm.editSummary.trim() || undefined
      }).unwrap();
      dispatch(addAlert('Release updated.', 'success'));
      setEditOpen(false);
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ??
        'Failed to save changes.';
      setEditError(msg);
    }
  };

  const handleRevertHistory = async (historyId: number) => {
    try {
      await revertHistory({
        communityId,
        releaseId,
        historyId
      }).unwrap();
      dispatch(addAlert('Release reverted successfully', 'success'));
    } catch {
      dispatch(addAlert('Failed to revert release', 'danger'));
    }
    setRevertingId(null);
  };

  return {
    release,
    community,
    isLoading,
    error,
    tags,
    myVote,
    agg,
    historyEntries,
    historyOpen,
    setHistoryOpen,
    historyLoading,
    pendingTag,
    setPendingTag,
    revertingId,
    setRevertingId,
    editOpen,
    setEditOpen,
    editForm,
    setEditForm,
    editError,
    canManageTags,
    canEdit,
    voting,
    unvoting,
    addingTag,
    votingTag,
    removingTag,
    saving,
    handleVote,
    handleAddTag,
    handleRemoveTag,
    handleVoteTag,
    handleEditOpen,
    handleEditSave,
    handleRevertHistory
  };
};
