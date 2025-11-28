import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Inventory.css";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [reports, setReports] = useState({
    lowStock: [],
    topProducts: [],
    gstSummary: {},
    stockStats: {}
  });
  const [loading, setLoading] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({});
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();

  // ------------------------
  // SIDEBAR RESPONSIVE STATE
  // ------------------------
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);

      if (width >= 992) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const gstRates = [
    { value: 0, label: "0% - Nil Rated" },
    { value: 0.1, label: "0.1% - Special Rate" },
    { value: 0.25, label: "0.25% - Special Rate" },
    { value: 3, label: "3% - GST" },
    { value: 5, label: "5% - GST" },
    { value: 12, label: "12% - GST" },
    { value: 18, label: "18% - GST" },
    { value: 28, label: "28% - GST" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) {
      alert("Please log in first.");
      window.location.href = "/login";
      return;
    }
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setCompanyId(userData.companyId || "");
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/products");
      setProducts(data.data || []);
      loadReports(data.data || []);
    } catch (err) {
      console.error("Error loading products:", err);
      alert("Error loading products: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadReports = (productsData = products) => {
    try {
      const lowStock = productsData.filter(p => p.availableStock <= 10).slice(0, 5);
      const topProducts = [...productsData]
        .sort((a, b) => (b.price * b.availableStock) - (a.price * a.availableStock))
        .slice(0, 5);
      
      const gstSummary = {
        totalCGST: productsData.reduce((sum, p) => {
          const calculated = calculateProductValues(p);
          return sum + calculated.cgst;
        }, 0),
        totalSGST: productsData.reduce((sum, p) => {
          const calculated = calculateProductValues(p);
          return sum + calculated.sgst;
        }, 0),
        totalIGST: productsData.reduce((sum, p) => {
          const calculated = calculateProductValues(p);
          return sum + calculated.igst;
        }, 0),
      };

      const stockStats = {
        totalStock: productsData.reduce((sum, p) => sum + (parseInt(p.currentStock) || 0), 0),
        availableStock: productsData.reduce((sum, p) => sum + (parseInt(p.availableStock) || 0), 0),
        calculatedSoldStock: productsData.reduce((sum, p) => sum + ((parseInt(p.currentStock) || 0) - (parseInt(p.availableStock) || 0)), 0),
        reservedStock: productsData.reduce((sum, p) => sum + ((parseInt(p.currentStock) || 0) - (parseInt(p.availableStock) || 0)), 0),
        outOfStock: productsData.filter(p => p.availableStock === 0).length,
        lowStock: productsData.filter(p => p.availableStock > 0 && p.availableStock <= 10).length,
        inStock: productsData.filter(p => p.availableStock > 10).length,
        totalProducts: productsData.length
      };

      setReports({
        lowStock,
        topProducts,
        gstSummary,
        stockStats
      });
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("Please upload a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const { data } = await api.post("/products/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(data.message || "Products uploaded successfully");
      load();
      e.target.value = "";
    } catch (err) {
      alert("Error uploading products: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setLoading(true);
      await api.delete(`/products/${id}`);
      alert("🗑️ Product deleted successfully");
      load();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) {
      alert("Please select a bulk action");
      return;
    }

    if (selectedProducts.length === 0) {
      alert("Please select products to perform bulk action");
      return;
    }

    if (bulkAction === "delete") {
      if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
      
      try {
        setLoading(true);
        await Promise.all(selectedProducts.map(id => api.delete(`/products/${id}`)));
        alert(`✅ ${selectedProducts.length} products deleted successfully`);
        setSelectedProducts([]);
        setBulkAction("");
        load();
      } catch (err) {
        alert("Failed to delete some products");
      } finally {
        setLoading(false);
      }
    } else if (bulkAction === "export") {
      exportSelectedToCSV(selectedProducts);
    }
  };

  const handleProductSelect = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(productId => productId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filtered.length && filtered.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filtered.map(p => p._id));
    }
  };

  const handleStockUpdateChange = (productId, field, value) => {
    setStockUpdate(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const updateAvailableStock = async (productId) => {
    const updateData = stockUpdate[productId];
    if (!updateData || updateData.availableStock === undefined) {
      alert("Please enter a valid stock quantity");
      return;
    }

    const availableStock = parseInt(updateData.availableStock);
    if (isNaN(availableStock) || availableStock < 0) {
      alert("Please enter a valid positive number for stock");
      return;
    }

    try {
      setLoading(true);
      await api.put(`/products/${productId}`, {
        availableStock: availableStock
      });
      alert("✅ Available stock updated successfully");
      setStockUpdate(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      load();
    } catch (err) {
      console.error("Stock update failed:", err);
      alert("Failed to update stock: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentStock = async (productId) => {
    const updateData = stockUpdate[productId];
    if (!updateData || updateData.currentStock === undefined) {
      alert("Please enter a valid stock quantity");
      return;
    }

    const currentStock = parseInt(updateData.currentStock);
    if (isNaN(currentStock) || currentStock < 0) {
      alert("Please enter a valid positive number for stock");
      return;
    }

    try {
      setLoading(true);
      await api.put(`/products/${productId}`, {
        currentStock: currentStock
      });
      alert("✅ Total stock updated successfully");
      setStockUpdate(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      load();
    } catch (err) {
      console.error("Stock update failed:", err);
      alert("Failed to update stock: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const quickStockAdjustment = async (productId, type) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    let newAvailableStock = product.availableStock;
    let newCurrentStock = product.currentStock;

    if (type === 'increase') {
      newAvailableStock += 1;
      newCurrentStock += 1;
    } else if (type === 'decrease') {
      if (product.availableStock <= 0) {
        alert("Cannot decrease stock below 0");
        return;
      }
      newAvailableStock -= 1;
      newCurrentStock -= 1;
    }

    try {
      setLoading(true);
      await api.put(`/products/${productId}`, {
        availableStock: newAvailableStock,
        currentStock: newCurrentStock
      });
      alert("✅ Stock adjusted successfully");
      load();
    } catch (err) {
      console.error("Stock adjustment failed:", err);
      alert("Failed to adjust stock: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number);
  };

  const calculateProductValues = (product) => {
    const price = parseFloat(product.price) || 0;
    const availableStock = parseInt(product.availableStock) || 0;
    const gstRate = parseFloat(product.gstRate) || 0;
    const gstAmount = parseFloat(product.gstAmount) || 0;
    
    const amount = price * availableStock;
    let totalGst = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (product.gstType === "percentage") {
      totalGst = (amount * gstRate) / 100;
      
      if (product.isInterState) {
        igst = totalGst;
      } else {
        cgst = totalGst / 2;
        sgst = totalGst / 2;
      }
    } else {
      totalGst = gstAmount * availableStock;
      
      if (product.isInterState) {
        igst = totalGst;
      } else {
        cgst = totalGst / 2;
        sgst = totalGst / 2;
      }
    }

    const totalAmount = amount + totalGst;

    return {
      amount: parseFloat(amount.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: parseFloat(igst.toFixed(2)),
      totalGst: parseFloat(totalGst.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  };

  const calculateSoldStock = (product) => {
    return (parseInt(product.currentStock) || 0) - (parseInt(product.availableStock) || 0);
  };

  const filtered = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.hsn || "").toLowerCase().includes(search.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Product", "HSN", "Unit", "Rate", "GST Type", "GST Value", "Total Stock", "Available Stock", "Calculated Sold Stock", "Amount", "CGST", "SGST", "IGST", "Total GST", "Total Amount"];
    const csvData = filtered.map(p => {
      const calculated = calculateProductValues(p);
      const calculatedSold = calculateSoldStock(p);
      return [
        p.name,
        p.hsn,
        p.unit,
        p.price,
        p.gstType,
        p.gstType === "percentage" ? `${p.gstRate}%` : p.gstAmount,
        p.currentStock,
        p.availableStock,
        calculatedSold,
        calculated.amount,
        calculated.cgst,
        calculated.sgst,
        calculated.igst,
        calculated.totalGst,
        calculated.totalAmount
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportSelectedToCSV = (selectedIds) => {
    const selectedProductsData = products.filter(p => selectedIds.includes(p._id));
    const headers = ["Product", "HSN", "Unit", "Rate", "GST Type", "GST Value", "Total Stock", "Available Stock", "Calculated Sold Stock", "Amount", "CGST", "SGST", "IGST", "Total GST", "Total Amount"];
    const csvData = selectedProductsData.map(p => {
      const calculated = calculateProductValues(p);
      const calculatedSold = calculateSoldStock(p);
      return [
        p.name,
        p.hsn,
        p.unit,
        p.price,
        p.gstType,
        p.gstType === "percentage" ? `${p.gstRate}%` : p.gstAmount,
        p.currentStock,
        p.availableStock,
        calculatedSold,
        calculated.amount,
        calculated.cgst,
        calculated.sgst,
        calculated.igst,
        calculated.totalGst,
        calculated.totalAmount
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selected-products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`inventory-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* OVERLAY FOR MOBILE */}
      <div
        className={`inventory-sidebar-overlay ${sidebarOpen ? "inventory-sidebar-overlay-visible" : ""}`}
        onClick={closeSidebar}
      />

      {/* SIDEBAR DRAWER */}
      <div className={`inventory-sidebar-drawer ${sidebarOpen ? "inventory-sidebar-drawer-open" : ""}`}>
        <Sidebar />
      </div>

      {/* MAIN PAGE CONTENT */}
      <div className="inventory-main-content">
        {/* MOBILE TOPBAR */}
        <div className="inventory-topbar">
          <button className="inventory-sidebar-toggle-btn" onClick={toggleSidebar}>
            ☰
          </button>
        </div>

        {/* Header Section */}
        <div className="inventory-header">
          <div className="inventory-header-content">
            <div className="inventory-header-text">
              <h1 className="inventory-page-title">Inventory Management</h1>
              <p className="inventory-page-subtitle">Manage your products, stock levels, and inventory reports</p>
            </div>
            <div className="inventory-header-actions">
              <Link to="/add-product" className="inventory-btn inventory-btn-primary">
                <span className="inventory-btn-icon">📥</span>
                Create Purchase
              </Link>
              <button 
                className="inventory-btn inventory-btn-secondary" 
                onClick={exportToCSV} 
                disabled={loading}
              >
                <span className="inventory-btn-icon">📥</span>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="inventory-loading">
            <div className="inventory-spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="inventory-tabs">
          <button 
            className={`inventory-tab ${activeTab === "products" ? "inventory-tab-active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            📦 Products
          </button>
          <button 
            className={`inventory-tab ${activeTab === "reports" ? "inventory-tab-active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            📊 Reports
          </button>
        </div>

        {/* Summary Cards */}
        {activeTab === "products" && (
          <>
            <div className="inventory-summary-grid">
              <div className="inventory-summary-card">
                <div className="inventory-summary-icon inventory-summary-icon-primary">
                  <span>📦</span>
                </div>
                <div className="inventory-summary-content">
                  <h3 className="inventory-summary-value">{reports.stockStats.totalProducts || products.length}</h3>
                  <p className="inventory-summary-label">Total Products</p>
                </div>
              </div>
              <div className="inventory-summary-card">
                <div className="inventory-summary-icon inventory-summary-icon-success">
                  <span>💰</span>
                </div>
                <div className="inventory-summary-content">
                  <h3 className="inventory-summary-value">
                    ₹{formatCurrency(products.reduce((sum, p) => {
                      const calculated = calculateProductValues(p);
                      return sum + calculated.amount;
                    }, 0))}
                  </h3>
                  <p className="inventory-summary-label">Stock Value</p>
                </div>
              </div>
              <div className="inventory-summary-card">
                <div className="inventory-summary-icon inventory-summary-icon-warning">
                  <span>📊</span>
                </div>
                <div className="inventory-summary-content">
                  <h3 className="inventory-summary-value">
                    {formatNumber(reports.stockStats.totalStock || 0)}
                  </h3>
                  <p className="inventory-summary-label">Total Stock</p>
                </div>
              </div>
              <div className="inventory-summary-card">
                <div className="inventory-summary-icon inventory-summary-icon-info">
                  <span>✅</span>
                </div>
                <div className="inventory-summary-content">
                  <h3 className="inventory-summary-value">
                    {formatNumber(reports.stockStats.availableStock || 0)}
                  </h3>
                  <p className="inventory-summary-label">Available Stock</p>
                </div>
              </div>
              <div className="inventory-summary-card">
                <div className="inventory-summary-icon inventory-summary-icon-danger">
                  <span>⚠️</span>
                </div>
                <div className="inventory-summary-content">
                  <h3 className="inventory-summary-value">
                    {reports.stockStats.lowStock || 0}
                  </h3>
                  <p className="inventory-summary-label">Low Stock Items</p>
                </div>
              </div>
              <div className="inventory-summary-card">
                <div className="inventory-summary-icon inventory-summary-icon-secondary">
                  <span>🧾</span>
                </div>
                <div className="inventory-summary-content">
                  <h3 className="inventory-summary-value">
                    ₹{formatCurrency(products.reduce((sum, p) => {
                      const calculated = calculateProductValues(p);
                      return sum + calculated.totalGst;
                    }, 0))}
                  </h3>
                  <p className="inventory-summary-label">Total GST</p>
                </div>
              </div>
            </div>

            {/* Tools Section */}
            <div className="inventory-tools-section">
              <div className="inventory-tool-card">
                <h3 className="inventory-tool-title">Upload Products</h3>
                <p className="inventory-tool-description">Bulk upload products using CSV file</p>
                <div className="inventory-file-upload-area">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    className="inventory-file-input"
                    id="inventory-file-upload"
                    disabled={loading}
                  />
                  <label htmlFor="inventory-file-upload" className="inventory-file-upload-label">
                    <span className="inventory-upload-icon">📤</span>
                    <span>{loading ? "Uploading..." : "Choose CSV File"}</span>
                  </label>
                </div>
              </div>
              <div className="inventory-tool-card">
                <h3 className="inventory-tool-title">Search Products</h3>
                <p className="inventory-tool-description">Find products by name or HSN code</p>
                <div className="inventory-search-container">
                  <span className="inventory-search-icon">🔍</span>
                  <input
                    className="inventory-search-input"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="inventory-bulk-actions">
                <div className="inventory-bulk-actions-content">
                  <span className="inventory-selected-count">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="inventory-bulk-actions-controls">
                    <select 
                      className="inventory-bulk-action-select"
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Select Action</option>
                      <option value="delete">Delete Selected</option>
                      <option value="export">Export Selected</option>
                    </select>
                    <button 
                      className="inventory-btn inventory-btn-danger"
                      onClick={handleBulkAction}
                      disabled={loading || !bulkAction}
                    >
                      Apply Action
                    </button>
                    <button 
                      className="inventory-btn inventory-btn-outline"
                      onClick={() => setSelectedProducts([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="inventory-table-card">
              <div className="inventory-table-header">
                <div className="inventory-table-title-section">
                  <h2 className="inventory-table-title">Products</h2>
                  <p className="inventory-table-subtitle">
                    Showing {filtered.length} of {products.length} products
                  </p>
                </div>
                <div className="inventory-table-actions">
                  <button 
                    className="inventory-btn inventory-btn-icon"
                    onClick={load}
                    title="Refresh"
                    disabled={loading}
                  >
                    <span className="inventory-btn-icon">🔄</span>
                  </button>
                </div>
              </div>

              <div className="inventory-table-container">
                <table className="inventory-data-table">
                  <thead>
                    <tr>
                      <th className="inventory-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === filtered.length && filtered.length > 0}
                          onChange={handleSelectAll}
                          disabled={loading || filtered.length === 0}
                        />
                      </th>
                      <th>Product</th>
                      <th>HSN</th>
                      <th>Rate</th>
                      <th>GST</th>
                      <th>Total Stock</th>
                      <th>Available</th>
                      <th>Sold</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const calculated = calculateProductValues(p);
                      const calculatedSold = calculateSoldStock(p);
                      const currentStockUpdate = stockUpdate[p._id] || {};
                      const isLowStock = p.availableStock <= 10;
                      const isOutOfStock = p.availableStock === 0;
                      
                      return (
                        <tr key={p._id} className={isOutOfStock ? 'inventory-out-of-stock' : isLowStock ? 'inventory-low-stock' : ''}>
                          <td className="inventory-checkbox-cell">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(p._id)}
                              onChange={() => handleProductSelect(p._id)}
                              disabled={loading}
                            />
                          </td>
                          <td>
                            <div className="inventory-product-info">
                              <div className="inventory-product-name">{p.name}</div>
                              <div className="inventory-product-meta">{p.unit}</div>
                            </div>
                          </td>
                          <td className="inventory-hsn-code">{p.hsn}</td>
                          <td className="inventory-price">₹{formatCurrency(p.price || 0)}</td>
                          <td>
                            <div className="inventory-gst-info">
                              <span className="inventory-gst-type">{p.gstType}</span>
                              <span className="inventory-gst-value">
                                {p.gstType === "percentage" ? `${p.gstRate}%` : `₹${formatCurrency(p.gstAmount || 0)}`}
                              </span>
                            </div>
                          </td>
                          <td className="inventory-stock-cell">
                            <div className="inventory-stock-section">
                              <span className="inventory-stock-value">{p.currentStock}</span>
                              <div className="inventory-stock-update">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Update"
                                  value={currentStockUpdate.currentStock || ""}
                                  onChange={(e) => handleStockUpdateChange(p._id, 'currentStock', e.target.value)}
                                  disabled={loading}
                                  className="inventory-stock-input"
                                />
                                <button
                                  className="inventory-btn inventory-btn-icon inventory-btn-sm"
                                  onClick={() => updateCurrentStock(p._id)}
                                  disabled={loading || !currentStockUpdate.currentStock}
                                >
                                  💾
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="inventory-stock-cell">
                            <div className="inventory-stock-section">
                              <span className={`inventory-stock-value ${isLowStock ? 'inventory-low' : ''} ${isOutOfStock ? 'inventory-out' : ''}`}>
                                {p.availableStock}
                                {isLowStock && !isOutOfStock && " ⚠️"}
                                {isOutOfStock && " ❌"}
                              </span>
                              <div className="inventory-stock-update">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Update"
                                  value={currentStockUpdate.availableStock || ""}
                                  onChange={(e) => handleStockUpdateChange(p._id, 'availableStock', e.target.value)}
                                  disabled={loading}
                                  className="inventory-stock-input"
                                />
                                <button
                                  className="inventory-btn inventory-btn-icon inventory-btn-sm"
                                  onClick={() => updateAvailableStock(p._id)}
                                  disabled={loading || !currentStockUpdate.availableStock}
                                >
                                  💾
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="inventory-sold-stock">
                            <span className="inventory-sold-value" title="Calculated: Total Stock - Available Stock">
                              {calculatedSold}
                            </span>
                          </td>
                          <td className="inventory-value-cell">
                            <div className="inventory-value-info">
                              <div className="inventory-total-amount">₹{formatCurrency(calculated.totalAmount)}</div>
                              <div className="inventory-gst-amount">GST: ₹{formatCurrency(calculated.totalGst)}</div>
                            </div>
                          </td>
                          <td className="inventory-actions-cell">
                            <div className="inventory-action-buttons">
                              <div className="inventory-quick-actions">
                                <button
                                  className="inventory-btn inventory-btn-icon inventory-btn-sm inventory-btn-success"
                                  onClick={() => quickStockAdjustment(p._id, 'increase')}
                                  disabled={loading}
                                  title="Add 1 to Stock"
                                >
                                  +
                                </button>
                                <button
                                  className="inventory-btn inventory-btn-icon inventory-btn-sm inventory-btn-warning"
                                  onClick={() => quickStockAdjustment(p._id, 'decrease')}
                                  disabled={loading || p.availableStock <= 0}
                                  title="Remove 1 from Stock"
                                >
                                  -
                                </button>
                              </div>
                              <div className="inventory-main-actions">
                                <Link
                                  to={`/edit-product/${p._id}`}
                                  className="inventory-btn inventory-btn-icon inventory-btn-sm"
                                  title="Edit Product"
                                >
                                  ✏️
                                </Link>
                                <button
                                  className="inventory-btn inventory-btn-icon inventory-btn-sm inventory-btn-danger"
                                  onClick={() => handleDelete(p._id)}
                                  title="Delete Product"
                                  disabled={loading}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filtered.length === 0 && (
                  <div className="inventory-empty-state">
                    <div className="inventory-empty-icon">📦</div>
                    <h3 className="inventory-empty-title">No products found</h3>
                    <p className="inventory-empty-description">
                      {search ? 'Try changing your search terms' : 'Get started by creating your first purchase'}
                    </p>
                    <div className="inventory-empty-actions">
                      <Link to="/add-product" className="inventory-btn inventory-btn-primary">
                        📥 Create Purchase
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Reports Section */}
        {activeTab === "reports" && (
          <div className="inventory-reports-section">
            <div className="inventory-reports-grid">
              {/* Low Stock Report */}
              <div className="inventory-report-card">
                <div className="inventory-report-header">
                  <h3 className="inventory-report-title">Low Stock Alert</h3>
                  <span className="inventory-report-badge inventory-report-badge-danger">{reports.lowStock.length} items</span>
                </div>
                <div className="inventory-report-content">
                  {reports.lowStock.length > 0 ? (
                    <div className="inventory-report-list">
                      {reports.lowStock.map((product, i) => (
                        <div key={product._id} className="inventory-report-item">
                          <div className="inventory-report-item-info">
                            <span className="inventory-report-item-name">{product.name}</span>
                            <span className="inventory-report-item-stock inventory-low">{product.availableStock} units</span>
                          </div>
                          <div className="inventory-report-item-meta">
                            <span>Reorder needed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="inventory-report-empty">
                      <p>All products have sufficient stock</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Products */}
              <div className="inventory-report-card">
                <div className="inventory-report-header">
                  <h3 className="inventory-report-title">Top Products by Value</h3>
                  <span className="inventory-report-badge">Top 5</span>
                </div>
                <div className="inventory-report-content">
                  {reports.topProducts.length > 0 ? (
                    <div className="inventory-report-list">
                      {reports.topProducts.map((product, i) => {
                        const calculated = calculateProductValues(product);
                        const calculatedSold = calculateSoldStock(product);
                        return (
                          <div key={product._id} className="inventory-report-item">
                            <div className="inventory-report-item-info">
                              <span className="inventory-report-item-rank">#{i + 1}</span>
                              <span className="inventory-report-item-name">{product.name}</span>
                              <span className="inventory-report-item-value">₹{formatCurrency(calculated.totalAmount)}</span>
                            </div>
                            <div className="inventory-report-item-meta">
                              <span>Stock: {product.availableStock} • Sold: {calculatedSold}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="inventory-report-empty">
                      <p>No products available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GST Summary */}
              <div className="inventory-report-card">
                <div className="inventory-report-header">
                  <h3 className="inventory-report-title">GST Summary</h3>
                  <span className="inventory-report-badge">Total</span>
                </div>
                <div className="inventory-report-content">
                  <div className="inventory-gst-summary">
                    <div className="inventory-gst-item">
                      <span className="inventory-gst-label">CGST:</span>
                      <span className="inventory-gst-amount">₹{formatCurrency(reports.gstSummary.totalCGST || 0)}</span>
                    </div>
                    <div className="inventory-gst-item">
                      <span className="inventory-gst-label">SGST:</span>
                      <span className="inventory-gst-amount">₹{formatCurrency(reports.gstSummary.totalSGST || 0)}</span>
                    </div>
                    <div className="inventory-gst-item">
                      <span className="inventory-gst-label">IGST:</span>
                      <span className="inventory-gst-amount">₹{formatCurrency(reports.gstSummary.totalIGST || 0)}</span>
                    </div>
                    <div className="inventory-gst-total">
                      <span className="inventory-gst-label">Total GST:</span>
                      <span className="inventory-gst-amount inventory-total">
                        ₹{formatCurrency(
                          (reports.gstSummary.totalCGST || 0) + 
                          (reports.gstSummary.totalSGST || 0) + 
                          (reports.gstSummary.totalIGST || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Distribution */}
              <div className="inventory-report-card">
                <div className="inventory-report-header">
                  <h3 className="inventory-report-title">Stock Distribution</h3>
                  <span className="inventory-report-badge">Overview</span>
                </div>
                <div className="inventory-report-content">
                  <div className="inventory-stock-distribution">
                    <div className="inventory-distribution-item">
                      <span className="inventory-distribution-label">Out of Stock:</span>
                      <span className="inventory-distribution-count inventory-out">
                        {reports.stockStats.outOfStock || 0}
                      </span>
                    </div>
                    <div className="inventory-distribution-item">
                      <span className="inventory-distribution-label">Low Stock:</span>
                      <span className="inventory-distribution-count inventory-low">
                        {reports.stockStats.lowStock || 0}
                      </span>
                    </div>
                    <div className="inventory-distribution-item">
                      <span className="inventory-distribution-label">In Stock:</span>
                      <span className="inventory-distribution-count inventory-in">
                        {reports.stockStats.inStock || 0}
                      </span>
                    </div>
                    <div className="inventory-distribution-item">
                      <span className="inventory-distribution-label">Sold Stock:</span>
                      <span className="inventory-distribution-count inventory-sold">
                        {formatNumber(reports.stockStats.calculatedSoldStock || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;