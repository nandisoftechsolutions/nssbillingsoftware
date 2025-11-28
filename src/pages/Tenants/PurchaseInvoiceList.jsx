import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./PurchaseInvoiceList.css";

function PurchaseInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalValue: 0,
    thisMonthValue: 0,
    pendingInventory: 0,
    totalItems: 0,
    soldStock: 0,
    availableStock: 0
  });

  useEffect(() => {
    fetchPurchaseInvoices();
  }, [filter, searchTerm]);

  const fetchPurchaseInvoices = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching purchase invoices...");
      
      const { data } = await api.get("/purchases");
      console.log("📦 API Response:", data);
      
      if (data.success) {
        // FIXED: Properly handle the response structure
        let invoicesData = data.data?.purchases || data.data || [];
        console.log("📊 Invoices data:", invoicesData);
        
        // Apply filters
        let filteredInvoices = invoicesData;
        
        // Date filter
        const now = new Date();
        switch (filter) {
          case "today":
            const today = now.toISOString().split('T')[0];
            filteredInvoices = filteredInvoices.filter(inv => 
              inv.invoiceDate && new Date(inv.invoiceDate).toISOString().split('T')[0] === today
            );
            break;
          case "week":
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            filteredInvoices = filteredInvoices.filter(inv => 
              inv.invoiceDate && new Date(inv.invoiceDate) >= weekAgo
            );
            break;
          case "month":
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            filteredInvoices = filteredInvoices.filter(inv => 
              inv.invoiceDate && new Date(inv.invoiceDate) >= monthAgo
            );
            break;
          default:
            break;
        }
        
        // Search filter
        if (searchTerm) {
          filteredInvoices = filteredInvoices.filter(inv =>
            inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.supplierPhone?.includes(searchTerm)
          );
        }
        
        console.log("✅ Filtered invoices:", filteredInvoices.length);
        setInvoices(filteredInvoices);
        
        // Calculate stats with the filtered data
        await calculateStats(filteredInvoices);
      } else {
        console.error("❌ API returned success: false", data.message);
        setInvoices([]);
        await calculateStats([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch purchase invoices:", error);
      alert("Failed to load purchase invoices");
      setInvoices([]);
      await calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (invoicesData) => {
    try {
      console.log("📊 Calculating stats from", invoicesData?.length || 0, "invoices");
      
      // FIXED: Ensure invoicesData is always an array
      const safeInvoicesData = Array.isArray(invoicesData) ? invoicesData : [];
      
      const totalPurchases = safeInvoicesData.length;
      const totalValue = safeInvoicesData.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);
      const totalItems = safeInvoicesData.reduce((sum, inv) => 
        sum + (inv.items?.reduce((itemSum, item) => itemSum + (parseInt(item.qty) || 0), 0) || 0), 0
      );
      const pendingInventory = safeInvoicesData.filter(inv => !inv.inventoryUpdated).length;

      // This month value calculation
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthValue = safeInvoicesData
        .filter(inv => inv.invoiceDate && new Date(inv.invoiceDate) >= thisMonthStart)
        .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);

      // Get stock stats
      const { soldStock, availableStock } = await calculateStockStats();

      const newStats = {
        totalPurchases,
        totalValue,
        thisMonthValue,
        totalItems,
        pendingInventory,
        soldStock,
        availableStock
      };

      console.log("📈 Calculated stats:", newStats);
      setStats(newStats);
    } catch (error) {
      console.error("❌ Error calculating stats:", error);
      // Set default stats on error
      setStats({
        totalPurchases: 0,
        totalValue: 0,
        thisMonthValue: 0,
        totalItems: 0,
        pendingInventory: 0,
        soldStock: 0,
        availableStock: 0
      });
    }
  };

  const calculateStockStats = async () => {
    try {
      console.log("📦 Fetching products for stock stats...");
      const { data: productsData } = await api.get("/products");
      
      if (productsData.success) {
        // FIXED: Handle different response structures
        const products = productsData.data?.products || productsData.data || [];
        
        console.log("📦 Products for stock calculation:", products.length);
        
        const availableStock = products.reduce((sum, product) => 
          sum + (parseInt(product.availableStock) || 0), 0
        );
        
        const soldStock = products.reduce((sum, product) => {
          const currentStock = parseInt(product.currentStock) || 0;
          const available = parseInt(product.availableStock) || 0;
          const calculatedSold = currentStock - available;
          
          if (calculatedSold > 0) {
            console.log(`  ${product.name}: Current=${currentStock}, Available=${available}, Sold=${calculatedSold}`);
          }
          
          return sum + Math.max(0, calculatedSold); 
        }, 0);

        console.log("📦 FINAL Stock Stats:", { 
          soldStock, 
          availableStock, 
          totalProducts: products.length,
          totalCurrentStock: products.reduce((sum, p) => sum + (parseInt(p.currentStock) || 0), 0)
        });
        
        return { soldStock, availableStock };
      }
    } catch (error) {
      console.error("❌ Failed to fetch products for stock stats:", error);
    }
    
    return { soldStock: 0, availableStock: 0 };
  };

  const runStockDiagnostic = async () => {
    try {
      console.log("🔍 RUNNING STOCK DIAGNOSTIC...");
      
      const { data: productsData } = await api.get("/products");
      if (productsData.success) {
        const products = productsData.data?.products || productsData.data || [];
        
        let totalCurrent = 0;
        let totalAvailable = 0;
        let totalStoredSold = 0;
        let totalCalculatedSold = 0;
        
        products.forEach((product, index) => {
          const current = parseInt(product.currentStock) || 0;
          const available = parseInt(product.availableStock) || 0;
          const storedSold = parseInt(product.soldStock) || 0;
          const calculatedSold = current - available;
          
          totalCurrent += current;
          totalAvailable += available;
          totalStoredSold += storedSold;
          totalCalculatedSold += Math.max(0, calculatedSold);
          
          console.log(`Product ${index + 1}: ${product.name}`);
          console.log(`  Current: ${current}, Available: ${available}`);
          console.log(`  Stored Sold: ${storedSold}, Calculated: ${calculatedSold}`);
          
          if (storedSold !== calculatedSold) {
            console.log(`  ⚠️ MISMATCH: ${storedSold} vs ${calculatedSold} (Difference: ${storedSold - calculatedSold})`);
          }
        });
        
        console.log("📊 DIAGNOSTIC TOTALS:");
        console.log(`  Total Current Stock: ${totalCurrent}`);
        console.log(`  Total Available Stock: ${totalAvailable}`);
        console.log(`  Total Stored Sold: ${totalStoredSold}`);
        console.log(`  Total Calculated Sold: ${totalCalculatedSold}`);
        console.log(`  Difference: ${totalStoredSold - totalCalculatedSold}`);
        
        alert(`Diagnostic complete! Check console for details.\nStored: ${totalStoredSold}, Calculated: ${totalCalculatedSold}`);
      }
    } catch (error) {
      console.error("❌ Diagnostic failed:", error);
    }
  };

  const fixSoldStockValues = async () => {
    if (!window.confirm("This will update all sold stock values to match the calculated values. Continue?")) {
      return;
    }
    
    try {
      const { data: productsData } = await api.get("/products");
      if (productsData.success) {
        const products = productsData.data?.products || productsData.data || [];
        let fixedCount = 0;
        
        for (const product of products) {
          const calculatedSold = Math.max(0, (parseInt(product.currentStock) || 0) - (parseInt(product.availableStock) || 0));
          const storedSold = parseInt(product.soldStock) || 0;
          
          if (storedSold !== calculatedSold) {
            console.log(`Fixing ${product.name}: ${storedSold} -> ${calculatedSold}`);
            
            await api.put(`/products/${product._id}`, {
              soldStock: calculatedSold
            });
            
            fixedCount++;
          }
        }
        
        alert(`✅ Fixed ${fixedCount} products! Sold stock values now match calculations.`);
      
        fetchPurchaseInvoices();
      }
    } catch (error) {
      console.error("❌ Fix failed:", error);
      alert("❌ Failed to fix sold stock values");
    }
  };

  const deleteInvoice = async (id) => {
    const invoiceToDelete = invoices.find(inv => inv._id === id);
    
    if (!invoiceToDelete) return;

    let confirmationMessage = "Are you sure you want to delete this purchase invoice? This action cannot be undone.";
    
    if (invoiceToDelete.inventoryUpdated) {
      confirmationMessage = "⚠️ This purchase invoice has updated inventory. Deleting it will reverse the stock updates. Are you sure you want to proceed?";
    }

    if (!window.confirm(confirmationMessage)) {
      return;
    }
    
    try {
      setDeleteLoading(id);
      console.log(`🗑️ Attempting to delete purchase invoice: ${id}`);
      
      const { data } = await api.delete(`/purchases/${id}`);
      
      if (data.success) {
        alert("✅ Purchase invoice deleted successfully");
       
        const updatedInvoices = invoices.filter(inv => inv._id !== id);
        setInvoices(updatedInvoices);
       
        calculateStats(updatedInvoices);
      } else {
        throw new Error(data.message || "Failed to delete purchase invoice");
      }
    } catch (error) {
      console.error("❌ Failed to delete purchase invoice:", error);
      
      let errorMessage = "Failed to delete purchase invoice. Please try again.";
      
      if (error.response) {
        const serverError = error.response.data;
        errorMessage = serverError.message || `Server error: ${error.response.status}`;
        
        if (error.response.status === 404) {
          errorMessage = "Purchase invoice not found. It may have been already deleted.";
        } else if (error.response.status === 400) {
          errorMessage = serverError.message || "Invalid request. Please check the invoice data.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error occurred. Please try again later or contact support.";
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your internet connection.";
      } else {
        errorMessage = error.message || "An unexpected error occurred.";
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number);
  };

  const getStatusBadge = (invoice) => {
    if (invoice.inventoryUpdated) {
      return <span className="badge success">✅ Stock Updated</span>;
    }
    if (invoice.status === "cancelled") {
      return <span className="badge danger">❌ Cancelled</span>;
    }
    return <span className="badge primary">📝 Recorded</span>;
  };

  const getPaymentStatusBadge = (invoice) => {
    switch (invoice.paymentStatus) {
      case "paid":
        return <span className="badge success">Paid</span>;
      case "partial":
        return <span className="badge warning">Partial</span>;
      case "pending":
      default:
        return <span className="badge secondary">Pending</span>;
    }
  };

  const calculateTotalItems = (items) => {
    return items?.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0) || 0;
  };

  const handleRefresh = () => {
    fetchPurchaseInvoices();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilter("all");
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="invoice-list-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading purchase invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-list-container">
      <Sidebar />
      <div className="main-content">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-info">
            <h1>📥 Purchase Invoices</h1>
            <p>Manage your purchase records and inventory updates</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary" 
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "⏳ Refreshing..." : "🔄 Refresh"}
            </button>
            
            {/* Debug and Fix Buttons */}
            <button 
              className="btn-secondary" 
              onClick={runStockDiagnostic}
              title="Check stock calculation"
            >
              🔍 Diagnose Stock
            </button>
            <button 
              className="btn-secondary" 
              onClick={fixSoldStockValues}
              title="Fix sold stock values"
            >
              🔧 Fix Stock Data
            </button>
            
            <Link to="/create-purchase-invoice" className="btn-primary">
              + New Purchase
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="summary-stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">📦</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.totalPurchases)}</h3>
              <p>Total Purchases</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalValue)}</h3>
              <p>Total Purchase Value</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">📅</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.thisMonthValue)}</h3>
              <p>This Month</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info">📊</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.totalItems)}</h3>
              <p>Total Items Purchased</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">⏳</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.pendingInventory)}</h3>
              <p>Pending Stock Update</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon secondary">🛒</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.soldStock)}</h3>
              <p>Sold Stock</p>
              <small>(Calculated: Current - Available)</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon teal">✅</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.availableStock)}</h3>
              <p>Available Stock</p>
            </div>
          </div>
        </div>

        {/* Stock Calculation Info */}
        <div className="info-banner">
          <strong>Stock Calculation:</strong> Sold Stock = Current Stock - Available Stock
          {stats.soldStock > 0 && (
            <span className="calculation-detail">
              {" "}(If this shows 6 instead of 2, click "Fix Stock Data" above)
            </span>
          )}
        </div>

        {/* Filters and Search */}
        <div className="filters-card">
          <div className="filters-header">
            <h3>Filters & Search</h3>
            <div className="results-count">
              Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              {(searchTerm || filter !== "all") && (
                <button 
                  className="clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          <div className="filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by invoice no, supplier name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchPurchaseInvoices()}
              />
              <button 
                onClick={fetchPurchaseInvoices}
                className="search-btn"
              >
                🔍
              </button>
            </div>
            
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === "today" ? "active" : ""}`}
                onClick={() => setFilter("today")}
              >
                Today
              </button>
              <button
                className={`filter-btn ${filter === "week" ? "active" : ""}`}
                onClick={() => setFilter("week")}
              >
                This Week
              </button>
              <button
                className={`filter-btn ${filter === "month" ? "active" : ""}`}
                onClick={() => setFilter("month")}
              >
                This Month
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="table-card">
          {invoices.length > 0 ? (
            <div className="table-responsive">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice Details</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Items & Quantity</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="invoice-row">
                      <td className="invoice-details">
                        <div className="invoice-number">
                          <strong>{invoice.invoiceNo}</strong>
                        </div>
                        {invoice.notes && (
                          <div className="invoice-notes" title={invoice.notes}>
                            📝 {invoice.notes.substring(0, 30)}...
                          </div>
                        )}
                      </td>
                      <td className="supplier-info">
                        <div className="supplier-name">
                          {invoice.supplierName || "N/A"}
                        </div>
                        {invoice.supplierPhone && (
                          <div className="supplier-phone">
                            📞 {invoice.supplierPhone}
                          </div>
                        )}
                      </td>
                      <td className="invoice-date">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="items-info">
                        <div className="items-count">
                          {invoice.items?.length || 0} items
                        </div>
                        <div className="total-quantity">
                          {calculateTotalItems(invoice.items)} units
                        </div>
                      </td>
                      <td className="invoice-amount">
                        <div className="amount-main">
                          {formatCurrency(invoice.grandTotal)}
                        </div>
                        {invoice.subtotal && (
                          <div className="amount-breakdown">
                            Subtotal: {formatCurrency(invoice.subtotal)}
                          </div>
                        )}
                      </td>
                      <td className="invoice-status">
                        {getStatusBadge(invoice)}
                      </td>
                      <td className="payment-status">
                        {getPaymentStatusBadge(invoice)}
                      </td>
                      <td className="invoice-actions">
                        <div className="action-buttons">
                          <Link
                            to={`/purchases/${invoice._id}`}
                            className="btn-action btn-view"
                            title="View Details"
                          >
                            👁️
                          </Link>
                          <Link
                            to={`/edit-purchase/${invoice._id}`}
                            className="btn-action btn-edit"
                            title="Edit Invoice"
                          >
                            ✏️
                          </Link>
                          <Link
                            to={`/create-purchase-invoice?clone=${invoice._id}`}
                            className="btn-action btn-clone"
                            title="Clone Invoice"
                          >
                            📋
                          </Link>
                          <button
                            onClick={() => deleteInvoice(invoice._id)}
                            className="btn-action btn-delete"
                            title="Delete Invoice"
                            disabled={deleteLoading === invoice._id}
                          >
                            {deleteLoading === invoice._id ? "⏳" : "🗑️"}
                          </button>
                        </div>
                        {invoice.inventoryUpdated && (
                          <div className="delete-info-tooltip">
                            Stock will be reversed on delete
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📥</div>
              <h3>No Purchase Invoices Found</h3>
              <p>
                {searchTerm || filter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first purchase invoice"
                }
              </p>
              <div className="empty-actions">
                <Link to="/create-purchase-invoice" className="btn-primary">
                  Create First Purchase
                </Link>
                {(searchTerm || filter !== "all") && (
                  <button 
                    className="btn-secondary"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PurchaseInvoiceList;