// src/pages/CAReport.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import jsPDF from "jspdf";
import "./CAReport.css";

function CAReport() {
  const [reportData, setReportData] = useState({
    purchases: [],
    sales: [],
    summary: {
      totalPurchases: 0,
      totalSales: 0,
      totalGST: 0,
      totalItemsSold: 0,
      totalItemsPurchased: 0,
      profitLoss: 0,
      profitMargin: 0,
      gstBreakdown: {
        cgst: 0,
        sgst: 0,
        igst: 0
      },
      totalTransactions: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Enhanced data validation and transformation
  const ensureArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.data?.purchases && Array.isArray(data.data.purchases)) return data.data.purchases;
    if (data.data?.invoices && Array.isArray(data.data.invoices)) return data.data.invoices;
    if (data.success && Array.isArray(data.data)) return data.data;
    return [];
  };

  // Extract valid supplier ID - FIXED VERSION
  const getValidSupplierId = (supplierId) => {
    if (!supplierId) return null;
    
    // If it's already a string, return it
    if (typeof supplierId === 'string') {
      return supplierId.length > 5 ? supplierId : null; // Basic validation
    }
    
    // If it's an object, try to extract the ID
    if (typeof supplierId === 'object') {
      console.log("🔍 Supplier ID is object:", supplierId);
      
      // Try common ID fields
      if (supplierId._id) return supplierId._id;
      if (supplierId.id) return supplierId.id;
      if (supplierId.supplierId) return supplierId.supplierId;
      
      // If it has a string representation that looks like an ID
      const stringRep = String(supplierId);
      if (stringRep.length > 5 && stringRep !== '[object Object]') {
        return stringRep;
      }
    }
    
    return null;
  };

  // Load report data with better error handling
  const loadReportData = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching CA report data...");
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      // Load purchases and sales in parallel with better error handling
      const [purchasesRes, salesRes] = await Promise.allSettled([
        api.get(`/purchases?${params}`),
        api.get(`/invoices?${params}`)
      ]);

      console.log("📦 Purchases API Response:", purchasesRes);
      console.log("🧾 Sales API Response:", salesRes);

      // Handle purchases response
      let purchases = [];
      if (purchasesRes.status === 'fulfilled' && purchasesRes.value.data?.success) {
        purchases = ensureArray(purchasesRes.value.data);
        console.log("✅ Purchases data loaded:", purchases.length, purchases);
      } else {
        console.warn('❌ Purchases API failed:', purchasesRes.reason);
      }

      // Handle sales response
      let sales = [];
      if (salesRes.status === 'fulfilled' && salesRes.value.data?.success) {
        sales = ensureArray(salesRes.value.data);
        console.log("✅ Sales data loaded:", sales.length);
      } else {
        console.warn('❌ Sales API failed:', salesRes.reason);
      }

      // Enhance purchase data with supplier GST information
      const enhancedPurchases = await enhancePurchaseData(purchases);

      // Calculate summary
      const summary = calculateSummary(enhancedPurchases, sales);

      console.log("📊 Final report data:", {
        purchases: enhancedPurchases.length,
        sales: sales.length,
        summary
      });

      setReportData({
        purchases: enhancedPurchases,
        sales,
        summary
      });
    } catch (error) {
      console.error("❌ Error loading CA report data:", error);
      alert("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced purchase data with supplier GST information - FIXED VERSION
  const enhancePurchaseData = async (purchases) => {
    try {
      // Ensure purchases is an array
      const purchasesArray = ensureArray(purchases);
      
      if (!purchasesArray.length) {
        console.log("📭 No purchases to enhance");
        return [];
      }

      console.log("🔧 Enhancing purchase data for:", purchasesArray.length, "purchases");

      const enhancedPurchases = await Promise.all(
        purchasesArray.map(async (purchase) => {
          // Create a base enhanced purchase object with proper defaults
          const enhancedPurchase = {
            ...purchase,
            supplierGstin: purchase.supplierGstin || purchase.supplierGSTIN || 'N/A',
            supplierName: purchase.supplierName || 'N/A',
            supplierAddress: purchase.supplierAddress || '',
            invoiceNo: purchase.invoiceNo || 'N/A',
            invoiceDate: purchase.invoiceDate || purchase.createdAt,
            grandTotal: parseFloat(purchase.grandTotal) || 0,
            totalTax: parseFloat(purchase.totalTax) || parseFloat(purchase.taxAmount) || 0,
            status: purchase.status || 'completed',
            paymentStatus: purchase.paymentStatus || 'pending'
          };

          // If supplierGstin is already available, return early
          if (enhancedPurchase.supplierGstin && enhancedPurchase.supplierGstin !== 'N/A') {
            return enhancedPurchase;
          }

          // Try to fetch supplier details to get GST number - FIXED SUPPLIER ID HANDLING
          const validSupplierId = getValidSupplierId(purchase.supplierId);
          if (validSupplierId) {
            try {
              console.log(`🔍 Fetching supplier details for ID: ${validSupplierId}`);
              const supplierRes = await api.get(`/suppliers/${validSupplierId}`);
              if (supplierRes.data?.success && supplierRes.data.data) {
                const supplier = supplierRes.data.data;
                console.log(`✅ Found supplier:`, supplier.name, supplier.gstNumber);
                return {
                  ...enhancedPurchase,
                  supplierGstin: supplier.gstNumber || 'N/A',
                  supplierName: supplier.name || enhancedPurchase.supplierName,
                  supplierAddress: supplier.address || enhancedPurchase.supplierAddress
                };
              }
            } catch (error) {
              console.warn(`❌ Could not fetch supplier details for ID: ${validSupplierId}`, error);
              // Don't throw, just continue with other enhancement methods
            }
          } else {
            console.log(`⚠️ Invalid supplier ID format:`, purchase.supplierId);
          }

          // If no valid supplier ID but has supplier name, try to find by name
          if (purchase.supplierName && purchase.supplierName !== 'N/A') {
            try {
              console.log(`🔍 Searching suppliers by name: ${purchase.supplierName}`);
              const suppliersRes = await api.get('/suppliers');
              if (suppliersRes.data?.success) {
                const suppliers = ensureArray(suppliersRes.data);
                const matchedSupplier = suppliers.find(s => 
                  s.name && s.name.toLowerCase() === purchase.supplierName.toLowerCase()
                );
                if (matchedSupplier) {
                  console.log(`✅ Matched supplier by name:`, matchedSupplier.name);
                  return {
                    ...enhancedPurchase,
                    supplierGstin: matchedSupplier.gstNumber || 'N/A',
                    supplierAddress: matchedSupplier.address || enhancedPurchase.supplierAddress
                  };
                }
              }
            } catch (error) {
              console.warn(`❌ Could not fetch suppliers list for: ${purchase.supplierName}`, error);
            }
          }

          // Return enhanced purchase with default values
          console.log(`📝 Using default GST for: ${enhancedPurchase.supplierName}`);
          return enhancedPurchase;
        })
      );

      console.log("✅ Enhanced purchases:", enhancedPurchases.length);
      return enhancedPurchases;
    } catch (error) {
      console.error("❌ Error enhancing purchase data:", error);
      // Return original purchases with ensured structure
      return ensureArray(purchases).map(purchase => ({
        ...purchase,
        supplierGstin: purchase.supplierGstin || purchase.supplierGSTIN || 'N/A',
        supplierName: purchase.supplierName || 'N/A',
        grandTotal: parseFloat(purchase.grandTotal) || 0,
        totalTax: parseFloat(purchase.totalTax) || parseFloat(purchase.taxAmount) || 0,
        status: purchase.status || 'completed'
      }));
    }
  };

  // Calculate summary statistics with proper GST breakdown
  const calculateSummary = (purchases, sales) => {
    const purchasesArray = ensureArray(purchases);
    const salesArray = ensureArray(sales);

    console.log("🧮 Calculating summary from:", {
      purchases: purchasesArray.length,
      sales: salesArray.length
    });

    const totalPurchases = purchasesArray.reduce((sum, purchase) => {
      const amount = parseFloat(purchase.grandTotal) || 0;
      return sum + amount;
    }, 0);

    const totalSales = salesArray.reduce((sum, sale) => {
      const amount = parseFloat(sale.grandTotal) || 0;
      return sum + amount;
    }, 0);
    
    // Calculate GST properly from sales
    let totalGST = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    salesArray.forEach(sale => {
      // If sale has individual GST fields, use them
      if (sale.cgstTotal || sale.sgstTotal || sale.igstTotal) {
        cgstTotal += parseFloat(sale.cgstTotal || 0);
        sgstTotal += parseFloat(sale.sgstTotal || 0);
        igstTotal += parseFloat(sale.igstTotal || 0);
      } else {
        // Fallback to gstTotal field and split based on place of supply
        const gstAmount = parseFloat(sale.gstTotal || 0);
        const isInterState = sale.placeOfSupply && !sale.placeOfSupply.includes('Karnataka');
        
        if (isInterState) {
          igstTotal += gstAmount;
        } else {
          cgstTotal += gstAmount / 2;
          sgstTotal += gstAmount / 2;
        }
      }
    });

    // If we calculated from items, set total GST
    totalGST = cgstTotal + sgstTotal + igstTotal;

    const totalItemsSold = salesArray.reduce((sum, sale) => {
      if (!sale.items || !Array.isArray(sale.items)) return sum;
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + (parseInt(item.qty) || 0);
      }, 0);
    }, 0);

    const totalItemsPurchased = purchasesArray.reduce((sum, purchase) => {
      if (!purchase.items || !Array.isArray(purchase.items)) return sum;
      return sum + purchase.items.reduce((itemSum, item) => {
        return itemSum + (parseInt(item.qty) || 0);
      }, 0);
    }, 0);

    const profitLoss = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? ((profitLoss / totalSales) * 100) : 0;

    // GST breakdown
    const gstBreakdown = {
      cgst: cgstTotal,
      sgst: sgstTotal,
      igst: igstTotal
    };

    const summary = {
      totalPurchases,
      totalSales,
      totalGST,
      totalItemsSold,
      totalItemsPurchased,
      profitLoss,
      profitMargin,
      gstBreakdown,
      totalTransactions: purchasesArray.length + salesArray.length
    };

    console.log("📈 Final summary:", summary);
    return summary;
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Format number without currency symbol for PDF
  const formatNumber = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return 'Invalid Date';
    }
  };

  // Format GST number
  const formatGSTIN = (gstin) => {
    if (!gstin || gstin === 'N/A') return 'N/A';
    return gstin.toUpperCase();
  };

  // Improved table creation function for PDF
  const createTable = (doc, headers, data, startY, options = {}) => {
    const { 
      fontSize = 9, 
      headerColor = [41, 128, 185], 
      rowHeight = 8,
      columnWidths = [],
      margins = { left: 14, right: 14 },
      showGrid = true
    } = options;
    
    let y = startY;
    const pageWidth = doc.internal.pageSize.getWidth();
    const availableWidth = pageWidth - margins.left - margins.right;
    
    // Use provided column widths or calculate equal widths
    const colWidths = columnWidths.length === headers.length 
      ? columnWidths 
      : Array(headers.length).fill(availableWidth / headers.length);
    
    // Draw header
    doc.setFillColor(...headerColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(fontSize);
    doc.setFont(undefined, 'bold');
    
    // Draw header background
    doc.rect(margins.left, y, availableWidth, rowHeight, 'F');
    
    // Draw header text
    let xPos = margins.left;
    headers.forEach((header, index) => {
      const width = colWidths[index];
      doc.text(header, xPos + 2, y + 5);
      xPos += width;
    });
    
    y += rowHeight;
    
    // Draw rows
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (y + rowHeight > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 20;
        
        // Redraw header on new page
        doc.setFillColor(...headerColor);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.rect(margins.left, y, availableWidth, rowHeight, 'F');
        
        xPos = margins.left;
        headers.forEach((header, index) => {
          const width = colWidths[index];
          doc.text(header, xPos + 2, y + 5);
          xPos += width;
        });
        
        y += rowHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
      }
      
      // Draw row data
      xPos = margins.left;
      row.forEach((cell, cellIndex) => {
        const width = colWidths[cellIndex];
        doc.text(String(cell || ''), xPos + 2, y + 5);
        xPos += width;
      });
      
      // Draw horizontal line
      if (showGrid) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);
      }
      
      y += rowHeight;
    });
    
    return y;
  };

  // Generate Professional PDF Report with better layout
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Company Header with better styling
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Company Name
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('NANDI SOFTECH SOLUTIONS', pageWidth / 2, 18, { align: 'center' });
    
    // Report Title
    doc.setFontSize(14);
    doc.text('CHARTERED ACCOUNTANT REPORT', pageWidth / 2, 28, { align: 'center' });
    
    // Report Period
    doc.setFontSize(10);
    doc.text(`Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`, pageWidth / 2, 38, { align: 'center' });

    let yPosition = 55;

    // Summary Section
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.setFont(undefined, 'bold');
    doc.text('FINANCIAL SUMMARY', 20, yPosition);
    yPosition += 8;

    // Summary Table
    const summaryHeaders = ['Metric', 'Amount'];
    const summaryData = [
      ['Total Sales', `₹${formatNumber(reportData.summary.totalSales)}`],
      ['Total Purchases', `₹${formatNumber(reportData.summary.totalPurchases)}`],
      ['Gross Profit/Loss', `₹${formatNumber(reportData.summary.profitLoss)}`],
      ['Profit Margin', `${(reportData.summary.profitMargin || 0).toFixed(2)}%`],
      ['Total GST Collected', `₹${formatNumber(reportData.summary.totalGST)}`],
      ['Total Transactions', reportData.summary.totalTransactions.toString()]
    ];

    yPosition = createTable(doc, summaryHeaders, summaryData, yPosition, {
      headerColor: [41, 128, 185],
      columnWidths: [70, 60],
      fontSize: 9,
      rowHeight: 7
    });

    yPosition += 12;

    // GST Breakdown
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.setFont(undefined, 'bold');
    doc.text('GST BREAKDOWN', 20, yPosition);
    yPosition += 8;

    const gstHeaders = ['GST Type', 'Amount'];
    const gstData = [
      ['CGST', `₹${formatNumber(reportData.summary.gstBreakdown?.cgst)}`],
      ['SGST', `₹${formatNumber(reportData.summary.gstBreakdown?.sgst)}`],
      ['IGST', `₹${formatNumber(reportData.summary.gstBreakdown?.igst)}`],
      ['Total GST', `₹${formatNumber(reportData.summary.totalGST)}`]
    ];

    yPosition = createTable(doc, gstHeaders, gstData, yPosition, {
      headerColor: [39, 174, 96],
      columnWidths: [70, 60],
      fontSize: 9,
      rowHeight: 7
    });

    yPosition += 15;

    // Sales Transactions
    if (reportData.sales.length > 0) {
      // Check if we need a new page
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.setFont(undefined, 'bold');
      doc.text('SALES TRANSACTIONS', 20, yPosition);
      yPosition += 8;

      const salesHeaders = ['Date', 'Customer', 'GSTIN', 'Invoice No', 'Amount', 'GST', 'Status'];
      const salesData = reportData.sales.map(sale => [
        formatDate(sale.invoiceDate),
        (sale.customerName || 'N/A').substring(0, 12),
        formatGSTIN(sale.customerGstin).substring(0, 10),
        (sale.invoiceNo || '-').substring(0, 10),
        `₹${formatNumber(sale.grandTotal)}`,
        `₹${formatNumber(sale.gstTotal)}`,
        (sale.status || '').substring(0, 8)
      ]);

      yPosition = createTable(doc, salesHeaders, salesData, yPosition, {
        headerColor: [52, 73, 94],
        fontSize: 7,
        rowHeight: 6,
        columnWidths: [18, 25, 22, 22, 25, 25, 15]
      });

      yPosition += 10;
    }

    // Purchase Transactions
    if (reportData.purchases.length > 0) {
      // Check if we need a new page
      if (yPosition > 160) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.setFont(undefined, 'bold');
      doc.text('PURCHASE TRANSACTIONS', 20, yPosition);
      yPosition += 8;

      const purchaseHeaders = ['Date', 'Supplier', 'GSTIN', 'Invoice No', 'Amount', 'Tax', 'Status'];
      const purchaseData = reportData.purchases.map(purchase => [
        formatDate(purchase.invoiceDate),
        (purchase.supplierName || 'N/A').substring(0, 12),
        formatGSTIN(purchase.supplierGstin).substring(0, 10),
        (purchase.invoiceNo || '-').substring(0, 10),
        `₹${formatNumber(purchase.grandTotal)}`,
        `₹${formatNumber(purchase.totalTax)}`,
        (purchase.status || 'completed').substring(0, 8)
      ]);

      yPosition = createTable(doc, purchaseHeaders, purchaseData, yPosition, {
        headerColor: [155, 89, 182],
        fontSize: 7,
        rowHeight: 6,
        columnWidths: [18, 25, 22, 22, 25, 25, 15]
      });

      yPosition += 10;
    }

    // Transaction Summary
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('TRANSACTION SUMMARY', 20, yPosition);
    yPosition += 8;

    const transactionData = [
      ['Total Sales Transactions:', reportData.sales.length.toString()],
      ['Total Purchase Transactions:', reportData.purchases.length.toString()],
      ['Grand Total Transactions:', reportData.summary.totalTransactions.toString()],
      ['Report Generated On:', new Date().toLocaleDateString('en-IN')],
      ['Generated By:', 'Nandi Softech Solutions System']
    ];

    doc.setFontSize(9);
    transactionData.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(value, 75, yPosition);
      yPosition += 5;
    });

    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(100, 100, 100);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text(`Confidential - For CA Use Only | Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text('Nandi Softech Solutions - GST Compliance Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save PDF
    doc.save(`CA-Report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`);
  };

  // Generate Excel-like data
  const generateExcelData = () => {
    const salesData = ensureArray(reportData.sales);
    const purchasesData = ensureArray(reportData.purchases);

    const csvContent = [
      ['Type', 'Date', 'Party Name', 'Invoice No', 'GSTIN', 'Amount', 'GST/Tax', 'Status', 'Place of Supply', 'HSN Details'],
      ...salesData.map(sale => [
        'Sale',
        formatDate(sale.invoiceDate),
        sale.customerName || '',
        sale.invoiceNo || '-',
        formatGSTIN(sale.customerGstin),
        sale.grandTotal || 0,
        sale.gstTotal || 0,
        sale.status || '',
        sale.placeOfSupply || '-',
        sale.items?.map(i => `${i.name} (HSN: ${i.hsn || 'N/A'})`).join('; ') || '-'
      ]),
      ...purchasesData.map(purchase => [
        'Purchase',
        formatDate(purchase.invoiceDate),
        purchase.supplierName || '',
        purchase.invoiceNo || '-',
        formatGSTIN(purchase.supplierGstin),
        purchase.grandTotal || 0,
        purchase.totalTax || 0,
        purchase.status || 'completed',
        purchase.placeOfSupply || '-',
        purchase.items?.map(i => `${i.name} (HSN: ${i.hsn || 'N/A'})`).join('; ') || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CA-Report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'paid':
      case 'completed':
      case 'finalize':
        return 'ca-status-badge ca-status-success';
      case 'pending':
        return 'ca-status-badge ca-status-warning';
      case 'overdue':
        return 'ca-status-badge ca-status-danger';
      case 'cancelled':
        return 'ca-status-badge ca-status-secondary';
      case 'draft':
        return 'ca-status-badge ca-status-light';
      default:
        return 'ca-status-badge ca-status-info';
    }
  };

  // Debug function to check API responses
  const debugAPI = async () => {
    console.log("🔍 DEBUG: Checking API responses...");
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const purchasesRes = await api.get(`/purchases?${params}`);
      console.log("📦 DEBUG Purchases API Response:", purchasesRes.data);
      
      // Check supplier IDs in purchases
      if (purchasesRes.data?.success) {
        const purchases = ensureArray(purchasesRes.data);
        purchases.forEach((purchase, index) => {
          console.log(`Purchase ${index + 1}:`, {
            supplierId: purchase.supplierId,
            supplierIdType: typeof purchase.supplierId,
            supplierName: purchase.supplierName,
            validSupplierId: getValidSupplierId(purchase.supplierId)
          });
        });
      }
      
      const salesRes = await api.get(`/invoices?${params}`);
      console.log("🧾 DEBUG Sales API Response:", salesRes.data);
      
      alert("Check console for API debug information");
    } catch (error) {
      console.error("❌ DEBUG API Error:", error);
      alert("Debug failed - check console");
    }
  };

  return (
    <div className="ca-report-container">
      <div className="ca-report-layout">
        {/* Sidebar */}
        <div className="ca-sidebar-section">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="ca-main-content">
          {/* Header */}
          <div className="ca-header-section">
            <div className="ca-header-content">
              <div className="ca-header-text">
                <h1 className="ca-page-title">📊 Chartered Accountant Report</h1>
                <p className="ca-page-subtitle">
                  Comprehensive purchase and sales report for CA verification and GST compliance
                </p>
              </div>
              <div className="ca-header-actions">
                <button 
                  className="ca-btn ca-btn-secondary ca-debug-btn"
                  onClick={debugAPI}
                  title="Debug API responses"
                >
                  <span className="ca-btn-icon">🐛</span>
                  Debug API
                </button>
                <button 
                  className="ca-btn ca-btn-success ca-export-btn"
                  onClick={generateExcelData}
                  disabled={loading}
                >
                  <span className="ca-btn-icon">📥</span>
                  Export Excel
                </button>
                <button 
                  className="ca-btn ca-btn-primary ca-pdf-btn"
                  onClick={generatePDFReport}
                  disabled={loading}
                >
                  <span className="ca-btn-icon">📄</span>
                  Generate PDF
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="ca-filters-card">
            <div className="ca-filters-header">
              <h3 className="ca-filters-title">🔍 Report Filters</h3>
              <div className="ca-data-info">
                Data: {reportData.purchases.length} purchases, {reportData.sales.length} sales
              </div>
            </div>
            <div className="ca-filters-body">
              <div className="ca-filters-grid">
                <div className="ca-filter-group">
                  <label className="ca-filter-label">Start Date</label>
                  <input
                    type="date"
                    className="ca-filter-input"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="ca-filter-group">
                  <label className="ca-filter-label">End Date</label>
                  <input
                    type="date"
                    className="ca-filter-input"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="ca-filter-group">
                  <button 
                    className="ca-btn ca-btn-secondary ca-refresh-btn"
                    onClick={loadReportData}
                    disabled={loading}
                  >
                    <span className="ca-btn-icon">{loading ? '🔄' : '🔄'}</span>
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>
              </div>
              <div className="ca-date-range-info">
                Showing data from <strong>{formatDate(dateRange.startDate)}</strong> to <strong>{formatDate(dateRange.endDate)}</strong>
                {reportData.purchases.length === 0 && (
                  <span className="ca-warning-text"> - No purchases found!</span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="ca-tabs-container">
            <div className="ca-tabs">
              <button 
                className={`ca-tab ${activeTab === "overview" ? "ca-tab-active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <span className="ca-tab-icon">📈</span>
                Overview
              </button>
              <button 
                className={`ca-tab ${activeTab === "sales" ? "ca-tab-active" : ""}`}
                onClick={() => setActiveTab("sales")}
              >
                <span className="ca-tab-icon">🧾</span>
                Sales
                <span className="ca-tab-badge">{reportData.sales.length}</span>
              </button>
              <button 
                className={`ca-tab ${activeTab === "purchases" ? "ca-tab-active" : ""}`}
                onClick={() => setActiveTab("purchases")}
              >
                <span className="ca-tab-icon">📥</span>
                Purchases
                <span className="ca-tab-badge">{reportData.purchases.length}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="ca-loading-state">
              <div className="ca-loading-spinner"></div>
              <p className="ca-loading-text">Loading CA report data...</p>
              <p className="ca-loading-subtext">Please wait while we fetch your financial data</p>
            </div>
          )}

          {/* Overview Tab */}
          {!loading && activeTab === "overview" && (
            <div className="ca-overview-content">
              {/* Summary Cards */}
              <div className="ca-summary-grid">
                <div className="ca-summary-card ca-card-sales">
                  <div className="ca-summary-content">
                    <div className="ca-summary-text">
                      <h6 className="ca-summary-title">Total Sales</h6>
                      <h3 className="ca-summary-value">{formatCurrency(reportData.summary.totalSales)}</h3>
                    </div>
                    <div className="ca-summary-icon">
                      <span className="ca-icon-sales">💰</span>
                    </div>
                  </div>
                  <div className="ca-summary-footer">
                    <span className="ca-summary-count">{reportData.sales.length} transactions</span>
                    <span className="ca-summary-trend">📈</span>
                  </div>
                </div>

                <div className="ca-summary-card ca-card-purchases">
                  <div className="ca-summary-content">
                    <div className="ca-summary-text">
                      <h6 className="ca-summary-title">Total Purchases</h6>
                      <h3 className="ca-summary-value">{formatCurrency(reportData.summary.totalPurchases)}</h3>
                    </div>
                    <div className="ca-summary-icon">
                      <span className="ca-icon-purchases">🛒</span>
                    </div>
                  </div>
                  <div className="ca-summary-footer">
                    <span className="ca-summary-count">{reportData.purchases.length} transactions</span>
                    <span className="ca-summary-trend">📦</span>
                  </div>
                </div>

                <div className="ca-summary-card ca-card-profit">
                  <div className="ca-summary-content">
                    <div className="ca-summary-text">
                      <h6 className="ca-summary-title">Gross Profit</h6>
                      <h3 className="ca-summary-value">{formatCurrency(reportData.summary.profitLoss)}</h3>
                    </div>
                    <div className="ca-summary-icon">
                      <span className="ca-icon-profit">📈</span>
                    </div>
                  </div>
                  <div className="ca-summary-footer">
                    <span className="ca-summary-margin">
                      Margin: {(reportData.summary.profitMargin || 0).toFixed(2)}%
                    </span>
                    <span className={`ca-profit-indicator ${reportData.summary.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                      {reportData.summary.profitLoss >= 0 ? '↑' : '↓'}
                    </span>
                  </div>
                </div>

                <div className="ca-summary-card ca-card-gst">
                  <div className="ca-summary-content">
                    <div className="ca-summary-text">
                      <h6 className="ca-summary-title">Total GST</h6>
                      <h3 className="ca-summary-value">{formatCurrency(reportData.summary.totalGST)}</h3>
                    </div>
                    <div className="ca-summary-icon">
                      <span className="ca-icon-gst">🏛️</span>
                    </div>
                  </div>
                  <div className="ca-summary-footer">
                    <span className="ca-summary-description">GST collected on sales</span>
                    <span className="ca-gst-indicator">🔰</span>
                  </div>
                </div>
              </div>

              {/* GST Breakdown */}
              <div className="ca-gst-breakdown-card">
                <div className="ca-gst-header">
                  <h5 className="ca-gst-title">🧾 GST Breakdown Analysis</h5>
                  <div className="ca-gst-total">
                    Total GST: {formatCurrency(reportData.summary.totalGST)}
                  </div>
                </div>
                <div className="ca-gst-body">
                  <div className="ca-gst-grid">
                    <div className="ca-gst-item ca-gst-cgst">
                      <div className="ca-gst-type">
                        <span className="ca-gst-icon">🔵</span>
                        CGST
                      </div>
                      <h4 className="ca-gst-amount">{formatCurrency(reportData.summary.gstBreakdown?.cgst)}</h4>
                      <div className="ca-gst-percentage">
                        {reportData.summary.totalGST > 0 ? 
                          ((reportData.summary.gstBreakdown?.cgst / reportData.summary.totalGST) * 100).toFixed(1) + '%' 
                          : '0%'}
                      </div>
                    </div>
                    <div className="ca-gst-item ca-gst-sgst">
                      <div className="ca-gst-type">
                        <span className="ca-gst-icon">🟢</span>
                        SGST
                      </div>
                      <h4 className="ca-gst-amount">{formatCurrency(reportData.summary.gstBreakdown?.sgst)}</h4>
                      <div className="ca-gst-percentage">
                        {reportData.summary.totalGST > 0 ? 
                          ((reportData.summary.gstBreakdown?.sgst / reportData.summary.totalGST) * 100).toFixed(1) + '%' 
                          : '0%'}
                      </div>
                    </div>
                    <div className="ca-gst-item ca-gst-igst">
                      <div className="ca-gst-type">
                        <span className="ca-gst-icon">🟠</span>
                        IGST
                      </div>
                      <h4 className="ca-gst-amount">{formatCurrency(reportData.summary.gstBreakdown?.igst)}</h4>
                      <div className="ca-gst-percentage">
                        {reportData.summary.totalGST > 0 ? 
                          ((reportData.summary.gstBreakdown?.igst / reportData.summary.totalGST) * 100).toFixed(1) + '%' 
                          : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="ca-stats-grid">
                <div className="ca-stat-card">
                  <div className="ca-stat-content">
                    <span className="ca-stat-icon">📋</span>
                    <div className="ca-stat-text">
                      <h4 className="ca-stat-value">{reportData.summary.totalTransactions}</h4>
                      <p className="ca-stat-label">Total Transactions</p>
                    </div>
                  </div>
                </div>
                <div className="ca-stat-card">
                  <div className="ca-stat-content">
                    <span className="ca-stat-icon">📦</span>
                    <div className="ca-stat-text">
                      <h4 className="ca-stat-value">{reportData.summary.totalItemsSold}</h4>
                      <p className="ca-stat-label">Items Sold</p>
                    </div>
                  </div>
                </div>
                <div className="ca-stat-card">
                  <div className="ca-stat-content">
                    <span className="ca-stat-icon">🛍️</span>
                    <div className="ca-stat-text">
                      <h4 className="ca-stat-value">{reportData.summary.totalItemsPurchased}</h4>
                      <p className="ca-stat-label">Items Purchased</p>
                    </div>
                  </div>
                </div>
                <div className="ca-stat-card">
                  <div className="ca-stat-content">
                    <span className="ca-stat-icon">⚖️</span>
                    <div className="ca-stat-text">
                      <h4 className="ca-stat-value">{(reportData.summary.profitMargin || 0).toFixed(1)}%</h4>
                      <p className="ca-stat-label">Profit Margin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {!loading && activeTab === "sales" && (
            <div className="ca-table-section">
              <div className="ca-table-card">
                <div className="ca-table-header">
                  <h5 className="ca-table-title">
                    🧾 Sales Transactions
                  </h5>
                  <div className="ca-table-info">
                    <span className="ca-table-count">{reportData.sales.length} transactions</span>
                    <span className="ca-table-period">
                      {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                    </span>
                  </div>
                </div>
                <div className="ca-table-container">
                  {reportData.sales.length === 0 ? (
                    <div className="ca-empty-state">
                      <div className="ca-empty-icon">📊</div>
                      <h4 className="ca-empty-title">No Sales Transactions</h4>
                      <p className="ca-empty-text">No sales transactions found for the selected period</p>
                    </div>
                  ) : (
                    <div className="ca-table-responsive">
                      <table className="ca-data-table">
                        <thead className="ca-table-head">
                          <tr>
                            <th className="ca-col-date">Date</th>
                            <th className="ca-col-party">Customer</th>
                            <th className="ca-col-gstin">GSTIN</th>
                            <th className="ca-col-invoice">Invoice No</th>
                            <th className="ca-col-amount">Amount</th>
                            <th className="ca-col-gst">GST</th>
                            <th className="ca-col-status">Status</th>
                            <th className="ca-col-actions">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="ca-table-body">
                          {reportData.sales.map((sale, index) => (
                            <tr key={`sale-${sale._id || index}`} className="ca-table-row">
                              <td className="ca-col-date">
                                <div className="ca-date-primary">{formatDate(sale.invoiceDate)}</div>
                                <div className="ca-time-secondary">
                                  {sale.invoiceDate ? new Date(sale.invoiceDate).toLocaleTimeString('en-IN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : ''}
                                </div>
                              </td>
                              <td className="ca-col-party">
                                <div className="ca-party-name">{sale.customerName || 'N/A'}</div>
                                {sale.placeOfSupply && (
                                  <div className="ca-pos-info">
                                    POS: {sale.placeOfSupply}
                                  </div>
                                )}
                              </td>
                              <td className="ca-col-gstin">
                                <code className="ca-gstin-code">{formatGSTIN(sale.customerGstin)}</code>
                              </td>
                              <td className="ca-col-invoice">
                                <code className="ca-invoice-code">{sale.invoiceNo || 'N/A'}</code>
                              </td>
                              <td className="ca-col-amount">
                                <span className="ca-amount-value">{formatCurrency(sale.grandTotal)}</span>
                              </td>
                              <td className="ca-col-gst">
                                <span className="ca-gst-value">{formatCurrency(sale.gstTotal)}</span>
                              </td>
                              <td className="ca-col-status">
                                <span className={getStatusBadgeClass(sale.status)}>
                                  {sale.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="ca-col-actions">
                                <button
                                  className="ca-action-btn ca-view-btn"
                                  onClick={() => navigate(`/invoice-preview/${sale._id}`)}
                                  title="View Invoice Details"
                                >
                                  <span className="ca-action-icon">👁️</span>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="ca-table-foot">
                          <tr>
                            <td colSpan="4" className="ca-total-label">
                              <strong>Total Sales:</strong>
                            </td>
                            <td className="ca-total-amount">
                              <strong>{formatCurrency(reportData.summary.totalSales)}</strong>
                            </td>
                            <td className="ca-total-gst">
                              <strong>{formatCurrency(reportData.summary.totalGST)}</strong>
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Purchases Tab */}
          {!loading && activeTab === "purchases" && (
            <div className="ca-table-section">
              <div className="ca-table-card">
                <div className="ca-table-header">
                  <h5 className="ca-table-title">
                    📥 Purchase Transactions
                  </h5>
                  <div className="ca-table-info">
                    <span className="ca-table-count">{reportData.purchases.length} transactions</span>
                    <span className="ca-table-period">
                      {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                    </span>
                  </div>
                </div>
                <div className="ca-table-container">
                  {reportData.purchases.length === 0 ? (
                    <div className="ca-empty-state">
                      <div className="ca-empty-icon">📊</div>
                      <h4 className="ca-empty-title">No Purchase Transactions</h4>
                      <p className="ca-empty-text">
                        {loading ? 'Loading...' : 'No purchase transactions found for the selected period. Check if purchases exist in your system.'}
                      </p>
                      <button 
                        className="ca-btn ca-btn-secondary"
                        onClick={debugAPI}
                      >
                        Debug API Response
                      </button>
                    </div>
                  ) : (
                    <div className="ca-table-responsive">
                      <table className="ca-data-table">
                        <thead className="ca-table-head">
                          <tr>
                            <th className="ca-col-date">Date</th>
                            <th className="ca-col-party">Supplier</th>
                            <th className="ca-col-gstin">GSTIN</th>
                            <th className="ca-col-invoice">Invoice No</th>
                            <th className="ca-col-amount">Amount</th>
                            <th className="ca-col-tax">Tax</th>
                            <th className="ca-col-status">Status</th>
                            <th className="ca-col-actions">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="ca-table-body">
                          {reportData.purchases.map((purchase, index) => (
                            <tr key={`purchase-${purchase._id || index}`} className="ca-table-row">
                              <td className="ca-col-date">
                                <div className="ca-date-primary">{formatDate(purchase.invoiceDate)}</div>
                                <div className="ca-time-secondary">
                                  {purchase.invoiceDate ? new Date(purchase.invoiceDate).toLocaleTimeString('en-IN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : ''}
                                </div>
                              </td>
                              <td className="ca-col-party">
                                <div className="ca-party-name">{purchase.supplierName || 'N/A'}</div>
                                {purchase.placeOfSupply && (
                                  <div className="ca-pos-info">
                                    POS: {purchase.placeOfSupply}
                                  </div>
                                )}
                              </td>
                              <td className="ca-col-gstin">
                                <code className="ca-gstin-code">{formatGSTIN(purchase.supplierGstin)}</code>
                              </td>
                              <td className="ca-col-invoice">
                                <code className="ca-invoice-code">{purchase.invoiceNo || 'N/A'}</code>
                              </td>
                              <td className="ca-col-amount">
                                <span className="ca-amount-value">{formatCurrency(purchase.grandTotal)}</span>
                              </td>
                              <td className="ca-col-tax">
                                <span className="ca-tax-value">{formatCurrency(purchase.totalTax)}</span>
                              </td>
                              <td className="ca-col-status">
                                <span className={getStatusBadgeClass(purchase.status)}>
                                  {purchase.status || 'Completed'}
                                </span>
                              </td>
                              <td className="ca-col-actions">
                                <button
                                  className="ca-action-btn ca-view-btn"
                                  onClick={() => alert('Purchase details view would open here')}
                                  title="View Purchase Details"
                                >
                                  <span className="ca-action-icon">👁️</span>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="ca-table-foot">
                          <tr>
                            <td colSpan="4" className="ca-total-label">
                              <strong>Total Purchases:</strong>
                            </td>
                            <td className="ca-total-amount">
                              <strong>{formatCurrency(reportData.summary.totalPurchases)}</strong>
                            </td>
                            <td className="ca-total-tax">
                              <strong>{formatCurrency(reportData.purchases.reduce((sum, p) => sum + (p.totalTax || 0), 0))}</strong>
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verification Notes */}
          {!loading && (
            <div className="ca-notes-section">
              <div className="ca-notes-card">
                <div className="ca-notes-header">
                  <h5 className="ca-notes-title">✅ CA Verification Notes</h5>
                  <div className="ca-notes-subtitle">Important checklist for Chartered Accountant verification</div>
                </div>
                <div className="ca-notes-body">
                  <div className="ca-notes-grid">
                    <div className="ca-checklist-section">
                      <h6 className="ca-checklist-title">📋 Verification Checklist:</h6>
                      <ul className="ca-checklist">
                        <li className="ca-checklist-item">
                          <span className="ca-check-icon">✅</span>
                          Verify all invoices have proper GST numbers
                        </li>
                        <li className="ca-checklist-item">
                          <span className="ca-check-icon">✅</span>
                          Check HSN codes for all items
                        </li>
                        <li className="ca-checklist-item">
                          <span className="ca-check-icon">✅</span>
                          Verify place of supply matches billing addresses
                        </li>
                        <li className="ca-checklist-item">
                          <span className="ca-check-icon">✅</span>
                          Ensure GST calculations are correct
                        </li>
                        <li className="ca-checklist-item">
                          <span className="ca-check-icon">✅</span>
                          Check input tax credit eligibility
                        </li>
                        <li className="ca-checklist-item">
                          <span className="ca-check-icon">✅</span>
                          Verify reverse charge mechanism if applicable
                        </li>
                      </ul>
                    </div>
                    <div className="ca-report-info-section">
                      <h6 className="ca-info-title">📊 Report Information:</h6>
                      <div className="ca-info-list">
                        <div className="ca-info-item">
                          <span className="ca-info-label">Report Period:</span>
                          <span className="ca-info-value">{formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}</span>
                        </div>
                        <div className="ca-info-item">
                          <span className="ca-info-label">Total Transactions:</span>
                          <span className="ca-info-value">{reportData.summary.totalTransactions}</span>
                        </div>
                        <div className="ca-info-item">
                          <span className="ca-info-label">Generated On:</span>
                          <span className="ca-info-value">{new Date().toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="ca-info-item">
                          <span className="ca-info-label">Data Source:</span>
                          <span className="ca-info-value">Nandi Softech Solutions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CAReport;