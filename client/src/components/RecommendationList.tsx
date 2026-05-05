import type { Recommendation } from "../types";

export function CompactList({ items }: { items: Recommendation[] }) {
  return (
    <div className="compact-list">
      {items.map((item) => (
        <div className="compact-row" key={item._id}>
          <div>
            <strong>{item.title}</strong>
            <span>
              {item.author} · {item.publisher}
            </span>
          </div>
          <span className={`priority ${item.priority}`}>{item.priority}</span>
        </div>
      ))}
    </div>
  );
}
