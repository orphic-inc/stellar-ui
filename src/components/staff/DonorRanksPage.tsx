import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetDonorRanksQuery,
  useCreateDonorRankMutation,
  useUpdateDonorRankMutation,
  useDeleteDonorRankMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button } from '../ui';

const PERK_KEYS = [
  'iconMouseOverText',
  'avatarMouseOverText',
  'customIcon',
  'customIconLink',
  'secondAvatar',
  'forumTitle',
  'profileInfo1',
  'profileInfo2',
  'profileInfo3',
  'profileInfo4'
] as const;

const PERK_LABELS: Record<string, string> = {
  iconMouseOverText: 'Custom icon mouseover text',
  avatarMouseOverText: 'Avatar mouseover text',
  customIcon: 'Custom icon',
  customIconLink: 'Custom icon link',
  secondAvatar: 'Second avatar',
  forumTitle: 'Forum title prefix/suffix',
  profileInfo1: 'Profile info block 1',
  profileInfo2: 'Profile info block 2',
  profileInfo3: 'Profile info block 3',
  profileInfo4: 'Profile info block 4'
};

type RankForm = {
  name: string;
  minDonation: string;
  badge: string;
  color: string;
  expiresAfterDays: string;
  perks: Record<string, boolean>;
};

const emptyForm = (): RankForm => ({
  name: '',
  minDonation: '',
  badge: '',
  color: '',
  expiresAfterDays: '',
  perks: {}
});

