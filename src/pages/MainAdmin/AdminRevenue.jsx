import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminRevenue.css";

function AdminRevenue() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    expiringNextWeek: 0,
    tenantCount: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchRevenueData = async () => {
    try {
      const { data } = await api.get("/admin/revenue", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setStats(data);
    } catch (err) {
      console.error("Revenue load error:", err);
      alert("Failed to fetch revenue data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate growth percentage (mock data for demo)
  const calculateGrowth = (current, previous) => {
    if (!previous) return 100;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="nandi-admin-layout">
      <AdminSidebar />

      <main className="nandi-admin-main">
        {/* Header */}
        <header className="admin-revenue-header">
          <div className="admin-revenue-header-content">
            <div className="admin-revenue-header-left">
              <div className="admin-breadcrumb">Admin / Revenue</div>
              <h1 className="admin-title">📈 Revenue Overview</h1>
              <p className="admin-subtitle">
                Track your revenue, subscriptions, and business growth
              </p>
            </div>
            <div className="admin-revenue-header-right">
              <div className="time-filter">
                <select 
                  className="time-filter-select"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="monthly">This Month</option>
                  <option value="yearly">This Year</option>
                  <option value="weekly">This Week</option>
                </select>
              </div>
              <button
                className="admin-back-btn"
                onClick={() => navigate("/admin/dashboard")}
              >
                <span className="back-icon">⬅️</span>
                {!isMobile && <span>Back to Dashboard</span>}
              </button>
            </div>
          </div>
        </header>

        <div className="admin-revenue-content">
          {loading ? (
            <div className="admin-revenue-loader">
              <div className="loader-spinner"></div>
              <p>Loading revenue data...</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <section className="revenue-stats-section">
                <div className="section-header">
                  <h2 className="section-title">💰 Financial Overview</h2>
                  <p className="section-subtitle">
                    Key revenue metrics and subscription insights
                  </p>
                </div>

                <div className="revenue-stats-grid">
                  {/* Total Revenue Card */}
                  <div className="revenue-stat-card primary">
                    <div className="stat-card-header">
                      <div className="stat-icon">💰</div>
                      <div className="stat-trend positive">
                        +{calculateGrowth(stats.totalRevenue, stats.totalRevenue * 0.8)}%
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                      <div className="stat-label">Total Revenue</div>
                      <div className="stat-description">
                        Lifetime revenue from all subscriptions
                      </div>
                    </div>
                  </div>

                  {/* Active Subscriptions Card */}
                  <div className="revenue-stat-card success">
                    <div className="stat-card-header">
                      <div className="stat-icon">✅</div>
                      <div className="stat-trend positive">
                        +{calculateGrowth(stats.activeSubscriptions, stats.activeSubscriptions * 0.9)}%
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">{stats.activeSubscriptions}</div>
                      <div className="stat-label">Active Subscriptions</div>
                      <div className="stat-description">
                        Currently active paid subscriptions
                      </div>
                    </div>
                  </div>

                  {/* Monthly Revenue Card */}
                  <div className="revenue-stat-card info">
                    <div className="stat-card-header">
                      <div className="stat-icon">📅</div>
                      <div className="stat-trend positive">
                        +{calculateGrowth(stats.monthlyRevenue || stats.totalRevenue / 12, (stats.monthlyRevenue || stats.totalRevenue / 12) * 0.85)}%
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">
                        {formatCurrency(stats.monthlyRevenue || stats.totalRevenue / 12)}
                      </div>
                      <div className="stat-label">Monthly Revenue</div>
                      <div className="stat-description">
                        Average monthly recurring revenue
                      </div>
                    </div>
                  </div>

                  {/* Expiring Soon Card */}
                  <div className="revenue-stat-card warning">
                    <div className="stat-card-header">
                      <div className="stat-icon">⏰</div>
                      <div className="stat-trend neutral">
                        {stats.expiringNextWeek > 0 ? 'Action Needed' : 'Stable'}
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">{stats.expiringNextWeek}</div>
                      <div className="stat-label">Expiring Next Week</div>
                      <div className="stat-description">
                        Subscriptions requiring renewal
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detailed Analytics */}
              <section className="revenue-analytics-section">
                <div className="analytics-grid">
                  {/* Revenue Summary */}
                  <div className="analytics-card main-summary">
                    <div className="analytics-card-header">
                      <h3 className="analytics-card-title">💹 Revenue Summary</h3>
                      <div className="revenue-badge all-time">All Time</div>
                    </div>
                    <div className="analytics-card-content">
                      <div className="revenue-breakdown">
                        <div className="revenue-item">
                          <div className="revenue-item-label">Total Revenue</div>
                          <div className="revenue-item-value">
                            {formatCurrency(stats.totalRevenue)}
                          </div>
                        </div>
                        <div className="revenue-item">
                          <div className="revenue-item-label">Monthly Average</div>
                          <div className="revenue-item-value">
                            {formatCurrency(stats.monthlyRevenue || stats.totalRevenue / 12)}
                          </div>
                        </div>
                        <div className="revenue-item">
                          <div className="revenue-item-label">Yearly Projection</div>
                          <div className="revenue-item-value">
                            {formatCurrency(stats.yearlyRevenue || stats.totalRevenue)}
                          </div>
                        </div>
                        <div className="revenue-item highlight">
                          <div className="revenue-item-label">Revenue Growth</div>
                          <div className="revenue-item-value positive">
                            +{stats.revenueGrowth || calculateGrowth(stats.totalRevenue, stats.totalRevenue * 0.8)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Metrics */}
                  <div className="analytics-card subscription-metrics">
                    <div className="analytics-card-header">
                      <h3 className="analytics-card-title">📊 Subscription Metrics</h3>
                      <div className="metrics-badge">Live</div>
                    </div>
                    <div className="analytics-card-content">
                      <div className="metrics-grid">
                        <div className="metric-item">
                          <div className="metric-icon">🏢</div>
                          <div className="metric-content">
                            <div className="metric-value">{stats.tenantCount}</div>
                            <div className="metric-label">Total Tenants</div>
                          </div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-icon">✅</div>
                          <div className="metric-content">
                            <div className="metric-value">{stats.activeSubscriptions}</div>
                            <div className="metric-label">Active Plans</div>
                          </div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-icon">⏰</div>
                          <div className="metric-content">
                            <div className="metric-value">{stats.expiringNextWeek}</div>
                            <div className="metric-label">Expiring Soon</div>
                          </div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-icon">📈</div>
                          <div className="metric-content">
                            <div className="metric-value positive">
                              +{calculateGrowth(stats.activeSubscriptions, stats.activeSubscriptions * 0.9)}%
                            </div>
                            <div className="metric-label">Growth Rate</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="revenue-actions-section">
                <div className="section-header">
                  <h2 className="section-title">⚡ Quick Actions</h2>
                  <p className="section-subtitle">
                    Manage your revenue and subscriptions efficiently
                  </p>
                </div>
                <div className="action-buttons-grid">
                  <button className="action-btn primary">
                    <span className="action-icon">📥</span>
                    <span className="action-text">Export Report</span>
                  </button>
                  <button className="action-btn secondary">
                    <span className="action-icon">📧</span>
                    <span className="action-text">Send Invoices</span>
                  </button>
                  <button className="action-btn success">
                    <span className="action-icon">🔄</span>
                    <span className="action-text">Renew Subscriptions</span>
                  </button>
                  <button 
                    className="action-btn info"
                    onClick={() => navigate("/admin/tenants")}
                  >
                    <span className="action-icon">👥</span>
                    <span className="action-text">Manage Tenants</span>
                  </button>
                </div>
              </section>

              {/* Revenue Chart Placeholder */}
              <section className="revenue-chart-section">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title">📈 Revenue Trend</h3>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color primary"></div>
                        <span>Revenue</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color success"></div>
                        <span>Subscriptions</span>
                      </div>
                    </div>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-message">
                      <div className="chart-icon">📊</div>
                      <h4>Revenue Analytics</h4>
                      <p>Interactive charts and detailed analytics coming soon</p>
                      <button className="btn-outline">View Detailed Reports</button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminRevenue;