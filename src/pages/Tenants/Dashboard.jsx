import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Dashboard.css";


function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    invoices: 0,
    totalSales: 0,
    suppliers: 0,
    purchaseInvoices: 0,
    totalPurchases: 0,
  });

  const [tenant, setTenant] = useState({
    companyName: "",
    email: "",
    tenantName: "",
    plan: "free",
    status: "active",
    expiresAt: null,
    isTrial: true,
    daysRemaining: 7
  });

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  // Calculate days remaining
  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 7;
    
    try {
      const now = new Date();
      const expiryDate = new Date(expiresAt);
      
      if (isNaN(expiryDate.getTime())) {
        console.warn('Invalid expiry date:', expiresAt);
        return 7;
      }
      
      const diffTime = expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 7;
    }
  };

  // ✅ Check login & set auth header
  useEffect(() => {
    const token = localStorage.getItem("token");
    const tenantId = localStorage.getItem("tenantId");
    
    if (!token || !tenantId) {
      console.warn("No token or tenantId found, redirecting to login");
      alert("Please log in to access your dashboard.");
      navigate("/login");
      return;
    }

    // Set auth headers for multi-tenant isolation
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    fetchTenantInfo();
  }, [navigate]);

  const fetchTenantInfo = async () => {
    setAuthLoading(true);
    try {
      console.log("🔄 Fetching tenant info...");
      const response = await api.get("/auth/me");
      
      console.log("🔍 FULL AUTH/ME RESPONSE:", response.data);
      
      // 🚨 CRITICAL FIX: Handle both response structures
      let user, company, tenantData;
      
      if (response.data?.success) {
        // Structure 1: response.data.data.user, response.data.data.company, response.data.data.tenant
        if (response.data.data) {
          user = response.data.data.user;
          company = response.data.data.company;
          tenantData = response.data.data.tenant;
        } 
        // Structure 2: response.data.user, response.data.company, response.data.tenant
        else {
          user = response.data.user;
          company = response.data.company;
          tenantData = response.data.tenant;
        }
      } else {
        // Direct structure without success wrapper
        user = response.data?.user;
        company = response.data?.company;
        tenantData = response.data?.tenant;
      }
      
      console.log("✅ Extracted tenant data:", {
        user: user?.email,
        company: company?.name,
        tenant: tenantData
      });
      
      const daysRemaining = calculateDaysRemaining(tenantData?.expiresAt);
      
      setTenant({
        companyName: company?.name || "Your Company",
        email: user?.email || "user@example.com",
        tenantName: tenantData?.companyName || tenantData?.name || company?.name || "My Business",
        plan: tenantData?.planName || tenantData?.plan || "Trial",
        status: tenantData?.status || "active",
        expiresAt: tenantData?.expiresAt,
        isTrial: tenantData?.isTrial !== undefined ? tenantData.isTrial : true,
        daysRemaining: daysRemaining
      });

      // Store tenant info for multi-tenant isolation
      if (tenantData?.id || tenantData?._id) {
        localStorage.setItem("tenantId", tenantData.id || tenantData._id);
      }
      if (company?.id || company?._id) {
        localStorage.setItem("companyId", company.id || company._id);
      }
      if (user?.id || user?._id) {
        localStorage.setItem("userId", user.id || user._id);
      }
      if (user?.email) localStorage.setItem("userEmail", user.email);
      if (company?.name) localStorage.setItem("companyName", company.name);
      if (tenantData?.planName || tenantData?.plan) {
        localStorage.setItem("planName", tenantData.planName || tenantData.plan);
      }
      if (tenantData?.expiresAt) localStorage.setItem("expiresAt", tenantData.expiresAt);
      if (tenantData?.isTrial !== undefined) localStorage.setItem("isTrial", tenantData.isTrial.toString());

    } catch (err) {
      console.error("❌ Failed to load tenant info:", err);
      console.error("❌ Error details:", err.response?.data);
      
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        handleLogout();
        return;
      }
      
      // Fallback to localStorage data
      const userEmail = localStorage.getItem("userEmail");
      const companyName = localStorage.getItem("companyName");
      const planName = localStorage.getItem("planName");
      const expiresAt = localStorage.getItem("expiresAt");
      const isTrial = localStorage.getItem("isTrial") !== 'false';
      
      const daysRemaining = calculateDaysRemaining(expiresAt);
      
      console.warn("⚠️ Using fallback tenant data");
      setTenant({
        companyName: companyName || "Your Company",
        email: userEmail || "user@example.com",
        tenantName: companyName || "My Business",
        plan: planName || "Trial",
        status: "active",
        expiresAt: expiresAt,
        isTrial: isTrial,
        daysRemaining: daysRemaining
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    // Clear all tenant-specific data
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("companyId");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("companyName");
    localStorage.removeItem("planName");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("isTrial");
    localStorage.removeItem("loginTime");
    
    // Clear API headers
    delete api.defaults.headers.common["Authorization"];
    delete api.defaults.headers.common["X-Tenant-ID"];
    
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Data extraction function - IMPROVED VERSION
  const extractDataFromResponse = (response, endpoint = '') => {
    if (!response || response.error) {
      console.log(`❌ ${endpoint}: No response or error`);
      return [];
    }
    
    const data = response.data;
    console.log(`📦 ${endpoint} raw response:`, data);
    
    // Handle direct array response
    if (Array.isArray(data)) {
      console.log(`✅ ${endpoint}: Direct array response`);
      return data;
    }
    
    // Handle success response with data
    if (data?.success) {
      // Check for data.data array
      if (Array.isArray(data.data)) {
        console.log(`✅ ${endpoint}: Success with data array`);
        return data.data;
      }
      // Check for nested arrays in data property
      else if (data.data && Array.isArray(data.data.items)) {
        console.log(`✅ ${endpoint}: Success with items array`);
        return data.data.items;
      }
      else if (data.data && Array.isArray(data.data.docs)) {
        console.log(`✅ ${endpoint}: Success with docs array`);
        return data.data.docs;
      }
      else if (data.data && Array.isArray(data.data.purchases)) {
        console.log(`✅ ${endpoint}: Success with purchases array`);
        return data.data.purchases;
      }
      else if (data.data && Array.isArray(data.data.invoices)) {
        console.log(`✅ ${endpoint}: Success with invoices array`);
        return data.data.invoices;
      }
      else if (data.data && Array.isArray(data.data.suppliers)) {
        console.log(`✅ ${endpoint}: Success with suppliers array`);
        return data.data.suppliers;
      }
      else if (data.data && Array.isArray(data.data.customers)) {
        console.log(`✅ ${endpoint}: Success with customers array`);
        return data.data.customers;
      }
      else if (data.data && Array.isArray(data.data.products)) {
        console.log(`✅ ${endpoint}: Success with products array`);
        return data.data.products;
      }
      // Handle direct data array without nesting
      else if (Array.isArray(data.data)) {
        console.log(`✅ ${endpoint}: Success with direct data array`);
        return data.data;
      }
    }
    
    // Handle paginated response without success wrapper
    if (data && Array.isArray(data.docs)) {
      console.log(`✅ ${endpoint}: Paginated docs response`);
      return data.docs;
    }
    
    // Handle array in data property without success wrapper
    if (data && Array.isArray(data.data)) {
      console.log(`✅ ${endpoint}: Data array without success wrapper`);
      return data.data;
    }
    
    // Handle specific endpoint responses
    if (data && Array.isArray(data.suppliers)) {
      console.log(`✅ ${endpoint}: Suppliers array response`);
      return data.suppliers;
    }
    if (data && Array.isArray(data.customers)) {
      console.log(`✅ ${endpoint}: Customers array response`);
      return data.customers;
    }
    if (data && Array.isArray(data.products)) {
      console.log(`✅ ${endpoint}: Products array response`);
      return data.products;
    }
    if (data && Array.isArray(data.invoices)) {
      console.log(`✅ ${endpoint}: Invoices array response`);
      return data.invoices;
    }
    if (data && Array.isArray(data.purchases)) {
      console.log(`✅ ${endpoint}: Purchases array response`);
      return data.purchases;
    }
    
    console.warn(`⚠️ ${endpoint}: Unexpected API response structure:`, data);
    return [];
  };

  // Stats loading function
  const loadStats = async () => {
    if (authLoading) return;
    
    setLoading(true);
    setStatsError("");
    
    try {
      console.log("📊 Loading dashboard stats...");
      
      // Make all API calls with proper error handling
      const endpoints = [
        { key: 'customers', url: '/customers' },
        { key: 'products', url: '/products' },
        { key: 'invoices', url: '/invoices' },
        { key: 'suppliers', url: '/suppliers' },
        { key: 'purchases', url: '/purchases' }
      ];

      const results = {};
      
      // Fetch data for each endpoint with better error handling
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Fetching ${endpoint.key} from ${endpoint.url}...`);
          const response = await api.get(endpoint.url);
          console.log(`📨 ${endpoint.key} response:`, response);
          
          const extractedData = extractDataFromResponse(response, endpoint.key);
          console.log(`✅ ${endpoint.key} extracted data:`, extractedData.length, 'items');
          
          results[endpoint.key] = extractedData;
        } catch (error) {
          console.error(`❌ Failed to fetch ${endpoint.key}:`, error);
          console.error(`❌ Error details:`, error.response?.data || error.message);
          results[endpoint.key] = [];
        }
      }

      // Debug: Check what data we got
      console.log("🔍 All results:", Object.keys(results).map(key => ({
        key,
        count: results[key].length
      })));

      // Calculate totals with safe array handling
      const totalSales = Array.isArray(results.invoices) ? results.invoices.reduce(
        (sum, invoice) => sum + (parseFloat(invoice?.grandTotal) || 0),
        0
      ) : 0;
      
      const totalPurchases = Array.isArray(results.purchases) ? results.purchases.reduce(
        (sum, purchase) => sum + (parseFloat(purchase?.grandTotal) || 0),
        0
      ) : 0;

      // Update stats with fallback to 0 if no data
      const newStats = {
        customers: Array.isArray(results.customers) ? results.customers.length : 0,
        products: Array.isArray(results.products) ? results.products.length : 0,
        invoices: Array.isArray(results.invoices) ? results.invoices.length : 0,
        totalSales,
        suppliers: Array.isArray(results.suppliers) ? results.suppliers.length : 0,
        purchaseInvoices: Array.isArray(results.purchases) ? results.purchases.length : 0,
        totalPurchases,
      };

      console.log("✅ Final stats:", newStats);
      setStats(newStats);

    } catch (err) {
      console.error("❌ Failed to load dashboard stats:", err);
      console.error("❌ Error response:", err.response?.data);
      setStatsError("Failed to load some business data. Please refresh the page.");
      
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadStats();
    }
  }, [authLoading]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Get plan display text
  const getPlanDisplayText = () => {
    if (tenant.isTrial) {
      if (tenant.daysRemaining > 0) {
        return `Trial - ${tenant.daysRemaining} day${tenant.daysRemaining !== 1 ? 's' : ''} left`;
      } else {
        return "Trial Expired";
      }
    }
    return tenant.plan;
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="nandi-dashboard-container">
        <div className="nandi-dashboard-loading">
          <div className="nandi-dashboard-spinner"></div>
          <p className="nandi-dashboard-loading-text">
            Loading your tenant dashboard...
          </p>
          <p className="nandi-dashboard-loading-subtext">
            Setting up your multi-tenant workspace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="nandi-dashboard-container">
      <div className="nandi-dashboard-layout">
        {/* Mobile Menu Toggle */}
        <button 
          className="nandi-dashboard-mobile-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Overlay for mobile menu */}
        {sidebarOpen && (
          <div 
            className="nandi-dashboard-overlay active" 
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`nandi-dashboard-sidebar ${sidebarOpen ? 'active' : ''}`}>
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="nandi-dashboard-main">
          {/* Header */}
          <header className="nandi-dashboard-header">
            <div className="nandi-dashboard-header-content">
              <div className="nandi-dashboard-header-top">
                <div className="nandi-dashboard-header-text">
                  <div className="nandi-dashboard-welcome-pill">
                    <span>{getPlanDisplayText()}</span>
                    <span>•</span>
                    <span>{tenant.status.toUpperCase()}</span>
                  </div>
                  <h1 className="nandi-dashboard-title">
                    <span className="nandi-dashboard-welcome">Welcome to</span>
                    {tenant.companyName} Dashboard
                  </h1>
                  {tenant.email && (
                    <p className="nandi-dashboard-subtitle">
                      Logged in as: <strong>{tenant.email}</strong>
                      {tenant.tenantName && ` • Workspace: ${tenant.tenantName}`}
                      {tenant.isTrial && tenant.daysRemaining > 0 && (
                        <span className="nandi-trial-info-badge">
                          ⏳ Trial ends in {tenant.daysRemaining} day{tenant.daysRemaining !== 1 ? 's' : ''}
                        </span>
                      )}
                      {tenant.isTrial && tenant.daysRemaining <= 0 && (
                        <span className="nandi-trial-expired-badge">
                          ❌ Trial expired - <Link to="/subscription">Upgrade</Link>
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="nandi-dashboard-header-actions">
                  <button
                    className="nandi-dashboard-logout-btn"
                    onClick={handleLogout}
                    title="Logout from system"
                    type="button"
                  >
                    <span className="nandi-logout-icon">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Body */}
          {loading ? (
            <section className="nandi-dashboard-loading">
              <div className="nandi-dashboard-spinner"></div>
              <p className="nandi-dashboard-loading-text">
                Loading business data...
              </p>
              <p className="nandi-dashboard-loading-subtext">
                Please wait while we fetch your dashboard information.
              </p>
            </section>
          ) : (
            <section className="nandi-dashboard-content">
              {/* Error Banner */}
              {statsError && (
                <div className="nandi-dashboard-error-banner">
                  <span className="nandi-error-icon">⚠️</span>
                  {statsError}
                  <button 
                    className="nandi-retry-btn"
                    onClick={loadStats}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* STATS */}
              <section className="nandi-dashboard-stats-section">
                <h2 className="nandi-dashboard-section-title">
                  <span className="nandi-section-icon">📊</span>
                  Business Overview
                </h2>

                <div className="nandi-dashboard-stats-grid">
                  {/* Total Sales */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-sales">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">💰</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">
                          {formatCurrency(stats.totalSales)}
                        </h3>
                        <p className="nandi-stat-label">Total Sales</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link to="/create-invoice" className="nandi-stat-card-action">
                        <span className="nandi-action-icon">➕</span>
                        New Invoice
                      </Link>
                    </div>
                  </div>

                  {/* Customers */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-customers">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">👥</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">{stats.customers}</h3>
                        <p className="nandi-stat-label">Total Customers</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link to="/customers" className="nandi-stat-card-action">
                        <span className="nandi-action-icon">👁️</span>
                        View All
                      </Link>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-products">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">📦</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">{stats.products}</h3>
                        <p className="nandi-stat-label">Total Products</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link to="/inventory" className="nandi-stat-card-action">
                        <span className="nandi-action-icon">👁️</span>
                        View Inventory
                      </Link>
                    </div>
                  </div>

                  {/* Sales Invoices */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-invoices">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">🧾</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">{stats.invoices}</h3>
                        <p className="nandi-stat-label">Sales Invoices</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link to="/invoices" className="nandi-stat-card-action">
                        <span className="nandi-action-icon">👁️</span>
                        View Sales
                      </Link>
                    </div>
                  </div>

                  {/* Purchases */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-purchases">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">📥</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">
                          {formatCurrency(stats.totalPurchases)}
                        </h3>
                        <p className="nandi-stat-label">Total Purchases</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link
                        to="/create-purchase-invoice"
                        className="nandi-stat-card-action"
                      >
                        <span className="nandi-action-icon">➕</span>
                        New Purchase
                      </Link>
                    </div>
                  </div>

                  {/* Suppliers */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-suppliers">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">🏢</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">{stats.suppliers}</h3>
                        <p className="nandi-stat-label">Total Suppliers</p>
                        {stats.suppliers === 0 && (
                          <p className="nandi-stat-warning">No suppliers found</p>
                        )}
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link to="/suppliers" className="nandi-stat-card-action">
                        <span className="nandi-action-icon">👁️</span>
                        View Suppliers
                      </Link>
                    </div>
                  </div>

                  {/* Purchase Invoices */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-purchase-invoices">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">📋</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">
                          {stats.purchaseInvoices}
                        </h3>
                        <p className="nandi-stat-label">Purchase Invoices</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <Link
                        to="/purchase-invoices"
                        className="nandi-stat-card-action"
                      >
                        <span className="nandi-action-icon">👁️</span>
                        View Purchases
                      </Link>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="nandi-dashboard-stat-card nandi-stat-card-summary">
                    <div className="nandi-stat-card-content">
                      <div className="nandi-stat-card-icon">
                        <span className="nandi-stat-icon">📈</span>
                      </div>
                      <div className="nandi-stat-card-text">
                        <h3 className="nandi-stat-value">
                          {stats.invoices + stats.purchaseInvoices}
                        </h3>
                        <p className="nandi-stat-label">Total Transactions</p>
                      </div>
                    </div>
                    <div className="nandi-stat-card-footer">
                      <span className="nandi-stat-card-info">
                        {stats.customers} customers • {stats.products} products • {stats.suppliers} suppliers
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* QUICK ACTIONS */}
              <section className="nandi-dashboard-actions-section">
                <h2 className="nandi-dashboard-section-title">
                  <span className="nandi-section-icon">⚡</span>
                  Quick Actions
                </h2>

                <div className="nandi-dashboard-actions-grid">
                  <Link
                    to="/create-invoice"
                    className="nandi-dashboard-action-card nandi-action-primary"
                  >
                    <div className="nandi-action-card-icon">➕</div>
                    <div className="nandi-action-card-content">
                      <h4 className="nandi-action-card-title">
                        New Sales Invoice
                      </h4>
                      <p className="nandi-action-card-description">
                        Create a new sales invoice for your customers.
                      </p>
                    </div>
                    <div className="nandi-action-card-arrow">→</div>
                  </Link>

                  <Link
                    to="/create-purchase-invoice"
                    className="nandi-dashboard-action-card nandi-action-secondary"
                  >
                    <div className="nandi-action-card-icon">📥</div>
                    <div className="nandi-action-card-content">
                      <h4 className="nandi-action-card-title">New Purchase</h4>
                      <p className="nandi-action-card-description">
                        Record new purchase from suppliers.
                      </p>
                    </div>
                    <div className="nandi-action-card-arrow">→</div>
                  </Link>

                  <Link
                    to="/customers"
                    className="nandi-dashboard-action-card nandi-action-success"
                  >
                    <div className="nandi-action-card-icon">👤</div>
                    <div className="nandi-action-card-content">
                      <h4 className="nandi-action-card-title">Add Customer</h4>
                      <p className="nandi-action-card-description">
                        Add new customer to your database.
                      </p>
                    </div>
                    <div className="nandi-action-card-arrow">→</div>
                  </Link>

                  <Link
                    to="/suppliers"
                    className="nandi-dashboard-action-card nandi-action-warning"
                  >
                    <div className="nandi-action-card-icon">🏢</div>
                    <div className="nandi-action-card-content">
                      <h4 className="nandi-action-card-title">Add Supplier</h4>
                      <p className="nandi-action-card-description">
                        Add new supplier to your records.
                      </p>
                    </div>
                    <div className="nandi-action-card-arrow">→</div>
                  </Link>

                  <Link
                    to="/inventory"
                    className="nandi-dashboard-action-card nandi-action-info"
                  >
                    <div className="nandi-action-card-icon">📦</div>
                    <div className="nandi-action-card-content">
                      <h4 className="nandi-action-card-title">Add Product</h4>
                      <p className="nandi-action-card-description">
                        Add new product to your inventory.
                      </p>
                    </div>
                    <div className="nandi-action-card-arrow">→</div>
                  </Link>

                  <Link
                    to="/ca-report"
                    className="nandi-dashboard-action-card nandi-action-purple"
                  >
                    <div className="nandi-action-card-icon">📊</div>
                    <div className="nandi-action-card-content">
                      <h4 className="nandi-action-card-title">CA Reports</h4>
                      <p className="nandi-action-card-description">
                        Generate reports for your chartered accountant.
                      </p>
                    </div>
                    <div className="nandi-action-card-arrow">→</div>
                  </Link>
                </div>
              </section>

              {/* SUMMARY / TIPS */}
              <section className="nandi-dashboard-summary-section">
                <h2 className="nandi-dashboard-section-title">
                  <span className="nandi-section-icon">💡</span>
                  Getting Started
                </h2>

                <div className="nandi-dashboard-summary-grid">
                  <div className="nandi-dashboard-summary-card">
                    <h4 className="nandi-summary-card-title">🚀 Quick Start Guide</h4>
                    <ul className="nandi-summary-card-list">
                      <li>Add your first customer to start invoicing</li>
                      <li>Set up your product catalog with GST details</li>
                      <li>Create your first sales invoice</li>
                      <li>Add suppliers for purchase tracking</li>
                      <li>Generate reports for your CA</li>
                    </ul>
                  </div>

                  <div className="nandi-dashboard-summary-card">
                    <h4 className="nandi-summary-card-title">📈 Best Practices</h4>
                    <ul className="nandi-summary-card-list">
                      <li>Update customer and product details regularly</li>
                      <li>Use GST-compliant invoices for smooth filing</li>
                      <li>Track both sales and purchases monthly</li>
                      <li>Generate reports to understand profit & growth</li>
                      <li>Keep your inventory updated for accurate tracking</li>
                    </ul>
                  </div>
                </div>
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;