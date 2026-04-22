interface Props {
  error?: Error | null;
  onReset?: () => void;
}

const FallbackComponent = ({ error, onReset }: Props) => (
  <div className="error-fallback box pad">
    <h3>Something went wrong</h3>
    <p className="error-message">
      {error?.message ?? 'An unexpected error occurred.'}
    </p>
    {onReset && (
      <button className="btn" onClick={onReset}>
        Try again
      </button>
    )}
  </div>
);

export default FallbackComponent;
