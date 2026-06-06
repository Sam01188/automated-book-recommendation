export function Metric({ label, value, icon, onClick }) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag className={`metric-card${onClick ? " clickable-metric" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
    </Tag>
  );
}
