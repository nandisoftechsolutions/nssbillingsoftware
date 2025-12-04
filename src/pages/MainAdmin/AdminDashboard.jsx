import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState({
    // Tenant stats
    totalTenants: 0,
    activeTenants: 0,
    expiredTenants: 0,
    newTenantsToday: 0,
    newTenantsThisMonth: 0,

    // Subscription stats
    activePlans: 0,
    expiredPlans: 0,
    trialUsers: 0,
    planUpgradeCount: 0,
    planCancellationCount: 0,

    // Revenue & Invoices
    totalRevenue: 0,
    totalInvoices: 0,

    // Plan stats
    totalPlans: 0,
    activePlansCount: 0,

    // Email stats
    expiryEmailsSent: 0,
    renewalRemindersSent: 0,
    autoCronNotificationsSent: 0,

    // Recent activities data
    recentTenants: [],
    recentPayments: []
  });

  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("⚠️ Please login as Admin to continue.");
      navigate("/admin/login");
    } else {
      loadStats();
    }
  }, [navigate]);

  const loadStats = async () => {
    setLoading(true);
    setHasError(false);
    setErrorMessage("");
    
    try {
      console.log("🔄 Loading admin overview stats...");
      
      const response = await api.get("/admin/overview");
      
      if (response.data.success) {
        console.log("✅ Admin stats loaded successfully:", response.data);
        
        // Generate recent activities from available data
        const recentTenants = generateRecentActivities(response.data);
        
        setStats({
          // Tenant stats
          totalTenants: response.data?.totalTenants ?? 0,
          activeTenants: response.data?.activeTenants ?? 0,
          expiredTenants: response.data?.expiredTenants ?? 0,
          newTenantsToday: response.data?.newTenantsToday ?? 0,
          newTenantsThisMonth: response.data?.newTenantsThisMonth ?? 0,

          // Subscription stats
          activePlans: response.data?.activePlans ?? 0,
          expiredPlans: response.data?.expiredPlans ?? 0,
          trialUsers: response.data?.trialUsers ?? 0,
          planUpgradeCount: response.data?.planUpgradeCount ?? 0,
          planCancellationCount: response.data?.planCancellationCount ?? 0,

          // Revenue & Invoices
          totalRevenue: response.data?.totalRevenue ?? 0,
          totalInvoices: response.data?.totalInvoices ?? 0,

          // Plan stats
          totalPlans: response.data?.totalPlans ?? 0,
          activePlansCount: response.data?.activePlansCount ?? 0,

          // Email stats
          expiryEmailsSent: response.data?.expiryEmailsSent ?? 0,
          renewalRemindersSent: response.data?.renewalRemindersSent ?? 0,
          autoCronNotificationsSent: response.data?.autoCronNotificationsSent ?? 0,

          // Recent activities
          recentTenants: recentTenants,
          recentPayments: []
        });
      } else {
        console.error("❌ Failed to load admin stats:", response.data);
        throw new Error(response.data?.message || "Failed to load admin statistics");
      }
    } catch (err) {
      console.error("❌ Admin dashboard error:", err);
      
      // Set error state
      setHasError(true);
      setErrorMessage(
        err.response?.data?.message || 
        err.message || 
        "Database connection failed. Showing demo data."
      );
      
      // Load demo data when API fails
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  // Load demo data when API is unavailable
  const loadDemoData = () => {
    console.log("📊 Loading demo data...");
    
    const demoStats = {
      // Tenant stats
      totalTenants: 24,
      activeTenants: 18,
      expiredTenants: 6,
      newTenantsToday: 2,
      newTenantsThisMonth: 8,

      // Subscription stats
      activePlans: 15,
      expiredPlans: 3,
      trialUsers: 5,
      planUpgradeCount: 7,
      planCancellationCount: 2,

      // Revenue & Invoices
      totalRevenue: 125000,
      totalInvoices: 45,

      // Plan stats
      totalPlans: 4,
      activePlansCount: 3,

      // Email stats
      expiryEmailsSent: 12,
      renewalRemindersSent: 8,
      autoCronNotificationsSent: 25,

      // Recent activities
      recentTenants: [
        {
          name: "Tech Solutions Inc",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'active'
        },
        {
          name: "Global Enterprises",
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'trial'
        },
        {
          name: "StartUp Innovations",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'active'
        },
        {
          name: "2 New Tenants Today",
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'new'
        },
        {
          name: "7 Plan Upgrades",
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'upgraded'
        }
      ],
      recentPayments: []
    };
    
    setStats(demoStats);
  };

  // Generate recent activities based on available data
  const generateRecentActivities = (data) => {
    const activities = [];
    
    // Add new tenants today
    if (data.newTenantsToday > 0) {
      activities.push({
        name: `${data.newTenantsToday} New Tenant${data.newTenantsToday > 1 ? 's' : ''} Today`,
        createdAt: new Date().toISOString(),
        subscriptionStatus: 'new'
      });
    }
    
    // Add plan upgrades
    if (data.planUpgradeCount > 0) {
      activities.push({
        name: `${data.planUpgradeCount} Plan Upgrade${data.planUpgradeCount > 1 ? 's' : ''}`,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'upgraded'
      });
    }
    
    // Add trial users
    if (data.trialUsers > 0) {
      activities.push({
        name: `${data.trialUsers} Active Trial${data.trialUsers > 1 ? 's' : ''}`,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'trial'
      });
    }
    
    // Add expired tenants reminder
    if (data.expiredTenants > 0) {
      activities.push({
        name: `${data.expiredTenants} Subscription${data.expiredTenants > 1 ? 's' : ''} Expired`,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'expired'
      });
    }
    
    // If no activities from data, add some generic ones
    if (activities.length === 0) {
      activities.push(
        {
          name: "System Initialized",
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'system'
        },
        {
          name: "Welcome to Admin Dashboard",
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          subscriptionStatus: 'info'
        }
      );
    }
    
    return activities.slice(0, 5); // Return max 5 activities
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const refreshData = () => {
    loadStats();
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
      case 'upgraded':
        return 'active';
      case 'trial':
        return 'trial';
      case 'expired':
        return 'expired';
      case 'new':
        return 'new';
      case 'system':
      case 'info':
        return 'info';
      default:
        return 'pending';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'upgraded': return 'Upgraded';
      case 'trial': return 'Trial';
      case 'expired': return 'Expired';
      case 'new': return 'New';
      case 'system': return 'System';
      case 'info': return 'Info';
      default: return 'Pending';
    }
  };

  // Get activity icon
  const getActivityIcon = (status) => {
    switch (status) {
      case 'active':
      case 'upgraded': return '✅';
      case 'trial': return '🟡';
      case 'expired': return '⏰';
      case 'new': return '🆕';
      case 'system': return '⚙️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  return (
    <div className="nandi-admin-layout">
      <AdminSidebar />

      <main className="nandi-admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-left">
              <div className="admin-breadcrumb">Admin / Overview</div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Monitor tenants, subscriptions and revenue in one clean view.
              </p>
            </div>
            <div className="admin-header-right">
              <div className="admin-date-chip">📅 {todayLabel}</div>
              <button
                className="admin-refresh-btn"
                onClick={refreshData}
                disabled={loading}
              >
                {loading ? "⏳" : "🔄"} {!isMobile && (loading ? 'Loading...' : 'Refresh')}
              </button>
              <button
                className="admin-logout-btn"
                type="button"
                onClick={handleLogout}
              >
                {!isMobile && <span>Logout</span>}
                <span className="logout-icon">🚪</span>
              </button>
            </div>
          </div>
        </header>

        <div className="admin-content-wrapper">
          {/* Error Banner */}
          {hasError && (
            <div className="admin-error-banner">
              <div className="error-banner-content">
                <span className="error-icon">⚠️</span>
                <div className="error-message">
                  <strong>Connection Issue:</strong> {errorMessage}
                </div>
                <button 
                  className="error-retry-btn"
                  onClick={refreshData}
                  disabled={loading}
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="admin-loader-wrapper">
              <div className="admin-loader" />
              <p>Loading admin data...</p>
            </div>
          ) : (
            <>
              {/* Demo Data Notice */}
              {hasError && (
                <div className="demo-data-notice">
                  <span className="demo-icon">📊</span>
                  <span>Showing demo data. Real data will appear when database connection is restored.</span>
                </div>
              )}

              {/* ====== TOP SUMMARY STRIP ====== */}
              <section className="admin-section">
                <div className="admin-summary-strip">
                  <div className="admin-summary-item">
                    <div className="admin-summary-icon">🏢</div>
                    <div className="admin-summary-content">
                      <div className="admin-summary-label">Total Tenants</div>
                      <div className="admin-summary-value">
                        {stats.totalTenants}
                      </div>
                    </div>
                  </div>
                  <div className="admin-summary-item">
                    <div className="admin-summary-icon">✅</div>
                    <div className="admin-summary-content">
                      <div className="admin-summary-label">Active Tenants</div>
                      <div className="admin-summary-value accent">
                        {stats.activeTenants}
                      </div>
                    </div>
                  </div>
                  <div className="admin-summary-item">
                    <div className="admin-summary-icon">💳</div>
                    <div className="admin-summary-content">
                      <div className="admin-summary-label">Active Plans</div>
                      <div className="admin-summary-value">
                        {stats.activePlans}
                      </div>
                    </div>
                  </div>
                  <div className="admin-summary-item">
                    <div className="admin-summary-icon">💰</div>
                    <div className="admin-summary-content">
                      <div className="admin-summary-label">Total Revenue</div>
                      <div className="admin-summary-value money">
                        ₹{Number(stats.totalRevenue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ====== A. Tenant Stats ====== */}
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">👥 Tenant Overview</h2>
                  <p className="admin-section-subtitle">
                    Track total tenants, active users and growth this month.
                  </p>
                </div>

                <div className="admin-card-grid">
                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-yellow">Total</div>
                    <div className="admin-card-icon">🏢</div>
                    <div className="admin-card-label">Total Tenants</div>
                    <div className="admin-card-value">{stats.totalTenants}</div>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-green">Active</div>
                    <div className="admin-card-icon">✅</div>
                    <div className="admin-card-label">Active Tenants</div>
                    <div className="admin-card-value">{stats.activeTenants}</div>
                    <p className="admin-card-hint">
                      Tenants with active subscription
                    </p>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-red">Expired</div>
                    <div className="admin-card-icon">⏰</div>
                    <div className="admin-card-label">Expired Tenants</div>
                    <div className="admin-card-value">
                      {stats.expiredTenants}
                    </div>
                    <p className="admin-card-hint">
                      Accounts that require renewal
                    </p>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-blue">Today</div>
                    <div className="admin-card-icon">🆕</div>
                    <div className="admin-card-label">New Today</div>
                    <div className="admin-card-value">
                      {stats.newTenantsToday}
                    </div>
                    <p className="admin-card-hint">
                      Registered on {todayLabel}
                    </p>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-info">This Month</div>
                    <div className="admin-card-icon">📈</div>
                    <div className="admin-card-label">New This Month</div>
                    <div className="admin-card-value">
                      {stats.newTenantsThisMonth}
                    </div>
                    <p className="admin-card-hint">
                      Monthly growth rate
                    </p>
                  </div>
                </div>
              </section>

              {/* ====== B. Subscription Stats ====== */}
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">
                    💳 Subscription & Plans
                  </h2>
                  <p className="admin-section-subtitle">
                    Keep an eye on plan usage, upgrades and cancellations.
                  </p>
                </div>

                <div className="admin-card-grid">
                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-green">Live</div>
                    <div className="admin-card-icon">🔵</div>
                    <div className="admin-card-label">Active Plans</div>
                    <div className="admin-card-value">{stats.activePlans}</div>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-red">Ended</div>
                    <div className="admin-card-icon">🔴</div>
                    <div className="admin-card-label">Expired Plans</div>
                    <div className="admin-card-value">
                      {stats.expiredPlans}
                    </div>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-yellow">Trial</div>
                    <div className="admin-card-icon">🟡</div>
                    <div className="admin-card-label">Trial Users</div>
                    <div className="admin-card-value">{stats.trialUsers}</div>
                    <p className="admin-card-hint">
                      Users on trial period
                    </p>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-blue">Upgrade</div>
                    <div className="admin-card-icon">⬆️</div>
                    <div className="admin-card-label">Plan Upgrades</div>
                    <div className="admin-card-value">
                      {stats.planUpgradeCount}
                    </div>
                    <p className="admin-card-hint">
                      Total upgrades done
                    </p>
                  </div>

                  <div className="nandi-admin-card">
                    <div className="admin-card-badge badge-grey">Cancelled</div>
                    <div className="admin-card-icon">❌</div>
                    <div className="admin-card-label">
                      Plan Cancellations
                    </div>
                    <div className="admin-card-value">
                      {stats.planCancellationCount}
                    </div>
                  </div>
                </div>
              </section>

              {/* ====== C. Revenue & System Stats ====== */}
              <section className="admin-section">
                <div className="admin-two-column">
                  {/* Revenue Card */}
                  <div className="nandi-admin-card admin-revenue-card">
                    <div className="admin-card-header-row">
                      <div className="admin-revenue-content">
                        <div className="admin-card-icon large">💰</div>
                        <div>
                          <div className="admin-card-label">Total Revenue</div>
                          <div className="admin-card-value money-big">
                            ₹{Number(stats.totalRevenue).toLocaleString()}
                          </div>
                          <p className="admin-card-hint">
                            Sum of all confirmed payments across tenants
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="admin-revenue-stats">
                      <div className="revenue-stat">
                        <span className="stat-label">Total Invoices:</span>
                        <span className="stat-value">{stats.totalInvoices}</span>
                      </div>
                      <div className="revenue-stat">
                        <span className="stat-label">Available Plans:</span>
                        <span className="stat-value">{stats.activePlansCount}/{stats.totalPlans}</span>
                      </div>
                    </div>
                    <Link
                      to="/admin/revenue"
                      className="admin-link-btn primary"
                    >
                      📈 View Revenue Reports
                    </Link>
                  </div>

                  {/* System Activity */}
                  <div className="admin-right-column">
                    <div className="admin-section-header small">
                      <h3 className="admin-section-title-sm">
                        📊 System Activity
                      </h3>
                      <p className="admin-section-subtitle-sm">
                        Platform performance and notifications
                      </p>
                    </div>

                    <div className="admin-card-grid small-grid">
                      <div className="nandi-admin-card compact">
                        <div className="admin-card-icon small">📨</div>
                        <div className="admin-card-content">
                          <div className="admin-card-label">
                            Expiry Emails
                          </div>
                          <div className="admin-card-value">
                            {stats.expiryEmailsSent}
                          </div>
                        </div>
                      </div>

                      <div className="nandi-admin-card compact">
                        <div className="admin-card-icon small">🔔</div>
                        <div className="admin-card-content">
                          <div className="admin-card-label">
                            Renewal Reminders
                          </div>
                          <div className="admin-card-value">
                            {stats.renewalRemindersSent}
                          </div>
                        </div>
                      </div>

                      <div className="nandi-admin-card compact">
                        <div className="admin-card-icon small">🤖</div>
                        <div className="admin-card-content">
                          <div className="admin-card-label">
                            Auto Notifications
                          </div>
                          <div className="admin-card-value">
                            {stats.autoCronNotificationsSent}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="nandi-admin-card activities-card">
                      <div className="admin-card-header">
                        <h4>🕒 Recent Activities</h4>
                        <button 
                          className="refresh-small"
                          onClick={refreshData}
                          disabled={loading}
                          title="Refresh data"
                        >
                          {loading ? "⏳" : "🔄"}
                        </button>
                      </div>
                      <div className="activities-list">
                        {stats.recentTenants.length === 0 ? (
                          <div className="no-activities">
                            <div className="no-activities-icon">📊</div>
                            <p>No recent activities</p>
                          </div>
                        ) : (
                          stats.recentTenants.map((activity, index) => (
                            <div key={index} className="activity-item">
                              <div className="activity-icon">
                                {getActivityIcon(activity.subscriptionStatus)}
                              </div>
                              <div className="activity-details">
                                <div className="activity-title">
                                  {activity.name}
                                </div>
                                <div className="activity-time">
                                  {new Date(activity.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className={`activity-status ${getStatusClass(activity.subscriptionStatus)}`}>
                                {getStatusText(activity.subscriptionStatus)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ====== Quick Actions ====== */}
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">⚡ Quick Actions</h2>
                  <p className="admin-section-subtitle">
                    Jump directly to the most important admin screens
                  </p>
                </div>

                <div className="admin-quick-actions">
                  <Link className="admin-link-btn" to="/admin/tenants">
                    <span className="action-icon">👥</span>
                    <span className="action-text">Manage Tenants</span>
                  </Link>
                  <Link className="admin-link-btn" to="/admin/plans">
                    <span className="action-icon">💳</span>
                    <span className="action-text">Manage Plans</span>
                  </Link>
                  <Link className="admin-link-btn" to="/manageadmin">
                    <span className="action-icon">👨‍💼</span>
                    <span className="action-text">Manage Admins</span>
                  </Link>
                  <Link className="admin-link-btn" to="/admin/settings">
                    <span className="action-icon">⚙️</span>
                    <span className="action-text">System Settings</span>
                  </Link>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;