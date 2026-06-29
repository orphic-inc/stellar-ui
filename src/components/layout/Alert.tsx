import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAlerts, removeAlert } from '../../store/slices/alertSlice';

// Status-colour-without-chip (WS10 banner recipe): a toast is a full-width
// notice, not a chip/control, so it paints straight from the --st-* status
// tokens via leaf utilities (12% fill / 40% border / solid text) so it themes.
const TYPE_CLASSES: Record<string, string> = {
  success:
    'bg-[color-mix(in_oklch,var(--st-success)_12%,transparent)] border-[color-mix(in_oklch,var(--st-success)_40%,transparent)] text-[var(--st-success)]',
  danger:
    'bg-[color-mix(in_oklch,var(--st-danger)_12%,transparent)] border-[color-mix(in_oklch,var(--st-danger)_40%,transparent)] text-[var(--st-danger)]',
  warning:
    'bg-[color-mix(in_oklch,var(--st-warning)_12%,transparent)] border-[color-mix(in_oklch,var(--st-warning)_40%,transparent)] text-[var(--st-warning)]',
  info: 'bg-[color-mix(in_oklch,var(--st-info)_12%,transparent)] border-[color-mix(in_oklch,var(--st-info)_40%,transparent)] text-[var(--st-info)]'
};

const Alert = () => {
  const alerts = useSelector(selectAlerts);
  const dispatch = useDispatch();

  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => dispatch(removeAlert(alerts[0].id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts, dispatch]);

  if (!alerts.length) return null;

  return (
    <div className="space-y-1 px-4 py-2">
      {alerts.map(({ id, msg, alertType }) => (
        <div
          key={id}
          className={`flex items-center justify-between rounded px-3 py-2 text-sm border ${
            TYPE_CLASSES[alertType] ?? TYPE_CLASSES.info
          }`}
        >
          <span>{msg}</span>
          <button
            onClick={() => dispatch(removeAlert(id))}
            className="ml-4 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Alert;
