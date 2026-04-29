import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { isStaffUser } from '../../utils/permissions';
import { useGetReportCountsQuery } from '../../store/services/reportsApi';

const ModBar = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: reportCounts } = useGetReportCountsQuery();

  if (!isStaffUser(user)) return null;

  const openReports = reportCounts?.open ?? 0;

  return (
    <div className="bg-amber-950/40 border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 py-1 flex items-center gap-3 text-xs text-amber-400">
        <span className="font-semibold uppercase tracking-wide">Staff</span>
        <span className="text-amber-800">|</span>
        <Link
          to="/private/staff/tools"
          className="hover:text-amber-200 transition-colors"
        >
          Toolbox
        </Link>
        <span className="text-amber-800">|</span>
        <Link
          to="/private/staff/reports"
          className="hover:text-amber-200 transition-colors flex items-center gap-1"
        >
          Reports
          {openReports > 0 && (
            <span className="bg-red-700 text-red-100 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none">
              {openReports}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default ModBar;
