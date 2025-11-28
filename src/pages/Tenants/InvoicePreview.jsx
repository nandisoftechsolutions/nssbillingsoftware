// src/pages/Tenants/InvoicePreview.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./InvoicePreview.css";

function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [layoutType, setLayoutType] = useState("a4"); // "a4" | "thermal"

  // ✅ Valid status values
  const VALID_STATUSES = {
    DRAFT: "Draft",
    PENDING: "Pending",
    PAID: "Paid",
    OVERDUE: "Overdue",
    CANCELLED: "Cancelled",
  };

  const normalizeStatus = (s) => {
    if (!s) return VALID_STATUSES.DRAFT;
    const key = String(s).trim().toLowerCase();
    if (key === "paid") return VALID_STATUSES.PAID;
    if (key === "pending") return VALID_STATUSES.PENDING;
    if (key === "overdue") return VALID_STATUSES.OVERDUE;
    if (key === "cancelled" || key === "canceled") return VALID_STATUSES.CANCELLED;
    if (key === "draft") return VALID_STATUSES.DRAFT;
    return s;
  };

  const getStatusChipClass = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case VALID_STATUSES.PAID:
        return "inv-preview-status inv-preview-status-paid";
      case VALID_STATUSES.OVERDUE:
        return "inv-preview-status inv-preview-status-overdue";
      case VALID_STATUSES.PENDING:
        return "inv-preview-status inv-preview-status-pending";
      case VALID_STATUSES.CANCELLED:
        return "inv-preview-status inv-preview-status-cancelled";
      case VALID_STATUSES.DRAFT:
      default:
        return "inv-preview-status inv-preview-status-draft";
    }
  };

  const getStatusTextClass = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case VALID_STATUSES.PAID:
        return "inv-preview-status-text inv-preview-status-paid";
      case VALID_STATUSES.OVERDUE:
        return "inv-preview-status-text inv-preview-status-overdue";
      case VALID_STATUSES.PENDING:
        return "inv-preview-status-text inv-preview-status-pending";
      case VALID_STATUSES.CANCELLED:
        return "inv-preview-status-text inv-preview-status-cancelled";
      case VALID_STATUSES.DRAFT:
      default:
        return "inv-preview-status-text inv-preview-status-draft";
    }
  };

  /* -----------------------------
     COMPANY SETTINGS FETCHING
  ----------------------------- */
  const fetchCompanySettings = async () => {
    try {
      console.log("🔄 Fetching company settings...");
      const { data } = await api.get("/settings");
      
      if (data.success && data.data?.company) {
        console.log("✅ Company settings loaded:", data.data.company);
        return data.data.company;
      } else {
        console.warn("⚠️ No company data found in settings response");
        return null;
      }
    } catch (err) {
      console.error("❌ Failed to fetch company settings:", err);
      // Try fallback to auth/me endpoint
      try {
        console.log("🔄 Trying fallback to /auth/me...");
        const { data } = await api.get("/auth/me");
        if (data.success && data.company) {
          console.log("✅ Company data loaded from auth/me:", data.company);
          return data.company;
        }
      } catch (meErr) {
        console.error("❌ Fallback to auth/me also failed:", meErr);
      }
      return null;
    }
  };

  /* -----------------------------
     STOCK MANAGEMENT HELPERS
  ----------------------------- */
  const updateProductStock = async (productIdOrObj, quantity, operation) => {
    try {
      let actualProductId = productIdOrObj;
      if (typeof productIdOrObj === "object" && productIdOrObj !== null) {
        actualProductId = productIdOrObj._id || productIdOrObj.id;
      }

      if (!actualProductId) {
        return { success: false, skip: true, error: "No valid product ID provided" };
      }

      const productResponse = await api.get(`/products/${actualProductId}`);
      if (!productResponse?.data?.success) {
        return { success: false, skip: true, error: "Product not found" };
      }

      const product = productResponse.data.data;
      const currentStock = Number(product.availableStock || 0);
      const currentSoldStock = Number(product.soldStock || 0);
      const qty = Number(quantity || 0);

      let newAvailableStock = currentStock;
      let newSoldStock = currentSoldStock;

      if (operation === "add") {
        newAvailableStock = currentStock + qty;
        newSoldStock = Math.max(0, currentSoldStock - qty);
      } else if (operation === "deduct") {
        if (currentStock < qty) {
          return {
            success: false,
            skip: false,
            error: `Insufficient stock for ${product.name}. Available: ${currentStock}, Required: ${qty}`,
          };
        }
        newAvailableStock = currentStock - qty;
        newSoldStock = currentSoldStock + qty;
      } else {
        return { success: false, skip: true, error: "Invalid stock operation" };
      }

      const updateResponse = await api.put(`/products/${actualProductId}`, {
        availableStock: newAvailableStock,
        soldStock: newSoldStock,
      });

      if (updateResponse?.data?.success) {
        return {
          success: true,
          skip: false,
          productName: product.name,
          quantity: qty,
          operation,
        };
      } else {
        return { success: false, skip: false, error: "Failed to update product stock" };
      }
    } catch (err) {
      console.error("updateProductStock error:", err);
      if (err.response?.status === 404) {
        return { success: false, skip: true, error: "Product not found (404)" };
      }
      return {
        success: false,
        skip: false,
        error: err.response?.data?.message || err.message || "Unknown error",
      };
    }
  };

  const handleStockForStatusChange = async (invoiceObj, oldStatusRaw, newStatusRaw) => {
    try {
      if (!invoiceObj || !Array.isArray(invoiceObj.items) || invoiceObj.items.length === 0) {
        return {
          success: true,
          successfulCount: 0,
          failedCount: 0,
          skippedCount: 0,
          noChange: true,
        };
      }

      const oldStatus = normalizeStatus(oldStatusRaw);
      const newStatus = normalizeStatus(newStatusRaw);

      let operation = null;
      if (oldStatus !== VALID_STATUSES.CANCELLED && newStatus === VALID_STATUSES.CANCELLED) {
        operation = "add";
      } else if (oldStatus === VALID_STATUSES.CANCELLED && newStatus !== VALID_STATUSES.CANCELLED) {
        operation = "deduct";
      } else {
        return {
          success: true,
          successfulCount: 0,
          failedCount: 0,
          skippedCount: 0,
          noChange: true,
        };
      }

      const updatePromises = invoiceObj.items.map((item) => {
        const productId = item.productId;
        const qty = Number(item.qty || 0);
        return updateProductStock(productId, qty, operation);
      });

      const results = await Promise.all(updatePromises);

      const successful = results.filter((r) => r.success === true);
      const skipped = results.filter((r) => r.success === false && r.skip === true);
      const failed = results.filter((r) => r.success === false && !r.skip);

      if (failed.length > 0 && successful.length > 0) {
        const rollbackOperation = operation === "add" ? "deduct" : "add";
        const rollbackResults = [];

        for (let i = 0; i < invoiceObj.items.length; i++) {
          const item = invoiceObj.items[i];
          try {
            const rb = await updateProductStock(
              item.productId,
              Number(item.qty || 0),
              rollbackOperation
            );
            rollbackResults.push(rb);
          } catch (rbErr) {
            console.error("Rollback failed for item", item, rbErr);
            rollbackResults.push({
              success: false,
              skip: false,
              error: rbErr.message || String(rbErr),
            });
          }
        }

        console.warn(
          "Partial failure during stock update. Attempted rollback. Rollback results:",
          rollbackResults
        );

        return {
          success: false,
          successfulCount: successful.length,
          failedCount: failed.length,
          skippedCount: skipped.length,
          failedUpdates: failed,
          skippedUpdates: skipped,
          operation,
        };
      }

      return {
        success: failed.length === 0,
        successfulCount: successful.length,
        failedCount: failed.length,
        skippedCount: skipped.length,
        failedUpdates: failed,
        skippedUpdates: skipped,
        operation,
      };
    } catch (err) {
      console.error("Error in handleStockForStatusChange:", err);
      throw new Error(err.message || "Stock management failed");
    }
  };

  /* -----------------------------
     FETCH INVOICE + COMPANY SETTINGS
  ----------------------------- */
  useEffect(() => {
    const fetchInvoiceAndCompany = async () => {
      try {
        setLoading(true);

        // 1) Load invoice
        const { data: invoiceRes } = await api.get(`/invoices/${id}`);
        if (!invoiceRes || !invoiceRes.success || !invoiceRes.data) {
          setError("Invoice not found.");
          setLoading(false);
          return;
        }

        const inv = invoiceRes.data;
        setInvoice(inv);

        // 2) Load company settings
        const companyData = await fetchCompanySettings();
        if (companyData) {
          setCompany(companyData);
        } else {
          console.warn("⚠️ No company settings found, using invoice embedded data");
          // Fallback to invoice embedded company data if available
          if (inv.companyId && typeof inv.companyId === "object") {
            setCompany(inv.companyId);
          }
        }

      } catch (err) {
        console.error("Failed to load invoice:", err);
        if (err.response?.status === 404) {
          setError("Invoice not found. It may have been deleted.");
        } else {
          setError("Failed to load invoice. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceAndCompany();
    } else {
      setError("Invalid invoice ID");
      setLoading(false);
    }
  }, [id]);

  /* -----------------------------
     PRINT + PDF
  ----------------------------- */
  const handlePrint = () => {
    const printContent = document.getElementById("inv-print-content");
    if (!printContent) {
      alert("Invoice content not available for printing.");
      return;
    }

    const printWindow = window.open("", "_blank");
    const title = invoice?.invoiceNo || "Invoice";
    const isThermal = layoutType === "thermal";

    const cssForA4 = `
      @page {
        size: A4;
        margin: 12mm;
      }
      body {
        font-family: 'Arial', sans-serif;
        margin: 0 !important;
        padding: 0 !important;
        color: #333;
        font-size: 12px;
        line-height: 1.4;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-a4-layout {
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        padding: 12mm !important;
        background: white !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: always;
        page-break-inside: avoid;
      }
      .print-header {
        border-bottom: 2px solid #2c5aa0;
        padding-bottom: 12px;
        margin-bottom: 15px;
      }
      .company-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .company-logo {
        max-width: 120px !important;
        max-height: 60px !important;
        object-fit: contain;
      }
      .company-name {
        font-size: 18px;
        font-weight: bold;
        color: #2c5aa0;
        margin-bottom: 4px;
      }
      .company-address {
        font-size: 11px;
        margin-bottom: 2px;
        color: #555;
        line-height: 1.3;
      }
      .invoice-title-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px 0;
        padding: 12px;
        background: #f8f9fa !important;
        border-radius: 4px;
        border: 1px solid #dee2e6;
      }
      .invoice-title {
        font-size: 20px;
        font-weight: bold;
        color: #2c5aa0;
        margin: 0;
        text-transform: uppercase;
      }
      .customer-sections {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }
      .customer-section {
        padding: 12px;
        background: #f8f9fa !important;
        border-radius: 4px;
        border: 1px solid #dee2e6;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 11px;
        border: 1px solid #ddd;
      }
      .items-table th {
        background: #2c5aa0 !important;
        color: white !important;
        font-weight: bold;
        padding: 6px 4px;
        border: 1px solid #1e4080;
        text-align: center;
        font-size: 10px;
      }
      .items-table td {
        padding: 5px 3px;
        border: 1px solid #ddd;
        text-align: center;
        font-size: 10px;
      }
      .item-description {
        text-align: left;
        padding-left: 6px !important;
      }
      .text-right {
        text-align: right;
        padding-right: 6px !important;
      }
      .totals-section {
        background: #f8f9fa !important;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        margin: 15px 0;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px solid #e9ecef;
        font-size: 12px;
      }
      .print-grand-total {
        background: #2c5aa0 !important;
        color: white !important;
        font-weight: bold;
        margin: 8px -12px -12px -12px;
        padding: 8px 12px;
        border-radius: 0 0 3px 3px;
        font-size: 13px;
      }
      .invoice-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 2px solid #2c5aa0;
      }
      .bank-details {
        padding: 12px;
        background: #f8f9fa !important;
        border-radius: 4px;
        border: 1px solid #dee2e6;
      }
      .signature-image {
        max-width: 100px !important;
        max-height: 40px !important;
        margin: 15px 0 4px 0;
      }
      .signature-line {
        width: 150px;
        height: 1px;
        background: #000;
        margin: 30px auto 4px auto;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .bold { font-weight: bold; }
    `;

    const cssForThermal = `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        font-family: 'Courier New', monospace;
        margin: 0;
        padding: 0;
        color: #000;
        font-size: 10px;
        line-height: 1.2;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .thermal-root {
        width: 76mm;
        margin: 0 auto;
        padding: 5px;
        box-shadow: none;
      }
      .thermal-header {
        text-align: center;
        margin-bottom: 8px;
      }
      .thermal-separator {
        border-bottom: 1px dashed #666;
        margin: 6px 0;
      }
      .thermal-items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 9px;
      }
      .thermal-items-table th {
        border-bottom: 1px solid #000;
        padding: 3px 1px;
        text-align: left;
        font-weight: bold;
      }
      .thermal-items-table td {
        padding: 2px 1px;
        border-bottom: 1px dotted #ccc;
      }
      .thermal-totals {
        margin-top: 8px;
        font-size: 10px;
      }
      .thermal-grand {
        font-weight: bold;
        border-top: 1px double #000;
        padding-top: 4px;
        margin-top: 4px;
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${company?.name || "Invoice"}</title>
          <style>
            ${isThermal ? cssForThermal : cssForA4}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
                setTimeout(function () {
                  window.close();
                }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      if (!invoice) throw new Error("Invoice data not loaded");

      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
        timeout: 30000,
      });

      if (!response.data) throw new Error("No PDF data received from server");

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      if (err.response?.status === 404) {
        alert("PDF not found. Try the 'Print' option.");
      } else if (err.code === "ECONNABORTED") {
        alert("PDF download timed out. Try again or use the 'Print' option.");
      } else {
        alert("Failed to download PDF. Try 'Print' or contact support.");
      }
    } finally {
      setPdfLoading(false);
    }
  };

  /* -----------------------------
     STATUS CHANGE FLOW
  ----------------------------- */
  const handleStatusChange = async (newStatusRaw) => {
    if (!invoice) {
      alert("Invoice not loaded");
      return;
    }

    const newStatus = normalizeStatus(newStatusRaw);
    const oldStatus = normalizeStatus(invoice.status);

    if (newStatus === oldStatus) {
      setShowStatusModal(false);
      return;
    }

    try {
      setUpdatingStatus(true);

      const stockResult = await handleStockForStatusChange(invoice, oldStatus, newStatus);

      if (!stockResult.success && !stockResult.noChange) {
        const errMsg = stockResult.failedUpdates?.[0]?.error || "Stock update failed";
        throw new Error(errMsg);
      }

      const { data } = await api.patch(`/invoices/${id}/status`, {
        status: newStatus,
      });

      if (data && data.success) {
        setInvoice((prev) => ({ ...prev, status: newStatus }));
        setShowStatusModal(false);

        let msg = `✅ Invoice status updated to ${newStatus}.`;
        if (stockResult.operation === "add") {
          if (stockResult.successfulCount > 0) {
            msg += `\n📦 Stock re-added for ${stockResult.successfulCount} item(s).`;
          }
          if (stockResult.skippedCount > 0) {
            msg += `\n⚠️ ${stockResult.skippedCount} item(s) skipped (product missing).`;
          }
        } else if (stockResult.operation === "deduct") {
          if (stockResult.successfulCount > 0) {
            msg += `\n📦 Stock deducted for ${stockResult.successfulCount} item(s).`;
          }
          if (stockResult.skippedCount > 0) {
            msg += `\n⚠️ ${stockResult.skippedCount} item(s) skipped (product missing).`;
          }
        }

        alert(msg);
      } else {
        throw new Error(data?.message || "Failed to update invoice status");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      let msg = "❌ Failed to update invoice status.";
      if (err && err.message) msg += `\n${err.message}`;
      alert(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* -----------------------------
     OTHER HELPERS
  ----------------------------- */
  const handleShare = (via) => {
    if (!invoice) return;

    const invoiceDetails = `Invoice ${invoice.invoiceNo}
Customer: ${invoice.customerName}
Amount: ₹${Number(invoice.grandTotal || 0).toFixed(2)}
Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
Status: ${invoice.status || "N/A"}`;

    if (via === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(invoiceDetails)}`, "_blank");
    } else if (via === "email") {
      const subject = `Invoice ${invoice.invoiceNo}`;
      const body = `Invoice Details:\n\n${invoiceDetails}\n\nThank you!`;
      window.location.href = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  /* -----------------------------
     Layout components
  ----------------------------- */

  const A4Layout = () => (
    <div className="invoice-a4-layout">
      {/* Header with logo and company info */}
      <div className="print-header">
        <div className="company-header">
          <div className="company-logo-section">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company?.name || "Company Logo"}
                className="company-logo"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            {!company?.logoUrl && (
              <div className="company-name-large">
                {company?.name || "Your Business Name"}
              </div>
            )}
          </div>
          <div className="company-details">
            <div className="company-name">{company?.name || ""}</div>
            {company?.address && <div className="company-address">{company.address}</div>}
            {company?.gstNumber && <div><strong>GSTIN:</strong> {company.gstNumber}</div>}
            {company?.state && (
              <div>
                <strong>State:</strong> {company.state}
                {company.stateCode ? ` (${company.stateCode})` : ""}
              </div>
            )}
            {company?.phone && <div><strong>Phone:</strong> {company.phone}</div>}
            {company?.email && <div><strong>Email:</strong> {company.email}</div>}
          </div>
        </div>
      </div>

      {/* Invoice Title & Meta */}
      <div className="invoice-title-section">
        <h1 className="invoice-title">TAX INVOICE</h1>
        <div className="invoice-meta">
          <div className="meta-row">
            <strong>Invoice No:</strong> {invoice.invoiceNo}
          </div>
          <div className="meta-row">
            <strong>Invoice Date:</strong>{" "}
            {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
          </div>
          {invoice.dueDate && (
            <div className="meta-row">
              <strong>Due Date:</strong>{" "}
              {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
            </div>
          )}
          <div className="meta-row">
            <strong>Place of Supply:</strong> {invoice.placeOfSupply || "-"}
          </div>
        </div>
      </div>

      {/* Customer section */}
      <div className="customer-sections">
        <div className="customer-section">
          <h3 className="section-title">Bill To</h3>
          <div className="customer-details">
            <div className="customer-name">{invoice.customerName}</div>
            {invoice.customerAddress && <div className="customer-address">{invoice.customerAddress}</div>}
            {invoice.customerPhone && <div><strong>Phone:</strong> {invoice.customerPhone}</div>}
            {invoice.customerEmail && <div><strong>Email:</strong> {invoice.customerEmail}</div>}
          </div>
        </div>

        <div className="customer-section">
          <h3 className="section-title">Ship To</h3>
          <div className="customer-details">
            <div className="customer-name">{invoice.shippingName || invoice.customerName}</div>
            {invoice.shippingAddress && <div className="customer-address">{invoice.shippingAddress}</div>}
            {!invoice.shippingAddress && invoice.customerAddress && (
              <div className="customer-address">{invoice.customerAddress}</div>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="items-table">
        <thead>
          <tr>
            <th width="4%">Sl.</th>
            <th width="26%">Description</th>
            <th width="8%">HSN/SAC</th>
            <th width="6%">Qty</th>
            <th width="10%">Rate (₹)</th>
            <th width="12%">Taxable Value (₹)</th>
            <th width="6%">GST %</th>
            <th width="8%">CGST (₹)</th>
            <th width="8%">SGST (₹)</th>
            <th width="8%">IGST (₹)</th>
            <th width="10%">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items &&
            invoice.items.map((item, index) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.price) || 0;
              const gstRate = Number(item.gstRate) || 0;
              const taxable = qty * rate;
              const gstAmount = (taxable * gstRate) / 100;

              const sameState =
                company?.stateCode?.toUpperCase() ===
                invoice.placeOfSupply?.toUpperCase();

              const cgst = sameState ? gstAmount / 2 : 0;
              const sgst = sameState ? gstAmount / 2 : 0;
              const igst = sameState ? 0 : gstAmount;
              const total = taxable + gstAmount;

              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="item-description">{item.name}</td>
                  <td className="text-center">{item.hsn}</td>
                  <td className="text-center">{qty}</td>
                  <td className="text-right">{rate.toFixed(2)}</td>
                  <td className="text-right">{taxable.toFixed(2)}</td>
                  <td className="text-center">{gstRate}%</td>
                  <td className="text-right">{cgst ? cgst.toFixed(2) : "-"}</td>
                  <td className="text-right">{sgst ? sgst.toFixed(2) : "-"}</td>
                  <td className="text-right">{igst ? igst.toFixed(2) : "-"}</td>
                  <td className="text-right">{total.toFixed(2)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals-section">
        <div className="total-row">
          <span>Taxable Value:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="total-row">
          <span>CGST:</span>
          <span>{formatCurrency(invoice.cgstTotal)}</span>
        </div>
        <div className="total-row">
          <span>SGST:</span>
          <span>{formatCurrency(invoice.sgstTotal)}</span>
        </div>
        <div className="total-row">
          <span>IGST:</span>
          <span>{formatCurrency(invoice.igstTotal)}</span>
        </div>
        <div className="total-row">
          <span>Total Tax:</span>
          <span>{formatCurrency(invoice.gstTotal)}</span>
        </div>
        <div className="total-row">
          <span>Round Off:</span>
          <span>{formatCurrency(invoice.roundOff)}</span>
        </div>
        <div className="total-row print-grand-total">
          <span>Grand Total:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
        {invoice.amountInWords && (
          <div className="amount-words">
            <strong>Amount in Words:</strong> {invoice.amountInWords}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="invoice-footer">
        <div className="bank-details">
          <h4>Bank Details</h4>
          {company?.bankName && <div><strong>Bank:</strong> {company.bankName}</div>}
          {company?.bankAccount && <div><strong>Account No:</strong> {company.bankAccount}</div>}
          {company?.ifsc && <div><strong>IFSC:</strong> {company.ifsc}</div>}
          {(!company?.bankName && !company?.bankAccount && !company?.ifsc) && (
            <div>Bank details not provided</div>
          )}
        </div>

        <div className="signature-section">
          <div className="declaration">
            <p>
              <strong>Declaration:</strong> We declare that this invoice shows the
              actual price of the goods/services and that all particulars are true
              and correct.
            </p>
          </div>
          <div className="signature">
            <div>For {company?.name || "Your Business"}</div>
            {company?.signatureUrl ? (
              <img
                src={company.signatureUrl}
                alt="Authorized Signature"
                className="signature-image"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            {!company?.signatureUrl && <div className="signature-line"></div>}
            <div className="signature-text">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );

  const ThermalLayout = () => (
    <div className="thermal-root">
      <div className="thermal-header">
        <div className="thermal-company-name bold">
          {company?.name || "Your Business"}
        </div>
        {company?.address && (
          <div className="thermal-company-address text-center">
            {company.address}
          </div>
        )}
        {company?.phone && <div>Ph: {company.phone}</div>}
        {company?.gstNumber && <div>GSTIN: {company.gstNumber}</div>}
      </div>

      <div className="thermal-separator" />

      <div className="thermal-meta">
        <div className="thermal-meta-row">
          <span>Invoice:</span>
          <span>{invoice.invoiceNo}</span>
        </div>
        <div className="thermal-meta-row">
          <span>Date:</span>
          <span>
            {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
          </span>
        </div>
        <div className="thermal-meta-row">
          <span>Customer:</span>
          <span>{invoice.customerName}</span>
        </div>
      </div>

      <div className="thermal-separator" />

      <table className="thermal-items-table">
        <thead>
          <tr>
            <th className="t-col-item text-left">Item</th>
            <th className="t-col-qty text-center">Qty</th>
            <th className="t-col-rate text-right">Rate</th>
            <th className="t-col-amt text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items &&
            invoice.items.map((item, i) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.price) || 0;
              const gstRate = Number(item.gstRate) || 0;
              const taxable = qty * rate;
              const gstAmount = (taxable * gstRate) / 100;
              const total = taxable + gstAmount;
              return (
                <tr key={i}>
                  <td className="t-col-item text-left">{item.name}</td>
                  <td className="t-col-qty text-center">{qty}</td>
                  <td className="t-col-rate text-right">{rate.toFixed(0)}</td>
                  <td className="t-col-amt text-right">{total.toFixed(0)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <div className="thermal-separator" />

      <div className="thermal-totals">
        <div className="thermal-total-row">
          <span>Sub Total:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="thermal-total-row">
          <span>GST:</span>
          <span>{formatCurrency(invoice.gstTotal)}</span>
        </div>
        <div className="thermal-total-row">
          <span>Round Off:</span>
          <span>{formatCurrency(invoice.roundOff)}</span>
        </div>
        <div className="thermal-total-row thermal-grand">
          <span>Grand Total:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
      </div>

      {invoice.amountInWords && (
        <>
          <div className="thermal-separator" />
          <div className="thermal-amount-words">
            <div className="bold">Amt in words:</div>
            <div>{invoice.amountInWords}</div>
          </div>
        </>
      )}

      <div className="thermal-separator" />
      <div className="thermal-footer text-center">
        <div>Thank you. Visit Again!</div>
        <div style={{ marginTop: 4, fontSize: 8 }}>
          Powered by Nandi Billing Software
        </div>
      </div>
    </div>
  );

  /* -----------------------------
     RENDER STATES
  ----------------------------- */
  if (loading) {
    return (
      <div className="inv-preview-container">
        <Sidebar />
        <div className="inv-preview-content">
          <div className="inv-preview-loading-state">
            <div className="inv-preview-spinner"></div>
            <p>Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="inv-preview-container">
        <Sidebar />
        <div className="inv-preview-content">
          <div className="inv-preview-error-state">
            <div className="inv-preview-error-icon">❌</div>
            <h3>{error || "Invoice not found"}</h3>
            <p>
              The invoice you're looking for doesn't exist or you don't have permission to
              view it.
            </p>
            <div className="inv-preview-action-buttons">
              <Link to="/invoices" className="inv-preview-btn inv-preview-btn-primary">
                Back to Invoices
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="inv-preview-btn inv-preview-btn-secondary"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(invoice.status);

  /* -----------------------------
     MAIN UI
  ----------------------------- */
  return (
    <div className="inv-preview-container">
      <Sidebar />
      <div className="inv-preview-content">
        {/* Header */}
        <div className="inv-preview-page-header">
          <div className="inv-preview-header-content">
            <div className="inv-preview-header-text">
              <h1>Invoice {invoice.invoiceNo}</h1>
              <p className="inv-preview-header-subtitle">
                Customer: {invoice.customerName} • Amount:{" "}
                {formatCurrency(invoice.grandTotal)}
              </p>
            </div>
            <div className="inv-preview-header-actions">
              <Link to="/create-invoice" className="inv-preview-btn inv-preview-btn-primary">
                New Invoice
              </Link>
              <Link to="/invoices" className="inv-preview-btn inv-preview-btn-outline">
                All Invoices
              </Link>
            </div>
          </div>

          {/* Layout toggle */}
          <div className="inv-preview-layout-toggle">
            <button
              className={
                layoutType === "a4"
                  ? "inv-preview-toggle-btn active"
                  : "inv-preview-toggle-btn"
              }
              onClick={() => setLayoutType("a4")}
            >
              GST A4 Invoice
            </button>
            <button
              className={
                layoutType === "thermal"
                  ? "inv-preview-toggle-btn active"
                  : "inv-preview-toggle-btn"
              }
              onClick={() => setLayoutType("thermal")}
            >
              Thermal 80mm
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="inv-preview-status-bar">
          <div className="inv-preview-status-info">
            <span className={getStatusChipClass(normalizedStatus)}>
              <span className="inv-preview-status-dot" />
              Status: {normalizedStatus}
            </span>
            {invoice.dueDate && (
              <span className="inv-preview-due-date">
                Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowStatusModal(true)}
            className="inv-preview-btn inv-preview-btn-outline"
            disabled={updatingStatus}
          >
            {updatingStatus ? "Updating..." : "Change Status"}
          </button>
        </div>

        {/* Company info debug */}
        {company && (
          <div className="inv-preview-alert inv-preview-alert-info">
            <div className="inv-preview-alert-icon">ℹ️</div>
            <div className="inv-preview-alert-content">
              <strong>Company Info Loaded</strong>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                {company.name} • {company.logoUrl ? 'Logo: ✅' : 'Logo: ❌'} • {company.signatureUrl ? 'Signature: ✅' : 'Signature: ❌'} • {company.bankName ? 'Bank: ✅' : 'Bank: ❌'}
              </div>
            </div>
          </div>
        )}

        {/* Stock info alert */}
        <div className="inv-preview-alert inv-preview-alert-info">
          <div className="inv-preview-alert-icon">💡</div>
          <div className="inv-preview-alert-content">
            <strong>Stock Management Info</strong>
            <ul>
              <li>
                <b>Changing to Cancelled</b>: stock is re-added to available inventory
              </li>
              <li>
                <b>Changing from Cancelled</b>: stock is deducted from available inventory
              </li>
              <li>Other status changes do not affect stock levels</li>
            </ul>
          </div>
        </div>

        {/* Action cards */}
        <div className="inv-preview-action-cards">
          <div className="inv-preview-action-card">
            <div className="inv-preview-action-card-header">
              <h3>PDF & Print</h3>
            </div>
            <div className="inv-preview-action-card-content">
              <div className="inv-preview-action-buttons">
                <button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="inv-preview-btn inv-preview-btn-success"
                >
                  {pdfLoading && <span className="inv-preview-spinner-small" />}
                  {pdfLoading ? "Downloading..." : "Download PDF"}
                </button>
                <button
                  onClick={handlePrint}
                  className="inv-preview-btn inv-preview-btn-primary"
                >
                  Print ({layoutType === "a4" ? "A4" : "Thermal"})
                </button>
              </div>
              <div className="inv-preview-pdf-help-text">
                <strong>Note:</strong> For the best quality PDF, use{" "}
                <b>Print → Save as PDF</b> with the layout you selected above.
              </div>
            </div>
          </div>

          <div className="inv-preview-action-card">
            <div className="inv-preview-action-card-header">
              <h3>Share Invoice</h3>
            </div>
            <div className="inv-preview-action-card-content">
              <div className="inv-preview-action-buttons">
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="inv-preview-btn inv-preview-btn-whatsapp"
                >
                  Share via WhatsApp
                </button>
                <button
                  onClick={() => handleShare("email")}
                  className="inv-preview-btn inv-preview-btn-info"
                >
                  Email Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice display (used for print as well) */}
        <div className="inv-preview-invoice-display">
          <div id="inv-print-content" className="inv-preview-invoice-content">
            {layoutType === "a4" ? <A4Layout /> : <ThermalLayout />}
          </div>
        </div>

        {/* Quick summary */}
        <div className="inv-preview-quick-summary">
          <h3>Quick Summary</h3>
          <div className="inv-preview-summary-grid">
            <div className="inv-preview-summary-item">
              <span>Invoice Number</span>
              <strong>{invoice.invoiceNo}</strong>
            </div>
            <div className="inv-preview-summary-item">
              <span>Date</span>
              <strong>
                {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
              </strong>
            </div>
            <div className="inv-preview-summary-item">
              <span>Customer</span>
              <strong>{invoice.customerName}</strong>
            </div>
            <div className="inv-preview-summary-item">
              <span>Items</span>
              <strong>{invoice.items ? invoice.items.length : 0}</strong>
            </div>
            <div className="inv-preview-summary-item">
              <span>Status</span>
              <strong className={getStatusTextClass(normalizedStatus)}>
                {normalizedStatus}
              </strong>
            </div>
            <div className="inv-preview-summary-item inv-preview-total">
              <span>Grand Total</span>
              <strong>{formatCurrency(invoice.grandTotal)}</strong>
            </div>
          </div>
        </div>

        {/* Status change modal */}
        {showStatusModal && (
          <div className="inv-preview-modal-overlay">
            <div className="inv-preview-modal-content">
              <div className="inv-preview-modal-header">
                <h3>Change Invoice Status</h3>
                <button
                  className="inv-preview-modal-close"
                  onClick={() => setShowStatusModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="inv-preview-modal-body">
                <p>
                  Current status: <strong>{normalizedStatus}</strong>
                </p>
                <div className="inv-preview-status-options">
                  {[
                    VALID_STATUSES.PENDING,
                    VALID_STATUSES.PAID,
                    VALID_STATUSES.OVERDUE,
                    VALID_STATUSES.DRAFT,
                    VALID_STATUSES.CANCELLED,
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updatingStatus}
                      className={`inv-preview-status-option ${
                        normalizedStatus === status ? "inv-preview-active" : ""
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="inv-preview-modal-footer">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="inv-preview-btn inv-preview-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoicePreview;