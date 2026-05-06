export function CompactList({ items }) {
  return (
    <div className="compact-list" style={{ display: 'grid', gap: '1rem' }}>
      {items.map((item) => (
        <div 
          className="compact-row" 
          key={item._id}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1.25rem', 
            background: 'var(--background)', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '1rem' }}>{item.title}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {item.author} • {item.publisher}
            </span>
          </div>
          <span className={`priority ${item.priority}`}>{item.priority}</span>
        </div>
      ))}
    </div>
  );
}
