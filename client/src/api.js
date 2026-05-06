import { buildStats, demoRecommendations, demoUsers } from "./data";

const api = "/api";

export async function login(email, password) {
  const response = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Invalid login");
  }

  return response.json();
}

export async function fetchRecommendations(token, role) {
  if (token === "demo-token") {
    return role === "lecturer" ? demoRecommendations.slice(0, 3) : demoRecommendations;
  }

  const response = await fetch(`${api}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

export async function fetchStats(token, items) {
  if (token === "demo-token") {
    return buildStats(items);
  }

  const response = await fetch(`${api}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

export async function createRecommendation(token, payload) {
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

export async function updatePriority(token, id, priority) {
  if (token === "demo-token") {
    return;
  }

  await fetch(`${api}/recommendations/${id}/priority`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ priority, priorityReason: "Assigned during department review" })
  });
}

// ADMIN METHODS
export async function getUsers(token) {
  const response = await fetch(`${api}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function createUser(token, userData) {
  const response = await fetch(`${api}/admin/users`, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create user");
  }
  return response.json();
}

export async function deleteUser(token, userId) {
  const response = await fetch(`${api}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to delete user");
  return response.json();
}
