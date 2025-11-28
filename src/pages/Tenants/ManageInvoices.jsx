import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./ManageInvoices.css";

function ManageInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = useNavigate();

  // Backend base URL
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:6060";

  // Helper: always use backend PDF endpoint
  const getInvoicePdfUrl = (id) => `${BASE_URL}/api/invoices/${id}/pdf`;

  // Valid status values
  const VALID_STATUSES = {
    DRAFT: "Draft",
    PENDING: "Pending",
    PAID: "Paid",
    OVERDUE: "Overdue",
    CANCELLED: "Cancelled",
  };

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Calculate total items and quantity for an invoice
  const calculateInvoiceTotals = (invoice) => {
    if (!invoice.items || !Array.isArray(invoice.items)) {
      return { totalItems: 0, totalQuantity: 0 };
    }

    const totalItems = invoice.items.length;
    const totalQuantity = invoice.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0),
      0
    );

    return { totalItems, totalQuantity };
  };

  // Get display status with proper formatting
  const getDisplayStatus = (status) => {
    if (!status) return VALID_STATUSES.DRAFT;
    return status;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const actualStatus = getDisplayStatus(status);
    switch (actualStatus) {
      case VALID_STATUSES.PAID:
        return "nandi-status-paid";
      case VALID_STATUSES.PENDING:
        return "nandi-status-pending";
      case VALID_STATUSES.OVERDUE:
        return "nandi-status-overdue";
      case VALID_STATUSES.CANCELLED:
        return "nandi-status-cancelled";
      case VALID_STATUSES.DRAFT:
      default:
        return "nandi-status-draft";
    }
  };

  // Load all invoices
  const loadInvoices = async () => {
    try {
      setRefreshing(true);
      const { data } = await api.get("/invoices");
      if (data?.success) {
        setInvoices(data.data || []);
      } else {
        console.error("Unexpected invoice response:", data);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Actions
  const handleView = (id) => {
    navigate(`/invoice-preview/${id}`);
  };

  const handleEdit = (invoice) => {
    navigate(`/create-invoice?edit=true`, {
      state: {
        invoiceData: invoice,
        isEditing: true,
      },
    });
  };

  const handleDelete = async (inv) => {
    if (!window.confirm(`🗑️ Are you sure you want to delete ${inv.invoiceNo}?`))
      return;
    try {
      await api.delete(`/invoices/${inv._id}`);
      alert("✅ Invoice deleted successfully!");
      setInvoices((prev) => prev.filter((x) => x._id !== inv._id));
    } catch (err) {
      alert("❌ Failed to delete invoice.");
      console.error(err);
    }
  };

  // Status update
  const updateStatus = async (inv, newStatus) => {
    try {
      const validStatus = Object.values(VALID_STATUSES).includes(newStatus)
        ? newStatus
        : VALID_STATUSES.PENDING;

      const response = await api.patch(`/invoices/${inv._id}/status`, {
        status: validStatus,
      });

      if (response.data.success) {
        setInvoices((prev) =>
          prev.map((item) =>
            item._id === inv._id ? { ...item, status: validStatus } : item
          )
        );
        alert(`✅ Invoice status updated to ${validStatus}`);
      } else {
        throw new Error("Failed to update invoice status");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      let errorMessage = "❌ Failed to update invoice status";
      if (err.response?.data?.message) {
        errorMessage += `\n${err.response.data.message}`;
      }
      alert(errorMessage);
    }
  };

  // Filtering
  const filtered = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const matchesSearch =
      inv.customerName?.toLowerCase().includes(term) ||
      inv.invoiceNo?.toLowerCase().includes(term);

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "paid" && inv.status === VALID_STATUSES.PAID) ||
      (selectedStatus === "pending" && inv.status === VALID_STATUSES.PENDING) ||
      (selectedStatus === "overdue" && inv.status === VALID_STATUSES.OVERDUE) ||
      (selectedStatus === "cancelled" && inv.status === VALID_STATUSES.CANCELLED) ||
      (selectedStatus === "draft" && (!inv.status || inv.status === VALID_STATUSES.DRAFT));

    return matchesSearch && matchesStatus;
  });

  // Summary statistics
  const summaryStats = {
    total: invoices.length,
    paid: invoices.filter((inv) => inv.status === VALID_STATUSES.PAID).length,
    pending: invoices.filter((inv) => inv.status === VALID_STATUSES.PENDING).length,
    overdue: invoices.filter((inv) => inv.status === VALID_STATUSES.OVERDUE).length,
    cancelled: invoices.filter((inv) => inv.status === VALID_STATUSES.CANCELLED).length,
    draft: invoices.filter((inv) => !inv.status || inv.status === VALID_STATUSES.DRAFT).length,
    totalAmount: invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0),
    totalItems: invoices.reduce((sum, inv) => {
      const { totalItems } = calculateInvoiceTotals(inv);
      return sum + totalItems;
    }, 0),
    totalQuantity: invoices.reduce((sum, inv) => {
      const { totalQuantity } = calculateInvoiceTotals(inv);
      return sum + totalQuantity;
    }, 0),
  };

  // Mobile Action Handler
  const handleMobileAction = (action, inv) => {
    switch (action) {
      case "view":
        handleView(inv._id);
        break;
      case "edit":
        handleEdit(inv);
        break;
      case "delete":
        handleDelete(inv);
        break;
      default:
        break;
    }
  };

  return (
    <div className="nandi-invoice-manager">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />
      
      {/* Main Content */}
      <div className={`nandi-main-content ${!sidebarOpen ? 'nandi-content-expanded' : ''}`}>
        
        {/* Top Bar */}
        <div className="nandi-topbar">
          <button onClick={toggleSidebar} className="nandi-sidebar-toggle">
            ☰
          </button>
          <div className="nandi-header-content">
            <h1 className="nandi-page-title">Manage Invoices</h1>
            <p className="nandi-page-subtitle">
              Track, filter and control all your invoices in one place.
            </p>
          </div>
          <Link to="/create-invoice" className="nandi-btn nandi-btn-primary nandi-create-btn">
            <span className="nandi-btn-icon">➕</span>
            Create Invoice
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="nandi-summary-grid">
          <div className="nandi-summary-card nandi-card-primary">
            <div className="nandi-summary-content">
              <div className="nandi-summary-icon">📄</div>
              <div className="nandi-summary-text">
                <div className="nandi-summary-value">{summaryStats.total}</div>
                <div className="nandi-summary-label">Total Invoices</div>
              </div>
            </div>
          </div>

          <div className="nandi-summary-card nandi-card-success">
            <div className="nandi-summary-content">
              <div className="nandi-summary-icon">✅</div>
              <div className="nandi-summary-text">
                <div className="nandi-summary-value">{summaryStats.paid}</div>
                <div className="nandi-summary-label">Paid</div>
              </div>
            </div>
          </div>

          <div className="nandi-summary-card nandi-card-warning">
            <div className="nandi-summary-content">
              <div className="nandi-summary-icon">⏳</div>
              <div className="nandi-summary-text">
                <div className="nandi-summary-value">{summaryStats.pending}</div>
                <div className="nandi-summary-label">Pending</div>
              </div>
            </div>
          </div>

          <div className="nandi-summary-card nandi-card-danger">
            <div className="nandi-summary-content">
              <div className="nandi-summary-icon">⚠️</div>
              <div className="nandi-summary-text">
                <div className="nandi-summary-value">{summaryStats.overdue}</div>
                <div className="nandi-summary-label">Overdue</div>
              </div>
            </div>
          </div>

          <div className="nandi-summary-card nandi-card-neutral">
            <div className="nandi-summary-content">
              <div className="nandi-summary-icon">📝</div>
              <div className="nandi-summary-text">
                <div className="nandi-summary-value">{summaryStats.draft}</div>
                <div className="nandi-summary-label">Draft</div>
              </div>
            </div>
          </div>

          <div className="nandi-summary-card nandi-card-info">
            <div className="nandi-summary-content">
              <div className="nandi-summary-icon">💰</div>
              <div className="nandi-summary-text">
                <div className="nandi-summary-value">
                  ₹{summaryStats.totalAmount.toLocaleString()}
                </div>
                <div className="nandi-summary-label">Total Amount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="nandi-info-panel">
          <div className="nandi-info-icon">💡</div>
          <div className="nandi-info-body">
            <h4>Invoice status is for payment tracking only</h4>
            <ul>
              <li>Changing status does not adjust stock or accounting.</li>
              <li>Use "Paid", "Pending", "Overdue" to track payment progress.</li>
              <li>
                "Draft" can be used for invoices you haven't shared with customers yet.
              </li>
            </ul>
          </div>
        </div>

        {/* Filters */}
        <div className="nandi-filter-card">
          <div className="nandi-filter-grid">
            <div className="nandi-filter-group">
              <label className="nandi-filter-label">Search</label>
              <div className="nandi-search-wrapper">
                <span className="nandi-search-icon">🔍</span>
                <input
                  type="text"
                  className="nandi-search-input"
                  placeholder="Customer name or invoice number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="nandi-filter-group">
              <label className="nandi-filter-label">Status</label>
              <div className="nandi-status-controls">
                <select
                  className="nandi-status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="nandi-btn nandi-btn-ghost nandi-refresh-btn"
                  type="button"
                  disabled={refreshing}
                  onClick={loadInvoices}
                  title="Refresh invoices"
                >
                  {refreshing ? "⏳" : "🔄"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        {!isMobile && (
          <div className="nandi-table-card">
            {loading ? (
              <div className="nandi-loader-wrapper">
                <div className="nandi-loader" />
                <p>Loading invoices...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="nandi-empty-state">
                <div className="nandi-empty-icon">🧾</div>
                <p className="nandi-empty-title">No invoices found</p>
                <p className="nandi-empty-subtitle">
                  Try changing filters or create a new invoice.
                </p>
                <Link to="/create-invoice" className="nandi-btn nandi-btn-primary">
                  Create your first invoice
                </Link>
              </div>
            ) : (
              <div className="nandi-table-container">
                <table className="nandi-data-table">
                  <thead>
                    <tr>
                      <th className="nandi-col-index">#</th>
                      <th className="nandi-col-invoice">Invoice</th>
                      <th className="nandi-col-customer">Customer</th>
                      <th className="nandi-col-items">Items</th>
                      <th className="nandi-col-quantity">Qty</th>
                      <th className="nandi-col-amount">Total (₹)</th>
                      <th className="nandi-col-status">Status</th>
                      <th className="nandi-col-date">Created</th>
                      <th className="nandi-col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv, i) => {
                      const { totalItems, totalQuantity } = calculateInvoiceTotals(inv);
                      const currentStatus = getDisplayStatus(inv.status);

                      return (
                        <tr key={inv._id} className="nandi-table-row">
                          <td className="nandi-col-index">{i + 1}</td>
                          <td className="nandi-col-invoice">
                            <span className="nandi-invoice-code">{inv.invoiceNo}</span>
                          </td>
                          <td className="nandi-col-customer">
                            <div className="nandi-customer-name">
                              {inv.customerName || "-"}
                            </div>
                            {inv.customerPhone && (
                              <div className="nandi-customer-phone">
                                📞 {inv.customerPhone}
                              </div>
                            )}
                          </td>
                          <td className="nandi-col-items">
                            <span className="nandi-badge nandi-badge-items">{totalItems}</span>
                          </td>
                          <td className="nandi-col-quantity">
                            <span className="nandi-badge nandi-badge-quantity">{totalQuantity}</span>
                          </td>
                          <td className="nandi-col-amount">
                            ₹{Number(inv.grandTotal || 0).toLocaleString()}
                          </td>
                          <td className="nandi-col-status">
                            <select
                              className={`nandi-status-dropdown ${getStatusBadgeClass(currentStatus)}`}
                              value={currentStatus}
                              onChange={(e) => updateStatus(inv, e.target.value)}
                            >
                              <option value={VALID_STATUSES.DRAFT}>Draft</option>
                              <option value={VALID_STATUSES.PENDING}>Pending</option>
                              <option value={VALID_STATUSES.PAID}>Paid</option>
                              <option value={VALID_STATUSES.OVERDUE}>Overdue</option>
                              <option value={VALID_STATUSES.CANCELLED}>Cancelled</option>
                            </select>
                          </td>
                          <td className="nandi-col-date">
                            <div className="nandi-date-main">
                              {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                            </div>
                            <div className="nandi-date-time">
                              {new Date(inv.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="nandi-col-actions">
                            <div className="nandi-action-buttons">
                              <button
                                className="nandi-btn nandi-btn-icon"
                                title="View"
                                onClick={() => handleView(inv._id)}
                              >
                                👁
                              </button>
                              <button
                                className="nandi-btn nandi-btn-icon"
                                title="Edit"
                                onClick={() => handleEdit(inv)}
                              >
                                ✏
                              </button>
                              <button
                                className="nandi-btn nandi-btn-icon nandi-btn-danger"
                                title="Delete"
                                onClick={() => handleDelete(inv)}
                              >
                                🗑
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
        )}

        {/* Mobile Cards */}
        {isMobile && (
          <div className="nandi-mobile-list">
            {loading ? (
              <div className="nandi-loader-wrapper">
                <div className="nandi-loader" />
                <p>Loading invoices...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="nandi-empty-state">
                <div className="nandi-empty-icon">🧾</div>
                <p className="nandi-empty-title">No invoices found</p>
                <p className="nandi-empty-subtitle">
                  Try changing filters or create a new invoice.
                </p>
                <Link to="/create-invoice" className="nandi-btn nandi-btn-primary">
                  Create your first invoice
                </Link>
              </div>
            ) : (
              filtered.map((inv) => {
                const { totalItems, totalQuantity } = calculateInvoiceTotals(inv);
                const currentStatus = getDisplayStatus(inv.status);

                return (
                  <div key={inv._id} className="nandi-mobile-card">
                    <div className="nandi-mobile-header">
                      <div>
                        <div className="nandi-mobile-invoice">{inv.invoiceNo}</div>
                        <div className="nandi-mobile-customer">{inv.customerName || "-"}</div>
                      </div>
                      <select
                        className={`nandi-mobile-status ${getStatusBadgeClass(currentStatus)}`}
                        value={currentStatus}
                        onChange={(e) => updateStatus(inv, e.target.value)}
                      >
                        <option value={VALID_STATUSES.DRAFT}>Draft</option>
                        <option value={VALID_STATUSES.PENDING}>Pending</option>
                        <option value={VALID_STATUSES.PAID}>Paid</option>
                        <option value={VALID_STATUSES.OVERDUE}>Overdue</option>
                        <option value={VALID_STATUSES.CANCELLED}>Cancelled</option>
                      </select>
                    </div>

                    {inv.customerPhone && (
                      <div className="nandi-mobile-phone">📞 {inv.customerPhone}</div>
                    )}

                    <div className="nandi-mobile-metrics">
                      <div className="nandi-metric">
                        <div className="nandi-metric-label">Items</div>
                        <div className="nandi-metric-value">{totalItems}</div>
                      </div>
                      <div className="nandi-metric">
                        <div className="nandi-metric-label">Qty</div>
                        <div className="nandi-metric-value">{totalQuantity}</div>
                      </div>
                      <div className="nandi-metric">
                        <div className="nandi-metric-label">Total</div>
                        <div className="nandi-metric-value">
                          ₹{Number(inv.grandTotal || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="nandi-mobile-actions">
                      <button
                        className="nandi-btn nandi-mobile-action-btn"
                        onClick={() => handleMobileAction("view", inv)}
                      >
                        👁 View
                      </button>
                      <button
                        className="nandi-btn nandi-mobile-action-btn"
                        onClick={() => handleMobileAction("edit", inv)}
                      >
                        ✏ Edit
                      </button>
                      <button
                        className="nandi-btn nandi-mobile-action-btn nandi-btn-danger"
                        onClick={() => handleMobileAction("delete", inv)}
                      >
                        🗑 Delete
                      </button>
                    </div>

                    <div className="nandi-mobile-date">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN")} •{" "}
                      {new Date(inv.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Summary Footer */}
        {filtered.length > 0 && (
          <div className="nandi-summary-footer">
            <div className="nandi-footer-grid">
              <div className="nandi-footer-item">
                <span className="nandi-footer-label">Total Invoices</span>
                <span className="nandi-footer-value">{filtered.length}</span>
              </div>
              <div className="nandi-footer-item">
                <span className="nandi-footer-label">Total Items</span>
                <span className="nandi-footer-value">
                  {filtered.reduce((sum, inv) => {
                    const { totalItems } = calculateInvoiceTotals(inv);
                    return sum + totalItems;
                  }, 0)}
                </span>
              </div>
              <div className="nandi-footer-item">
                <span className="nandi-footer-label">Total Quantity</span>
                <span className="nandi-footer-value">
                  {filtered.reduce((sum, inv) => {
                    const { totalQuantity } = calculateInvoiceTotals(inv);
                    return sum + totalQuantity;
                  }, 0)}
                </span>
              </div>
              <div className="nandi-footer-item">
                <span className="nandi-footer-label">Total Amount</span>
                <span className="nandi-footer-value">
                  ₹
                  {filtered
                    .reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageInvoices;