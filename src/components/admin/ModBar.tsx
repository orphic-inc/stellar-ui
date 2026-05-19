import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { isStaffUser } from '../../utils/permissions';
import { useGetReportCountsQuery } from '../../store/services/reportsApi';
import { useGetInstallStatusQuery } from '../../store/services/installApi';

const ModBar = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: reportCounts } = useGetReportCountsQuery();
  const { data: installStatus } = useGetInstallStatusQuery();

  if (!isStaffUser(user)) return null;

  const openReports = reportCounts?.open ?? 0;
  const setupChecklist = installStatus?.setupChecklist ?? [];

  return (
    <div className="bg-amber-950/40 border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 py-1.5">
        <div className="flex items-center gap-3 text-xs text-amber-400">
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

        {setupChecklist.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-amber-200">
            <span className="font-medium">
              Configuration steps to complete before launch:
            </span>
            {setupChecklist.map((item) => (
              <span
                key={item}
                className="rounded border border-amber-800/70 bg-amber-900/30 px-2 py-0.5"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModBar;
