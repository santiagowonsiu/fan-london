'use client';

import { useEffect, useState } from 'react';
import { createItem, createType, fetchSuggestions, fetchTypes } from '@/lib/api';
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
    if (!formData.type.trim() || !formData.name.trim()) return;

    setLoading(true);
    try {
      let typeName = formData.type.trim();
      
      const existingType = types.find(t => t.name.toLowerCase() === typeName.toLowerCase());
      if (!existingType) {
        await createType(typeName);
        await loadTypes();
      }

      await createItem({ 
        type: typeName, 
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

  function handleTypeChange(type) {
    setFormData(prev => ({ ...prev, type }));
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
            <label>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Select or type new...</option>
                {types.map(type => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Or type new type..."
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
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

