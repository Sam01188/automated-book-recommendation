const statusBadgeTypes = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  under_review: "info"
};

const priorityBadgeTypes = {
  high: "danger",
  medium: "warning",
  low: "success",
  unassigned: "secondary"
};

export function getStatusBadgeType(status) {
  return statusBadgeTypes[status] || "default";
}

export function getPriorityBadgeType(priority) {
  return priorityBadgeTypes[priority] || "default";
}
