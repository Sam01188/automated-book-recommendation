export function Metric({ label, value, icon, onClick }) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag className={`metric-card admin-stat-card${onClick ? " clickable-metric" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
    </Tag>
  );
}
