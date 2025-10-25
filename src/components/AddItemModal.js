'use client';

import { useEffect, useState } from 'react';
import { createItem, fetchSuggestions, fetchTypes } from '@/lib/api';
import ImageUpload from './ImageUpload';

export default function AddItemModal({ isOpen, onClose, onItemAdded }) {
  const [types, setTypes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [formData, setFormData] = useState({ type: '', name: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTypes();
      setFormData({ type: '', name: '', imageUrl: '' });
      setSuggestions([]);
    }
  }, [isOpen]);

  async function loadTypes() {
    try {
      const typesData = await fetchTypes();
      setTypes(typesData);
    } catch (e) {
      console.error('Failed to load types:', e);
    }
  }

  async function handleNameChange(name) {
    setFormData(prev => ({ ...prev, name }));
    if (name.length > 2) {
      try {
        const suggestionsData = await fetchSuggestions(name);
        setSuggestions(suggestionsData);
      } catch (e) {
        console.error('Failed to fetch suggestions:', e);
      }
    } else {
      setSuggestions([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.type.trim() || !formData.name.trim()) {
      alert('Please select a type and enter an item name');
      return;
    }

    setLoading(true);
    try {
      await createItem({ 
        type: formData.type.trim(), 
        name: formData.name.trim(),
        imageUrl: formData.imageUrl || undefined
      });
      onItemAdded();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Item</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Type *</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              required
            >
              <option value="">-- Select a type --</option>
              {types.map(type => (
                <option key={type._id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            {types.length === 0 && (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                No types available. Please create types first in the Product Types page.
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Item Name</label>
            <input
              className="input"
              placeholder="Enter item name..."
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            {suggestions.length > 0 && (
              <div className="suggestions">
                <div className="suggestions-title">Similar items:</div>
                {suggestions.map(item => (
                  <div key={item._id} className="suggestion-item">
                    <span className="suggestion-name">{item.name}</span>
                    <span className="suggestion-type">{item.type}</span>
                    {item.archived && <span className="suggestion-archived">(Archived)</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <ImageUpload
              currentImageUrl={formData.imageUrl}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

