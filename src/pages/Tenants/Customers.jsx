import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    gstin: "", 
    address: "", 
    openingBalance: 0 
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Enhanced data extraction function
  const extractDataFromResponse = (response, endpoint = '') => {
    if (!response || !response.data) {
      console.log(`❌ ${endpoint}: No response or data`);
      return [];
    }
    
    const data = response.data;
    console.log(`📦 ${endpoint} raw response:`, data);
    
    // Handle different response structures
    if (Array.isArray(data)) {
      console.log(`✅ ${endpoint}: Direct array response`);
      return data;
    } else if (data && Array.isArray(data.docs)) {
      console.log(`✅ ${endpoint}: Paginated docs response`);
      return data.docs;
    } else if (data && Array.isArray(data.data)) {
      console.log(`✅ ${endpoint}: Standard data array response`);
      return data.data;
    } else if (data && data.success && Array.isArray(data.data)) {
      console.log(`✅ ${endpoint}: Success wrapper with data array`);
      return data.data;
    } else if (data && data.success && data.data && typeof data.data === 'object') {
      console.log(`✅ ${endpoint}: Success wrapper with object data`);
      // Handle cases like {success: true, data: {count: 0, items: []}}
      if (Array.isArray(data.data.items)) {
        return data.data.items;
      } else if (Array.isArray(data.data.customers)) {
        return data.data.customers;
      } else if (Array.isArray(data.data.products)) {
        return data.data.products;
      } else if (Array.isArray(data.data.invoices)) {
        return data.data.invoices;
      } else if (Array.isArray(data.data.suppliers)) {
        return data.data.suppliers;
      } else if (Array.isArray(data.data.purchases)) {
        return data.data.purchases;
      } else {
        console.warn(`⚠️ ${endpoint}: Unexpected object structure`, data.data);
        return [];
      }
    } else {
      console.warn(`⚠️ ${endpoint}: Unexpected API response structure:`, data);
      return [];
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const load = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching customers...");
      
      // Set auth headers
      const token = localStorage.getItem("token");
      const tenantId = localStorage.getItem("tenantId");
      
      if (token && tenantId) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        api.defaults.headers.common["X-Tenant-ID"] = tenantId;
      }
      
      const response = await api.get("/customers");
      
      // Use the helper function to extract data
      const customersData = extractDataFromResponse(response, 'customers');
      
      console.log(`✅ Loaded ${customersData.length} customers:`, customersData);
      
      // Process customer data to ensure all fields are present
      const processedCustomers = customersData.map(customer => ({
        _id: customer._id || customer.id,
        name: customer.name || 'Unknown Customer',
        phone: customer.phone || '',
        email: customer.email || '',
        gstin: customer.gstin || customer.gstNumber || '',
        address: customer.address || '',
        openingBalance: parseFloat(customer.openingBalance) || 0,
        balance: parseFloat(customer.balance) || 0,
        totalSales: parseFloat(customer.totalSales) || 0,
        totalPaid: parseFloat(customer.totalPaid) || 0,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }));
      
      setCustomers(processedCustomers);
      
    } catch (err) {
      console.error("❌ Failed to load customers:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      
      let errorMessage = "Failed to load customers";
      
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        // Redirect to login
        window.location.href = "/login";
      } else if (err.response?.status === 403) {
        errorMessage = "Access denied. Please check your permissions.";
      } else if (err.response?.status === 404) {
        errorMessage = "Customers endpoint not found.";
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage = err.response?.data?.message || err.message || "Failed to load customers";
      }
      
      showMessage(errorMessage, "error");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = customers.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      console.log(editing ? "🔄 Updating customer..." : "📝 Creating customer...");
      
      // Prepare customer data according to backend model
      const customerData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        gstin: form.gstin.trim().toUpperCase(),
        address: form.address.trim(),
        openingBalance: parseFloat(form.openingBalance) || 0
      };

      // Validate required fields
      if (!customerData.name) {
        throw new Error("Customer name is required");
      }

      let response;
      if (editing) {
        console.log(`📝 Updating customer ${editing._id}:`, customerData);
        response = await api.put(`/customers/${editing._id}`, customerData);
      } else {
        console.log(`➕ Creating new customer:`, customerData);
        response = await api.post("/customers", customerData);
      }
      
      console.log("✅ Save response:", response.data);
      
      if (response.data?.success) {
        showMessage(editing ? "✅ Customer updated successfully" : "✅ Customer added successfully");
        setEditing(null);
        setForm({ name: "", phone: "", email: "", gstin: "", address: "", openingBalance: 0 });
        setShowForm(false);
        await load(); // Reload the data
      } else {
        throw new Error(response.data?.message || "Failed to save customer");
      }
      
    } catch (err) {
      console.error("❌ Save failed:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      
      let errorMsg = "Failed to save customer. Please try again.";
      
      if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || "Invalid customer data. Please check all fields.";
      } else if (err.response?.status === 401) {
        errorMsg = "Session expired. Please log in again.";
        window.location.href = "/login";
      } else if (err.response?.status === 409) {
        errorMsg = "Customer with this name or GSTIN already exists.";
      } else {
        errorMsg = err.response?.data?.message || err.message || errorMsg;
      }
      
      showMessage(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c) => {
    console.log("✏️ Editing customer:", c);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      gstin: c.gstin || "",
      address: c.address || "",
      openingBalance: c.openingBalance || 0
    });
    setEditing(c);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    
    try {
      console.log("🗑️ Deleting customer:", id);
      const response = await api.delete(`/customers/${id}`);
      
      if (response.data?.success) {
        showMessage("✅ Customer deleted successfully");
        await load(); // Reload the data
      } else {
        throw new Error(response.data?.message || "Failed to delete customer");
      }
    } catch (err) {
      console.error("❌ Delete failed:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      
      let errorMsg = "Failed to delete customer. Please try again.";
      
      if (err.response?.status === 404) {
        errorMsg = "Customer not found. It may have been already deleted.";
      } else if (err.response?.status === 401) {
        errorMsg = "Session expired. Please log in again.";
        window.location.href = "/login";
      } else if (err.response?.status === 403) {
        errorMsg = "You don't have permission to delete this customer.";
      } else {
        errorMsg = err.response?.data?.message || err.message || errorMsg;
      }
      
      showMessage(errorMsg, "error");
    }
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", gstin: "", address: "", openingBalance: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number || 0);
  };

  // Calculate financial summary with safe data access
  const financialSummary = {
    totalBalance: customers.reduce((sum, customer) => sum + (parseFloat(customer?.balance) || 0), 0),
    totalSales: customers.reduce((sum, customer) => sum + (parseFloat(customer?.totalSales) || 0), 0),
    totalPaid: customers.reduce((sum, customer) => sum + (parseFloat(customer?.totalPaid) || 0), 0),
    activeCustomers: customers.filter(customer => (parseFloat(customer?.totalSales) || 0) > 0).length,
  };

  return (
    <div className="customers-container">
      <div className="customers-layout">
        {/* Sidebar */}
        <div className="customers-sidebar">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="customers-main">
          {/* Header */}
          <div className="customers-header">
            <div className="customers-header-content">
              <div className="customers-header-text">
                <h1 className="customers-title">
                  <span className="customers-title-icon">👥</span>
                  Customers
                </h1>
                <p className="customers-subtitle">
                  Manage your customer database and track balances
                </p>
              </div>
              <div className="customers-header-actions">
                <button 
                  className={`customers-btn customers-btn-primary customers-add-btn ${showForm ? 'active' : ''}`}
                  onClick={() => setShowForm(!showForm)}
                  disabled={submitting || loading}
                >
                  <span className="btn-icon">{showForm ? '✕' : '➕'}</span>
                  {showForm ? 'Close Form' : 'Add Customer'}
                </button>
                <button 
                  className="customers-btn customers-btn-secondary"
                  onClick={load}
                  disabled={loading}
                >
                  <span className="btn-icon">🔄</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`customers-alert customers-alert-${message.type}`}>
              <span className="customers-alert-icon">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              {message.text}
              <button 
                className="customers-alert-close"
                onClick={() => setMessage({ text: "", type: "" })}
              >
                ✕
              </button>
            </div>
          )}

          {/* Customer Form */}
          {showForm && (
            <div className="customers-form-section">
              <div className="customers-form-card">
                <div className="customers-form-header">
                  <h3 className="customers-form-title">
                    <span className="form-title-icon">
                      {editing ? '✏️' : '➕'}
                    </span>
                    {editing ? 'Edit Customer' : 'Add New Customer'}
                  </h3>
                  <p className="customers-form-subtitle">
                    {editing ? 'Update customer information' : 'Add a new customer to your database'}
                  </p>
                  {editing && (
                    <div className="customers-form-warning">
                      ⚠️ Editing customer: <strong>{editing.name}</strong>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSubmit} className="customers-form">
                  <div className="customers-form-grid">
                    <div className="customers-form-group">
                      <label className="customers-form-label">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        className="customers-form-input"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        disabled={submitting}
                        maxLength="100"
                      />
                    </div>

                    <div className="customers-form-group">
                      <label className="customers-form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        className="customers-form-input"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                        disabled={submitting}
                        maxLength="15"
                      />
                    </div>

                    <div className="customers-form-group">
                      <label className="customers-form-label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="customers-form-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        disabled={submitting}
                        maxLength="100"
                      />
                    </div>

                    <div className="customers-form-group">
                      <label className="customers-form-label">
                        GSTIN Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter GSTIN (15 characters)"
                        className="customers-form-input"
                        value={form.gstin}
                        onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase().replace(/\s/g, '') })}
                        disabled={submitting}
                        maxLength="15"
                        pattern="[A-Z0-9]{15}"
                        title="GSTIN must be 15 characters (2 state code + 10 PAN + 3 entity + 1 check digit)"
                      />
                      <small className="customers-form-help">
                        Format: 24AABCU9603R1ZM
                      </small>
                    </div>

                    <div className="customers-form-group customers-form-fullwidth">
                      <label className="customers-form-label">
                        Address
                      </label>
                      <textarea
                        placeholder="Enter complete address"
                        className="customers-form-input customers-form-textarea"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        disabled={submitting}
                        rows="3"
                        maxLength="500"
                      />
                    </div>

                    <div className="customers-form-group">
                      <label className="customers-form-label">
                        Opening Balance (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="customers-form-input"
                        value={form.openingBalance}
                        onChange={(e) => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })}
                        disabled={submitting}
                        min="-9999999"
                        max="9999999"
                      />
                      <small className="customers-form-help">
                        Positive for credit balance, negative for debit balance
                      </small>
                    </div>
                  </div>

                  <div className="customers-form-actions">
                    <button 
                      type="submit" 
                      className="customers-btn customers-btn-success customers-submit-btn"
                      disabled={submitting || !form.name.trim()}
                    >
                      <span className="btn-icon">
                        {submitting ? '⏳' : (editing ? '💾' : '➕')}
                      </span>
                      {submitting ? 'Saving...' : (editing ? 'Update Customer' : 'Add Customer')}
                    </button>
                    
                    <button 
                      type="button" 
                      className="customers-btn customers-btn-secondary customers-cancel-btn"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      <span className="btn-icon">✕</span>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and Stats */}
          <div className="customers-content-section">
            <div className="customers-search-stats">
              <div className="customers-search-container">
                <div className="customers-search-group">
                  <span className="customers-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search customers by name, phone, email, or GSTIN..."
                    className="customers-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={loading}
                  />
                  {search && (
                    <button 
                      className="customers-search-clear"
                      onClick={() => setSearch("")}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="customers-search-info">
                  {search && (
                    <span className="customers-search-results">
                      Found {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="customers-stats-grid">
                <div className="customers-stat-card">
                  <div className="customers-stat-icon-wrapper customers-stat-primary">
                    <span className="customers-stat-icon">👥</span>
                  </div>
                  <div className="customers-stat-content">
                    <span className="customers-stat-value">{formatNumber(customers.length)}</span>
                    <span className="customers-stat-label">Total Customers</span>
                    <span className="customers-stat-subtext">
                      {financialSummary.activeCustomers} active
                    </span>
                  </div>
                </div>
                <div className="customers-stat-card">
                  <div className="customers-stat-icon-wrapper customers-stat-success">
                    <span className="customers-stat-icon">💰</span>
                  </div>
                  <div className="customers-stat-content">
                    <span className="customers-stat-value">₹{formatCurrency(financialSummary.totalSales)}</span>
                    <span className="customers-stat-label">Total Sales</span>
                    <span className="customers-stat-subtext">
                      All time revenue
                    </span>
                  </div>
                </div>
                <div className="customers-stat-card">
                  <div className="customers-stat-icon-wrapper customers-stat-warning">
                    <span className="customers-stat-icon">💳</span>
                  </div>
                  <div className="customers-stat-content">
                    <span className="customers-stat-value">₹{formatCurrency(financialSummary.totalPaid)}</span>
                    <span className="customers-stat-label">Total Paid</span>
                    <span className="customers-stat-subtext">
                      Received payments
                    </span>
                  </div>
                </div>
                <div className="customers-stat-card">
                  <div className="customers-stat-icon-wrapper customers-stat-info">
                    <span className="customers-stat-icon">⚖️</span>
                  </div>
                  <div className="customers-stat-content">
                    <span className="customers-stat-value">₹{formatCurrency(financialSummary.totalBalance)}</span>
                    <span className="customers-stat-label">Total Balance</span>
                    <span className="customers-stat-subtext">
                      Outstanding amount
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="customers-table-section">
              <div className="customers-table-card">
                {loading ? (
                  <div className="customers-loading">
                    <div className="customers-loading-spinner"></div>
                    <p className="customers-loading-text">Loading customers...</p>
                    <p className="customers-loading-subtext">
                      Please wait while we fetch your customer data
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="customers-table-header">
                      <h4 className="customers-table-title">
                        <span className="table-title-icon">📋</span>
                        Customer List {filtered.length > 0 && `(${formatNumber(filtered.length)})`}
                      </h4>
                      <div className="customers-table-actions">
                        <span className="customers-results-count">
                          Showing {formatNumber(filtered.length)} of {formatNumber(customers.length)} customers
                        </span>
                        {customers.length > 0 && (
                          <button 
                            className="customers-btn customers-btn-secondary customers-export-btn"
                            onClick={() => showMessage("Export feature coming soon!", "info")}
                          >
                            <span className="btn-icon">📤</span>
                            Export
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="customers-table-container">
                      {filtered.length === 0 ? (
                        <div className="customers-empty-state">
                          <div className="customers-empty-icon">
                            {search ? '🔍' : '👥'}
                          </div>
                          <h5 className="customers-empty-title">
                            {search ? 'No customers found' : 'No customers yet'}
                          </h5>
                          <p className="customers-empty-text">
                            {search 
                              ? `No customers match "${search}". Try adjusting your search terms.` 
                              : 'Get started by adding your first customer to your database.'
                            }
                          </p>
                          <div className="customers-empty-actions">
                            {!search && (
                              <button 
                                className="customers-btn customers-btn-primary customers-empty-btn"
                                onClick={() => setShowForm(true)}
                              >
                                <span className="btn-icon">➕</span>
                                Add First Customer
                              </button>
                            )}
                            {search && (
                              <button 
                                className="customers-btn customers-btn-secondary"
                                onClick={() => setSearch("")}
                              >
                                <span className="btn-icon">✕</span>
                                Clear Search
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table */}
                          <div className="customers-table-responsive">
                            <table className="customers-table">
                              <thead className="customers-table-head">
                                <tr>
                                  <th className="customers-col-sr">#</th>
                                  <th className="customers-col-name">Customer Details</th>
                                  <th className="customers-col-contact">Contact Info</th>
                                  <th className="customers-col-gstin">GSTIN</th>
                                  <th className="customers-col-financial">Financial Summary</th>
                                  <th className="customers-col-actions">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="customers-table-body">
                                {filtered.map((customer, index) => (
                                  <tr key={customer._id} className="customers-table-row">
                                    <td className="customers-col-sr">
                                      <span className="customers-sr-number">{index + 1}</span>
                                    </td>
                                    <td className="customers-col-name">
                                      <div className="customers-name-primary">
                                        {customer.name}
                                        {(customer.balance || 0) < 0 && (
                                          <span className="customers-overdue-badge" title="Customer has overdue balance">
                                            ⚠️
                                          </span>
                                        )}
                                      </div>
                                      {customer.address && (
                                        <div className="customers-address-secondary">
                                          📍 {customer.address.length > 50 ? customer.address.substring(0, 50) + '...' : customer.address}
                                        </div>
                                      )}
                                      <div className="customers-meta-info">
                                        {customer.createdAt && (
                                          <span className="customers-created-date">
                                            Added: {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="customers-col-contact">
                                      <div className="customers-contact-info">
                                        {customer.phone && (
                                          <div className="customers-contact-item">
                                            <span className="contact-icon">📞</span>
                                            <a 
                                              href={`tel:${customer.phone}`}
                                              className="customers-phone-link"
                                              title={`Call ${customer.phone}`}
                                            >
                                              {customer.phone}
                                            </a>
                                          </div>
                                        )}
                                        {customer.email && (
                                          <div className="customers-contact-item">
                                            <span className="contact-icon">📧</span>
                                            <a 
                                              href={`mailto:${customer.email}`}
                                              className="customers-email-link"
                                              title={`Email ${customer.email}`}
                                            >
                                              {customer.email}
                                            </a>
                                          </div>
                                        )}
                                        {!customer.phone && !customer.email && (
                                          <span className="customers-empty-field">No contact info</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="customers-col-gstin">
                                      {customer.gstin ? (
                                        <div className="customers-gstin-container">
                                          <code className="customers-gstin-code">
                                            {customer.gstin}
                                          </code>
                                          <span className="customers-gstin-verified" title="GSTIN verified">
                                            ✅
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="customers-empty-field">-</span>
                                      )}
                                    </td>
                                    <td className="customers-col-financial">
                                      <div className="customers-financial-summary">
                                        <div className="customers-financial-row">
                                          <span className="financial-label">Sales:</span>
                                          <span className="financial-value sales">
                                            ₹{formatCurrency(customer.totalSales)}
                                          </span>
                                        </div>
                                        <div className="customers-financial-row">
                                          <span className="financial-label">Paid:</span>
                                          <span className="financial-value paid">
                                            ₹{formatCurrency(customer.totalPaid)}
                                          </span>
                                        </div>
                                        <div className="customers-financial-row">
                                          <span className="financial-label">Balance:</span>
                                          <span className={`financial-value balance ${(customer.balance || 0) < 0 ? 'negative' : (customer.balance || 0) > 0 ? 'positive' : 'zero'}`}>
                                            ₹{formatCurrency(customer.balance)}
                                            {(customer.balance || 0) < 0 && (
                                              <span className="balance-warning" title="Overdue amount">
                                                ⚠️
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="customers-col-actions">
                                      <div className="customers-actions">
                                        <button 
                                          className="customers-action-btn customers-edit-btn"
                                          onClick={() => handleEdit(customer)}
                                          title="Edit Customer"
                                          disabled={submitting}
                                        >
                                          <span className="action-icon">✏️</span>
                                          <span className="action-text">Edit</span>
                                        </button>
                                        <button 
                                          className="customers-action-btn customers-delete-btn"
                                          onClick={() => handleDelete(customer._id)}
                                          title="Delete Customer"
                                          disabled={submitting}
                                        >
                                          <span className="action-icon">🗑️</span>
                                          <span className="action-text">Delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards View */}
                          <div className="customers-mobile-cards">
                            {filtered.map((customer, index) => (
                              <div key={customer._id} className="customers-mobile-card">
                                <div className="customers-card-header">
                                  <div className="customers-card-name">
                                    {customer.name}
                                    {(customer.balance || 0) < 0 && (
                                      <span className="customers-overdue-badge-mobile" title="Overdue balance">
                                        ⚠️
                                      </span>
                                    )}
                                  </div>
                                  <div className={`customers-card-balance ${(customer.balance || 0) < 0 ? 'negative' : (customer.balance || 0) > 0 ? 'positive' : 'zero'}`}>
                                    ₹{formatCurrency(customer.balance)}
                                  </div>
                                </div>
                                
                                <div className="customers-card-details">
                                  {customer.phone && (
                                    <div className="customers-card-detail">
                                      <span className="detail-icon">📞</span>
                                      <a href={`tel:${customer.phone}`} className="detail-value">
                                        {customer.phone}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {customer.email && (
                                    <div className="customers-card-detail">
                                      <span className="detail-icon">📧</span>
                                      <a href={`mailto:${customer.email}`} className="detail-value">
                                        {customer.email}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {customer.gstin && (
                                    <div className="customers-card-detail">
                                      <span className="detail-icon">🏛️</span>
                                      <span className="detail-value">{customer.gstin}</span>
                                    </div>
                                  )}
                                  
                                  {customer.address && (
                                    <div className="customers-card-detail">
                                      <span className="detail-icon">📍</span>
                                      <span className="detail-value">
                                        {customer.address.length > 60 ? customer.address.substring(0, 60) + '...' : customer.address}
                                      </span>
                                    </div>
                                  )}

                                  <div className="customers-card-financials">
                                    <div className="customers-financial-item">
                                      <span className="financial-label">Total Sales:</span>
                                      <span className="financial-value">₹{formatCurrency(customer.totalSales)}</span>
                                    </div>
                                    <div className="customers-financial-item">
                                      <span className="financial-label">Total Paid:</span>
                                      <span className="financial-value">₹{formatCurrency(customer.totalPaid)}</span>
                                    </div>
                                    <div className="customers-financial-item highlight">
                                      <span className="financial-label">Outstanding:</span>
                                      <span className={`financial-value ${(customer.balance || 0) < 0 ? 'negative' : (customer.balance || 0) > 0 ? 'positive' : 'zero'}`}>
                                        ₹{formatCurrency(customer.balance)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="customers-card-actions">
                                  <button 
                                    className="customers-action-btn customers-edit-btn"
                                    onClick={() => handleEdit(customer)}
                                    disabled={submitting}
                                  >
                                    <span className="action-icon">✏️</span>
                                    Edit
                                  </button>
                                  <button 
                                    className="customers-action-btn customers-delete-btn"
                                    onClick={() => handleDelete(customer._id)}
                                    disabled={submitting}
                                  >
                                    <span className="action-icon">🗑️</span>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customers;