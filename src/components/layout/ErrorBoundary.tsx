import * as Sentry from '@sentry/react';
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  FallbackComponent?: React.ComponentType<{
    error: Error | null;
    onReset: () => void;
  }>;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack }
    });
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      const { FallbackComponent } = this.props;
      return FallbackComponent ? (
        <FallbackComponent
          error={this.state.error}
          onReset={() => {
            this.setState({ hasError: false, error: null });
            this.props.onReset?.();
          }}
        />
      ) : (
        <div className="error-boundary">Something went wrong.</div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
