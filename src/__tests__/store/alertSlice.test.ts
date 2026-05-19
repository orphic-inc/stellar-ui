import alertReducer, {
  addAlert,
  removeAlert,
  selectAlerts
} from '../../store/slices/alertSlice';

describe('alertSlice', () => {
  const emptyState: never[] = [];

  it('adds an alert with explicit alertType', () => {
    const state = alertReducer(emptyState, addAlert('Saved!', 'success'));
    expect(state).toHaveLength(1);
    expect(state[0].msg).toBe('Saved!');
    expect(state[0].alertType).toBe('success');
    expect(state[0].id).toBeDefined();
  });

  it('defaults alertType to "info" when omitted', () => {
    const state = alertReducer(emptyState, addAlert('Info message'));
    expect(state[0].alertType).toBe('info');
  });

  it('removes an alert by id', () => {
    const withAlert = alertReducer(emptyState, addAlert('Temp', 'warning'));
    const id = withAlert[0].id;
    const cleared = alertReducer(withAlert, removeAlert(id));
    expect(cleared).toHaveLength(0);
  });

  it('does not remove alerts with non-matching id', () => {
    const withAlert = alertReducer(emptyState, addAlert('Keep me', 'danger'));
    const after = alertReducer(withAlert, removeAlert('nonexistent-id'));
    expect(after).toHaveLength(1);
  });

  it('selectAlerts returns alert array from state', () => {
    const state = {
      alert: [{ id: '1', msg: 'Hi', alertType: 'info' as const }]
    };
    expect(selectAlerts(state)).toHaveLength(1);
  });
});
