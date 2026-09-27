import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useAddReleaseCreditMutation,
  useChangeReleaseCreditRoleMutation,
  useRemoveReleaseCreditMutation,
  type ArtistRole,
  type ReleaseCredit
} from '../../store/services/releaseCreditsApi';
import { useCreateArtistMutation } from '../../store/services/artistApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { hasAnyPermission } from '../../utils/permissions';
import type { AuthUser } from '../../types';
import type { ArtistChoice } from '../ui';

/**
 * Role headings in `ArtistRole` order. A `Record` over the union, so a role the
 * contract adds fails to compile here instead of silently having no heading.
 */
const ROLE_ORDER: Record<ArtistRole, number> = {
  Main: 0,
  Guest: 1,
  Composer: 2,
  Conductor: 3,
  DJ: 4,
  Remixer: 5,
  Producer: 6,
  Arranger: 7
};

export const ARTIST_ROLES = (Object.keys(ROLE_ORDER) as ArtistRole[]).sort(
  (a, b) => ROLE_ORDER[a] - ROLE_ORDER[b]
);

/** Credits under their role, in role order; a role with no credit is absent. */
export const groupCreditsByRole = (credits: ReleaseCredit[]) =>
  ARTIST_ROLES.map((role) => ({
    role,
    credits: credits.filter((credit) => credit.role === role)
  })).filter((group) => group.credits.length > 0);

type Params = {
  communityId: number;
  releaseId: number;
  credits: ReleaseCredit[];
  user: AuthUser | null;
};

/**
 * Credit editing on the release page (#388, stellar-api#721). A moderator
 * (`communities_manage` or `admin`, as the api's tag and credit gates) may
 * change or remove any credit; anyone else only the credits they added. Adding
 * is open to every viewer.
 */
export const useReleaseCredits = ({
  communityId,
  releaseId,
  credits,
  user
}: Params) => {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [addCredit, { isLoading: adding }] = useAddReleaseCreditMutation();
  const [changeRole, { isLoading: changing }] =
    useChangeReleaseCreditRoleMutation();
  const [removeCredit, { isLoading: removing }] =
    useRemoveReleaseCreditMutation();
  const [createArtist, { isLoading: creating }] = useCreateArtistMutation();

  const isModerator = hasAnyPermission(user, ['communities_manage', 'admin']);
  const canManage = (credit: ReleaseCredit) =>
    isModerator || (user !== null && credit.addedById === user.id);
  const canEditAny = credits.some(canManage);
  const isLastCredit = credits.length <= 1;

  const fail = (err: unknown, fallback: string) =>
    dispatch(addAlert(getApiErrorMessage(err) ?? fallback, 'danger'));

  const handleChangeRole = async (creditId: number, role: ArtistRole) => {
    try {
      await changeRole({ communityId, releaseId, creditId, role }).unwrap();
    } catch (err) {
      fail(err, 'Failed to change the role.');
    }
  };

  const handleRemove = async (creditId: number) => {
    try {
      await removeCredit({ communityId, releaseId, creditId }).unwrap();
    } catch (err) {
      fail(err, 'Failed to remove the credit.');
    }
  };

  /**
   * Adds the credit, creating the artist first when the choice is a new name.
   * Resolves true on success so the form can clear itself.
   */
  const handleAdd = async (choice: ArtistChoice, role: ArtistRole) => {
    try {
      const artistId =
        choice.id ?? (await createArtist({ name: choice.name }).unwrap()).id;
      await addCredit({ communityId, releaseId, artistId, role }).unwrap();
      return true;
    } catch (err) {
      fail(err, 'Failed to add the credit.');
      return false;
    }
  };

  return {
    editing,
    setEditing,
    canManage,
    canEditAny,
    isLastCredit,
    busy: adding || changing || removing || creating,
    handleChangeRole,
    handleRemove,
    handleAdd
  };
};
