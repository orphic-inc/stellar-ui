import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRequestMutation } from '../../store/services/requestApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import type { ReleaseType } from '../../store/services/requestApi';

const RELEASE_TYPES: ReleaseType[] = [
  'Music',
  'Applications',
  'EBooks',
  'ELearningVideos',
  'Audiobooks',
  'Comedy',
  'Comics'
];

const MIN_BOUNTY_BYTES = 104857600; // 100 MiB

const CreateRequestForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: communitiesData } = useGetCommunitiesQuery();
  const [createRequest, { isLoading }] = useCreateRequestMutation();

  const [form, setForm] = useState({
    title: '',
    description: '',
    communityId: '',
    type: 'Music' as ReleaseType,
    year: '',
    image: '',
    bounty: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.communityId) errs.communityId = 'Community is required';
    if (!form.bounty) {
      errs.bounty = 'Bounty is required';
    } else {
      const b = Number(form.bounty);
      if (isNaN(b) || b < MIN_BOUNTY_BYTES) {
        errs.bounty = `Minimum bounty is ${(MIN_BOUNTY_BYTES / 1048576).toFixed(
          0
        )} MiB`;
      }
    }
    if (form.year) {
      const y = parseInt(form.year, 10);
      if (isNaN(y) || y < 1900 || y > 2100)
        errs.year = 'Year must be between 1900 and 2100';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const result = await createRequest({
        title: form.title.trim(),
        description: form.description.trim(),
        communityId: parseInt(form.communityId, 10),
        type: form.type,
        bounty: form.bounty,
        year: form.year ? parseInt(form.year, 10) : undefined,
        image: form.image || undefined
      }).unwrap();

      dispatch(addAlert('Request created.', 'success'));
      navigate(`/private/requests/${result.id}`);
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ??
        'Failed to create request.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const communities = communitiesData?.data ?? [];

  return (
    <div className="thin">
      <h2 className="text-xl font-semibold mb-6">New Request</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="req-title"
            className="block text-sm text-gray-400 mb-1"
          >
            Title
          </label>
          <input
            id="req-title"
            value={form.title}
            onChange={set('title')}
            maxLength={256}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            placeholder="What are you looking for?"
          />
          {errors.title && (
            <p className="text-red-400 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="req-description"
            className="block text-sm text-gray-400 mb-1"
          >
            Description
          </label>
          <textarea
            id="req-description"
            value={form.description}
            onChange={set('description')}
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y"
            placeholder="Describe what you're requesting in detail…"
          />
          {errors.description && (
            <p className="text-red-400 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="req-community"
              className="block text-sm text-gray-400 mb-1"
            >
              Community
            </label>
            <select
              id="req-community"
              value={form.communityId}
              onChange={set('communityId')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              <option value="">Select community…</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.communityId && (
              <p className="text-red-400 text-xs mt-1">{errors.communityId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="req-type"
              className="block text-sm text-gray-400 mb-1"
            >
              Type
            </label>
            <select
              id="req-type"
              value={form.type}
              onChange={set('type')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              {RELEASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="req-year"
              className="block text-sm text-gray-400 mb-1"
            >
              Year (optional)
            </label>
            <input
              id="req-year"
              type="number"
              value={form.year}
              onChange={set('year')}
              min={1900}
              max={2100}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              placeholder="e.g. 2003"
            />
            {errors.year && (
              <p className="text-red-400 text-xs mt-1">{errors.year}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="req-bounty"
              className="block text-sm text-gray-400 mb-1"
            >
              Bounty (bytes){' '}
              <span className="text-gray-500 text-xs">
                min 100 MiB = 104857600
              </span>
            </label>
            <input
              id="req-bounty"
              type="number"
              value={form.bounty}
              onChange={set('bounty')}
              min={MIN_BOUNTY_BYTES}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono"
              placeholder="104857600"
            />
            {errors.bounty && (
              <p className="text-red-400 text-xs mt-1">{errors.bounty}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="req-image"
            className="block text-sm text-gray-400 mb-1"
          >
            Cover image URL (optional)
          </label>
          <input
            id="req-image"
            type="url"
            value={form.image}
            onChange={set('image')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            placeholder="https://…"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-40"
          >
            {isLoading ? 'Creating…' : 'Create Request'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequestForm;
