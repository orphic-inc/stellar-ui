import { useNavigate } from 'react-router-dom';

const ENTITY_INPUTS = [
  { label: 'Releases', path: '/releases' },
  { label: 'Artists', path: '/artists' },
  { label: 'Requests', path: '/requests' },
  { label: 'Forums', path: '/forums' },
  { label: 'Log', path: '/log' },
  { label: 'Users', path: '/users' }
];

const QuickSearch = () => {
  const navigate = useNavigate();

  const handleKey =
    (path: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      const q = e.currentTarget.value.trim();
      e.currentTarget.value = '';
      navigate(q ? `${path}?q=${encodeURIComponent(q)}` : path);
    };

  return (
    <div className="bg-[var(--st-base)] border-t border-[var(--st-border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 overflow-x-auto">
        {ENTITY_INPUTS.map(({ label, path }) => (
          <input
            key={path}
            type="text"
            onKeyDown={handleKey(path)}
            placeholder={label}
            data-st="field"
            className="text-xs w-24 shrink-0"
          />
        ))}
      </div>
    </div>
  );
};

export default QuickSearch;
