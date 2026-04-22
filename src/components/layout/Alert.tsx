import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAlerts, removeAlert } from '../../store/slices/alertSlice';

const TYPE_CLASSES: Record<string, string> = {
  success: 'bg-green-900/60 border-green-700 text-green-300',
  danger: 'bg-red-900/60 border-red-700 text-red-300',
  warning: 'bg-yellow-900/60 border-yellow-700 text-yellow-300',
  info: 'bg-blue-900/60 border-blue-700 text-blue-300'
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
