import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Reports.css";

function Reports() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [reports, setReports] = useState({
    sales: {},
    purchases: {},
    inventory: {},
    financial: {},
    customer: {},
    product: {}
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchReportsData();
  }, [timeRange]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      console.log("📊 Fetching reports data...");
      
      // Fetch all data in parallel with better error handling
      const requests = [
        api.get("/invoices").catch(err => {
          console.error("❌ Failed to fetch invoices:", err);
          return { data: { data: [] } };
        }),
        api.get("/purchases").catch(err => {
          console.error("❌ Failed to fetch purchases:", err);
          return { data: { data: [] } };
        }),
        api.get("/products").catch(err => {
          console.error("❌ Failed to fetch products:", err);
          return { data: { data: [] } };
        }),
        api.get("/customers").catch(err => {
          console.error("❌ Failed to fetch customers:", err);
          return { data: { data: [] } };
        }),
        api.get("/suppliers").catch(err => {
          console.error("❌ Failed to fetch suppliers:", err);
          return { data: { data: [] } };
        })
      ];

      const [
        invoicesRes,
        purchasesRes,
        productsRes,
        customersRes,
        suppliersRes
      ] = await Promise.all(requests);

      console.log("📦 Raw API Responses:", {
        invoices: invoicesRes?.data,
        purchases: purchasesRes?.data,
        products: productsRes?.data,
        customers: customersRes?.data,
        suppliers: suppliersRes?.data
      });

      // Process all the data with proper response structure handling
      const processedReports = processReportsData({
        invoices: getDataFromResponse(invoicesRes?.data),
        purchases: getDataFromResponse(purchasesRes?.data),
        products: getDataFromResponse(productsRes?.data),
        customers: getDataFromResponse(customersRes?.data),
        suppliers: getDataFromResponse(suppliersRes?.data)
      });

      console.log("✅ Processed Reports:", processedReports);
      setReports(processedReports);
    } catch (error) {
      console.error("❌ Failed to fetch reports data:", error);
      // Set empty state to prevent crashes
      setReports({
        sales: {},
        purchases: {},
        inventory: {},
        financial: {},
        customer: {},
        product: {}
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract data from different API response structures
  const getDataFromResponse = (response) => {
    if (!response) return [];
    
    // Handle different response structures
    if (response.success) {
      // Structure: { success: true, data: [...] } or { success: true, data: { purchases: [...] } }
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle nested structures like { data: { purchases: [], invoices: [] } }
        if (response.data.purchases && Array.isArray(response.data.purchases)) {
          return response.data.purchases;
        } else if (response.data.invoices && Array.isArray(response.data.invoices)) {
          return response.data.invoices;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          return response.data.products;
        } else if (response.data.customers && Array.isArray(response.data.customers)) {
          return response.data.customers;
        } else if (response.data.suppliers && Array.isArray(response.data.suppliers)) {
          return response.data.suppliers;
        }
      }
    }
    
    // If response is already an array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Fallback: try to find any array in the response
    for (let key in response) {
      if (Array.isArray(response[key])) {
        return response[key];
      }
    }
    
    return [];
  };

  const processReportsData = (rawData) => {
    const now = new Date();
    let startDate;

    // Calculate date range based on timeRange
    switch (timeRange) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Ensure data is arrays
    const invoices = Array.isArray(rawData.invoices) ? rawData.invoices : [];
    const purchases = Array.isArray(rawData.purchases) ? rawData.purchases : [];
    const products = Array.isArray(rawData.products) ? rawData.products : [];
    const customers = Array.isArray(rawData.customers) ? rawData.customers : [];
    const suppliers = Array.isArray(rawData.suppliers) ? rawData.suppliers : [];

    console.log("📊 Data counts:", {
      invoices: invoices.length,
      purchases: purchases.length,
      products: products.length,
      customers: customers.length,
      suppliers: suppliers.length
    });

    // Filter period data
    const periodInvoices = invoices.filter(inv => {
      if (!inv?.createdAt && !inv?.invoiceDate) return false;
      const invoiceDate = new Date(inv.createdAt || inv.invoiceDate);
      return invoiceDate >= startDate && !isNaN(invoiceDate.getTime());
    });

    const periodPurchases = purchases.filter(purchase => {
      if (!purchase?.createdAt && !purchase?.purchaseDate && !purchase?.invoiceDate) return false;
      const purchaseDate = new Date(purchase.createdAt || purchase.purchaseDate || purchase.invoiceDate);
      return purchaseDate >= startDate && !isNaN(purchaseDate.getTime());
    });

    // Calculate sales data
    const totalRevenue = invoices.reduce((sum, inv) => {
      const amount = parseFloat(inv?.grandTotal) || parseFloat(inv?.totalAmount) || 0;
      return sum + amount;
    }, 0);
    
    const periodRevenue = periodInvoices.reduce((sum, inv) => {
      const amount = parseFloat(inv?.grandTotal) || parseFloat(inv?.totalAmount) || 0;
      return sum + amount;
    }, 0);

    // Calculate purchase data
    const totalPurchaseValue = purchases.reduce((sum, purchase) => {
      const amount = parseFloat(purchase?.totalAmount) || parseFloat(purchase?.grandTotal) || 0;
      return sum + amount;
    }, 0);
    
    const periodPurchaseValue = periodPurchases.reduce((sum, purchase) => {
      const amount = parseFloat(purchase?.totalAmount) || parseFloat(purchase?.grandTotal) || 0;
      return sum + amount;
    }, 0);

    // Calculate financial data
    const netRevenue = totalRevenue - totalPurchaseValue;
    const profitMargin = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;

    // Calculate customer spending
    const customerSpending = invoices.reduce((acc, inv) => {
      const customerName = inv?.customerName || inv?.customer?.name || 'Unknown Customer';
      const amount = parseFloat(inv?.grandTotal) || parseFloat(inv?.totalAmount) || 0;
      
      if (!acc[customerName]) {
        acc[customerName] = { totalSpent: 0, invoiceCount: 0 };
      }
      acc[customerName].totalSpent += amount;
      acc[customerName].invoiceCount += 1;
      
      return acc;
    }, {});

    const topCustomers = Object.entries(customerSpending)
      .map(([name, data]) => ({
        name,
        totalSpent: data.totalSpent,
        invoiceCount: data.invoiceCount
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Calculate product sales - using the same logic as PurchaseInvoiceList
    const productSales = products.map(product => {
      // Calculate sold quantity based on different possible field names
      const currentStock = parseInt(product?.currentStock) || parseInt(product?.availableStock) || 0;
      const availableStock = parseInt(product?.availableStock) || parseInt(product?.currentStock) || 0;
      const soldQuantity = Math.max(0, currentStock - availableStock);
      
      const price = parseFloat(product?.price) || parseFloat(product?.salePrice) || 0;
      const salesValue = soldQuantity * price;
      
      return {
        id: product._id || product.id,
        name: product.name || 'Unknown Product',
        soldQuantity,
        salesValue,
        price,
        availableStock,
        currentStock
      };
    });

    // Get top suppliers - using the same logic as Suppliers component
    const topSuppliers = getTopSuppliers(purchases);

    // Calculate inventory stats - using the same logic as PurchaseInvoiceList
    const availableStock = products.reduce((sum, p) => 
      sum + (parseInt(p?.availableStock) || parseInt(p?.currentStock) || 0), 0
    );
    
    const soldStock = products.reduce((sum, product) => {
      const currentStock = parseInt(product.currentStock) || 0;
      const available = parseInt(product.availableStock) || 0;
      const calculatedSold = currentStock - available;
      return sum + Math.max(0, calculatedSold); 
    }, 0);

    const result = {
      sales: {
        totalRevenue,
        periodRevenue,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(inv => 
          inv?.status === "Paid" || inv?.paymentStatus === "Paid" || inv?.status === "paid"
        ).length,
        pendingInvoices: invoices.filter(inv => 
          inv?.status === "Pending" || inv?.paymentStatus === "Pending" || inv?.status === "pending"
        ).length,
        draftInvoices: invoices.filter(inv => 
          inv?.status === "Draft" || inv?.status === "draft"
        ).length,
        periodInvoices: periodInvoices.length
      },
      purchases: {
        totalPurchases: purchases.length,
        totalPurchaseValue,
        periodPurchaseValue,
        periodPurchases: periodPurchases.length,
        topSuppliers
      },
      inventory: {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + (parseInt(p?.currentStock) || parseInt(p?.availableStock) || 0), 0),
        availableStock,
        soldStock,
        lowStock: products.filter(p => {
          const availableStock = parseInt(p?.availableStock) || parseInt(p?.currentStock) || 0;
          const minStockLevel = parseInt(p?.minStockLevel) || 5;
          return availableStock > 0 && availableStock <= minStockLevel;
        }).length,
        outOfStock: products.filter(p => {
          const availableStock = parseInt(p?.availableStock) || parseInt(p?.currentStock) || 0;
          return availableStock === 0;
        }).length,
        topProducts: [...products]
          .map(p => ({
            ...p,
            stockValue: (parseFloat(p?.price) || parseFloat(p?.salePrice) || 0) * 
                       (parseInt(p?.availableStock) || parseInt(p?.currentStock) || 0)
          }))
          .sort((a, b) => (b.stockValue || 0) - (a.stockValue || 0))
          .slice(0, 5)
      },
      financial: {
        netRevenue,
        profitMargin,
        averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        totalGST: invoices.reduce((sum, inv) => sum + (parseFloat(inv?.gstTotal) || parseFloat(inv?.taxAmount) || 0), 0),
        totalExpenses: totalPurchaseValue
      },
      customer: {
        totalCustomers: customers.length,
        topCustomers,
        newCustomers: customers.filter(cust => {
          if (!cust?.createdAt) return false;
          const customerDate = new Date(cust.createdAt);
          return customerDate >= startDate;
        }).length
      },
      product: {
        topSelling: [...productSales]
          .sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0))
          .slice(0, 5),
        mostValuable: [...productSales]
          .sort((a, b) => (b.salesValue || 0) - (a.salesValue || 0))
          .slice(0, 5)
      }
    };

    console.log("📈 Final Report Data:", result);
    return result;
  };

  const getTopSuppliers = (purchases) => {
    const supplierSpending = purchases.reduce((acc, purchase) => {
      const supplierName = purchase?.supplierName || purchase?.supplier?.name || 'Unknown Supplier';
      const amount = parseFloat(purchase?.totalAmount) || parseFloat(purchase?.grandTotal) || 0;
      
      if (!acc[supplierName]) {
        acc[supplierName] = 0;
      }
      acc[supplierName] += amount;
      
      return acc;
    }, {});

    return Object.entries(supplierSpending)
      .map(([name, totalSpent]) => ({ name, totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      amount = 0;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number) => {
    if (number === undefined || number === null || isNaN(number)) {
      number = 0;
    }
    return new Intl.NumberFormat('en-IN').format(number);
  };

  const formatPercent = (number) => {
    if (number === undefined || number === null || isNaN(number)) {
      return "0.0%";
    }
    return `${parseFloat(number).toFixed(1)}%`;
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "year": return "This Year";
      default: return "This Month";
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle different data types for CSV
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const printReport = (section) => {
    const printWindow = window.open('', '_blank');
    const content = generatePrintContent(section);
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = (section) => {
    const title = `${section.charAt(0).toUpperCase() + section.slice(1)} Report - ${getTimeRangeLabel()}`;
    const sectionData = reports[section] || {};
    
    let contentHTML = '';
    
    switch(section) {
      case 'sales':
        contentHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Revenue Summary</h4>
              <p>Total Revenue: ${formatCurrency(sectionData.totalRevenue)}</p>
              <p>Period Revenue: ${formatCurrency(sectionData.periodRevenue)}</p>
              <p>Total Invoices: ${formatNumber(sectionData.totalInvoices)}</p>
              <p>Average Invoice: ${formatCurrency(sectionData.averageInvoiceValue)}</p>
            </div>
          </div>
        `;
        break;
      case 'purchases':
        contentHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Purchase Summary</h4>
              <p>Total Purchases: ${formatNumber(sectionData.totalPurchases)}</p>
              <p>Total Value: ${formatCurrency(sectionData.totalPurchaseValue)}</p>
              <p>Period Value: ${formatCurrency(sectionData.periodPurchaseValue)}</p>
            </div>
          </div>
        `;
        break;
      case 'inventory':
        contentHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Inventory Summary</h4>
              <p>Total Products: ${formatNumber(sectionData.totalProducts)}</p>
              <p>Available Stock: ${formatNumber(sectionData.availableStock)}</p>
              <p>Low Stock Items: ${formatNumber(sectionData.lowStock)}</p>
              <p>Out of Stock: ${formatNumber(sectionData.outOfStock)}</p>
            </div>
          </div>
        `;
        break;
      default:
        contentHTML = `<div>Print content for ${section} section</div>`;
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 5px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; }
          @media print { 
            body { margin: 0; } 
            .no-print { display: none !important; } 
            .stat-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
          <p>Time Range: ${getTimeRangeLabel()}</p>
        </div>
        ${contentHTML}
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="reports-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safety check before rendering
  if (!reports || !reports.financial) {
    return (
      <div className="reports-container">
        <Sidebar />
        <div className="main-content">
          <div className="error-state">
            <h2>Unable to load reports</h2>
            <p>Please check your backend server and try again.</p>
            <button className="btn-primary" onClick={fetchReportsData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <div className="reports-header">
          <div className="header-info">
            <h1>📊 Business Reports</h1>
            <p>Comprehensive analytics and insights for your business</p>
          </div>
          <div className="header-controls">
            <select 
              className="time-range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button 
              className="btn-secondary"
              onClick={fetchReportsData}
              disabled={loading}
            >
              {loading ? "⏳" : "🔄"}
            </button>
          </div>
        </div>

        {/* Time Range Info */}
        <div className="time-range-info">
          Showing data for: <strong>{getTimeRangeLabel()}</strong>
        </div>

        {/* Navigation Tabs */}
        <div className="reports-tabs">
          <button 
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📈 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}
            onClick={() => setActiveTab("sales")}
          >
            🧾 Sales
          </button>
          <button 
            className={`tab-btn ${activeTab === "purchases" ? "active" : ""}`}
            onClick={() => setActiveTab("purchases")}
          >
            📥 Purchases
          </button>
          <button 
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            📦 Inventory
          </button>
          <button 
            className={`tab-btn ${activeTab === "financial" ? "active" : ""}`}
            onClick={() => setActiveTab("financial")}
          >
            💰 Financial
          </button>
          <button 
            className={`tab-btn ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            👥 Customers
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <h3>{formatCurrency(reports.sales.totalRevenue)}</h3>
                  <p>Total Revenue</p>
                  <div className="metric-trend">
                    <span className="trend-up">↑ {formatCurrency(reports.sales.periodRevenue)} this period</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card success">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <h3>{formatCurrency(reports.financial.netRevenue)}</h3>
                  <p>Net Revenue</p>
                  <div className="metric-trend">
                    <span>Margin: {formatPercent(reports.financial.profitMargin)}</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card warning">
                <div className="metric-icon">🧾</div>
                <div className="metric-content">
                  <h3>{formatNumber(reports.sales.totalInvoices)}</h3>
                  <p>Total Invoices</p>
                  <div className="metric-breakdown">
                    <span>Paid: {reports.sales.paidInvoices}</span>
                    <span>Pending: {reports.sales.pendingInvoices}</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card info">
                <div className="metric-icon">📦</div>
                <div className="metric-content">
                  <h3>{formatNumber(reports.inventory.totalProducts)}</h3>
                  <p>Total Products</p>
                  <div className="metric-breakdown">
                    <span>Stock: {formatNumber(reports.inventory.totalStock)}</span>
                    <span>Sold: {formatNumber(reports.inventory.soldStock)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-section">
                <h3>📈 Sales Performance</h3>
                <div className="stat-cards">
                  <div className="stat-card">
                    <span className="stat-label">Average Invoice Value</span>
                    <span className="stat-value">{formatCurrency(reports.financial.averageInvoiceValue)}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total GST Collected</span>
                    <span className="stat-value">{formatCurrency(reports.financial.totalGST)}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Period Invoices</span>
                    <span className="stat-value">{formatNumber(reports.sales.periodInvoices)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-section">
                <h3>📥 Purchase Overview</h3>
                <div className="stat-cards">
                  <div className="stat-card">
                    <span className="stat-label">Total Purchases</span>
                    <span className="stat-value">{formatNumber(reports.purchases.totalPurchases)}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Purchase Value</span>
                    <span className="stat-value">{formatCurrency(reports.purchases.totalPurchaseValue)}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Period Purchases</span>
                    <span className="stat-value">{formatNumber(reports.purchases.periodPurchases)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-section">
                <h3>📦 Inventory Health</h3>
                <div className="stat-cards">
                  <div className="stat-card">
                    <span className="stat-label">Available Stock</span>
                    <span className="stat-value">{formatNumber(reports.inventory.availableStock)}</span>
                  </div>
                  <div className="stat-card warning">
                    <span className="stat-label">Low Stock Items</span>
                    <span className="stat-value">{formatNumber(reports.inventory.lowStock)}</span>
                  </div>
                  <div className="stat-card danger">
                    <span className="stat-label">Out of Stock</span>
                    <span className="stat-value">{formatNumber(reports.inventory.outOfStock)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-grid">
              <div className="activity-card">
                <h3>🏆 Top Selling Products</h3>
                <div className="activity-list">
                  {reports.product.topSelling.map((product, index) => (
                    <div key={product.id || index} className="activity-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{product.name}</span>
                      <span className="value">{formatNumber(product.soldQuantity)} sold</span>
                      <span className="amount">{formatCurrency(product.salesValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="activity-card">
                <h3>⭐ Top Customers</h3>
                <div className="activity-list">
                  {reports.customer.topCustomers.map((customer, index) => (
                    <div key={index} className="activity-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{customer.name}</span>
                      <span className="value">{customer.invoiceCount} invoices</span>
                      <span className="amount">{formatCurrency(customer.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === "sales" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>🧾 Sales Report</h2>
              <div className="section-actions">
                <button className="btn-secondary" onClick={() => printReport('sales')}>
                  🖨️ Print
                </button>
                <button className="btn-primary" onClick={() => exportToCSV([], 'sales-report.csv')}>
                  📥 Export CSV
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card large">
                <h3>Revenue Summary</h3>
                <div className="stat-content">
                  <div className="stat-row">
                    <span>Total Revenue:</span>
                    <span className="stat-value">{formatCurrency(reports.sales.totalRevenue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Period Revenue:</span>
                    <span className="stat-value success">{formatCurrency(reports.sales.periodRevenue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Invoices:</span>
                    <span className="stat-value">{formatNumber(reports.sales.totalInvoices)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Period Invoices:</span>
                    <span className="stat-value info">{formatNumber(reports.sales.periodInvoices)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Average Invoice Value:</span>
                    <span className="stat-value">{formatCurrency(reports.financial.averageInvoiceValue)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card large">
                <h3>Invoice Status</h3>
                <div className="stat-content">
                  <div className="status-item">
                    <span className="status-dot paid"></span>
                    <span>Paid Invoices:</span>
                    <span className="stat-value">{reports.sales.paidInvoices}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot pending"></span>
                    <span>Pending Invoices:</span>
                    <span className="stat-value">{reports.sales.pendingInvoices}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot draft"></span>
                    <span>Draft Invoices:</span>
                    <span className="stat-value">{reports.sales.draftInvoices}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total GST Collected:</span>
                    <span className="stat-value">{formatCurrency(reports.financial.totalGST)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>📥 Purchase Report</h2>
              <div className="section-actions">
                <button className="btn-secondary" onClick={() => printReport('purchases')}>
                  🖨️ Print
                </button>
                <button className="btn-primary" onClick={() => exportToCSV([], 'purchases-report.csv')}>
                  📥 Export CSV
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card large">
                <h3>Purchase Summary</h3>
                <div className="stat-content">
                  <div className="stat-row">
                    <span>Total Purchases:</span>
                    <span className="stat-value">{formatNumber(reports.purchases.totalPurchases)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Purchase Value:</span>
                    <span className="stat-value">{formatCurrency(reports.purchases.totalPurchaseValue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Period Purchase Value:</span>
                    <span className="stat-value info">{formatCurrency(reports.purchases.periodPurchaseValue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Period Purchases:</span>
                    <span className="stat-value">{formatNumber(reports.purchases.periodPurchases)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card large">
                <h3>Top Suppliers</h3>
                <div className="stat-content">
                  {reports.purchases.topSuppliers.map((supplier, index) => (
                    <div key={index} className="supplier-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{supplier.name}</span>
                      <span className="amount">{formatCurrency(supplier.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>📦 Inventory Report</h2>
              <div className="section-actions">
                <button className="btn-secondary" onClick={() => printReport('inventory')}>
                  🖨️ Print
                </button>
                <button className="btn-primary" onClick={() => exportToCSV([], 'inventory-report.csv')}>
                  📥 Export CSV
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card large">
                <h3>Stock Overview</h3>
                <div className="stat-content">
                  <div className="stat-row">
                    <span>Total Products:</span>
                    <span className="stat-value">{formatNumber(reports.inventory.totalProducts)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Stock:</span>
                    <span className="stat-value">{formatNumber(reports.inventory.totalStock)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Available Stock:</span>
                    <span className="stat-value success">{formatNumber(reports.inventory.availableStock)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Sold Stock:</span>
                    <span className="stat-value info">{formatNumber(reports.inventory.soldStock)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card large">
                <h3>Stock Alerts</h3>
                <div className="stat-content">
                  <div className="alert-item danger">
                    <span>Out of Stock:</span>
                    <span className="stat-value">{formatNumber(reports.inventory.outOfStock)}</span>
                  </div>
                  <div className="alert-item warning">
                    <span>Low Stock:</span>
                    <span className="stat-value">{formatNumber(reports.inventory.lowStock)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="products-section">
              <h3>Top Products by Value</h3>
              <div className="products-grid">
                {reports.inventory.topProducts.map((product, index) => (
                  <div key={product._id || product.id || index} className="product-card">
                    <div className="product-rank">#{index + 1}</div>
                    <div className="product-info">
                      <div className="product-name">{product.name || 'Unknown Product'}</div>
                      <div className="product-stock">
                        <span>Stock: {formatNumber(product.availableStock || product.currentStock || 0)}</span>
                        <span>Value: {formatCurrency(product.stockValue || (product.price || 0) * (product.availableStock || 0))}</span>
                      </div>
                    </div>
                    <div className="product-price">{formatCurrency(product.price || product.salePrice || 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>💰 Financial Report</h2>
              <div className="section-actions">
                <button className="btn-secondary" onClick={() => printReport('financial')}>
                  🖨️ Print
                </button>
                <button className="btn-primary" onClick={() => exportToCSV([], 'financial-report.csv')}>
                  📥 Export CSV
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card large">
                <h3>Financial Summary</h3>
                <div className="stat-content">
                  <div className="stat-row">
                    <span>Total Revenue:</span>
                    <span className="stat-value">{formatCurrency(reports.sales.totalRevenue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Purchases:</span>
                    <span className="stat-value">{formatCurrency(reports.purchases.totalPurchaseValue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Net Revenue:</span>
                    <span className="stat-value success">{formatCurrency(reports.financial.netRevenue)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Profit Margin:</span>
                    <span className="stat-value info">{formatPercent(reports.financial.profitMargin)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total GST:</span>
                    <span className="stat-value">{formatCurrency(reports.financial.totalGST)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>👥 Customers Report</h2>
              <div className="section-actions">
                <button className="btn-secondary" onClick={() => printReport('customers')}>
                  🖨️ Print
                </button>
                <button className="btn-primary" onClick={() => exportToCSV(reports.customer.topCustomers, 'customers-report.csv')}>
                  📥 Export CSV
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card large">
                <h3>Customer Overview</h3>
                <div className="stat-content">
                  <div className="stat-row">
                    <span>Total Customers:</span>
                    <span className="stat-value">{formatNumber(reports.customer.totalCustomers)}</span>
                  </div>
                  <div className="stat-row">
                    <span>New Customers (Period):</span>
                    <span className="stat-value success">{formatNumber(reports.customer.newCustomers)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card large">
                <h3>Top Customers by Spending</h3>
                <div className="stat-content">
                  {reports.customer.topCustomers.map((customer, index) => (
                    <div key={index} className="supplier-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{customer.name}</span>
                      <span className="value">{customer.invoiceCount} invoices</span>
                      <span className="amount">{formatCurrency(customer.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Reports</h3>
          <div className="action-buttons">
            <Link to="/invoices" className="btn-secondary">
              🧾 View All Invoices
            </Link>
            <Link to="/purchase-invoices" className="btn-secondary">
              📥 View All Purchases
            </Link>
            <Link to="/inventory" className="btn-secondary">
              📦 View Inventory
            </Link>
            <button className="btn-primary" onClick={fetchReportsData}>
              🔄 Refresh Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;