import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminTenants.css";

function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    companyName: "",
    ownerEmail: "",
    ownerPhone: "",
    planName: "Trial",
    planDuration: 7,
    planPrice: 0,
    subscriptionStart: new Date().toISOString().split('T')[0],
    expiresAt: "",
    status: "active"
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    suspended: 0,
    trial: 0
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Plan options
  const planOptions = ["Trial", "Basic", "Professional", "Enterprise"];

  // Calculate expiry date based on plan duration
  const calculateExpiryDate = (startDate, durationDays) => {
    const start = new Date(startDate);
    const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
    return expiry.toISOString().split('T')[0];
  };

  // Load Tenants
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/tenants");
      
      let tenantsData = [];
      if (response.data && response.data.success) {
        tenantsData = response.data.data || [];
      } else {
        tenantsData = response.data?.data || response.data || [];
      }
      
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      calculateStats(tenantsData);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      alert(err.response?.data?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (tenantsData) => {
    const now = new Date();
    const statsData = {
      total: tenantsData.length,
      active: 0,
      expired: 0,
      suspended: 0,
      trial: 0
    };

    tenantsData.forEach(tenant => {
      const expired = tenant.expiresAt && new Date(tenant.expiresAt) < now;
      const suspended = tenant.status === "suspended";
      const isTrial = tenant.planName === "Trial";

      if (suspended) statsData.suspended++;
      else if (expired) statsData.expired++;
      else statsData.active++;

      if (isTrial) statsData.trial++;
    });

    setStats(statsData);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Handle plan duration change
  const handlePlanDurationChange = (duration) => {
    const newForm = {
      ...form,
      planDuration: parseInt(duration),
      expiresAt: calculateExpiryDate(form.subscriptionStart, parseInt(duration))
    };
    setForm(newForm);
  };

  // Handle subscription start date change
  const handleSubscriptionStartChange = (date) => {
    const newForm = {
      ...form,
      subscriptionStart: date,
      expiresAt: calculateExpiryDate(date, form.planDuration)
    };
    setForm(newForm);
  };

  // Filter Tenants
  const filteredTenants = tenants.filter((tenant) => {
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      tenant.companyName?.toLowerCase().includes(q) ||
      tenant.ownerEmail?.toLowerCase().includes(q) ||
      tenant.ownerPhone?.toLowerCase().includes(q) ||
      tenant.planName?.toLowerCase().includes(q);

    const now = new Date();
    const expired = tenant.expiresAt && new Date(tenant.expiresAt) < now;
    const suspended = tenant.status === "suspended";
    const isTrial = tenant.planName === "Trial";

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = !expired && !suspended;
    else if (statusFilter === "expired") matchesStatus = expired;
    else if (statusFilter === "suspended") matchesStatus = suspended;
    else if (statusFilter === "trial") matchesStatus = isTrial;

    // Plan filter
    let matchesPlan = true;
    if (planFilter !== "all") matchesPlan = tenant.planName === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate days remaining
  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Save Tenant (Add / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tenantData = {
        ...form,
        planPrice: Number(form.planPrice),
        planDuration: Number(form.planDuration),
        isTrial: form.planName === "Trial"
      };

      let response;
      if (editingId) {
        response = await api.put(`/admin/tenants/${editingId}`, tenantData);
        if (response.data && response.data.success) {
          alert("Tenant updated successfully");
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } else {
        response = await api.post("/admin/tenants", tenantData);
        if (response.data && response.data.success) {
          alert("Tenant added successfully");
        } else {
          throw new Error(response.data?.message || "Create failed");
        }
      }

      // Reset form
      setForm({
        companyName: "",
        ownerEmail: "",
        ownerPhone: "",
        planName: "Trial",
        planDuration: 7,
        planPrice: 0,
        subscriptionStart: new Date().toISOString().split('T')[0],
        expiresAt: calculateExpiryDate(new Date(), 7),
        status: "active"
      });
      setEditingId(null);
      fetchTenants();
    } catch (err) {
      console.error("Save error:", err);
      alert(err.response?.data?.message || err.message || "Failed to save tenant");
    } finally {
      setLoading(false);
    }
  };

  // Edit Tenant
  const handleEdit = (tenant) => {
    setForm({
      companyName: tenant.companyName || "",
      ownerEmail: tenant.ownerEmail || "",
      ownerPhone: tenant.ownerPhone || "",
      planName: tenant.planName || "Trial",
      planDuration: tenant.planDuration || 7,
      planPrice: tenant.planPrice || 0,
      subscriptionStart: tenant.subscriptionStart ? 
        new Date(tenant.subscriptionStart).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      expiresAt: tenant.expiresAt ? 
        new Date(tenant.expiresAt).toISOString().split('T')[0] : 
        calculateExpiryDate(new Date(), tenant.planDuration || 7),
      status: tenant.status || "active"
    });

    setEditingId(tenant._id);
  };

  // Delete Tenant
  const handleDelete = async (id, companyName) => {
    const input = window.prompt(
      `WARNING: You are deleting tenant "${companyName}". All company data will be permanently deleted. Type YES to confirm.`,
      "NO"
    );

    if (input?.toUpperCase() !== "YES") return;

    setDeleteLoading(id);

    try {
      const response = await api.delete(`/admin/tenants/${id}`);
      
      if (response.data && response.data.success) {
        alert("Tenant deleted successfully");
        setTenants((prev) => prev.filter((x) => x._id !== id));
        fetchTenants();
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || err.message || "Failed to delete tenant");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Suspend/Activate Tenant
  const toggleTenantStatus = async (tenant) => {
    const newStatus = tenant.status === "suspended" ? "active" : "suspended";
    const action = newStatus === "suspended" ? "suspend" : "activate";
    
    if (!window.confirm(
      `${action === "suspend" ? "Suspend" : "Activate"} ${tenant.companyName}? ` +
      `${action === "suspend" ? "They will be locked out of the app." : "They will regain access to the app."}`
    )) return;

    try {
      const response = await api.put(`/admin/tenants/${tenant._id}`, {
        status: newStatus
      });

      if (response.data && response.data.success) {
        alert(`Tenant ${action === "suspend" ? "suspended" : "activated"} successfully`);
        fetchTenants();
      } else {
        throw new Error(response.data?.message || "Status update failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update tenant status");
    }
  };

  // Extend Subscription
  const extendSubscription = async (tenant) => {
    const extensionDays = prompt("Extend subscription by how many days?", "30");
    if (!extensionDays || isNaN(extensionDays)) return;

    const currentExpiry = tenant.expiresAt ? new Date(tenant.expiresAt) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + parseInt(extensionDays) * 24 * 60 * 60 * 1000);

    try {
      const response = await api.put(`/admin/tenants/${tenant._id}`, {
        expiresAt: newExpiry.toISOString(),
        status: "active"
      });

      if (response.data && response.data.success) {
        alert(`Subscription extended by ${extensionDays} days`);
        fetchTenants();
      } else {
        throw new Error(response.data?.message || "Extension failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to extend subscription");
    }
  };

  // Upgrade/Downgrade Plan
  const changePlan = async (tenant) => {
    const newPlan = prompt("Enter new plan name:", tenant.planName);
    if (!newPlan) return;

    const newPrice = prompt("Enter plan price:", tenant.planPrice || "0");
    if (newPrice === null) return;

    const newDuration = prompt("Enter plan duration in days:", tenant.planDuration || "30");
    if (!newDuration) return;

    try {
      const response = await api.put(`/admin/tenants/${tenant._id}`, {
        planName: newPlan,
        planPrice: parseFloat(newPrice),
        planDuration: parseInt(newDuration),
        expiresAt: calculateExpiryDate(tenant.subscriptionStart || new Date(), parseInt(newDuration))
      });

      if (response.data && response.data.success) {
        alert("Plan updated successfully");
        fetchTenants();
      } else {
        throw new Error(response.data?.message || "Plan update failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update plan");
    }
  };

  // Send Expiry Email
  const sendExpiryEmail = async (tenant) => {
    try {
      const daysRemaining = calculateDaysRemaining(tenant.expiresAt);
      
      const response = await api.post("/admin/tenants/send-expiry-email", {
        email: tenant.ownerEmail,
        companyName: tenant.companyName,
        expiresAt: tenant.expiresAt,
        daysRemaining: daysRemaining
      });

      if (response.data && response.data.success) {
        alert("Expiry email sent successfully");
      } else {
        throw new Error(response.data?.message || "Email sending failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to send email");
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      companyName: "",
      ownerEmail: "",
      ownerPhone: "",
      planName: "Trial",
      planDuration: 7,
      planPrice: 0,
      subscriptionStart: new Date().toISOString().split('T')[0],
      expiresAt: calculateExpiryDate(new Date(), 7),
      status: "active"
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (tenant) => {
    const now = new Date();
    const expired = tenant.expiresAt && new Date(tenant.expiresAt) < now;
    const suspended = tenant.status === "suspended";
    
    if (suspended) return "tenants-status-badge tenants-status-suspended";
    if (expired) return "tenants-status-badge tenants-status-expired";
    return "tenants-status-badge tenants-status-active";
  };

  // Get status text
  const getStatusText = (tenant) => {
    const now = new Date();
    const expired = tenant.expiresAt && new Date(tenant.expiresAt) < now;
    const suspended = tenant.status === "suspended";
    
    if (suspended) return "Suspended";
    if (expired) return "Expired";
    
    const daysRemaining = calculateDaysRemaining(tenant.expiresAt);
    if (daysRemaining <= 7) return `Expiring in ${daysRemaining}d`;
    return "Active";
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="tenants-admin-layout">
      {/* Mobile Header */}
      <div className="tenants-mobile-header">
        <button className="tenants-mobile-menu-btn" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="tenants-mobile-title">Tenants</h1>
        <button 
          className="tenants-refresh-btn mobile" 
          onClick={fetchTenants} 
          disabled={loading}
        >
          {loading ? "⟳" : "↻"}
        </button>
      </div>

      <main className="tenants-admin-main">
        <header className="tenants-admin-header">
          <div className="tenants-header-content">
            <div className="tenants-header-left">
              <div className="tenants-breadcrumb">Admin / Tenants</div>
              <h1 className="tenants-title">Tenant Management</h1>
              <p className="tenants-subtitle">Manage all tenants & subscriptions</p>
            </div>

            <div className="tenants-header-right">
              <button 
                className="tenants-refresh-btn" 
                onClick={fetchTenants} 
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button
                className="tenants-back-btn"
                onClick={() => navigate("/admin/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Statistics Cards */}
        <div className="tenants-stats-container">
          <div className="tenants-stat-card">
            <div className="tenants-stat-icon">🏢</div>
            <div className="tenants-stat-content">
              <div className="tenants-stat-value">{stats.total}</div>
              <div className="tenants-stat-label">Total Tenants</div>
            </div>
          </div>
          <div className="tenants-stat-card">
            <div className="tenants-stat-icon">✅</div>
            <div className="tenants-stat-content">
              <div className="tenants-stat-value">{stats.active}</div>
              <div className="tenants-stat-label">Active</div>
            </div>
          </div>
          <div className="tenants-stat-card">
            <div className="tenants-stat-icon">⏰</div>
            <div className="tenants-stat-content">
              <div className="tenants-stat-value">{stats.expired}</div>
              <div className="tenants-stat-label">Expired</div>
            </div>
          </div>
          <div className="tenants-stat-card">
            <div className="tenants-stat-icon">⛔</div>
            <div className="tenants-stat-content">
              <div className="tenants-stat-value">{stats.suspended}</div>
              <div className="tenants-stat-label">Suspended</div>
            </div>
          </div>
          <div className="tenants-stat-card">
            <div className="tenants-stat-icon">🎉</div>
            <div className="tenants-stat-content">
              <div className="tenants-stat-value">{stats.trial}</div>
              <div className="tenants-stat-label">Trial</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="tenants-filters-container">
          <div className="tenants-filter-group">
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tenants-search-input"
            />
          </div>
          <div className="tenants-filter-group">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="tenants-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div className="tenants-filter-group">
            <select 
              value={planFilter} 
              onChange={(e) => setPlanFilter(e.target.value)}
              className="tenants-filter-select"
            >
              <option value="all">All Plans</option>
              {planOptions.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FORM */}
        <div className="tenants-form-container">
          <div className="tenants-form-header">
            <h3>{editingId ? "Edit Tenant" : "Add New Tenant"}</h3>
            {editingId && (
              <button 
                type="button" 
                className="tenants-cancel-btn" 
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="tenants-form">
            <div className="tenants-form-grid">
              <div className="tenants-form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Owner Email *</label>
                <input
                  type="email"
                  placeholder="Enter owner email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  required
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Owner Phone</label>
                <input
                  type="tel"
                  placeholder="Enter owner phone"
                  value={form.ownerPhone}
                  onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Plan Name *</label>
                <select
                  value={form.planName}
                  onChange={(e) => setForm({ ...form, planName: e.target.value })}
                  required
                  className="tenants-form-select"
                >
                  {planOptions.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>

              <div className="tenants-form-group">
                <label>Plan Duration (Days) *</label>
                <input
                  type="number"
                  placeholder="Plan duration in days"
                  value={form.planDuration}
                  onChange={(e) => handlePlanDurationChange(e.target.value)}
                  min="1"
                  required
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Plan Price (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.planPrice}
                  onChange={(e) => setForm({ ...form, planPrice: e.target.value })}
                  min="0"
                  step="0.01"
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Subscription Start *</label>
                <input
                  type="date"
                  value={form.subscriptionStart}
                  onChange={(e) => handleSubscriptionStartChange(e.target.value)}
                  required
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Expiry Date *</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  required
                  className="tenants-form-input"
                />
              </div>

              <div className="tenants-form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="tenants-form-select"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="tenants-form-actions">
              <button 
                type="submit" 
                className="tenants-submit-btn" 
                disabled={loading}
              >
                {loading ? "Processing..." : editingId ? "Update Tenant" : "Add Tenant"}
              </button>
            </div>
          </form>
        </div>

        {/* Tenants Table */}
        <div className="tenants-table-container">
          <div className="tenants-table-header">
            <h3>Tenants ({filteredTenants.length})</h3>
            <div className="tenants-table-info">
              <span className="tenants-results-count">
                Showing {filteredTenants.length} of {tenants.length} tenants
              </span>
            </div>
          </div>

          {filteredTenants.length === 0 ? (
            <div className="tenants-empty-state">
              <div className="tenants-empty-icon">🏢</div>
              <h3>No tenants found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="tenants-table-wrapper">
              <table className="tenants-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Plan</th>
                    <th>Subscription</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTenants.map((tenant) => {
                    const daysRemaining = calculateDaysRemaining(tenant.expiresAt);
                    const isExpired = daysRemaining <= 0;
                    
                    return (
                      <tr 
                        key={tenant._id} 
                        className={isExpired ? 'tenants-table-row-expired' : 'tenants-table-row'}
                      >
                        <td className="tenants-table-company">
                          <div className="tenants-company-name">{tenant.companyName}</div>
                          {tenant.planName === "Trial" && (
                            <span className="tenants-trial-badge">Trial</span>
                          )}
                        </td>
                        
                        <td className="tenants-table-contact">
                          <div className="tenants-contact-email">{tenant.ownerEmail}</div>
                          {tenant.ownerPhone && (
                            <div className="tenants-contact-phone">{tenant.ownerPhone}</div>
                          )}
                        </td>
                        
                        <td className="tenants-table-plan">
                          <div className="tenants-plan-name">{tenant.planName}</div>
                          <div className="tenants-plan-price">₹{tenant.planPrice || 0}</div>
                        </td>
                        
                        <td className="tenants-table-subscription">
                          <div className="tenants-subscription-dates">
                            <div className="tenants-start-date">
                              Start: {tenant.subscriptionStart ? new Date(tenant.subscriptionStart).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="tenants-expiry-date">
                              Expires: {tenant.expiresAt ? new Date(tenant.expiresAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          {!isExpired && (
                            <div className="tenants-days-remaining">
                              {daysRemaining} days remaining
                            </div>
                          )}
                        </td>
                        
                        <td className="tenants-table-status">
                          <span className={getStatusBadgeClass(tenant)}>
                            {getStatusText(tenant)}
                          </span>
                        </td>
                        
                        <td className="tenants-table-actions">
                          <div className="tenants-action-buttons">
                            <button
                              className="tenants-action-btn tenants-edit-btn"
                              onClick={() => handleEdit(tenant)}
                              title="Edit Tenant"
                            >
                              Edit
                            </button>
                            
                            <button
                              className="tenants-action-btn tenants-extend-btn"
                              onClick={() => extendSubscription(tenant)}
                              title="Extend Subscription"
                            >
                              Extend
                            </button>
                            
                            <button
                              className="tenants-action-btn tenants-plan-btn"
                              onClick={() => changePlan(tenant)}
                              title="Change Plan"
                            >
                              Plan
                            </button>
                            
                            <button
                              className="tenants-action-btn tenants-status-btn"
                              onClick={() => toggleTenantStatus(tenant)}
                              title={tenant.status === "suspended" ? "Activate Tenant" : "Suspend Tenant"}
                            >
                              {tenant.status === "suspended" ? "Activate" : "Suspend"}
                            </button>
                            
                            {isExpired && (
                              <button
                                className="tenants-action-btn tenants-email-btn"
                                onClick={() => sendExpiryEmail(tenant)}
                                title="Send Expiry Email"
                              >
                                Email
                              </button>
                            )}
                            
                            <button
                              className="tenants-action-btn tenants-delete-btn"
                              onClick={() => handleDelete(tenant._id, tenant.companyName)}
                              disabled={deleteLoading === tenant._id}
                              title="Delete Tenant"
                            >
                              {deleteLoading === tenant._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Sidebar */}
      <AdminSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}

export default AdminTenants;