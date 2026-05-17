import { useNavigate } from 'react-router-dom';

const ENTITY_INPUTS = [
  { label: 'Releases', path: '/private/releases' },
  { label: 'Artists', path: '/private/artists' },
  { label: 'Requests', path: '/private/requests' },
  { label: 'Forums', path: '/private/forums' },
  { label: 'Log', path: '/private/log' },
  { label: 'Users', path: '/private/users' }
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
    <div className="bg-gray-900 border-t border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 overflow-x-auto">
        {ENTITY_INPUTS.map(({ label, path }) => (
          <input
            key={path}
            type="text"
            onKeyDown={handleKey(path)}
            placeholder={label}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-0.5 w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500 shrink-0"
          />
        ))}
      </div>
    </div>
  );
};

export default QuickSearch;
