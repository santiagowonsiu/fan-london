const API_BASE = '/api';

export async function fetchItems({ includeArchived, q, page, limit } = {}) {
  const params = new URLSearchParams();
  if (includeArchived) params.set('archived', 'true');
  else params.set('archived', 'false');
  if (q) params.set('q', q);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`${API_BASE}/items?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function createItem(data) {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create item');
  }
  return res.json();
}

export async function updateItem(id, data) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update item');
  }
  return res.json();
}

export async function toggleArchive(id) {
  const res = await fetch(`${API_BASE}/items/${id}/archive`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to archive/unarchive item');
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete item');
}

export async function fetchTypes() {
  const res = await fetch(`${API_BASE}/types`);
  if (!res.ok) throw new Error('Failed to fetch types');
  return res.json();
}

export async function createType(name) {
  const res = await fetch(`${API_BASE}/types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create type');
  }
  return res.json();
}

export async function fetchSuggestions(query) {
  const res = await fetch(`${API_BASE}/items/suggest?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return res.json();
}

export async function postTransaction(data) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create transaction');
  }
  return res.json();
}

export async function fetchTransactions(params = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', String(params.limit || 50));
  if (params.direction) query.set('direction', params.direction);
  if (params.itemId) query.set('itemId', params.itemId);
  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchStock() {
  const res = await fetch(`${API_BASE}/transactions/stock`);
  if (!res.ok) throw new Error('Failed to fetch stock');
  return res.json();
}

