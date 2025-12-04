import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminRevenue.css";

// Icons as components for better control
const DashboardIcon = () => <span>📊</span>;
const RevenueIcon = () => <span>💰</span>;
const SubscriptionIcon = () => <span>📈</span>;
const TenantIcon = () => <span>👥</span>;
const ExportIcon = () => <span>📤</span>;
const InvoiceIcon = () => <span>🧾</span>;
const RenewIcon = () => <span>🔄</span>;
const BackIcon = () => <span>←</span>;
const RefreshIcon = () => <span>↻</span>;
const GrowthIcon = () => <span>📈</span>;
const CalendarIcon = () => <span>📅</span>;
const CheckIcon = () => <span>✅</span>;
const ClockIcon = () => <span>⏰</span>;
const BuildingIcon = () => <span>🏢</span>;
const ChartIcon = () => <span>📊</span>;
const DownloadIcon = () => <span>⬇️</span>;
const EmailIcon = () => <span>✉️</span>;
const SettingsIcon = () => <span>⚙️</span>;

function AdminRevenue() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    revenueGrowth: 0,
    activeSubscriptions: 0,
    expiringNextWeek: 0,
    tenantCount: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    failedPayments: 0,
    averageRevenuePerUser: 0,
    churnRate: 0,
  });

  const [revenueDetails, setRevenueDetails] = useState({
    paymentDetails: [],
    revenueByPlan: [],
    monthlyTrend: []
  });

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("monthly");
  const [isMobile, setIsMobile] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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
      setLoading(true);
      console.log("🔄 Fetching revenue data...");
      
      const response = await api.get("/admin/revenue");
      
      if (response.data.success) {
        console.log("✅ Revenue data loaded:", response.data);
        setStats(response.data);
      } else {
        console.error("❌ Failed to load revenue data:", response.data);
        alert("Failed to fetch revenue data");
      }
    } catch (err) {
      console.error("❌ Revenue load error:", err);
      alert(err.response?.data?.message || "Failed to fetch revenue data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueDetails = async (period = "monthly") => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/admin/revenue/details?period=${period}`);
      
      if (response.data.success) {
        setRevenueDetails({
          paymentDetails: response.data.paymentDetails || [],
          revenueByPlan: response.data.revenueByPlan || [],
          monthlyTrend: response.data.monthlyTrend || []
        });
      }
    } catch (err) {
      console.error("❌ Revenue details error:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    fetchRevenueDetails("monthly");
  }, []);

  useEffect(() => {
    fetchRevenueDetails(timeRange);
  }, [timeRange]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${Number(value).toFixed(1)}%`;
  };

  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      const response = await api.get('/admin/revenue/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert("Report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      alert("Export feature will be implemented soon!");
    } finally {
      setExportLoading(false);
    }
  };

  const handleSendInvoices = async () => {
    if (window.confirm("Send reminder invoices to all pending payments?")) {
      try {
        const response = await api.post('/admin/invoices/send-reminders');
        if (response.data.success) {
          alert(`${response.data.count} invoices sent successfully!`);
        }
      } catch (err) {
        alert("Invoice sending feature will be implemented soon!");
      }
    }
  };

  const handleRenewSubscriptions = () => {
    navigate("/admin/tenants");
  };

  const handleViewAnalytics = () => {
    navigate("/admin/analytics");
  };

  // Generate sample trend data for demonstration
  const generateMonthlyTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 1000000) + 500000,
      subscriptions: Math.floor(Math.random() * 50) + 20
    }));
  };

  return (
    <div className="nandi-admin-layout">
      <AdminSidebar />

      <main className="nandi-admin-main">
        {/* Enhanced Header */}
        <header className="admin-revenue-header">
          <div className="admin-revenue-header-content">
            <div className="admin-revenue-header-left">
              <div className="admin-breadcrumb">
                <span>Admin Dashboard</span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-active">Revenue Management</span>
              </div>
              <div className="header-title-section">
                <h1 className="admin-title">
                  <RevenueIcon /> Revenue Dashboard
                </h1>
                <p className="admin-subtitle">
                  Real-time financial insights and subscription analytics
                </p>
              </div>
            </div>
            <div className="admin-revenue-header-right">
              <div className="header-controls">
                <div className="time-filter-wrapper">
                  <span className="time-filter-label">Period:</span>
                  <select 
                    className="time-filter-select"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    disabled={detailsLoading}
                  >
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="quarterly">This Quarter</option>
                    <option value="yearly">This Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <button
                  className="admin-control-btn refresh-btn"
                  onClick={fetchRevenueData}
                  disabled={loading}
                  title="Refresh Data"
                >
                  <RefreshIcon />
                  {!isMobile && <span>Refresh</span>}
                </button>
                <button
                  className="admin-control-btn back-btn"
                  onClick={() => navigate("/admin/dashboard")}
                  title="Back to Dashboard"
                >
                  <BackIcon />
                  {!isMobile && <span>Dashboard</span>}
                </button>
              </div>
            </div>
          </div>
          
          {/* Stats Quick Overview in Header */}
          <div className="header-quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-label">Monthly Revenue</span>
              <span className="quick-stat-value">{formatCurrency(stats.monthlyRevenue)}</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Active Subs</span>
              <span className="quick-stat-value">{stats.activeSubscriptions}</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Growth</span>
              <span className={`quick-stat-value ${stats.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(stats.revenueGrowth)}
              </span>
            </div>
          </div>
        </header>

        <div className="admin-revenue-content">
          {loading ? (
            <div className="admin-revenue-loader">
              <div className="loader-spinner"></div>
              <p>Loading revenue data...</p>
              <p className="loader-subtext">Please wait while we fetch the latest statistics</p>
            </div>
          ) : (
            <>
              {/* Key Metrics Cards */}
              <section className="key-metrics-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <DashboardIcon /> Key Performance Indicators
                  </h2>
                  <p className="section-subtitle">
                    Overview of your financial performance and subscription health
                  </p>
                </div>

                <div className="metrics-grid">
                  {/* Total Revenue Card */}
                  <div className="metric-card primary-gradient">
                    <div className="metric-card-inner">
                      <div className="metric-icon-wrapper">
                        <RevenueIcon />
                      </div>
                      <div className="metric-content">
                        <div className="metric-header">
                          <span className="metric-title">Total Revenue</span>
                          <span className={`metric-trend ${stats.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                            <GrowthIcon /> {formatPercentage(stats.revenueGrowth)}
                          </span>
                        </div>
                        <div className="metric-value">{formatCurrency(stats.totalRevenue)}</div>
                        <div className="metric-description">Lifetime collected revenue</div>
                        <div className="metric-extra">
                          <span className="extra-item">
                            <span className="extra-label">This Month:</span>
                            <span className="extra-value">{formatCurrency(stats.monthlyRevenue)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Subscriptions Card */}
                  <div className="metric-card success-gradient">
                    <div className="metric-card-inner">
                      <div className="metric-icon-wrapper">
                        <SubscriptionIcon />
                      </div>
                      <div className="metric-content">
                        <div className="metric-header">
                          <span className="metric-title">Active Subscriptions</span>
                          <span className="metric-trend neutral">
                            <CheckIcon /> Active
                          </span>
                        </div>
                        <div className="metric-value">{stats.activeSubscriptions}</div>
                        <div className="metric-description">Currently active plans</div>
                        <div className="metric-extra">
                          <span className="extra-item">
                            <span className="extra-label">Expiring Soon:</span>
                            <span className="extra-value warning">{stats.expiringNextWeek}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Revenue Card */}
                  <div className="metric-card info-gradient">
                    <div className="metric-card-inner">
                      <div className="metric-icon-wrapper">
                        <CalendarIcon />
                      </div>
                      <div className="metric-content">
                        <div className="metric-header">
                          <span className="metric-title">Monthly Revenue</span>
                          <span className="metric-trend positive">
                            <CalendarIcon /> Current
                          </span>
                        </div>
                        <div className="metric-value">{formatCurrency(stats.monthlyRevenue)}</div>
                        <div className="metric-description">Revenue this month</div>
                        <div className="metric-extra">
                          <span className="extra-item">
                            <span className="extra-label">Yearly:</span>
                            <span className="extra-value">{formatCurrency(stats.yearlyRevenue)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tenant Overview Card */}
                  <div className="metric-card purple-gradient">
                    <div className="metric-card-inner">
                      <div className="metric-icon-wrapper">
                        <TenantIcon />
                      </div>
                      <div className="metric-content">
                        <div className="metric-header">
                          <span className="metric-title">Tenant Overview</span>
                          <span className="metric-trend neutral">
                            <BuildingIcon /> Total
                          </span>
                        </div>
                        <div className="metric-value">{stats.tenantCount}</div>
                        <div className="metric-description">Active organizations</div>
                        <div className="metric-extra">
                          <span className="extra-item">
                            <span className="extra-label">ARPU:</span>
                            <span className="extra-value">{formatCurrency(stats.averageRevenuePerUser || stats.totalRevenue / stats.tenantCount || 0)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Revenue Analytics & Charts */}
              <section className="analytics-section">
                <div className="analytics-grid">
                  {/* Revenue Breakdown */}
                  <div className="analytics-card main-card">
                    <div className="analytics-card-header">
                      <h3 className="analytics-card-title">
                        <ChartIcon /> Revenue Breakdown
                      </h3>
                      <div className="time-range-badge">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</div>
                    </div>
                    <div className="analytics-card-content">
                      <div className="revenue-breakdown-chart">
                        {revenueDetails.revenueByPlan.length > 0 ? (
                          <div className="plan-distribution">
                            {revenueDetails.revenueByPlan.map((plan, index) => (
                              <div key={index} className="plan-distribution-item">
                                <div className="plan-info">
                                  <span className="plan-name">{plan._id || 'Unknown Plan'}</span>
                                  <span className="plan-percentage">
                                    {((plan.totalRevenue / stats.totalRevenue) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="plan-bar">
                                  <div 
                                    className="plan-bar-fill"
                                    style={{
                                      width: `${(plan.totalRevenue / stats.totalRevenue) * 100}%`,
                                      backgroundColor: `hsl(${index * 60}, 70%, 60%)`
                                    }}
                                  ></div>
                                </div>
                                <div className="plan-details">
                                  <span className="plan-revenue">{formatCurrency(plan.totalRevenue)}</span>
                                  <span className="plan-count">{plan.paymentCount} payments</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-chart">
                            <ChartIcon />
                            <p>No revenue data available for the selected period</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="revenue-summary-stats">
                        <div className="summary-stat">
                          <div className="summary-label">Total Invoices</div>
                          <div className="summary-value">{stats.totalInvoices}</div>
                        </div>
                        <div className="summary-stat">
                          <div className="summary-label">Pending Payments</div>
                          <div className="summary-value warning">{stats.pendingPayments}</div>
                        </div>
                        <div className="summary-stat">
                          <div className="summary-label">Failed Payments</div>
                          <div className="summary-value danger">{stats.failedPayments}</div>
                        </div>
                        <div className="summary-stat">
                          <div className="summary-label">Success Rate</div>
                          <div className="summary-value success">
                            {stats.totalInvoices > 0 
                              ? `${(((stats.totalInvoices - stats.failedPayments) / stats.totalInvoices) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Trend */}
                  <div className="analytics-card trend-card">
                    <div className="analytics-card-header">
                      <h3 className="analytics-card-title">📈 Monthly Trend</h3>
                      <div className="trend-badge">Last 6 Months</div>
                    </div>
                    <div className="analytics-card-content">
                      <div className="trend-chart">
                        {generateMonthlyTrend().map((month, index) => (
                          <div key={index} className="trend-month">
                            <div className="trend-month-label">{month.month}</div>
                            <div className="trend-bars">
                              <div 
                                className="trend-bar revenue-bar"
                                style={{ height: `${(month.revenue / 1500000) * 100}%` }}
                                title={`Revenue: ${formatCurrency(month.revenue)}`}
                              >
                                <div className="bar-tooltip">{formatCurrency(month.revenue)}</div>
                              </div>
                              <div 
                                className="trend-bar subscription-bar"
                                style={{ height: `${(month.subscriptions / 80) * 100}%` }}
                                title={`Subscriptions: ${month.subscriptions}`}
                              >
                                <div className="bar-tooltip">{month.subscriptions} subs</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="trend-legend">
                        <div className="legend-item">
                          <div className="legend-color revenue"></div>
                          <span>Revenue</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color subscription"></div>
                          <span>Subscriptions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Transactions */}
              <section className="transactions-section">
                <div className="section-header">
                  <h2 className="section-title">💳 Recent Transactions</h2>
                  <p className="section-subtitle">
                    Latest payment activities and subscription updates
                  </p>
                </div>
                <div className="transactions-table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Tenant</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueDetails.paymentDetails.slice(0, 8).map((payment, index) => (
                        <tr key={index} className={`transaction-row ${payment.status}`}>
                          <td>
                            <div className="tenant-cell">
                              <div className="tenant-avatar">
                                {payment.tenantId?.name?.charAt(0) || 'T'}
                              </div>
                              <div className="tenant-info">
                                <div className="tenant-name">
                                  {payment.tenantId?.name || 'Unknown Tenant'}
                                </div>
                                <div className="tenant-email">
                                  {payment.tenantId?.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="plan-cell">
                            <span className="plan-badge">{payment.planType || 'Basic'}</span>
                          </td>
                          <td className="amount-cell">
                            <span className="amount-value">{formatCurrency(payment.amount)}</span>
                          </td>
                          <td className="date-cell">
                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td>
                            <span className={`status-badge ${payment.status}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="action-btn view-btn"
                                onClick={() => console.log('View invoice:', payment._id)}
                                title="View Invoice"
                              >
                                👁️
                              </button>
                              <button 
                                className="action-btn download-btn"
                                onClick={() => console.log('Download invoice:', payment._id)}
                                title="Download"
                              >
                                <DownloadIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {revenueDetails.paymentDetails.length === 0 && (
                    <div className="empty-transactions">
                      <p>No transactions found for the selected period</p>
                    </div>
                  )}
                </div>
                {revenueDetails.paymentDetails.length > 8 && (
                  <div className="view-all-wrapper">
                    <button 
                      className="view-all-btn"
                      onClick={() => navigate("/admin/transactions")}
                    >
                      View All Transactions →
                    </button>
                  </div>
                )}
              </section>

              {/* Quick Actions & Tools */}
              <section className="tools-section">
                <div className="section-header">
                  <h2 className="section-title">⚡ Revenue Tools</h2>
                  <p className="section-subtitle">
                    Manage your revenue operations efficiently
                  </p>
                </div>
                <div className="tools-grid">
                  <div className="tool-card export-tool">
                    <div className="tool-icon">
                      <ExportIcon />
                    </div>
                    <h4 className="tool-title">Export Reports</h4>
                    <p className="tool-description">
                      Generate detailed PDF/Excel reports for any time period
                    </p>
                    <button 
                      className="tool-action-btn"
                      onClick={handleExportReport}
                      disabled={exportLoading}
                    >
                      {exportLoading ? 'Exporting...' : 'Export Report'}
                    </button>
                  </div>

                  <div className="tool-card invoice-tool">
                    <div className="tool-icon">
                      <InvoiceIcon />
                    </div>
                    <h4 className="tool-title">Invoice Management</h4>
                    <p className="tool-description">
                      Send, track, and manage invoices and payment reminders
                    </p>
                    <button 
                      className="tool-action-btn"
                      onClick={handleSendInvoices}
                    >
                      Send Invoices
                    </button>
                  </div>

                  <div className="tool-card subscription-tool">
                    <div className="tool-icon">
                      <RenewIcon />
                    </div>
                    <h4 className="tool-title">Subscription Renewals</h4>
                    <p className="tool-description">
                      Manage upcoming renewals and subscription changes
                    </p>
                    <button 
                      className="tool-action-btn"
                      onClick={handleRenewSubscriptions}
                    >
                      Manage Renewals
                    </button>
                  </div>

                  <div className="tool-card analytics-tool">
                    <div className="tool-icon">
                      <SettingsIcon />
                    </div>
                    <h4 className="tool-title">Advanced Analytics</h4>
                    <p className="tool-description">
                      Deep dive into revenue trends and forecasting
                    </p>
                    <button 
                      className="tool-action-btn"
                      onClick={handleViewAnalytics}
                    >
                      View Analytics
                    </button>
                  </div>
                </div>
              </section>

              {/* Performance Insights */}
              <section className="insights-section">
                <div className="insights-grid">
                  <div className="insight-card performance-insight">
                    <h3 className="insight-title">📊 Performance Insights</h3>
                    <div className="insight-content">
                      <div className="insight-item">
                        <span className="insight-label">Monthly Growth Rate</span>
                        <span className={`insight-value ${stats.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                          {formatPercentage(stats.revenueGrowth)}
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Avg Revenue Per User</span>
                        <span className="insight-value">
                          {formatCurrency(stats.averageRevenuePerUser || stats.totalRevenue / stats.tenantCount || 0)}
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Payment Success Rate</span>
                        <span className="insight-value success">
                          {stats.totalInvoices > 0 
                            ? `${(((stats.totalInvoices - stats.failedPayments) / stats.totalInvoices) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="insight-card upcoming-renewals">
                    <h3 className="insight-title">⏰ Upcoming Renewals</h3>
                    <div className="insight-content">
                      {stats.expiringNextWeek > 0 ? (
                        <>
                          <div className="renewal-alert warning">
                            <span className="alert-icon">⚠️</span>
                            <span className="alert-text">
                              {stats.expiringNextWeek} subscription{stats.expiringNextWeek !== 1 ? 's' : ''} expiring in next 7 days
                            </span>
                          </div>
                          <button 
                            className="renewal-action-btn"
                            onClick={handleRenewSubscriptions}
                          >
                            Review Renewals
                          </button>
                        </>
                      ) : (
                        <div className="renewal-alert success">
                          <span className="alert-icon">✅</span>
                          <span className="alert-text">
                            No subscriptions expiring in the next week
                          </span>
                        </div>
                      )}
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