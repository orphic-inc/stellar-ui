import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { isStaffUser } from '../../utils/permissions';
import { useGetReportCountsQuery } from '../../store/services/reportsApi';
import {
  useDismissInstallChecklistItemMutation,
  useGetInstallStatusQuery
} from '../../store/services/installApi';

const CHECKLIST_LINKS: Record<
  string,
  { to: string; label: string } | undefined
> = {
  'registration-open': {
    to: '/private/staff/tools/settings',
    label: 'Open settings'
  },
  'max-users-default': {
    to: '/private/staff/tools/settings',
    label: 'Open settings'
  },
  'approved-domains-empty': {
    to: '/private/staff/tools/settings',
    label: 'Open settings'
  }
};

const ModBar = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: reportCounts } = useGetReportCountsQuery();
  const { data: installStatus } = useGetInstallStatusQuery();
  const [dismissChecklistItem] = useDismissInstallChecklistItemMutation();

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
            {setupChecklist.map((item) => {
              const actionLink = CHECKLIST_LINKS[item.id];
              return (
                <span
                  key={item.id}
                  className="rounded border border-amber-800/70 bg-amber-900/30 px-2 py-1 inline-flex items-center gap-2"
                >
                  <span className="text-amber-100">{item.message}</span>
                  {actionLink && (
                    <Link
                      to={actionLink.to}
                      className="text-amber-400 hover:text-amber-100 underline underline-offset-2 transition-colors"
                    >
                      {actionLink.label}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void dismissChecklistItem(item.id)}
                    className="text-amber-500 hover:text-amber-200 transition-colors"
                    aria-label={`Dismiss ${item.id}`}
                    title="Dismiss reminder"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModBar;
