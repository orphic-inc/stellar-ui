import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { hasPermission, isStaffUser } from '../../utils/permissions';
import { useGetStaffUnreadCountQuery } from '../../store/services/staffInboxApi';
import { useGetReportCountsQuery } from '../../store/services/reportsApi';

const ModBar = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: inboxCounts } = useGetStaffUnreadCountQuery(undefined, {
    skip: !isStaffUser(user)
  });
  const { data: reportCounts } = useGetReportCountsQuery(undefined, {
    skip: !isStaffUser(user)
  });

  if (!isStaffUser(user)) return null;

  const openTickets = inboxCounts?.count ?? 0;
  const openReports = (reportCounts?.open ?? 0) + (reportCounts?.claimed ?? 0);

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
      <Link
        to="/private/staff/inbox"
        className="hover:text-amber-200 transition-colors flex items-center gap-1"
      >
        Inbox
        {openTickets > 0 && (
          <span className="bg-amber-700 text-amber-100 rounded-full px-1.5 py-0.5 leading-none">
            {openTickets}
          </span>
        )}
      </Link>
      <Link
        to="/private/staff/reports"
        className="hover:text-amber-200 transition-colors flex items-center gap-1"
      >
        Reports
        {openReports > 0 && (
          <span className="bg-amber-700 text-amber-100 rounded-full px-1.5 py-0.5 leading-none">
            {openReports}
          </span>
        )}
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
