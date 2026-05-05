export type Role = "lecturer" | "hod" | "librarian";

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  department: string;
}

export interface Recommendation {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  edition: string;
  additionalNotes: string;
  department: string;
  status: "submitted" | "under_review" | "approved" | "rejected";
  priority: "high" | "medium" | "low" | "unassigned";
  submittedBy?: { name: string; department: string };
  createdAt?: string;
}

export interface Stats {
  total: number;
  pending: number;
  approved: number;
  highPriority: number;
}
