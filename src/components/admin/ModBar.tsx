import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetReportCountsQuery } from '../../store/services/reportsApi';
import {
  useDismissInstallChecklistItemMutation,
  useGetInstallStatusQuery,
  type LaunchChecklistItem
} from '../../store/services/installApi';
import { canSeeModBar, canUseReportActions } from '../staff/staffAffordances';
import { canAccessToolbox } from '../staff/staffToolRegistry';

const SITE_FULL_POLL_MS = 5 * 60 * 1000;

const CHECKLIST_LINKS: Record<
  string,
  { to: string; label: string } | undefined
> = {
  'registration-closed': {
    to: '/staff/tools/settings',
    label: 'Open settings'
  },
  'max-users-default': {
    to: '/staff/tools/settings',
    label: 'Open settings'
  },
  'approved-domains-empty': {
    to: '/staff/tools/settings',
    label: 'Open settings'
  }
};

/**
 * The launch checklist row. Each item dismisses permanently by id, so this row
 * carries only one-time setup steps — never live site state.
 */
const SetupChecklist = ({
  items,
  onDismiss
}: {
  items: LaunchChecklistItem[];
  onDismiss: (id: string) => void;
}) => {
  if (items.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-amber-200">
      <span className="font-medium">
        Configuration steps to complete before launch:
      </span>
      {items.map((item) => {
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
              onClick={() => onDismiss(item.id)}
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
  );
};

/**
 * Live state, so it is not a checklist item: those dismiss permanently by id
 * and would stay silent the next time the site filled (#327). No dismiss
 * control at all — the row leaves when the site stops being full.
 *
 * `role="status"` rather than `alert`: ModBar is in the header of every private
 * page, and an assertive live region would interrupt a screen reader on each
 * navigation.
 */
const SiteFullBanner = () => (
  <div
    role="status"
    className="mt-1 flex flex-wrap items-center gap-2 rounded border border-rose-800/70 bg-rose-950/40 px-2 py-1 text-[11px] text-rose-200"
  >
    <span className="font-medium text-rose-100">
      The site is full — every seat is taken. Registration and invite sending
      are refused.
    </span>
    <Link
      to="/staff/tools/settings"
      className="text-rose-300 hover:text-rose-100 underline underline-offset-2 transition-colors"
    >
      Open settings
    </Link>
  </div>
);

const StaffLinks = ({
  showToolboxLink,
  showReportsLink,
  openReports
}: {
  showToolboxLink: boolean;
  showReportsLink: boolean;
  openReports: number;
}) => (
  <div className="flex items-center gap-3 text-xs text-amber-400">
    <span className="font-semibold uppercase tracking-wide">Staff</span>
    <span className="text-amber-800">|</span>
    {showToolboxLink && (
      <>
        <Link
          to="/staff/tools"
          className="hover:text-amber-200 transition-colors"
        >
          Toolbox
        </Link>
        <span className="text-amber-800">|</span>
      </>
    )}
    {showReportsLink && (
      <Link
        to="/staff/reports"
        className="hover:text-amber-200 transition-colors flex items-center gap-1"
      >
        Reports
        {openReports > 0 && (
          <span className="bg-red-700 text-red-100 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none">
            {openReports}
          </span>
        )}
      </Link>
    )}
  </div>
);

const ModBar = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: reportCounts } = useGetReportCountsQuery();
  // Polled, unlike every other reader of this query: App.tsx holds a root
  // subscription for the whole session and nothing here calls setupListeners,
  // so without a timer the banner would only ever appear to staff who loaded
  // the tab after the site was already full — silent exactly when it is needed.
  const { data: installStatus } = useGetInstallStatusQuery(undefined, {
    pollingInterval: SITE_FULL_POLL_MS
  });
  const [dismissChecklistItem] = useDismissInstallChecklistItemMutation();

  if (!canSeeModBar(user)) return null;

  const openReports = reportCounts?.open ?? 0;
  const setupChecklist = installStatus?.setupChecklist ?? [];
  const showToolboxLink = canAccessToolbox(user);
  const showReportsLink = canUseReportActions(user);

  return (
    <div className="bg-amber-950/40 border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 py-1.5">
        <StaffLinks
          showToolboxLink={showToolboxLink}
          showReportsLink={showReportsLink}
          openReports={openReports}
        />
        {installStatus?.registrationFull && <SiteFullBanner />}
        <SetupChecklist
          items={setupChecklist}
          onDismiss={(id) => void dismissChecklistItem(id)}
        />
      </div>
    </div>
  );
};

export default ModBar;
