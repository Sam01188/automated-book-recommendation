export function Button({ children, variant = "primary", size = "md", onClick, disabled, className = "", ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
