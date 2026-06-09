export function StatCard({ label, value, icon: Icon, trend, onClick }) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`stat-card${onClick ? " stat-card-actionable" : ""}`}
      onClick={onClick}
    >
      <div className="stat-header">
        <div className="stat-icon">{Icon && <Icon size={24} />}</div>
        {trend && <span className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </Tag>
  );
}
