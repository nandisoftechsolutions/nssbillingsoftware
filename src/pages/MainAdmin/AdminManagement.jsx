import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import './AdminManagement.css';

// Icons as components for better control
const UsersIcon = () => <span className="icon">👥</span>;
const CheckIcon = () => <span className="icon">✅</span>;
const PauseIcon = () => <span className="icon">⏸️</span>;
const SearchIcon = () => <span className="icon">🔍</span>;
const AddIcon = () => <span className="icon">➕</span>;
const EditIcon = () => <span className="icon">✏️</span>;
const DeleteIcon = () => <span className="icon">🗑️</span>;
const CloseIcon = () => <span className="icon">×</span>;
const SuccessIcon = () => <span className="icon">✅</span>;
const ErrorIcon = () => <span className="icon">❌</span>;
const LoadingIcon = () => <span className="icon">⏳</span>;

const AdminManagement = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    isActive: true
  });

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/admins');
      if (response.data.success) {
        setAdmins(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err.response?.data?.message || 'Failed to load admins');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      isActive: true
    });
    setEditingAdmin(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!editingAdmin && !formData.password) {
      setError('Password is required for new admin');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  // Create or update admin
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setTimeout(() => setError(''), 5000);
      return;
    }

    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingAdmin) {
        // Update admin
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        const response = await api.put(`/admin/admins/${editingAdmin._id}`, updateData);
        if (response.data.success) {
          setSuccess('Admin updated successfully');
        }
      } else {
        // Create new admin
        const response = await api.post('/admin/admins', formData);
        if (response.data.success) {
          setSuccess('Admin created successfully');
        }
      }
      
      resetForm();
      fetchAdmins();
    } catch (err) {
      console.error('Error saving admin:', err);
      setError(err.response?.data?.message || 'Failed to save admin');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit admin
  const handleEdit = (admin) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
      isActive: admin.isActive
    });
    setEditingAdmin(admin);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete admin
  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/admins/${adminId}`);
      if (response.data.success) {
        setSuccess('Admin deleted successfully');
        fetchAdmins();
      }
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  // Toggle admin status
  const handleToggleStatus = async (admin) => {
    try {
      const response = await api.put(`/admin/admins/${admin._id}`, {
        isActive: !admin.isActive
      });
      if (response.data.success) {
        setSuccess(`Admin ${!admin.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchAdmins();
      }
    } catch (err) {
      console.error('Error updating admin status:', err);
      setError(err.response?.data?.message || 'Failed to update admin status');
    }
  };

  // Filter admins based on search
  const filteredAdmins = admins.filter(admin =>
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stats
  const stats = {
    total: admins.length,
    active: admins.filter(a => a.isActive).length,
    inactive: admins.filter(a => !a.isActive).length,
    superAdmins: admins.filter(a => a.role === 'superadmin').length
  };

  return (
    <div className="admin-management-container">
      <AdminSidebar />
      
      <main className="admin-management-main">
        {/* Header Section */}
        <div className="admin-management-header">
          <div className="header-content">
            <div className="header-title">
              <h1><UsersIcon /> Admin Management</h1>
              <p className="subtitle">Manage system administrators and their permissions</p>
            </div>
            <button
              className="btn btn-primary add-admin-btn"
              onClick={() => setShowForm(true)}
            >
              <AddIcon /> {!isMobile && 'Add New Admin'}
            </button>
          </div>

          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon primary">
                <UsersIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total Admins</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon success">
                <CheckIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.active}</h3>
                <p>Active Admins</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon warning">
                <PauseIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.inactive}</h3>
                <p>Inactive Admins</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon danger">
                <span className="icon">⭐</span>
              </div>
              <div className="stat-content">
                <h3>{stats.superAdmins}</h3>
                <p>Super Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="alerts-container">
          {error && (
            <div className="alert alert-error slide-in">
              <div className="alert-content">
                <ErrorIcon />
                <span>{error}</span>
              </div>
              <button className="alert-close" onClick={() => setError('')}>
                <CloseIcon />
              </button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success slide-in">
              <div className="alert-content">
                <SuccessIcon />
                <span>{success}</span>
              </div>
              <button className="alert-close" onClick={() => setSuccess('')}>
                <CloseIcon />
              </button>
            </div>
          )}
        </div>

        <div className="admin-management-content">
          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            
            <div className="filter-actions">
              <select 
                className="filter-select"
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setSearchTerm('');
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
              >
                <option value="all">All Admins</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="superadmin">Super Admins</option>
              </select>
            </div>
          </div>

          {/* Admin Form Modal */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{editingAdmin ? 'Edit Admin' : 'Create New Admin'}</h3>
                  <button className="modal-close" onClick={resetForm}>
                    <CloseIcon />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="admin-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label required">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter admin full name"
                        className="form-input"
                        maxLength="100"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label required">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="admin@example.com"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Password {editingAdmin && <span className="optional">(optional)</span>}
                        {!editingAdmin && <span className="required">*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingAdmin}
                        placeholder="Minimum 6 characters"
                        className="form-input"
                        minLength="6"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-text">Active Account</span>
                      </label>
                      <p className="checkbox-help">
                        Inactive admins cannot access the system
                      </p>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <LoadingIcon /> {isMobile ? 'Saving...' : 'Saving Changes...'}
                        </>
                      ) : editingAdmin ? (
                        'Update Admin'
                      ) : (
                        'Create Admin'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Admins Table */}
          <div className="table-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading admins...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <UsersIcon />
                </div>
                <h3>{searchTerm ? 'No Matching Admins' : 'No Admins Yet'}</h3>
                <p>
                  {searchTerm 
                    ? 'Try a different search term'
                    : 'Get started by creating your first admin account'
                  }
                </p>
                {!searchTerm && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <AddIcon /> Create First Admin
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admins-table">
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th>Contact</th>
                        <th className="hide-on-mobile">Role</th>
                        <th>Status</th>
                        <th className="hide-on-mobile">Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr 
                          key={admin._id} 
                          className={`admin-row ${!admin.isActive ? 'inactive' : ''}`}
                        >
                          <td>
                            <div className="admin-info">
                              <div className="admin-avatar">
                                {admin.name?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div className="admin-details">
                                <div className="admin-name">{admin.name}</div>
                                <div className="admin-id">ID: {admin._id?.slice(-6) || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="contact-info">
                              <div className="admin-email">{admin.email}</div>
                              <div className="last-login hide-on-mobile">
                                Last login: {admin.lastLogin 
                                  ? new Date(admin.lastLogin).toLocaleDateString()
                                  : 'Never'
                                }
                              </div>
                            </div>
                          </td>
                          <td className="hide-on-mobile">
                            <span className={`role-badge ${admin.role}`}>
                              {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                              {admin.isActive ? (
                                <>
                                  <CheckIcon /> Active
                                </>
                              ) : (
                                <>
                                  <PauseIcon /> Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="hide-on-mobile">
                            <div className="date-info">
                              {new Date(admin.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-edit"
                                onClick={() => handleEdit(admin)}
                                title="Edit Admin"
                                aria-label="Edit"
                              >
                                <EditIcon />
                              </button>
                              <button
                                className={`btn-icon btn-status ${admin.isActive ? 'deactivate' : 'activate'}`}
                                onClick={() => handleToggleStatus(admin)}
                                title={admin.isActive ? 'Deactivate' : 'Activate'}
                                aria-label={admin.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {admin.isActive ? <PauseIcon /> : <CheckIcon />}
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(admin._id)}
                                title="Delete Admin"
                                aria-label="Delete"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Cards View */}
                <div className="mobile-cards-view">
                  {filteredAdmins.map((admin) => (
                    <div key={admin._id} className="admin-card">
                      <div className="card-header">
                        <div className="admin-info">
                          <div className="admin-avatar">
                            {admin.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className="admin-details">
                            <div className="admin-name">{admin.name}</div>
                            <div className="admin-email">{admin.email}</div>
                          </div>
                        </div>
                        <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="card-row">
                          <span className="label">Role:</span>
                          <span className={`value role-badge ${admin.role}`}>
                            {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </div>
                        <div className="card-row">
                          <span className="label">Created:</span>
                          <span className="value">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="card-row">
                          <span className="label">Last Login:</span>
                          <span className="value">
                            {admin.lastLogin 
                              ? new Date(admin.lastLogin).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-footer">
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(admin)}
                            title="Edit Admin"
                            aria-label="Edit"
                          >
                            <EditIcon /> Edit
                          </button>
                          <button
                            className={`btn-icon btn-status ${admin.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleStatus(admin)}
                            title={admin.isActive ? 'Deactivate' : 'Activate'}
                            aria-label={admin.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {admin.isActive ? <PauseIcon /> : <CheckIcon />}
                            {admin.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(admin._id)}
                            title="Delete Admin"
                            aria-label="Delete"
                          >
                            <DeleteIcon /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Table Footer */}
            {filteredAdmins.length > 0 && (
              <div className="table-footer">
                <div className="table-summary">
                  Showing {filteredAdmins.length} of {admins.length} admins
                </div>
                <div className="table-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowForm(true)}
                  >
                    <AddIcon /> Add Another Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminManagement;