import { buildStats, demoRecommendations, demoUsers } from "./data";
import type { Recommendation, Role, Stats, User } from "./types";

const api = "/api";

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  try {
    const response = await fetch(`${api}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error("Invalid login");
    }

    return response.json();
  } catch {
    const role = (username.toLowerCase() || "lecturer") as Role;
    const user = demoUsers[role] || demoUsers.lecturer;
    return { token: "demo-token", user };
  }
}

export async function fetchRecommendations(token: string, role: Role): Promise<Recommendation[]> {
  if (token === "demo-token") {
    return role === "lecturer" ? demoRecommendations.slice(0, 3) : demoRecommendations;
  }

  const response = await fetch(`${api}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

export async function fetchStats(token: string, items: Recommendation[]): Promise<Stats> {
  if (token === "demo-token") {
    return buildStats(items);
  }

  const response = await fetch(`${api}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

export async function createRecommendation(token: string, payload: Partial<Recommendation>): Promise<Recommendation> {
  if (token === "demo-token") {
    return {
      _id: `demo-${Date.now()}`,
      title: payload.title || "",
      author: payload.author || "",
      isbn: payload.isbn || "",
      publisher: payload.publisher || "",
      edition: payload.edition || "",
      additionalNotes: payload.additionalNotes || "",
      department: "DCEE",
      status: "submitted",
      priority: "unassigned",
      submittedBy: { name: "Menaka Samaranayake", department: "DCEE" }
    };
  }

  const response = await fetch(`${api}/recommendations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
}

export async function updatePriority(token: string, id: string, priority: Recommendation["priority"]) {
  if (token === "demo-token") {
    return;
  }

  await fetch(`${api}/recommendations/${id}/priority`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ priority, priorityReason: "Assigned during department review" })
  });
}
