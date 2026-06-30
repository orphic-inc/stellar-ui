import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetCommunitiesQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation
} from '../../store/services/communityApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import type { Community, CommunityType, RegistrationStatus } from '../../types';
import { PageShell, Panel, Button, SectionHeading } from '../ui';

const COMMUNITY_TYPES: CommunityType[] = [
  'Music',
  'Applications',
  'EBooks',
  'ELearningVideos',
  'Audiobooks',
  'Comedy',
  'Comics'
];

const REGISTRATION_STATUSES: { value: RegistrationStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'invite', label: 'Invite only' },
  { value: 'closed', label: 'Closed' }
];

const VALID_REGISTRATION_STATUSES = ['open', 'invite', 'closed'] as const;

const isRegistrationStatus = (v: unknown): v is RegistrationStatus =>
  typeof v === 'string' &&
  (VALID_REGISTRATION_STATUSES as readonly string[]).includes(v);

const toRegistrationStatus = (
  v: string | null | undefined
): RegistrationStatus => (isRegistrationStatus(v) ? v : 'open');

const EditRow = ({
  community,
  onDone
}: {
  community: Community;
  onDone: () => void;
}) => {
  const [updateCommunity] = useUpdateCommunityMutation();
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>(
      toRegistrationStatus(community.registrationStatus)
    );
  const [allowDuplicateFormats, setAllowDuplicateFormats] = useState(
    community.allowDuplicateFormats
  );
  const [staffMembers, setStaffMembers] = useState(community.staff ?? []);
  const [newStaffUserId, setNewStaffUserId] = useState('');
  const [leaderId, setLeaderId] = useState(
    community.leaderId != null ? String(community.leaderId) : ''
  );

  const handleAddStaff = () => {
    const uid = parseInt(newStaffUserId, 10);
    if (!uid || staffMembers.some((s) => s.id === uid)) return;
    setStaffMembers((prev) => [...prev, { id: uid, username: `#${uid}` }]);
    setNewStaffUserId('');
  };

  const handleRemoveStaff = (uid: number) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== uid));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCommunity({
      id: community.id,
      name,
      description,
      registrationStatus,
      allowDuplicateFormats,
      staffIds: staffMembers.map((s) => s.id),
      leaderId: leaderId.trim() === '' ? null : parseInt(leaderId, 10)
    });
    onDone();
  };

  return (
    <tr data-st="row" data-st-open>
      <td className="p-0" colSpan={5}>
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label
                htmlFor={`edit-cm-name-${community.id}`}
                data-st="meta"
                className="block mb-1"
              >
                Name
              </label>
              <input
                id={`edit-cm-name-${community.id}`}
                data-st="field"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 min-w-40">
              <label
                htmlFor={`edit-cm-desc-${community.id}`}
                data-st="meta"
                className="block mb-1"
              >
                Description
              </label>
              <input
                id={`edit-cm-desc-${community.id}`}
                data-st="field"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor={`edit-cm-status-${community.id}`}
                data-st="meta"
                className="block mb-1"
              >
                Registration
              </label>
              <select
                id={`edit-cm-status-${community.id}`}
                data-st="field"
                value={registrationStatus}
                onChange={(e) =>
                  setRegistrationStatus(e.target.value as RegistrationStatus)
                }
              >
                {REGISTRATION_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`edit-cm-leader-${community.id}`}
                data-st="meta"
                className="block mb-1"
              >
                Leader (User ID)
              </label>
              <input
                id={`edit-cm-leader-${community.id}`}
                data-st="field"
                type="number"
                min={1}
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                placeholder="—"
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-2 self-end pb-1">
              <input
                id={`edit-cm-dupeformats-${community.id}`}
                data-st="field"
                type="checkbox"
                checked={allowDuplicateFormats}
                onChange={(e) => setAllowDuplicateFormats(e.target.checked)}
              />
              <label
                htmlFor={`edit-cm-dupeformats-${community.id}`}
                data-st="meta"
                className="whitespace-nowrap"
              >
                Allow duplicate formats
              </label>
            </div>
          </div>

          {/* Staff management */}
          <div className="border border-[var(--st-border)] rounded p-3 space-y-2">
            <p
              data-st="meta"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Community Staff
            </p>
            <div className="flex flex-wrap gap-1.5">
              {staffMembers.length === 0 && (
                <span data-st="meta" className="text-xs">
                  No staff assigned.
                </span>
              )}
              {staffMembers.map((s) => (
                <span
                  key={s.id}
                  data-st="chip"
                  className="inline-flex items-center gap-1 text-xs"
                >
                  {s.username}
                  <Button
                    variant="link-danger"
                    onClick={() => handleRemoveStaff(s.id)}
                    className="ml-0.5"
                  >
                    ×
                  </Button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                data-st="field"
                type="number"
                min={1}
                value={newStaffUserId}
                onChange={(e) => setNewStaffUserId(e.target.value)}
                placeholder="User ID"
                className="w-24"
              />
              <Button
                variant="primary"
                onClick={handleAddStaff}
                disabled={!newStaffUserId}
              >
                Add Staff
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" type="submit">
              Save
            </Button>
            <Button variant="link" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
};

const CommunityManager = () => {
  const dispatch = useDispatch();
  const { data: communities, isLoading, error } = useGetCommunitiesQuery(1);
  const [createCommunity, { isLoading: isCreating }] =
    useCreateCommunityMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<CommunityType>('Music');
  const [newStatus, setNewStatus] = useState<RegistrationStatus>('open');
  const [newAllowDuplicateFormats, setNewAllowDuplicateFormats] =
    useState(true);
  const [newLeaderId, setNewLeaderId] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCommunity({
        name: newName,
        description: newDescription,
        type: newType,
        registrationStatus: newStatus,
        allowDuplicateFormats: newAllowDuplicateFormats,
        ...(newLeaderId !== '' && { leaderId: parseInt(newLeaderId, 10) })
      }).unwrap();
      dispatch(addAlert('Community created successfully.', 'success'));
      setNewName('');
      setNewDescription('');
      setNewType('Music');
      setNewStatus('open');
      setNewAllowDuplicateFormats(true);
      setNewLeaderId('');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to create community.',
          'danger'
        )
      );
    }
  };

  return (
    <PageShell title="Community Manager" width="lg">
      <section className="space-y-3">
        <SectionHeading>Communities</SectionHeading>
        <Panel className="overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <Spinner />
            </div>
          ) : error ? (
            <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
              Failed to load communities.
            </p>
          ) : (
            <table data-st="grid">
              <thead data-st="colhead">
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th data-st-num>Releases</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {!communities?.data?.length ? (
                  <tr data-st="row">
                    <td colSpan={5} className="text-center">
                      No communities yet.
                    </td>
                  </tr>
                ) : (
                  communities.data.map((c) =>
                    editingId === c.id ? (
                      <EditRow
                        key={c.id}
                        community={c}
                        onDone={() => setEditingId(null)}
                      />
                    ) : (
                      <tr key={c.id} data-st="row">
                        <td className="font-medium">
                          <Link
                            to={`/private/communities/${c.id}`}
                            data-st="control"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td>{c.type ?? '—'}</td>
                        <td>{c.description ?? '—'}</td>
                        <td data-st-num>{c._count?.releases ?? 0}</td>
                        <td className="text-center">
                          <Button
                            variant="link"
                            onClick={() => setEditingId(c.id)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          )}
        </Panel>
      </section>

      <section className="space-y-3">
        <SectionHeading>Create New Community</SectionHeading>
        <Panel
          as="form"
          onSubmit={handleCreate}
          className="p-4 flex flex-wrap gap-4 items-end"
        >
          <div>
            <label
              htmlFor="cm-name"
              data-st="meta"
              className="block text-sm font-medium mb-1"
            >
              Name <span className="text-[var(--st-danger)]">*</span>
            </label>
            <input
              id="cm-name"
              data-st="field"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="Community name"
              className="w-52"
            />
          </div>
          <div>
            <label
              htmlFor="cm-type"
              data-st="meta"
              className="block text-sm font-medium mb-1"
            >
              Type <span className="text-[var(--st-danger)]">*</span>
            </label>
            <select
              id="cm-type"
              data-st="field"
              value={newType}
              onChange={(e) => setNewType(e.target.value as CommunityType)}
            >
              {COMMUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="cm-status"
              data-st="meta"
              className="block text-sm font-medium mb-1"
            >
              Registration <span className="text-[var(--st-danger)]">*</span>
            </label>
            <select
              id="cm-status"
              data-st="field"
              value={newStatus}
              onChange={(e) =>
                setNewStatus(e.target.value as RegistrationStatus)
              }
            >
              {REGISTRATION_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label
              htmlFor="cm-description"
              data-st="meta"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <input
              id="cm-description"
              data-st="field"
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full"
            />
          </div>
          {newStatus !== 'open' && (
            <div>
              <label
                htmlFor="cm-leader-id"
                data-st="meta"
                className="block text-sm font-medium mb-1"
              >
                Leader User ID{' '}
                <span className="text-[var(--st-danger)]">*</span>
              </label>
              <input
                id="cm-leader-id"
                data-st="field"
                type="number"
                min={1}
                value={newLeaderId}
                onChange={(e) => setNewLeaderId(e.target.value)}
                required
                placeholder="User ID"
                className="w-28"
              />
            </div>
          )}
          <div className="flex items-center gap-2 self-end pb-2.5">
            <input
              id="cm-allow-duplicate-formats"
              data-st="field"
              type="checkbox"
              checked={newAllowDuplicateFormats}
              onChange={(e) => setNewAllowDuplicateFormats(e.target.checked)}
            />
            <label
              htmlFor="cm-allow-duplicate-formats"
              data-st="meta"
              className="whitespace-nowrap"
            >
              Allow duplicate formats
            </label>
          </div>
          <Button variant="primary" type="submit" disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create Community'}
          </Button>
        </Panel>
      </section>
    </PageShell>
  );
};

export default CommunityManager;
