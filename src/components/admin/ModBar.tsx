import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { hasPermission, isStaffUser } from '../../utils/permissions';

const ModBar = () => {
  const user = useAppSelector(selectCurrentUser);

  if (!isStaffUser(user)) return null;

  return (
    <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-1 flex items-center gap-3 text-xs text-amber-400">
      <span className="font-semibold uppercase tracking-wide">Staff</span>
      <span className="text-amber-800">|</span>
      <Link
        to="/private/staff/tools"
        className="hover:text-amber-200 transition-colors"
      >
        Toolbox
      </Link>
      {hasPermission(user, 'admin') && (
        <Link
          to="/private/staff/tools/user-ranks"
          className="hover:text-amber-200 transition-colors"
        >
          User Ranks
        </Link>
      )}
      {hasPermission(user, 'forums_manage') && (
        <>
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
        </>
      )}
    </div>
  );
};

export default ModBar;
