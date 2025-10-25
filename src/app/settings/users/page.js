'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }

      alert('User created successfully!');
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
      loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  const startEditing = (user) => {
    setEditingUser({ ...user, password: '' }); // Don't pre-fill password
  };

  const saveEdit = async () => {
    if (!editingUser.firstName || !editingUser.lastName || !editingUser.email) {
      alert('First name, last name, and email are required');
      return;
    }

    try {
      const updateData = {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
        active: editingUser.active
      };

      // Only include password if it was changed
      if (editingUser.password) {
        updateData.password = editingUser.password;
      }

      const res = await fetch(`${API_BASE}/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) throw new Error('Failed to update user');

      alert('User updated successfully!');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (userId, userName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete user');

      alert('User deleted successfully!');
      loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Users</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="button"
            onClick={() => setEditMode(!editMode)}
            style={{ background: editMode ? '#ef4444' : '#3b82f6' }}
          >
            {editMode ? '✓ Done Editing' : '✏️ Edit Mode'}
          </button>
          <button
            className="button"
            onClick={() => setShowAddModal(true)}
            style={{ background: '#10b981' }}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  className="input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  className="input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="button primary" onClick={handleAddUser}>
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div style={{ 
        padding: 20, 
        background: 'white', 
        borderRadius: 8, 
        border: '1px solid #e5e7eb' 
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>
          All Users ({users.length})
        </h3>

        {users.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
            No users yet. Add your first one above!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {users.map((user) => (
              <div
                key={user._id}
                style={{
                  padding: 16,
                  background: user.active ? '#f9fafb' : '#fee2e2',
                  borderRadius: 6,
                  border: `1px solid ${user.active ? '#e5e7eb' : '#fca5a5'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {editingUser && editingUser._id === user._id ? (
                  <>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginRight: 12 }}>
                      <input
                        className="input"
                        value={editingUser.firstName}
                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                      <input
                        className="input"
                        value={editingUser.lastName}
                        onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                      <input
                        type="email"
                        className="input"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        placeholder="Email"
                      />
                      <input
                        type="password"
                        className="input"
                        value={editingUser.password}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        placeholder="New Password (leave blank to keep current)"
                      />
                      <select
                        className="input"
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={editingUser.active}
                          onChange={(e) => setEditingUser({ ...editingUser, active: e.target.checked })}
                        />
                        <span>Active</span>
                      </label>
                    </div>
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
                        onClick={() => setEditingUser(null)}
                        style={{ background: '#6b7280', padding: '6px 12px', fontSize: 14 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>
                          {user.fullName}
                        </span>
                        <span style={{ 
                          fontSize: 12, 
                          background: user.role === 'admin' ? '#dbeafe' : user.role === 'manager' ? '#fef3c7' : '#f3f4f6',
                          color: user.role === 'admin' ? '#1e40af' : user.role === 'manager' ? '#92400e' : '#374151',
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          fontWeight: 600
                        }}>
                          {user.role}
                        </span>
                        {!user.active && (
                          <span style={{ 
                            fontSize: 12, 
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600
                          }}>
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, color: '#6b7280' }}>
                        {user.email}
                      </div>
                    </div>
                    {editMode && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="button" 
                          onClick={() => startEditing(user)}
                          style={{ background: '#3b82f6', padding: '6px 12px', fontSize: 14 }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="button" 
                          onClick={() => handleDelete(user._id, user.fullName)}
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
          <strong>ℹ️ About Users:</strong> Users represent team members who perform actions in the system.
          Their names will appear when recording movements, expenses, and other activities. 
          <br/><br/>
          <strong>Note:</strong> Passwords are currently stored in plain text for development. 
          In production, passwords should be properly hashed for security.
        </p>
      </div>
    </div>
  );
}

