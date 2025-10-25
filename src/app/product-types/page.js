'use client';

import { useState, useEffect } from 'react';
import { fetchTypes, createType, updateType, deleteType } from '@/lib/api';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ProductTypesPage() {
  const [types, setTypes] = useState([]);
  const [unassignedProducts, setUnassignedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTypes(), loadUnassignedProducts()]);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      const data = await fetchTypes();
      setTypes(data);
    } catch (error) {
      console.error('Error loading types:', error);
      throw error;
    }
  };

  const loadUnassignedProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/items/unassigned`);
      if (!res.ok) throw new Error('Failed to fetch unassigned products');
      const data = await res.json();
      setUnassignedProducts(data);
    } catch (error) {
      console.error('Error loading unassigned products:', error);
      throw error;
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      alert('Please enter a type name');
      return;
    }

    try {
      await createType({ name: newTypeName.trim() });
      setNewTypeName('');
      await loadData();
      alert('Product type added successfully!');
    } catch (error) {
      console.error('Error adding type:', error);
      alert('Failed to add product type');
    }
  };

  const startEditing = (type) => {
    setEditingType({ ...type });
  };

  const cancelEditing = () => {
    setEditingType(null);
  };

  const saveEdit = async () => {
    if (!editingType.name.trim()) {
      alert('Type name cannot be empty');
      return;
    }

    try {
      await updateType(editingType._id, { name: editingType.name.trim() });
      setEditingType(null);
      await loadData();
      alert('Product type updated successfully!');
    } catch (error) {
      console.error('Error updating type:', error);
      alert('Failed to update product type');
    }
  };

  const handleDelete = async (typeId, typeName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${typeName}"?\n\nNote: You cannot delete a type that is being used by products.`
    );
    
    if (!confirmed) return;

    try {
      await deleteType(typeId);
      await loadData();
      alert('Product type deleted successfully!');
    } catch (error) {
      console.error('Error deleting type:', error);
      alert(error.message || 'Failed to delete product type');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading product types...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Product Types</h1>
        <button
          className="button"
          onClick={() => setEditMode(!editMode)}
          style={{ background: editMode ? '#ef4444' : '#3b82f6' }}
        >
          {editMode ? '✓ Done Editing' : '✏️ Edit Mode'}
        </button>
      </div>

      {/* Unassigned Products Warning */}
      {unassignedProducts.length > 0 && (
        <div style={{ 
          padding: 20, 
          background: '#fef3c7', 
          borderRadius: 8, 
          border: '2px solid #f59e0b',
          marginBottom: 30 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 24, marginRight: 12 }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: 18, color: '#92400e' }}>
              Unassigned Products ({unassignedProducts.length})
            </h3>
          </div>
          <p style={{ margin: 0, marginBottom: 16, fontSize: 14, color: '#92400e' }}>
            The following products don't have a type assigned. Please assign them to a category:
          </p>
          <div style={{ display: 'grid', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {unassignedProducts.map((product) => (
              <div
                key={product._id}
                style={{
                  padding: 12,
                  background: 'white',
                  borderRadius: 6,
                  border: '1px solid #fbbf24',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>{product.name}</span>
                <Link 
                  href={`/products?highlight=${product._id}`}
                  style={{
                    padding: '4px 12px',
                    background: '#f59e0b',
                    color: 'white',
                    borderRadius: 4,
                    fontSize: 13,
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  Assign Type →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Type */}
      <div style={{ 
        padding: 20, 
        background: 'white', 
        borderRadius: 8, 
        border: '1px solid #e5e7eb',
        marginBottom: 30 
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Add New Product Type</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            className="input"
            placeholder="Enter type name (e.g., Seafood, Dairy, Beverages)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
            style={{ flex: 1 }}
          />
          <button className="button" onClick={handleAddType}>
            + Add Type
          </button>
        </div>
      </div>

      {/* Types List */}
      <div style={{ 
        padding: 20, 
        background: 'white', 
        borderRadius: 8, 
        border: '1px solid #e5e7eb' 
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>
          All Product Types ({types.length})
        </h3>

        {types.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
            No product types yet. Add your first one above!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {types.map((type) => (
              <div
                key={type._id}
                style={{
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {editingType && editingType._id === type._id ? (
                  <>
                    <input
                      type="text"
                      className="input"
                      value={editingType.name}
                      onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      style={{ flex: 1, marginRight: 12 }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="button" 
                        onClick={saveEdit}
                        style={{ background: '#10b981', padding: '6px 12px', fontSize: 14 }}
                      >
                        ✓ Save
                      </button>
                      <button 
                        className="button" 
                        onClick={cancelEditing}
                        style={{ background: '#6b7280', padding: '6px 12px', fontSize: 14 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>{type.name}</span>
                      {type.productCount !== undefined && (
                        <span style={{ 
                          marginLeft: 12, 
                          fontSize: 14, 
                          color: '#6b7280',
                          background: '#e5e7eb',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          {type.productCount} {type.productCount === 1 ? 'product' : 'products'}
                        </span>
                      )}
                    </div>
                    {editMode && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="button" 
                          onClick={() => startEditing(type)}
                          style={{ background: '#3b82f6', padding: '6px 12px', fontSize: 14 }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="button" 
                          onClick={() => handleDelete(type._id, type.name)}
                          style={{ background: '#ef4444', padding: '6px 12px', fontSize: 14 }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div style={{ 
        marginTop: 30, 
        padding: 16, 
        background: '#eff6ff', 
        borderRadius: 8, 
        border: '1px solid #93c5fd' 
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
          <strong>ℹ️ About Product Types:</strong> Types help organize your products into categories 
          (e.g., Dairy, Seafood, Oils). You cannot delete a type that is currently being used by products.
        </p>
      </div>
    </div>
  );
}

