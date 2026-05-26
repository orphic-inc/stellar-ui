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

  const togglePerk = (
    key: string,
    current: Record<string, boolean>,
    setter: (updater: (f: RankForm) => RankForm) => void
  ) => {
    setter((f) => ({
      ...f,
      perks: { ...current, [key]: !current[key] }
    }));
  };

  const fieldClass =
    'w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500';

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load donor ranks.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Donor Ranks</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create Rank'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">
            New Donor Rank
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="donor-rank-name"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Name
                </label>
                <input
                  id="donor-rank-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-min-donation"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Min Donation ($)
                </label>
                <input
                  id="donor-rank-min-donation"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minDonation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minDonation: e.target.value }))
                  }
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-badge"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Badge (emoji/text)
                </label>
                <input
                  id="donor-rank-badge"
                  type="text"
                  value={form.badge}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, badge: e.target.value }))
                  }
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-color"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Badge color (hex, optional)
                </label>
                <input
                  id="donor-rank-color"
                  type="text"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  placeholder="#ff69b4"
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-expires"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Expires after (days, optional)
                </label>
                <input
                  id="donor-rank-expires"
                  type="number"
                  min={0}
                  value={form.expiresAfterDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expiresAfterDays: e.target.value
                    }))
                  }
                  className={fieldClass}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Perks</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PERK_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!form.perks[key]}
                      onChange={() => togglePerk(key, form.perks, setForm)}
                      className="accent-indigo-500"
                    />
                    {PERK_LABELS[key]}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {isCreating ? 'Creating…' : 'Create Rank'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!ranks || ranks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-10 text-center">
          <p className="text-gray-500 text-sm">No donor ranks defined yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranks.map((rank) => (
            <div
              key={rank.id}
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className="font-medium text-sm"
                    style={{ color: rank.color || undefined }}
                  >
                    {rank.badge && <span className="mr-1">{rank.badge}</span>}
                    {rank.name}
                  </span>
                  <span className="ml-3 text-xs text-gray-500">
                    ${rank.minDonation}
                    {rank.expiresAfterDays != null &&
                      ` · ${rank.expiresAfterDays}d`}
                  </span>
                </div>
                <button
                  onClick={() =>
                    editingId === rank.id
                      ? setEditingId(null)
                      : handleStartEdit(rank)
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {editingId === rank.id ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(rank.id, rank.name)}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>

              {editingId === rank.id && (
                <div className="border-t border-gray-700 px-4 py-3 bg-gray-950">
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`edit-rank-name-${rank.id}`}
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Name
                        </label>
                        <input
                          id={`edit-rank-name-${rank.id}`}
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          required
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edit-rank-min-${rank.id}`}
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Min Donation ($)
                        </label>
                        <input
                          id={`edit-rank-min-${rank.id}`}
                          type="number"
                          min={0}
                          step={0.01}
                          value={editForm.minDonation}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              minDonation: e.target.value
                            }))
                          }
                          required
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edit-rank-badge-${rank.id}`}
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Badge
                        </label>
                        <input
                          id={`edit-rank-badge-${rank.id}`}
                          type="text"
                          value={editForm.badge}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              badge: e.target.value
                            }))
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edit-rank-color-${rank.id}`}
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Color (hex)
                        </label>
                        <input
                          id={`edit-rank-color-${rank.id}`}
                          type="text"
                          value={editForm.color}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              color: e.target.value
                            }))
                          }
                          placeholder="#ff69b4"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edit-rank-expires-${rank.id}`}
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Expires after (days)
                        </label>
                        <input
                          id={`edit-rank-expires-${rank.id}`}
                          type="number"
                          min={0}
                          value={editForm.expiresAfterDays}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              expiresAfterDays: e.target.value
                            }))
                          }
                          className={fieldClass}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Perks</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PERK_KEYS.map((key) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={!!editForm.perks[key]}
                              onChange={() =>
                                togglePerk(key, editForm.perks, setEditForm)
                              }
                              className="accent-indigo-500"
                            />
                            {PERK_LABELS[key]}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      >
                        {isUpdating ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorRanksPage;
