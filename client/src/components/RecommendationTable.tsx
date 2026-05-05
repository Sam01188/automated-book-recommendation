import type { Recommendation } from "../types";

interface RecommendationTableProps {
  items: Recommendation[];
  title: string;
  compact?: boolean;
  onPriority?: (id: string, priority: Recommendation["priority"]) => void;
}

export function RecommendationTable({ items, title, compact, onPriority }: RecommendationTableProps) {
  return (
    <div className={compact ? "table-wrap compact" : "table-wrap"}>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Publisher</th>
            <th>Submitted By</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.title}</td>
              <td>{item.author}</td>
              <td>{item.publisher}</td>
              <td>{item.submittedBy?.name || "Lecturer"}</td>
              <td>
                {onPriority ? (
                  <select value={item.priority} onChange={(event) => onPriority(item._id, event.target.value as Recommendation["priority"])}>
                    <option value="unassigned">Set priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                ) : (
                  <span className={`priority ${item.priority}`}>{item.priority}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
