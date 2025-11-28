// src/pages/MainAdmin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState({
    // Tenant stats
    tenants: 0,
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

    // Email / reminder stats
    expiryEmailsSent: 0,
    renewalRemindersSent: 0,
    autoCronNotificationsSent: 0,

    // Revenue
    revenue: 0,
  });

  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    try {
      const { data } = await api.get("/admin/overview", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      setStats({
        // Tenant stats
        tenants: data?.tenants ?? 0,
        activeTenants: data?.activeTenants ?? 0,
        expiredTenants: data?.expiredTenants ?? 0,
        newTenantsToday: data?.newTenantsToday ?? 0,
        newTenantsThisMonth: data?.newTenantsThisMonth ?? 0,

        // Subscription stats
        activePlans: data?.activePlans ?? 0,
        expiredPlans: data?.expiredPlans ?? 0,
        trialUsers: data?.trialUsers ?? 0,
        planUpgradeCount: data?.planUpgradeCount ?? 0,
        planCancellationCount: data?.planCancellationCount ?? 0,

        // Email & reminder stats
        expiryEmailsSent: data?.expiryEmailsSent ?? 0,
        renewalRemindersSent: data?.renewalRemindersSent ?? 0,
        autoCronNotificationsSent: data?.autoCronNotificationsSent ?? 0,

        // Revenue
        revenue: data?.revenue ?? 0,
      });
    } catch (err) {
      console.error("Admin dashboard error:", err);
      alert("Failed to load admin stats. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
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
          {loading ? (
            <div className="admin-loader-wrapper">
              <div className="admin-loader" />
              <p>Loading admin data...</p>
            </div>
          ) : (
            <>
              {/* ====== TOP SUMMARY STRIP ====== */}
              <section className="admin-section">
                <div className="admin-summary-strip">
                  <div className="admin-summary-item">
                    <div className="admin-summary-icon">🏢</div>
                    <div className="admin-summary-content">
                      <div className="admin-summary-label">Total Tenants</div>
                      <div className="admin-summary-value">
                        {stats.tenants}
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
                        ₹{Number(stats.revenue).toLocaleString()}
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
                    <div className="admin-card-value">{stats.tenants}</div>
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

              {/* ====== C. Revenue & Notifications ====== */}
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
                            ₹{Number(stats.revenue).toLocaleString()}
                          </div>
                          <p className="admin-card-hint">
                            Sum of all confirmed payments across tenants
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/admin/revenue"
                      className="admin-link-btn primary"
                    >
                      📈 View Revenue Reports
                    </Link>
                  </div>

                  {/* Email & Reminder Stats */}
                  <div className="admin-right-column">
                    <div className="admin-section-header small">
                      <h3 className="admin-section-title-sm">
                        📧 Email & Reminder Activity
                      </h3>
                      <p className="admin-section-subtitle-sm">
                        Auto communication handled by the system
                      </p>
                    </div>

                    <div className="admin-card-grid small-grid">
                      <div className="nandi-admin-card compact">
                        <div className="admin-card-icon small">📨</div>
                        <div className="admin-card-content">
                          <div className="admin-card-label">
                            Expiry Emails Sent
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
                            Auto-Cron Notifications
                          </div>
                          <div className="admin-card-value">
                            {stats.autoCronNotificationsSent}
                          </div>
                        </div>
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
                    <span className="action-text">View Tenants</span>
                  </Link>
                  <Link className="admin-link-btn" to="/admin/plans">
                    <span className="action-icon">💳</span>
                    <span className="action-text">Manage Plans</span>
                  </Link>
                  <Link className="admin-link-btn" to="/admin/revenue">
                    <span className="action-icon">📈</span>
                    <span className="action-text">View Revenue</span>
                  </Link>
                  <Link className="admin-link-btn" to="/admin/settings">
                    <span className="action-icon">⚙️</span>
                    <span className="action-text">Admin Settings</span>
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