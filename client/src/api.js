import { buildStats, demoRecommendations, demoUsers } from "./data";

const api = "/api";

async function checkApiResponse(response) {
  if (response.ok) {
    return response.json();
  }

  const errorData = await response.json().catch(() => ({}));
  const message = errorData.message || response.statusText || "Request failed";
  const error = new Error(message);
  error.status = response.status;
  throw error;
}

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

export async function logout(token) {
  if (token === "demo-token") {
    return;
  }

  try {
    await fetch(`${api}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export async function fetchRecommendations(token, role) {
  if (token === "demo-token") {
    return role === "lecturer" ? demoRecommendations.slice(0, 3) : demoRecommendations;
  }

  const response = await fetch(`${api}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return checkApiResponse(response);
}

export async function fetchStats(token, items) {
  if (token === "demo-token") {
    return buildStats(items);
  }

  const response = await fetch(`${api}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return checkApiResponse(response);
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

export async function updateRecommendationOrder(token, payload) {
  if (token === "demo-token") {
    return [];
  }

  const body = typeof payload === 'object' && !Array.isArray(payload) ? payload : { orderedIds: payload };

  const response = await fetch(`${api}/recommendations/rank-order`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to save recommendation order");
  }

  return response.json();
}

export async function resetRecommendationOrder(token) {
  if (token === "demo-token") {
    return [];
  }

  const response = await fetch(`${api}/recommendations/reset-order`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to reset recommendation order");
  }

  return response.json();
}

export async function submitToLibrarian(token) {
  if (token === "demo-token") {
    return [];
  }

  const response = await fetch(`${api}/recommendations/submit`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit recommendations");
  }

  return response.json();
}

export async function deleteRecommendation(token, id) {
  if (token === "demo-token") {
    return;
  }

  const response = await fetch(`${api}/recommendations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete recommendation");
  }

  return response.ok;
}

export async function updateRecommendation(token, id, payload) {
  if (token === "demo-token") {
    return payload;
  }

  const response = await fetch(`${api}/recommendations/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update recommendation");
  }

  return response.json();
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

export const updateUser = async (token, id, data) => {
  const response = await fetch(`${api}/admin/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  return response.json();
};

export async function fetchOrderPeriods(token) {
  const response = await fetch(`${api}/order-periods`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return checkApiResponse(response);
}

export async function fetchCurrentPeriod(token) {
  const response = await fetch(`${api}/order-periods/current`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return checkApiResponse(response);
}

export async function fetchCurrentHodPeriod(token) {
  const response = await fetch(`${api}/order-periods/current-hod`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return checkApiResponse(response);
}

export async function createOrderPeriod(token, payload) {
  const response = await fetch(`${api}/order-periods`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create order period");
  }
  return response.json();
}

export async function updateOrderPeriod(token, id, payload) {
  const response = await fetch(`${api}/order-periods/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update order period");
  }
  return response.json();
}

export async function closeOrderPeriod(token, id) {
  const response = await fetch(`${api}/order-periods/${id}/close`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to close order period");
  }
  return response.json();
}

export async function openHodPeriod(token, id) {
  const response = await fetch(`${api}/order-periods/${id}/open-hod`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to open HOD period");
  }
  return response.json();
}

export async function deleteOrderPeriod(token, id) {
  const response = await fetch(`${api}/order-periods/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete order period");
  }
  return response.json();
}


