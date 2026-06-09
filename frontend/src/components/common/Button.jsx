/**
 * Reusable Button component
 * Variants: primary, secondary, accent, ghost
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props
}) {
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const classes = `btn btn-${variant} ${sizeClass} ${loading ? 'btn--loading' : ''} ${className}`.trim();

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true">⚽</span>
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