// The create form and each per-rank inline edit form share this exact field set,
// so it lives in one place keyed off `idPrefix` (label↔input association must stay
// unique across the create form and any open edit form). Inputs/checkboxes paint
// from the `field` Role directly; labels decompose to `meta`.
const RankFields = ({
  idPrefix,
  form,
  setForm
}: {
  idPrefix: string;
  form: RankForm;
  setForm: React.Dispatch<React.SetStateAction<RankForm>>;
}) => {
  const togglePerk = (key: string) =>
    setForm((f) => ({ ...f, perks: { ...f.perks, [key]: !f.perks[key] } }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${idPrefix}-name`}
            data-st="meta"
            className="block text-xs mb-1"
          >
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            data-st="field"
            className="w-full"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-min-donation`}
            data-st="meta"
            className="block text-xs mb-1"
          >
            Min Donation ($)
          </label>
          <input
            id={`${idPrefix}-min-donation`}
            data-st="field"
            className="w-full"
            type="number"
            min={0}
            step={0.01}
            value={form.minDonation}
            onChange={(e) =>
              setForm((f) => ({ ...f, minDonation: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-badge`}
            data-st="meta"
            className="block text-xs mb-1"
          >
            Badge (emoji/text)
          </label>
          <input
            id={`${idPrefix}-badge`}
            data-st="field"
            className="w-full"
            type="text"
            value={form.badge}
            onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-color`}
            data-st="meta"
            className="block text-xs mb-1"
          >
            Color (hex)
          </label>
          <input
            id={`${idPrefix}-color`}
            data-st="field"
            className="w-full"
            type="text"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            placeholder="#ff69b4"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-expires`}
            data-st="meta"
            className="block text-xs mb-1"
          >
            Expires after (days)
          </label>
          <input
            id={`${idPrefix}-expires`}
            data-st="field"
            className="w-full"
            type="number"
            min={0}
            value={form.expiresAfterDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, expiresAfterDays: e.target.value }))
            }
          />
        </div>
      </div>
      <div>
        <p data-st="meta" className="text-xs mb-2">
          Perks
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PERK_KEYS.map((key) => (
            <label
              key={key}
              data-st="meta"
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                data-st="field"
                checked={!!form.perks[key]}
                onChange={() => togglePerk(key)}
              />
              {PERK_LABELS[key]}
            </label>
          ))}
        </div>
      </div>
    </>
  );
};

const DonorRanksPage = () => {
  const dispatch = useDispatch();
  const { data: ranks, isLoading, error } = useGetDonorRanksQuery();
  const [createRank, { isLoading: isCreating }] = useCreateDonorRankMutation();
  const [updateRank, { isLoading: isUpdating }] = useUpdateDonorRankMutation();
  const [deleteRank] = useDeleteDonorRankMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RankForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RankForm>(emptyForm());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRank({
        name: form.name,
        minDonation: Number(form.minDonation),
        badge: form.badge || undefined,
        color: form.color || undefined,
        expiresAfterDays: form.expiresAfterDays
          ? Number(form.expiresAfterDays)
          : undefined,
        perks: Object.keys(form.perks).length > 0 ? form.perks : undefined
      }).unwrap();
      dispatch(addAlert('Donor rank created.', 'success'));
      setForm(emptyForm());
      setShowForm(false);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to create donor rank.',
          'danger'
        )
      );
    }
  };

  const handleStartEdit = (rank: NonNullable<typeof ranks>[number]) => {
    setEditingId(rank.id);
    setEditForm({
      name: rank.name,
      minDonation: String(rank.minDonation),
      badge: rank.badge ?? '',
      color: rank.color ?? '',
      expiresAfterDays:
        rank.expiresAfterDays != null ? String(rank.expiresAfterDays) : '',
      perks: (rank.perks as Record<string, boolean>) ?? {}
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId == null) return;
    try {
      await updateRank({
        rankId: editingId,
        name: editForm.name,
        minDonation: Number(editForm.minDonation),
        badge: editForm.badge || undefined,
        color: editForm.color || undefined,
        expiresAfterDays: editForm.expiresAfterDays
          ? Number(editForm.expiresAfterDays)
          : undefined,
        perks:
          Object.keys(editForm.perks).length > 0 ? editForm.perks : undefined
      }).unwrap();
      dispatch(addAlert('Donor rank updated.', 'success'));
      setEditingId(null);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to update donor rank.',
          'danger'
        )
      );
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete donor rank "${name}"? This cannot be undone.`)) return;
    try {
      await deleteRank(id).unwrap();
      dispatch(addAlert('Donor rank deleted.', 'success'));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to delete donor rank.',
          'danger'
        )
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <p className="p-4 text-[var(--st-danger)]">Failed to load donor ranks.</p>
    );

  return (
    <PageShell
      title="Donor Ranks"
      actions={
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Create Rank'}
        </Button>
      }
    >
      {showForm && (
        <Panel className="p-5 space-y-3">
          <h3 data-st="prose" data-st-strong className="text-sm font-semibold">
            New Donor Rank
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <RankFields idPrefix="donor-rank" form={form} setForm={setForm} />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create Rank'}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {!ranks || ranks.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p data-st="meta" className="text-sm">
            No donor ranks defined yet.
          </p>
        </Panel>
      ) : (
        <div className="space-y-2">
          {ranks.map((rank) => (
            <Panel key={rank.id} className="overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className="font-medium text-sm"
                    style={{ color: rank.color || undefined }}
                  >
                    <span className="mr-1">{rank.badge ?? '—'}</span>
                    {rank.name}
                  </span>
                  <span className="ml-3 text-xs text-[var(--st-text-faint)]">
                    ${rank.minDonation}
                  </span>
                  <span className="ml-2 text-xs text-[var(--st-text-faint)]">
                    {rank.expiresAfterDays != null
                      ? `${rank.expiresAfterDays} days`
                      : 'Never'}
                  </span>
                </div>
                <Button
                  variant="link"
                  onClick={() =>
                    editingId === rank.id
                      ? setEditingId(null)
                      : handleStartEdit(rank)
                  }
                >
                  {editingId === rank.id ? 'Cancel' : 'Edit'}
                </Button>
                <Button
                  variant="link-danger"
                  onClick={() => handleDelete(rank.id, rank.name)}
                >
                  Delete
                </Button>
              </div>

              {editingId === rank.id && (
                <div className="border-t border-[var(--st-border-subtle)] bg-[var(--st-raised)] px-4 py-3">
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <RankFields
                      idPrefix={`edit-rank-${rank.id}`}
                      form={editForm}
                      setForm={setEditForm}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default DonorRanksPage;
