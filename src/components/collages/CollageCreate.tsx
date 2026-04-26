import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollageMutation } from '../../store/services/collageApi';

const CATEGORIES = [
  { id: 0, label: 'Personal' },
  { id: 1, label: 'Theme / Genre Intro' },
  { id: 2, label: 'Discography' },
  { id: 3, label: 'Label' },
  { id: 4, label: 'Charts' },
  { id: 5, label: 'Staff Picks' },
  { id: 6, label: 'Other' }
];

const CollageCreate = () => {
  const navigate = useNavigate();
  const [createCollage, { isLoading }] = useCreateCollageMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const collage = await createCollage({
        name,
        description,
        categoryId,
        tags
      }).unwrap();
      navigate(`/private/collages/${collage.id}`);
    } catch (err: unknown) {
      const e = err as { data?: { msg?: string } };
      setError(e?.data?.msg ?? 'Failed to create collage.');
    }
  };

  return (
    <div className="thin">
      <h2 className="text-xl font-semibold mb-4">Create Collage</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="collage-name"
            className="block text-sm text-gray-300 mb-1"
          >
            Name
          </label>
          <input
            id="collage-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={100}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="collage-category"
            className="block text-sm text-gray-300 mb-1"
          >
            Category
          </label>
          <select
            id="collage-category"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {CATEGORIES.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="collage-description"
            className="block text-sm text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="collage-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={5}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>

        <div>
          <label
            htmlFor="collage-tags"
            className="block text-sm text-gray-300 mb-1"
          >
            Tags <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            id="collage-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="jazz, 2020s, favorites"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded"
          >
            {isLoading ? 'Creating…' : 'Create Collage'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/private/collages')}
            className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollageCreate;
