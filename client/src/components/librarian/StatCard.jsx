export function StatCard({ label, value, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        {trend && <span className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
