import React from 'react';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createTestStore } from '../testUtils';
import Alert from '../../components/layout/Alert';
import { addAlert } from '../../store/slices/alertSlice';

describe('Alert', () => {
  it('renders nothing when there are no alerts', () => {
    const { container } = renderWithProviders(<Alert />);
    expect(container.firstChild).toBeNull();
  });

  it('shows alert message and success styling', () => {
    const store = createTestStore();
    store.dispatch(addAlert('Saved successfully!', 'success'));
    renderWithProviders(<Alert />, { store });
    expect(screen.getByText('Saved successfully!')).toBeInTheDocument();
  });

  it('shows danger alert message', () => {
    const store = createTestStore();
    store.dispatch(addAlert('Something went wrong.', 'danger'));
    renderWithProviders(<Alert />, { store });
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('removes alert when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(addAlert('Will be dismissed', 'info'));
    renderWithProviders(<Alert />, { store });
    expect(screen.getByText('Will be dismissed')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Will be dismissed')).not.toBeInTheDocument();
  });

  it('auto-dismisses after 5 seconds', () => {
    jest.useFakeTimers();
    const store = createTestStore();
    store.dispatch(addAlert('Timed out', 'warning'));
    renderWithProviders(<Alert />, { store });
    expect(screen.getByText('Timed out')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5001);
    });
    expect(screen.queryByText('Timed out')).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
