export function Card({ children, title, className = "", ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}
