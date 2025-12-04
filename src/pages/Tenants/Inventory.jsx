import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Inventory.css";
import {
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiAlertTriangle,
  FiDownload,
  FiUpload,
  FiSearch,
  FiPlus,
  FiFilter,
  FiDollarSign,
  FiBarChart2,
  FiGrid,
  FiShoppingBag,
  FiArchive,
  FiPercent,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMenu,
  FiX,
  FiRefreshCw,
  FiChevronRight
} from "react-icons/fi";

function Inventory() {

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");

  // 🔥 DO NOT SET true by default — prevents hydration overlay flash
  const [loading, setLoading] = useState(false);

  const [reports, setReports] = useState({
    lowStock: [],
    topProducts: [],
    gstSummary: {},
    stockStats: {}
  });

  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Responsive Sidebar
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setSidebarOpen(width >= 992);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Initial Load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      window.location.href = "/login";
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    loadProducts();
  }, []);

  // Apply Filters & Sorting
  useEffect(() => {
    if (!products.length) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    if (search.trim()) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.hsn?.toString().includes(search)
      );
    }

    switch (stockFilter) {
      case "low":
        filtered = filtered.filter(p => p.availableStock <= 10 && p.availableStock > 0);
        break;
      case "out":
        filtered = filtered.filter(p => p.availableStock === 0);
        break;
      case "in":
        filtered = filtered.filter(p => p.availableStock > 10);
        break;
      default:
        break;
    }

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "stock":
        filtered.sort((a, b) => (b.availableStock || 0) - (a.availableStock || 0));
        break;
      case "value":
        filtered.sort(
          (a, b) =>
            ((b.price || 0) * (b.availableStock || 0)) -
            ((a.price || 0) * (a.availableStock || 0))
        );
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, search, stockFilter, sortBy]);

  // Load Products from API
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/products");
      const list = data.data || [];
      setProducts(list);
      loadDashboardReports(list);
    } catch (err) {
      console.error("Product load error:", err);
      alert("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Inventory Analytics
  const loadDashboardReports = useCallback((productsData) => {
    try {
      const lowStock = productsData
        .filter(p => (p.availableStock || 0) <= 10 && (p.availableStock || 0) > 0)
        .slice(0, 10);

      const topProducts = [...productsData]
        .sort(
          (a, b) =>
            ((b.price || 0) * (b.availableStock || 0)) -
            ((a.price || 0) * (a.availableStock || 0))
        )
        .slice(0, 10);

      const gstSummary = {
        totalCGST: productsData.reduce((sum, p) => sum + getGstSplit(p).cgst, 0),
        totalSGST: productsData.reduce((sum, p) => sum + getGstSplit(p).sgst, 0),
        totalIGST: productsData.reduce((sum, p) => sum + getGstSplit(p).igst, 0),
      };

      const stockStats = {
        totalProducts: productsData.length,
        totalStock: productsData.reduce(
          (sum, p) => sum + (parseInt(p.currentStock) || 0),
          0
        ),
        availableStock: productsData.reduce(
          (sum, p) => sum + (parseInt(p.availableStock) || 0),
          0
        ),
        outOfStock: productsData.filter(p => (p.availableStock || 0) === 0).length,
        lowStock: productsData.filter(
          p => (p.availableStock || 0) > 0 && (p.availableStock || 0) <= 10
        ).length,
        inStock: productsData.filter(
          p => (p.availableStock || 0) > 10
        ).length,
        soldStock: productsData.reduce(
          (sum, p) => sum + ((p.currentStock || 0) - (p.availableStock || 0)),
          0
        ),
      };

      setReports({
        lowStock,
        topProducts,
        gstSummary,
        stockStats
      });

    } catch (err) {
      console.error("Dashboard report error:", err);
    }
  }, []);

  // GST Calculator
  const getGstSplit = useCallback((product) => {
    const price = parseFloat(product.price) || 0;
    const qty = parseInt(product.availableStock) || 0;
    const gstRate = parseFloat(product.gstRate) || 0;

    const amount = price * qty;
    const gstAmount = (amount * gstRate) / 100;

    let cgst = gstAmount / 2;
    let sgst = gstAmount / 2;
    let igst = 0;

    if (product.isInterState) {
      igst = gstAmount;
      cgst = 0;
      sgst = 0;
    }

    return { cgst, sgst, igst };
  }, []);

  // Upload CSV
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Only CSV file allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const { data } = await api.post("/products/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(data.message || "Uploaded successfully!");
      loadProducts();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload CSV.");
    } finally {
      e.target.value = "";
      setLoading(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!products.length) return alert("No products to export.");

    const headers = ["Product", "HSN", "Rate", "Stock", "Available", "GST", "Value"];

    const rows = products.map(p => [
      p.name || "",
      p.hsn || "",
      p.price || 0,
      p.currentStock || 0,
      p.availableStock || 0,
      p.gstRate || 0,
      ((p.price || 0) * (p.availableStock || 0)).toFixed(2),
    ]);

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await api.delete(`/products/${id}`);
      alert("Product deleted successfully.");
      loadProducts();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete product.");
    }
  };

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  }, []);

  const getStockStatus = useCallback((stock) => {
    if (stock === 0) return { text: "Out of Stock", class: "stock-out" };
    if (stock <= 10) return { text: "Low Stock", class: "stock-low" };
    return { text: "In Stock", class: "stock-in" };
  }, []);
  return (
    <div className="corporate-inventory-container">

      {/* 🔥 Overlay only if loading === true */}
      {loading === true && (
        <div className="corporate-loading-overlay" style={{ display: "flex" }}>
          <div className="corporate-loading-spinner"></div>
          <p>Loading inventory data...</p>
        </div>
      )}

      {/* Sidebar Overlay */}
      <div
        className={`corporate-sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`corporate-sidebar ${sidebarOpen ? "active" : ""}`}>
        <Sidebar />
      </aside>

      {/* Main */}
      <main className="corporate-inventory-main">

        {/* Mobile Header */}
        <header className="corporate-mobile-header">
          <button className="corporate-mobile-menu-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <div className="corporate-mobile-title">
            <FiPackage size={20} />
            <span>Inventory</span>
          </div>

          <div className="corporate-mobile-actions">
            <button className="corporate-refresh-btn" onClick={loadProducts} disabled={loading}>
              <FiRefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="corporate-inventory-header">
          <div className="corporate-header-content">

            <div className="corporate-header-left">
              <h1 className="corporate-header-title">
                <FiPackage className="corporate-header-icon" />
                Inventory Management
              </h1>
              <p className="corporate-header-subtitle">
                Real-time stock insights and inventory analytics
              </p>
            </div>

            <div className="corporate-header-right">
              <button
                className="corporate-header-btn corporate-btn-secondary"
                onClick={loadProducts}
                disabled={loading}
              >
                <FiRefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="corporate-inventory-content">

          {/* Top Action Bar */}
          <div className="corporate-action-bar">
            <div className="corporate-action-group">
              <Link to="/create-purchase-invoice" className="corporate-btn corporate-btn-primary">
                <FiPlus size={16} />
                Create Purchase
              </Link>

              <label className="corporate-file-upload">
                <input type="file" accept=".csv" onChange={handleFileUpload} disabled={loading} />
                <FiUpload size={16} />
                Upload CSV
              </label>

              <button
                className="corporate-btn corporate-btn-success"
                onClick={exportCSV}
                disabled={loading || products.length === 0}
              >
                <FiDownload size={16} />
                Export CSV
              </button>

              <Link to="/add-product" className="corporate-btn corporate-btn-info">
                <FiPlus size={16} />
                Add Product
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="corporate-filter-bar">

            <div className="corporate-search-box">
              <FiSearch className="corporate-search-icon" />
              <input
                type="text"
                className="corporate-search-input"
                placeholder="Search products by name or HSN code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="corporate-filter-group">

              <div className="corporate-filter-select">
                <FiFilter size={16} />
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="all">All Stock</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              <div className="corporate-filter-select">
                <FiTrendingUp size={16} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  disabled={loading}
                >
                  <option value="name">Sort by Name</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="value">Sort by Value</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="corporate-view-toggle">

                <button
                  className={`corporate-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  disabled={loading}
                >
                  <FiGrid size={18} />
                </button>

                <button
                  className={`corporate-view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  disabled={loading}
                >
                  <FiArchive size={18} />
                </button>

              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="corporate-metrics-grid">

            <div className="corporate-metric-card corporate-metric-primary">
              <div className="corporate-metric-icon">
                <FiPackage size={24} />
              </div>
              <div className="corporate-metric-content">
                <h3 className="corporate-metric-value">{reports.stockStats.totalProducts || 0}</h3>
                <p className="corporate-metric-label">Total Products</p>
              </div>
            </div>

            <div className="corporate-metric-card corporate-metric-success">
              <div className="corporate-metric-icon">
                <FiShoppingBag size={24} />
              </div>
              <div className="corporate-metric-content">
                <h3 className="corporate-metric-value">{reports.stockStats.availableStock || 0}</h3>
                <p className="corporate-metric-label">Available Stock</p>
              </div>
            </div>

            <div className="corporate-metric-card corporate-metric-warning">
              <div className="corporate-metric-icon">
                <FiAlertTriangle size={24} />
              </div>
              <div className="corporate-metric-content">
                <h3 className="corporate-metric-value">{reports.stockStats.lowStock || 0}</h3>
                <p className="corporate-metric-label">Low Stock Items</p>
              </div>
            </div>

            <div className="corporate-metric-card corporate-metric-danger">
              <div className="corporate-metric-icon">
                <FiTrendingDown size={24} />
              </div>
              <div className="corporate-metric-content">
                <h3 className="corporate-metric-value">{reports.stockStats.outOfStock || 0}</h3>
                <p className="corporate-metric-label">Out of Stock</p>
              </div>
            </div>

            <div className="corporate-metric-card corporate-metric-purple">
              <div className="corporate-metric-icon">
                <FiDollarSign size={24} />
              </div>
              <div className="corporate-metric-content">
                <h3 className="corporate-metric-value">
                  {formatCurrency(
                    products.reduce(
                      (sum, p) => sum + ((p.price || 0) * (p.availableStock || 0)),
                      0
                    )
                  )}
                </h3>
                <p className="corporate-metric-label">Stock Value</p>
              </div>
            </div>
          </div>

          {/* Reports */}
          <div className="corporate-reports-section">

            <div className="corporate-section-header">
              <h2 className="corporate-section-title">
                <FiBarChart2 className="corporate-section-icon" />
                Inventory Analytics
              </h2>
            </div>

            <div className="corporate-reports-grid">

              {/* Low Stock */}
              <div className="corporate-report-card corporate-report-alert">
                <div className="corporate-report-header">
                  <h3 className="corporate-report-title">
                    <FiAlertTriangle className="corporate-report-icon" />
                    Low Stock Alerts
                  </h3>
                  <span className="corporate-report-badge">
                    {reports.lowStock.length}
                  </span>
                </div>

                <div className="corporate-report-content">
                  {reports.lowStock.length === 0 ? (
                    <p className="corporate-report-empty">
                      No items in low stock
                    </p>
                  ) : (
                    reports.lowStock.map((p) => (
                      <div className="corporate-report-item" key={p._id}>

                        <div className="corporate-report-item-info">
                          <span className="corporate-report-item-name">{p.name}</span>
                          <span className="corporate-report-item-hsn">HSN: {p.hsn}</span>
                        </div>

                        <div className="corporate-report-item-stock">
                          <span className="corporate-stock-badge stock-low">
                            {p.availableStock || 0} units
                          </span>

                          <button className="corporate-action-btn">
                            <FiChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="corporate-report-footer">
                  <Link to="/low-stock" className="corporate-report-link">
                    View all low stock items
                  </Link>
                </div>
              </div>

              {/* Top Products */}
              <div className="corporate-report-card corporate-report-success">
                <div className="corporate-report-header">
                  <h3 className="corporate-report-title">
                    <FiTrendingUp className="corporate-report-icon" />
                    Top Products by Value
                  </h3>
                </div>

                <div className="corporate-report-content">
                  {reports.topProducts.length === 0 ? (
                    <p className="corporate-report-empty">No products available</p>
                  ) : (
                    reports.topProducts.map((p, i) => {
                      const stockStatus = getStockStatus(p.availableStock);

                      return (
                        <div className="corporate-report-item" key={p._id}>
                          <div className="corporate-report-item-rank">
                            <span className="corporate-rank-badge">#{i + 1}</span>
                          </div>

                          <div className="corporate-report-item-info">
                            <span className="corporate-report-item-name">{p.name}</span>
                            <span className="corporate-report-item-value">
                              Value: {formatCurrency((p.price || 0) * (p.availableStock || 0))}
                            </span>
                          </div>

                          <div className="corporate-report-item-stock">
                            <span className={`corporate-stock-badge ${stockStatus.class}`}>
                              {p.availableStock || 0} units
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* GST Summary */}
              <div className="corporate-report-card corporate-report-info">
                <div className="corporate-report-header">
                  <h3 className="corporate-report-title">
                    <FiPercent className="corporate-report-icon" />
                    GST Summary
                  </h3>
                </div>

                <div className="corporate-report-content">
                  <div className="corporate-gst-summary">
                    <div className="corporate-gst-item">
                      <span className="corporate-gst-label">Total CGST</span>
                      <span className="corporate-gst-value">
                        {formatCurrency(reports.gstSummary.totalCGST || 0)}
                      </span>
                    </div>

                    <div className="corporate-gst-item">
                      <span className="corporate-gst-label">Total SGST</span>
                      <span className="corporate-gst-value">
                        {formatCurrency(reports.gstSummary.totalSGST || 0)}
                      </span>
                    </div>

                    <div className="corporate-gst-item">
                      <span className="corporate-gst-label">Total IGST</span>
                      <span className="corporate-gst-value">
                        {formatCurrency(reports.gstSummary.totalIGST || 0)}
                      </span>
                    </div>

                    <div className="corporate-gst-total">
                      <span className="corporate-gst-label">Total GST Liability</span>
                      <span className="corporate-gst-value">
                        {formatCurrency(
                          (reports.gstSummary.totalCGST || 0) +
                          (reports.gstSummary.totalSGST || 0) +
                          (reports.gstSummary.totalIGST || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="corporate-report-footer">
                  <Link to="/gst-reports" className="corporate-report-link">
                    View detailed GST reports
                  </Link>
                </div>
              </div>

              {/* Stock Distribution */}
              <div className="corporate-report-card corporate-report-dark">
                <div className="corporate-report-header">
                  <h3 className="corporate-report-title">
                    <FiGrid className="corporate-report-icon" />
                    Stock Distribution
                  </h3>
                </div>

                <div className="corporate-report-content">
                  <div className="corporate-stock-distribution">

                    <div className="corporate-distribution-item">
                      <div className="corporate-distribution-bar corporate-bar-in">
                        <div
                          className="corporate-bar-fill"
                          style={{
                            width: `${(
                              ((reports.stockStats.inStock || 0) /
                                (reports.stockStats.totalProducts || 1)) *
                              100
                            ).toFixed(1)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="corporate-distribution-info">
                        <span className="corporate-distribution-label">In Stock</span>
                        <span className="corporate-distribution-value">
                          {reports.stockStats.inStock || 0} items
                        </span>
                      </div>
                    </div>

                    <div className="corporate-distribution-item">
                      <div className="corporate-distribution-bar corporate-bar-low">
                        <div
                          className="corporate-bar-fill"
                          style={{
                            width: `${(
                              ((reports.stockStats.lowStock || 0) /
                                (reports.stockStats.totalProducts || 1)) *
                              100
                            ).toFixed(1)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="corporate-distribution-info">
                        <span className="corporate-distribution-label">Low Stock</span>
                        <span className="corporate-distribution-value">
                          {reports.stockStats.lowStock || 0} items
                        </span>
                      </div>
                    </div>

                    <div className="corporate-distribution-item">
                      <div className="corporate-distribution-bar corporate-bar-out">
                        <div
                          className="corporate-bar-fill"
                          style={{
                            width: `${(
                              ((reports.stockStats.outOfStock || 0) /
                                (reports.stockStats.totalProducts || 1)) *
                              100
                            ).toFixed(1)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="corporate-distribution-info">
                        <span className="corporate-distribution-label">Out of Stock</span>
                        <span className="corporate-distribution-value">
                          {reports.stockStats.outOfStock || 0} items
                        </span>
                      </div>
                    </div>

                    <div className="corporate-distribution-total">
                      <span className="corporate-distribution-label">Total Products</span>
                      <span className="corporate-distribution-value">
                        {reports.stockStats.totalProducts || 0} items
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PRODUCTS SECTION */}
          <div className="corporate-products-section">

            <div className="corporate-section-header">
              <h2 className="corporate-section-title">
                <FiShoppingCart className="corporate-section-icon" />
                Product Inventory
                <span className="corporate-section-badge">
                  {filteredProducts.length} items
                </span>
              </h2>
              <p className="corporate-section-subtitle">
                Showing {filteredProducts.length} of {products.length}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="corporate-empty-state">
                <FiPackage size={48} />
                <h3>No products found</h3>
                <p>Add your first product or upload a CSV file</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="corporate-empty-state">
                <FiSearch size={48} />
                <h3>No matching products</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="corporate-products-grid">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.availableStock);
                  const totalValue =
                    (product.price || 0) * (product.availableStock || 0);

                  return (
                    <div className="corporate-product-card" key={product._id}>
                      <div className="corporate-product-header">

                        <div className="corporate-product-badge">
                          <span
                            className={`corporate-stock-status ${stockStatus.class}`}
                          >
                            {stockStatus.text}
                          </span>
                        </div>

                        <div className="corporate-product-actions">
                          <button className="corporate-action-icon-btn" title="View">
                            <FiEye size={14} />
                          </button>

                          <button className="corporate-action-icon-btn" title="Edit">
                            <FiEdit size={14} />
                          </button>

                          <button
                            className="corporate-action-icon-btn corporate-danger"
                            title="Delete"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="corporate-product-content">
                        <h3 className="corporate-product-name">
                          {product.name}
                        </h3>

                        <p className="corporate-product-hsn">HSN: {product.hsn}</p>

                        <div className="corporate-product-details">

                          <div className="corporate-product-detail">
                            <span className="corporate-detail-label">Rate</span>
                            <span className="corporate-detail-value">
                              {formatCurrency(product.price)}
                            </span>
                          </div>

                          <div className="corporate-product-detail">
                            <span className="corporate-detail-label">Stock</span>
                            <span className="corporate-detail-value">
                              {product.availableStock || 0} units
                            </span>
                          </div>

                          <div className="corporate-product-detail">
                            <span className="corporate-detail-label">GST</span>
                            <span className="corporate-detail-value">
                              {product.gstRate || 0}%
                            </span>
                          </div>
                        </div>

                        <div className="corporate-product-value">
                          <span className="corporate-value-label">Total Value</span>
                          <span className="corporate-value-amount">
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                      </div>

                      <div className="corporate-product-footer">
                        <button className="corporate-btn corporate-btn-sm corporate-btn-outline">
                          Quick Order
                        </button>

                        <button className="corporate-btn corporate-btn-sm corporate-btn-primary">
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="corporate-products-table-container">
                <table className="corporate-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>HSN</th>
                      <th>Rate</th>
                      <th>Stock</th>
                      <th>GST</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.availableStock);
                      const totalValue =
                        (product.price || 0) * (product.availableStock || 0);

                      return (
                        <tr key={product._id}>

                          <td>
                            <div className="corporate-table-product">
                              <div className="corporate-table-product-name">
                                {product.name}
                              </div>
                            </div>
                          </td>

                          <td>{product.hsn}</td>

                          <td>{formatCurrency(product.price)}</td>

                          <td>
                            <div className="corporate-table-stock">
                              <span>{product.availableStock || 0}</span>
                              <small>/ {product.currentStock || 0}</small>
                            </div>
                          </td>

                          <td>{product.gstRate || 0}%</td>

                          <td>{formatCurrency(totalValue)}</td>

                          <td>
                            <span
                              className={`corporate-status-badge ${stockStatus.class}`}
                            >
                              {stockStatus.text}
                            </span>
                          </td>

                          <td>
                            <div className="corporate-table-actions">
                              <button className="corporate-action-icon-btn" title="View">
                                <FiEye size={14} />
                              </button>

                              <button className="corporate-action-icon-btn" title="Edit">
                                <FiEdit size={14} />
                              </button>

                              <button
                                className="corporate-action-icon-btn corporate-danger"
                                title="Delete"
                                onClick={() => handleDeleteProduct(product._id)}
                              >
                                <FiTrash2 size={14} />
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
        </div>
      </main>
    </div>
  );
}

export default Inventory;
