import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useDemoteTagMutation,
  useGetOfficialTagsQuery,
  usePromoteTagMutation
} from '../../store/services/tagApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { Button, Panel, SectionHeading } from '../ui';

/**
 * Staff curation of the official tag vocabulary (#365, stellar-api#298,
 * ADR-0045). Promote takes a name rather than picking an existing tag, because
 * the api mints a tag that does not exist yet. The api folds the name and
 * follows the alias table, so the alert names the tag it landed on.
 */
const TagCuration = () => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const { data: officialTags = [] } = useGetOfficialTagsQuery();
  const [promote, { isLoading: promoting }] = usePromoteTagMutation();
  const [demote] = useDemoteTagMutation();

  const alert = (msg: string, kind: 'success' | 'danger') =>
    dispatch(addAlert(msg, kind));

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tag = await promote(name.trim()).unwrap();
      alert(`"${tag.name}" is now an official tag.`, 'success');
      setName('');
    } catch (err) {
      alert(getApiErrorMessage(err) ?? 'Failed to promote the tag.', 'danger');
    }
  };

  const handleDemote = async (id: number) => {
    try {
      const tag = await demote(id).unwrap();
      alert(`"${tag.name}" is no longer an official tag.`, 'success');
    } catch (err) {
      alert(getApiErrorMessage(err) ?? 'Failed to demote the tag.', 'danger');
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeading>Official tags</SectionHeading>
      <Panel className="p-4 space-y-3">
        <form onSubmit={handlePromote} className="flex gap-2 items-end">
          <div className="flex-1">
            <label htmlFor="promote-tag" data-st="meta" className="block mb-1">
              Promote a tag
            </label>
            <input
              id="promote-tag"
              data-st="field"
              className="w-full"
              placeholder="e.g. shoegaze"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            type="submit"
            disabled={promoting || !name.trim()}
          >
            {promoting ? 'Promoting…' : 'Promote'}
          </Button>
        </form>
        {officialTags.length === 0 ? (
          <p data-st="meta" className="text-sm">
            No official tags yet.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {officialTags.map((tag) => (
              <li key={tag.id} data-st="chip" className="text-xs">
                {tag.name}
                <Button
                  variant="link-danger"
                  onClick={() => handleDemote(tag.id)}
                  aria-label={`Demote ${tag.name}`}
                  className="ml-1"
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  );
};

export default TagCuration;
