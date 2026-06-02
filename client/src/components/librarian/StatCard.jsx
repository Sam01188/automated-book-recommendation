export function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <article className="metric-card admin-stat-card">
      <div className="metric-header">
        <span className="metric-label">{title}</span>
        <span className="metric-icon">
          <Icon size={20} />
        </span>
      </div>
      {trend && <span className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      <strong className="metric-value">{value}</strong>
    </article>
  );
}
