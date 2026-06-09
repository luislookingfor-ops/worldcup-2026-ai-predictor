import './Loading.css';

export function LoadingSpinner({ size = 'md', text = 'Cargando...' }) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`} role="status" aria-label={text}>
      <div className="spinner-ball">⚽</div>
      <span className="spinner-text">{text}</span>
    </div>
  );
}

export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i} aria-hidden="true">
          <div className="skeleton-line skeleton-line--lg" />
          <div className="skeleton-line skeleton-line--md" />
          <div className="skeleton-line skeleton-line--sm" />
          <div className="skeleton-row">
            <div className="skeleton-circle" />
            <div className="skeleton-line skeleton-line--xs" />
          </div>
        </div>
      ))}
    </>
  );
}

export function LoadingPage() {
  return (
    <div className="loading-page">
      <LoadingSpinner size="lg" text="Preparando el campo..." />
    </div>
  );
}

export default LoadingSpinner;
