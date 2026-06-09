export const demoUsers = {
  lecturer: { id: "1", name: "Menaka Samaranayake", username: "lecturer", role: "lecturer", department: "DCEE" },
  hod: { id: "2", name: "Sameera Rathnayake", username: "hod", role: "hod", department: "DCEE" },
  librarian: { id: "3", name: "Senaka Aluthge", username: "librarian", role: "librarian", department: "DCEE" }
};

export const demoRecommendations = [
  {
    _id: "b1",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    publisher: "Prentice Hall",
    edition: "1st",
    additionalNotes: "Core software engineering reference for final-year design projects.",
    department: "DCEE",
    status: "approved",
    priority: "high",
    submittedBy: { name: "Menaka Samaranayake", department: "DCEE" }
  },
  {
    _id: "b2",
    title: "Database System Concepts",
    author: "Silberschatz",
    isbn: "9780073523323",
    publisher: "McGraw Hill",
    edition: "7th",
    additionalNotes: "Useful for database design and information systems modules.",
    department: "DCEE",
    status: "under_review",
    priority: "medium",
    submittedBy: { name: "Menaka Samaranayake", department: "DCEE" }
  },
  {
    _id: "b3",
    title: "Computer Networks",
    author: "Andrew S. Tanenbaum",
    isbn: "9780132126953",
    publisher: "Pearson",
    edition: "5th",
    additionalNotes: "Supports network engineering and distributed systems coursework.",
    department: "DCEE",
    status: "submitted",
    priority: "unassigned",
    submittedBy: { name: "Menaka Samaranayake", department: "DCEE" }
  },
  {
    _id: "b4",
    title: "Design Patterns",
    author: "Erich Gamma",
    isbn: "9780201633610",
    publisher: "Addison-Wesley",
    edition: "Classic",
    additionalNotes: "Recommended for object-oriented design topics.",
    department: "DCEE",
    status: "approved",
    priority: "high",
    submittedBy: { name: "Menaka Samaranayake", department: "DCEE" }
  },
  {
    _id: "b5",
    title: "Operating System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9781118063330",
    publisher: "Wiley",
    edition: "10th",
    additionalNotes: "Reference copy for lab and theory work.",
    department: "DCEE",
    status: "under_review",
    priority: "low",
    submittedBy: { name: "Menaka Samaranayake", department: "DCEE" }
  }
];

export function buildStats(items) {
  return {
    total: items.length,
    pending: items.filter((item) => item.status === "submitted" || item.status === "under_review").length,
    approved: items.filter((item) => item.status === "approved").length,
    highPriority: items.filter((item) => item.priority !== "unassigned").length,
    priorityPending: items.filter(
      (item) =>
        item.priority === "unassigned" &&
        (item.status === "under_review" || item.status === "submitted")
    ).length
  };
}
