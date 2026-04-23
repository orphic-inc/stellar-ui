import { Link } from 'react-router-dom';

const ModBar = () => (
  <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-1 flex items-center gap-3 text-xs text-amber-400">
    <span className="font-semibold uppercase tracking-wide">Staff</span>
    <span className="text-amber-800">|</span>
    <Link
      to="/private/staff/tools"
      className="hover:text-amber-200 transition-colors"
    >
      Toolbox
    </Link>
    <Link
      to="/private/staff/tools/user-ranks"
      className="hover:text-amber-200 transition-colors"
    >
      User Ranks
    </Link>
    <Link
      to="/private/staff/tools/categories"
      className="hover:text-amber-200 transition-colors"
    >
      Categories
    </Link>
    <Link
      to="/private/staff/tools/forums"
      className="hover:text-amber-200 transition-colors"
    >
      Forums
    </Link>
  </div>
);

export default ModBar;
