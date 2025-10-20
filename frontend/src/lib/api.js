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

export async function deleteItem(id) {
  const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete item");
  // DELETE returns 204 (no content), so don't try to parse JSON
  return;
}

export async function fetchTypes() {
  const res = await fetch(`${API_BASE_URL}/api/types`);
  if (!res.ok) throw new Error("Failed to fetch types");
  return res.json();
}

export async function createType(name) {
  const res = await fetch(`${API_BASE_URL}/api/types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create type");
  return res.json();
}

export async function fetchSuggestions(query) {
  const res = await fetch(`${API_BASE_URL}/api/items/suggest?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

// Transactions API
export async function postTransaction({ itemId, direction, quantity }) {
  const res = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, direction, quantity }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create transaction");
  }
  return res.json();
}

export async function fetchTransactions({ page = 1, limit = 50, direction, itemId } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (direction) params.set("direction", direction);
  if (itemId) params.set("itemId", itemId);
  const res = await fetch(`${API_BASE_URL}/api/transactions?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function fetchStock() {
  const res = await fetch(`${API_BASE_URL}/api/transactions/stock`);
  if (!res.ok) throw new Error("Failed to fetch stock");
  return res.json();
}
