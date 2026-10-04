import { useGetOfficialTagsQuery } from '../../store/services/tagApi';

const OFFICIAL_TAGS_LIST = 'official-tags';

/**
 * The release tag editor's add row: a free-text field and its button. The
 * curated vocabulary (#365, stellar-api#298) arrives as the field's datalist,
 * so official tags are suggested as a member types while any name is still
 * accepted: the vocabulary is open by design (ADR-0045 §1).
 */
const TagAddRow = ({
  value,
  onChange,
  onAdd,
  adding
}: {
  value: string;
  onChange: (next: string) => void;
  onAdd: () => void;
  adding: boolean;
}) => {
  const { data: officialTags = [] } = useGetOfficialTagsQuery();
  return (
    <div className="flex gap-1">
      <input
        type="text"
        data-st="field"
        value={value}
        list={OFFICIAL_TAGS_LIST}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onAdd();
        }}
        placeholder="Add tag…"
        className="flex-1 min-w-0 text-xs rounded px-2 py-1"
      />
      <datalist id={OFFICIAL_TAGS_LIST}>
        {officialTags.map((tag) => (
          <option key={tag.id} value={tag.name} />
        ))}
      </datalist>
      <button
        type="button"
        disabled={adding || !value.trim()}
        onClick={onAdd}
        data-st="control"
        data-st-primary
        className="text-xs disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
};

export default TagAddRow;
