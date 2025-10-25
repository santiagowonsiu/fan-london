const API_BASE = '/api';

/**
 * Get current organization ID from localStorage
 */
function getOrgId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedOrganizationId');
}

/**
 * Add organization ID to headers and params for all API calls
 */
function addOrgHeaders() {
  const orgId = getOrgId();
  return orgId ? { 'x-organization-id': orgId } : {};
}

function addOrgToParams(params) {
  const orgId = getOrgId();
  if (orgId) params.set('organizationId', orgId);
  return params;
}

export async function fetchItems({ includeArchived, q, page, limit } = {}) {
  const params = new URLSearchParams();
  if (includeArchived) params.set('archived', 'true');
  else params.set('archived', 'false');
  if (q) params.set('q', q);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  addOrgToParams(params);
  const res = await fetch(`${API_BASE}/items?${params.toString()}`, {
    headers: addOrgHeaders()
  });
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

export async function createType(typeData) {
  const res = await fetch(`${API_BASE}/types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create type');
  }
  return res.json();
}

export async function updateType(id, typeData) {
  const res = await fetch(`${API_BASE}/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update type');
  }
  return res.json();
}

export async function deleteType(id) {
  const res = await fetch(`${API_BASE}/types/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete type');
  }
  return res.json();
}

// Users API
export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(id, userData) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update user');
  }
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete user');
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

// Suppliers API
export async function fetchSuppliers(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  const res = await fetch(`${API_BASE}/suppliers?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch suppliers');
  return res.json();
}

export async function createSupplier(data) {
  const res = await fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create supplier');
  }
  return res.json();
}

export async function updateSupplier(id, data) {
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update supplier');
  }
  return res.json();
}

export async function deleteSupplier(id) {
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete supplier');
  }
}

// Direct Purchases API
export async function fetchDirectPurchases(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.supplier) query.set('supplier', params.supplier);
  if (params.payment) query.set('payment', params.payment);
  const res = await fetch(`${API_BASE}/direct-purchases?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch direct purchases');
  return res.json();
}

export async function createDirectPurchase(data) {
  const res = await fetch(`${API_BASE}/direct-purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create direct purchase');
  }
  return res.json();
}

export async function updateDirectPurchase(id, data) {
  const res = await fetch(`${API_BASE}/direct-purchases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update direct purchase');
  }
  return res.json();
}

// Personal Expenses API
export async function fetchPersonalExpenses(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  if (params.category) query.set('category', params.category);
  const res = await fetch(`${API_BASE}/personal-expenses?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch personal expenses');
  return res.json();
}

export async function createPersonalExpense(data) {
  console.log('Creating personal expense with data:', data);
  
  try {
    const res = await fetch(`${API_BASE}/personal-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('API error:', err);
      throw new Error(err.error || `Failed to create personal expense (${res.status})`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function updatePersonalExpense(id, data) {
  const res = await fetch(`${API_BASE}/personal-expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update personal expense');
  }
  return res.json();
}

// Purchasing Summary API
export async function fetchPurchasingSummary(params = {}) {
  const query = new URLSearchParams();
  if (params.dateRange) query.set('dateRange', params.dateRange);
  if (params.supplier) query.set('supplier', params.supplier);
  if (params.payment) query.set('payment', params.payment);
  const res = await fetch(`${API_BASE}/purchasing-summary?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch purchasing summary');
  return res.json();
}

// Stock Reconciliation API
export async function downloadStockTemplate() {
  const res = await fetch(`${API_BASE}/stock-reconciliation/template`);
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stock-reconciliation-template-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function uploadStockReconciliation(formData) {
  const res = await fetch(`${API_BASE}/stock-reconciliation/upload`, {
    method: 'POST',
    body: formData, // FormData includes the file
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload reconciliation');
  }
  return res.json();
}

export async function fetchStockReconciliations() {
  const res = await fetch(`${API_BASE}/stock-reconciliation`);
  if (!res.ok) throw new Error('Failed to fetch reconciliations');
  return res.json();
}

export async function fetchStockReconciliation(id) {
  const res = await fetch(`${API_BASE}/stock-reconciliation/${id}`);
  if (!res.ok) throw new Error('Failed to fetch reconciliation');
  return res.json();
}

