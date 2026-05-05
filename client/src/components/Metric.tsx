import type { ReactNode } from "react";

export function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{label === "Total Submissions" ? "In this account" : "Current count"}</small>
    </div>
  );
}
