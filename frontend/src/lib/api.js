const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function fetchItems({ includeArchived = false, q = "", page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  params.set("archived", includeArchived ? "true" : "false");
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  if (page) params.set("page", String(page));
  const res = await fetch(`${API_BASE_URL}/api/items?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function createItem(payload) {
  const res = await fetch(`${API_BASE_URL}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create item");
  return res.json();
}

export async function updateItem(id, payload) {
  const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}

export async function toggleArchive(id) {
  const res = await fetch(`${API_BASE_URL}/api/items/${id}/archive`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to toggle archive");
  return res.json();
}
