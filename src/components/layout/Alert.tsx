import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAlerts, removeAlert } from '../../store/slices/alertSlice';

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
    <div className="alerts">
      {alerts.map(({ id, msg, alertType }) => (
        <div key={id} className={`alert alert-${alertType}`}>
          <span>{msg}</span>
          <button
            onClick={() => dispatch(removeAlert(id))}
            className="alert-close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Alert;
