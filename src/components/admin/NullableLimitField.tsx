import { useRef } from 'react';

type Props = {
  id: string;
  label: string;
  /** `null` is unlimited; `0` is none. */
  value: number | null;
  onChange: (next: number | null) => void;
};

/**
 * A rank limit where `null` means unlimited (#370): a number input plus an
 * "Unlimited" checkbox. Unlimited is a deliberate grant, so it takes its own
 * click rather than being what an empty input means. Clearing the checkbox
 * restores the number it replaced.
 */
const NullableLimitField = ({ id, label, value, onChange }: Props) => {
  const lastNumber = useRef(0);
  const unlimited = value === null;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="number"
          min={0}
          disabled={unlimited}
          value={unlimited ? '' : value}
          onChange={(e) =>
            onChange(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
          }
          className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-40"
        />
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) => {
              if (e.target.checked) {
                lastNumber.current = value ?? 0;
                onChange(null);
              } else {
                onChange(lastNumber.current);
              }
            }}
          />
          Unlimited
          {/* Other checkboxes on the page are "Unlimited …" too, so the name
              says which limit this one lifts. */}
          <span className="sr-only"> {label}</span>
        </label>
      </div>
      <p className="text-xs text-gray-500 mt-1">0 = none</p>
    </div>
  );
};

export default NullableLimitField;
