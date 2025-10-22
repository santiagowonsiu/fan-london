'use client';

import { useEffect, useState } from 'react';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, fetchTypes } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    orderNotes: '',
    productTypes: [],
  });

  useEffect(() => {
    loadSuppliers();
    loadTypes();
  }, []);

  async function loadSuppliers() {
    setLoading(true);
    try {
      const data = await fetchSuppliers({ q: searchQuery });
      setSuppliers(data.suppliers || []);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTypes() {
    try {
      const data = await fetchTypes();
      setTypes(data || []);
    } catch (e) {
      console.error('Failed to load types:', e);
    }
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      contactNumber: '',
      orderNotes: '',
      productTypes: [],
    });
    setShowAddModal(true);
  }

  function openEditModal(supplier) {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      contactNumber: supplier.contactNumber || '',
      orderNotes: supplier.orderNotes || '',
      productTypes: supplier.productTypes?.map(t => t._id) || [],
    });
    setShowAddModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSupplier(editingId, formData);
      } else {
        await createSupplier(formData);
      }
      setShowAddModal(false);
      loadSuppliers();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await deleteSupplier(id);
      loadSuppliers();
    } catch (e) {
      alert(e.message);
    }
  }

  function toggleProductType(typeId) {
    setFormData(prev => {
      const current = prev.productTypes || [];
      if (current.includes(typeId)) {
        return { ...prev, productTypes: current.filter(id => id !== typeId) };
      } else {
        return { ...prev, productTypes: [...current, typeId] };
      }
    });
  }

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="page-title" style={{ fontSize: 20, margin: 0 }}>Suppliers</h2>
        <button
          type="button"
          className="button primary"
          onClick={openAddModal}
          style={{ fontSize: 16, padding: '10px 20px' }}
        >
          + Add Supplier
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          className="input"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && loadSuppliers()}
          style={{ maxWidth: 400 }}
        />
        <button 
          type="button" 
          className="button primary" 
          onClick={loadSuppliers}
          style={{ marginLeft: 12 }}
        >
          Search
        </button>
      </div>

      {/* Supplier Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
      ) : suppliers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
          No suppliers found. Add your first supplier!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 20,
        }}>
          {suppliers.map((supplier) => (
            <div
              key={supplier._id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 20,
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>
                  {supplier.name}
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="button"
                    onClick={() => openEditModal(supplier)}
                    style={{ padding: '4px 12px', fontSize: 13 }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => handleDelete(supplier._id)}
                    style={{ padding: '4px 12px', fontSize: 13, background: '#fee2e2', color: '#dc2626', border: '1px solid #dc2626' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: 16, fontSize: 14 }}>
                {supplier.email && (
                  <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>📧</span>
                    <a href={`mailto:${supplier.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.contactNumber && (
                  <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>📞</span>
                    <a href={`tel:${supplier.contactNumber}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {supplier.contactNumber}
                    </a>
                  </div>
                )}
              </div>

              {/* Product Types */}
              {supplier.productTypes && supplier.productTypes.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Product Types
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {supplier.productTypes.map((type) => (
                      <span
                        key={type._id}
                        style={{
                          padding: '4px 10px',
                          background: '#e0e7ff',
                          color: '#3730a3',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {type.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Notes */}
              {supplier.orderNotes && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#f9fafb',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#4b5563',
                  borderLeft: '3px solid #3730a3',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Order Notes:</div>
                  {supplier.orderNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={() => setShowAddModal(false)}
          />
          
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal" style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h3>{editingId ? 'Edit Supplier' : 'Add Supplier'}</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                {/* Name */}
                <div className="form-group">
                  <label>
                    Supplier Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Contact Number */}
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    className="input"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Product Types */}
                <div className="form-group">
                  <label>Product Types</label>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    maxHeight: 200,
                    overflowY: 'auto',
                    background: '#f9fafb',
                  }}>
                    {types.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: 14 }}>No product types available</div>
                    ) : types.map((type) => (
                      <label
                        key={type._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: 6,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.productTypes.includes(type._id)}
                          onChange={() => toggleProductType(type._id)}
                          style={{ marginRight: 10 }}
                        />
                        <span style={{ fontWeight: 500 }}>{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                <div className="form-group">
                  <label>Order Notes</label>
                  <textarea
                    className="input"
                    value={formData.orderNotes}
                    onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                    rows="4"
                    placeholder="How to place orders, minimum quantities, delivery times, etc."
                    style={{ width: '100%' }}
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button primary"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

