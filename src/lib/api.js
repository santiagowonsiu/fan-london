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

export async function deleteItem(id, justification) {
  const params = new URLSearchParams();
  if (justification) params.set('justification', justification);
  const res = await fetch(`${API_BASE}/items/${id}?${params.toString()}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete item');
  }
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

export async function updateTransaction(id, data) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update transaction');
  }
  return res.json();
}

export async function deleteTransaction(id, justification) {
  const params = new URLSearchParams();
  if (justification) params.set('justification', justification);
  const res = await fetch(`${API_BASE}/transactions/${id}?${params.toString()}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete transaction');
  }
}

export async function fetchActivityLogs(params = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', String(params.limit || 50));
  if (params.action) query.set('action', params.action);
  if (params.entityType) query.set('entityType', params.entityType);
  const res = await fetch(`${API_BASE}/activity-logs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch activity logs');
  return res.json();
}

// Internal Orders API
export async function fetchInternalOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  const res = await fetch(`${API_BASE}/internal-orders?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch internal orders');
  return res.json();
}

export async function createInternalOrder(data) {
  const res = await fetch(`${API_BASE}/internal-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create internal order');
  }
  return res.json();
}

export async function updateInternalOrder(id, data) {
  const res = await fetch(`${API_BASE}/internal-orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update internal order');
  }
  return res.json();
}

// External Orders API
export async function fetchExternalOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.supplier) query.set('supplier', params.supplier);
  const res = await fetch(`${API_BASE}/external-orders?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch external orders');
  return res.json();
}

export async function createExternalOrder(data) {
  const res = await fetch(`${API_BASE}/external-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create external order');
  }
  return res.json();
}

export async function updateExternalOrder(id, data) {
  const res = await fetch(`${API_BASE}/external-orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update external order');
  }
  return res.json();
}

