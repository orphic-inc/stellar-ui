import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import FallbackComponent from '../../components/layout/FallbackComponent';
import ErrorBoundary from '../../components/layout/ErrorBoundary';

// ── FallbackComponent ─────────────────────────────────────────────────────────

describe('FallbackComponent', () => {
  it('shows generic message when no error is provided', () => {
    renderWithProviders(<FallbackComponent />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByText(/an unexpected error occurred/i)
    ).toBeInTheDocument();
  });

  it('shows the error message when an error is provided', () => {
    renderWithProviders(
      <FallbackComponent error={new Error('Network timeout')} />
    );
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('does not render a Try Again button when onReset is not provided', () => {
    renderWithProviders(<FallbackComponent />);
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
  });

  it('renders a Try Again button and calls onReset when clicked', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    renderWithProviders(<FallbackComponent onReset={onReset} />);
    const btn = screen.getByRole('button', { name: /try again/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

// ── ErrorBoundary ─────────────────────────────────────────────────────────────

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Boom!');
  return <span>OK</span>;
};

describe('ErrorBoundary', () => {
  // Suppress React's error boundary console.error noise during tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('shows default fallback when an error is thrown and no FallbackComponent is given', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders the custom FallbackComponent when provided', () => {
    const CustomFallback = ({ error }: { error: Error | null }) => (
      <div>Custom error: {error?.message}</div>
    );
    renderWithProviders(
      <ErrorBoundary FallbackComponent={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error: Boom!')).toBeInTheDocument();
  });

  it('calls onError prop when an error is caught', () => {
    const onError = jest.fn();
    renderWithProviders(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('resets state and calls onReset when FallbackComponent triggers reset', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    let shouldThrow = true;

    const DynamicThrower = () => {
      if (shouldThrow) throw new Error('Reset me');
      return <span>Recovered</span>;
    };

    const ResettableFallback = ({
      onReset: reset
    }: {
      error: Error | null;
      onReset: () => void;
    }) => <button onClick={reset}>Reset</button>;

    const { rerender } = renderWithProviders(
      <ErrorBoundary FallbackComponent={ResettableFallback} onReset={onReset}>
        <DynamicThrower />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    rerender(
      <ErrorBoundary FallbackComponent={ResettableFallback} onReset={onReset}>
        <DynamicThrower />
      </ErrorBoundary>
    );

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
