import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./PurchaseInvoicePreview.css";

function PurchaseInvoicePreview() {
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
     FETCH INVOICE + COMPANY SETTINGS
  ----------------------------- */
  useEffect(() => {
    const fetchInvoiceAndCompany = async () => {
      try {
        setLoading(true);
        setError("");

        console.log(`🔄 Fetching purchase invoice with ID: ${id}`);

        // 1) Load purchase invoice with proper population
        const { data: invoiceRes } = await api.get(`/purchases/${id}`);
        
        console.log("📦 Purchase invoice API response:", invoiceRes);

        if (!invoiceRes || !invoiceRes.success || !invoiceRes.data) {
          setError("Purchase invoice not found or no data returned.");
          setLoading(false);
          return;
        }

        const inv = invoiceRes.data;
        console.log("✅ Purchase invoice loaded:", inv);
        
        // Debug: Log items structure to check HSN data
        console.log("🔍 Items structure:", inv.items);
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((item, index) => {
            console.log(`📦 Item ${index}:`, {
              name: item.name,
              hsn: item.hsn,
              hsnCode: item.hsnCode,
              productId: item.productId,
              productData: item.productId
            });
          });
        }
        
        // Ensure items array exists and has proper structure
        if (!inv.items || !Array.isArray(inv.items)) {
          console.warn("⚠️ No items array found in invoice, creating empty array");
          inv.items = [];
        }

        // Enhanced data processing with better HSN handling
        const processedInvoice = {
          ...inv,
          invoiceNo: inv.invoiceNo || "N/A",
          invoiceDate: inv.invoiceDate || new Date().toISOString(),
          supplierName: inv.supplierName || "N/A",
          supplierAddress: inv.supplierAddress || "",
          supplierPhone: inv.supplierPhone || "",
          supplierGSTIN: inv.supplierGSTIN || inv.supplierGstNumber || "",
          paymentStatus: inv.paymentStatus || "pending",
          status: inv.status || "draft",
          subtotal: Number(inv.subtotal || 0),
          totalTax: Number(inv.totalTax || 0),
          grandTotal: Number(inv.grandTotal || 0),
          discount: Number(inv.discount || 0),
          shippingCharges: Number(inv.shippingCharges || 0),
          otherCharges: Number(inv.otherCharges || 0),
          tax: Number(inv.tax || 0),
          taxDetails: inv.taxDetails || [],
          items: inv.items.map((item, index) => {
            // Try to get HSN from multiple possible sources
            let hsnCode = item.hsnCode || item.hsn || "";

            return {
              ...item,
              name: item.name || item.productName || `Product ${index + 1}`,
              hsnCode: hsnCode,
              hsn: hsnCode,
              qty: Number(item.qty || 0),
              rate: Number(item.rate || item.price || 0),
              gstRate: Number(item.gstRate || 0),
              unit: item.unit || "pcs",
              description: item.description || "",
              productId: item.productId || null
            };
          })
        };

        console.log("✅ Processed invoice with HSN data:", processedInvoice);
        setInvoice(processedInvoice);

        // 2) Load company settings
        const companyData = await fetchCompanySettings();
        if (companyData) {
          setCompany(companyData);
        } else {
          console.warn("⚠️ No company settings found, using fallback data");
          setCompany({
            name: "Your Business Name",
            address: "Your Business Address",
            city: "Your City",
            state: "Your State",
            stateCode: "ST",
            gstNumber: "Your GSTIN",
            phone: "Your Phone",
            email: "your-email@example.com",
            bankName: "Your Bank Name",
            bankAccount: "Your Account Number",
            ifsc: "Your IFSC Code",
            logoUrl: null,
            signatureUrl: null
          });
        }

      } catch (err) {
        console.error("❌ Failed to load purchase invoice:", err);
        if (err.response?.status === 404) {
          setError("Purchase invoice not found. It may have been deleted.");
        } else if (err.response?.status === 500) {
          setError("Server error while loading purchase invoice. Please try again later.");
        } else {
          setError("Failed to load purchase invoice. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceAndCompany();
    } else {
      setError("Invalid purchase invoice ID");
      setLoading(false);
    }
  }, [id]);

  /* -----------------------------
     PRINT FUNCTIONALITY - IMPROVED
  ----------------------------- */
  const handlePrint = () => {
    const printContent = document.getElementById("purchase-inv-print-content");
    if (!printContent) {
      alert("Purchase invoice content not available for printing.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      alert("Please allow popups for printing.");
      return;
    }

    const title = invoice?.invoiceNo || "Purchase Invoice";
    const isThermal = layoutType === "thermal";

    const cssForA4 = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Arial', sans-serif;
        margin: 0 !important;
        padding: 0 !important;
        color: #000;
        font-size: 13px;
        line-height: 1.3;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .purchase-invoice-a4-layout {
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        padding: 10mm !important;
        background: white !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: always;
        page-break-inside: avoid;
      }
      .print-header {
        border-bottom: 3px solid #28a745;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .company-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      .company-logo {
        max-width: 120px !important;
        max-height: 70px !important;
        object-fit: contain;
      }
      .company-name {
        font-size: 20px;
        font-weight: bold;
        color: #28a745;
        margin-bottom: 5px;
      }
      .company-address {
        font-size: 12px;
        margin-bottom: 3px;
        color: #333;
        line-height: 1.3;
      }
      .invoice-title-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px 0;
        padding: 15px;
        background: #f8f9fa !important;
        border-radius: 5px;
        border: 1px solid #dee2e6;
      }
      .invoice-title {
        font-size: 22px;
        font-weight: bold;
        color: #28a745;
        margin: 0;
        text-transform: uppercase;
      }
      .invoice-meta {
        text-align: right;
        font-size: 13px;
      }
      .meta-row {
        margin-bottom: 4px;
      }
      .supplier-sections {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      .supplier-section {
        padding: 15px;
        background: #f8f9fa !important;
        border-radius: 5px;
        border: 1px solid #dee2e6;
      }
      .section-title {
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 10px 0;
        color: #28a745;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 12px;
        border: 2px solid #333;
      }
      .items-table th {
        background: #28a745 !important;
        color: white !important;
        font-weight: bold;
        padding: 8px 5px;
        border: 1px solid #1e7e34;
        text-align: center;
        font-size: 11px;
      }
      .items-table td {
        padding: 7px 5px;
        border: 1px solid #333;
        text-align: center;
        font-size: 11px;
      }
      .item-description {
        text-align: left;
        padding-left: 8px !important;
      }
      .product-description {
        font-size: 10px;
        color: #666;
        margin-top: 2px;
        font-style: italic;
      }
      .text-right {
        text-align: right;
        padding-right: 8px !important;
      }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .bold { font-weight: bold; }
      .totals-section {
        background: #f8f9fa !important;
        border: 2px solid #333;
        border-radius: 5px;
        padding: 15px;
        margin: 20px 0;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #ddd;
        font-size: 13px;
      }
      .print-grand-total {
        background: #28a745 !important;
        color: white !important;
        font-weight: bold;
        margin: 10px -15px -15px -15px;
        padding: 10px 15px;
        border-radius: 0 0 3px 3px;
        font-size: 14px;
      }
      .amount-words {
        margin-top: 10px;
        padding: 10px;
        background: #e9ecef;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid #ddd;
      }
      .invoice-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 25px;
        padding-top: 20px;
        border-top: 3px solid #28a745;
      }
      .bank-details {
        padding: 15px;
        background: #f8f9fa !important;
        border-radius: 5px;
        border: 1px solid #dee2e6;
      }
      .bank-details h4 {
        margin: 0 0 10px 0;
        color: #28a745;
        font-size: 14px;
      }
      .signature-section {
        text-align: center;
      }
      .declaration {
        margin-bottom: 20px;
        font-size: 12px;
        text-align: left;
      }
      .signature-image {
        max-width: 120px !important;
        max-height: 50px !important;
        margin: 15px 0 5px 0;
      }
      .signature-line {
        width: 180px;
        height: 1px;
        background: #000;
        margin: 25px auto 5px auto;
      }
      .signature-text {
        font-weight: bold;
        margin-top: 5px;
      }
      .system-info {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px dashed #999;
        font-size: 10px;
        color: #666;
        text-align: center;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .purchase-invoice-a4-layout {
          width: 100% !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
      }
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
      .thermal-company-name {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 3px;
      }
      .thermal-separator {
        border-bottom: 1px dashed #666;
        margin: 6px 0;
      }
      .thermal-meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
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
      .t-col-item { width: 45%; }
      .t-col-qty { width: 15%; text-align: center; }
      .t-col-rate { width: 20%; text-align: right; }
      .t-col-amt { width: 20%; text-align: right; }
      .thermal-totals {
        margin-top: 8px;
        font-size: 10px;
      }
      .thermal-total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
      }
      .thermal-grand {
        font-weight: bold;
        border-top: 1px double #000;
        padding-top: 4px;
        margin-top: 4px;
      }
      .thermal-amount-words {
        margin-top: 6px;
        font-size: 8px;
      }
      .thermal-footer {
        text-align: center;
        margin-top: 8px;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .thermal-root {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;

    const printInstructions = `
      <div style="padding: 20px; font-family: Arial; background: #f0f8ff; border-radius: 8px; margin: 20px; border-left: 4px solid #28a745;">
        <h3 style="color: #28a745; margin-top: 0;">💡 Print Instructions</h3>
        <ol style="margin-bottom: 0;">
          <li>Click the print button or press <strong>Ctrl+P</strong></li>
          <li>Select <strong>"Save as PDF"</strong> as your printer</li>
          <li>Enable <strong>"Background graphics"</strong> for best quality</li>
          <li>Set <strong>Margins</strong> to "None" or "Minimum"</li>
          <li>Click <strong>"Save"</strong> to download your PDF</li>
        </ol>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${company?.name || "Purchase Invoice"}</title>
          <style>
            ${isThermal ? cssForThermal : cssForA4}
            @media screen {
              .print-instructions { display: block; }
            }
            @media print {
              .print-instructions { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-instructions">
            ${printInstructions}
          </div>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              // Auto-print after a short delay
              setTimeout(function() {
                window.print();
              }, 1000);
              
              // Close window after print (optional)
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  /* -----------------------------
     PDF DOWNLOAD WITH BETTER FALLBACK
  ----------------------------- */
  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      
      console.log("🔄 Attempting to download PDF...");
      
      // Try the PDF endpoint
      const timestamp = new Date().getTime();
      const response = await api.get(`/purchases/${id}/pdf?_t=${timestamp}`, {
        responseType: "blob",
        timeout: 30000,
      });

      if (!response.data) {
        throw new Error("No PDF data received from server");
      }

      // Check if the response is actually a PDF
      if (response.data.type !== 'application/pdf') {
        // If it's not a PDF, it might be an error message
        const text = await new Response(response.data).text();
        console.error("Server returned non-PDF response:", text);
        throw new Error("Server returned an error instead of PDF");
      }

      // Create and download the PDF file
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-invoice-${invoice.invoiceNo || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setTimeout(() => {
        alert(`✅ PDF downloaded successfully!\n\nFile: purchase-invoice-${invoice.invoiceNo || id}.pdf`);
      }, 500);

    } catch (error) {
      console.error("Failed to download PDF:", error);
      
      let errorMessage = "PDF generation service is currently unavailable. ";
      
      if (error.response?.status === 500) {
        errorMessage += "The server encountered an error while generating the PDF. ";
      }
      
      errorMessage += "Using print to PDF as fallback...";
      
      alert(`❌ ${errorMessage}`);
      
      // Fallback to print method
      setTimeout(() => {
        console.log("🔄 Falling back to print method for PDF generation");
        handlePrint();
      }, 1000);
    } finally {
      setPdfLoading(false);
    }
  };

  /* -----------------------------
     STATUS CHANGE FLOW
  ----------------------------- */
  const handleStatusChange = async (newStatusRaw) => {
    if (!invoice) {
      alert("Purchase invoice not loaded");
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

      const { data } = await api.patch(`/purchases/${id}/status`, {
        status: newStatus,
      });

      if (data && data.success) {
        setInvoice((prev) => ({ ...prev, status: newStatus }));
        setShowStatusModal(false);
        alert(`✅ Purchase invoice status updated to ${newStatus}.`);
      } else {
        throw new Error(data?.message || "Failed to update purchase invoice status");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      let msg = "❌ Failed to update purchase invoice status.";
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

    const invoiceDetails = `Purchase Invoice ${invoice.invoiceNo}
Supplier: ${invoice.supplierName}
Amount: ₹${Number(invoice.grandTotal || 0).toFixed(2)}
Date: ${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
Status: ${invoice.status || "N/A"}`;

    if (via === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(invoiceDetails)}`, "_blank");
    } else if (via === "email") {
      const subject = `Purchase Invoice ${invoice.invoiceNo}`;
      const body = `Purchase Invoice Details:\n\n${invoiceDetails}\n\nThank you!`;
      window.location.href = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  const calculateItemTotal = (item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate || item.price || 0);
    return qty * rate;
  };

  const convertToWords = (amount) => {
    if (!amount || isNaN(amount)) return "Zero Rupees";
    
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    
    let words = `${rupees.toLocaleString('en-IN')} Rupees`;
    if (paise > 0) {
      words += ` and ${paise} Paise`;
    }
    
    return words + " Only";
  };

  // Helper to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  /* -----------------------------
     Layout components
  ----------------------------- */

  const A4Layout = () => (
    <div className="purchase-invoice-a4-layout">
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
        <h1 className="invoice-title">PURCHASE INVOICE</h1>
        <div className="invoice-meta">
          <div className="meta-row">
            <strong>Invoice No:</strong> {invoice.invoiceNo || "N/A"}
          </div>
          <div className="meta-row">
            <strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}
          </div>
          {invoice.dueDate && (
            <div className="meta-row">
              <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
            </div>
          )}
          {invoice.purchaseOrderNo && (
            <div className="meta-row">
              <strong>PO Number:</strong> {invoice.purchaseOrderNo}
            </div>
          )}
        </div>
      </div>

      {/* Supplier section */}
      <div className="supplier-sections">
        <div className="supplier-section">
          <h3 className="section-title">Supplier Information</h3>
          <div className="supplier-details">
            <div className="supplier-name bold">{invoice.supplierName || "N/A"}</div>
            {invoice.supplierAddress && <div className="supplier-address">{invoice.supplierAddress}</div>}
            {invoice.supplierPhone && <div><strong>Phone:</strong> {invoice.supplierPhone}</div>}
            {invoice.supplierGSTIN && <div><strong>GSTIN:</strong> {invoice.supplierGSTIN}</div>}
          </div>
        </div>

        <div className="supplier-section">
          <h3 className="section-title">Additional Information</h3>
          <div className="additional-details">
            <div className="payment-status">
              <strong>Payment Status:</strong> {invoice.paymentStatus || "pending"}
            </div>
            {invoice.paymentTerms && (
              <div className="payment-terms">
                <strong>Payment Terms:</strong> {invoice.paymentTerms}
              </div>
            )}
            {invoice.inventoryUpdated && (
              <div className="inventory-status">
                <strong>Inventory:</strong> ✅ Updated
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="items-table">
        <thead>
          <tr>
            <th width="4%">Sl.</th>
            <th width="30%">Product Description</th>
            <th width="10%">HSN/SAC</th>
            <th width="8%">Qty</th>
            <th width="10%">Unit</th>
            <th width="12%">Rate (₹)</th>
            <th width="12%">Taxable Value (₹)</th>
            <th width="8%">GST %</th>
            <th width="6%">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, index) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.rate || item.price || 0);
              const gstRate = Number(item.gstRate) || 0;
              const taxable = qty * rate;
              const gstAmount = (taxable * gstRate) / 100;
              const total = taxable + gstAmount;

              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="item-description">
                    <strong>{item.name || `Product ${index + 1}`}</strong>
                    {item.description && (
                      <div className="product-description">{item.description}</div>
                    )}
                  </td>
                  <td className="text-center">
                    {item.hsnCode || item.hsn || "N/A"}
                  </td>
                  <td className="text-center">{qty}</td>
                  <td className="text-center">{item.unit || "pcs"}</td>
                  <td className="text-right">{rate.toFixed(2)}</td>
                  <td className="text-right">{taxable.toFixed(2)}</td>
                  <td className="text-center">{gstRate}%</td>
                  <td className="text-right">{total.toFixed(2)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No items found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals-section">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        
        {/* Tax Breakdown */}
        {invoice.taxDetails && invoice.taxDetails.length > 0 ? (
          invoice.taxDetails.map((tax, index) => (
            <div key={index} className="total-row">
              <span>{tax.name} ({tax.rate}%):</span>
              <span>{formatCurrency(tax.amount)}</span>
            </div>
          ))
        ) : invoice.tax > 0 ? (
          <div className="total-row">
            <span>Tax ({invoice.tax}%):</span>
            <span>{formatCurrency((invoice.subtotal * invoice.tax) / 100)}</span>
          </div>
        ) : null}
        
        {invoice.discount > 0 && (
          <div className="total-row">
            <span>Discount:</span>
            <span>-{formatCurrency(invoice.discount)}</span>
          </div>
        )}
        
        {invoice.shippingCharges > 0 && (
          <div className="total-row">
            <span>Shipping Charges:</span>
            <span>{formatCurrency(invoice.shippingCharges)}</span>
          </div>
        )}
        
        {invoice.otherCharges > 0 && (
          <div className="total-row">
            <span>Other Charges:</span>
            <span>{formatCurrency(invoice.otherCharges)}</span>
          </div>
        )}
        
        <div className="total-row print-grand-total">
          <span>Grand Total:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
        
        <div className="amount-words">
          <strong>Amount in Words:</strong> {convertToWords(invoice.grandTotal)}
        </div>
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
              <strong>Declaration:</strong> We declare that this purchase invoice shows the
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

      {/* System Information */}
      <div className="system-info">
        <p>
          <strong>Invoice ID:</strong> {invoice._id} | 
          <strong> Created:</strong> {formatDate(invoice.createdAt)} |
          <strong> Updated:</strong> {formatDate(invoice.updatedAt)}
        </p>
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
          <span>Purchase Invoice:</span>
          <span>{invoice.invoiceNo || "N/A"}</span>
        </div>
        <div className="thermal-meta-row">
          <span>Date:</span>
          <span>{formatDate(invoice.invoiceDate)}</span>
        </div>
        <div className="thermal-meta-row">
          <span>Supplier:</span>
          <span>{invoice.supplierName || "N/A"}</span>
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
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, i) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.rate || item.price || 0);
              const total = calculateItemTotal(item);
              return (
                <tr key={i}>
                  <td className="t-col-item text-left">{item.name || `Item ${i + 1}`}</td>
                  <td className="t-col-qty text-center">{qty}</td>
                  <td className="t-col-rate text-right">{rate.toFixed(0)}</td>
                  <td className="t-col-amt text-right">{total.toFixed(0)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="text-center">No items</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="thermal-separator" />

      <div className="thermal-totals">
        <div className="thermal-total-row">
          <span>Sub Total:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        {invoice.tax > 0 && (
          <div className="thermal-total-row">
            <span>Tax:</span>
            <span>{formatCurrency((invoice.subtotal * invoice.tax) / 100)}</span>
        </div>
        )}
        {invoice.discount > 0 && (
          <div className="thermal-total-row">
            <span>Discount:</span>
            <span>-{formatCurrency(invoice.discount)}</span>
          </div>
        )}
        <div className="thermal-total-row thermal-grand">
          <span>Grand Total:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
      </div>

      <div className="thermal-separator" />
      <div className="thermal-amount-words">
        <div className="bold">Amt in words:</div>
        <div>{convertToWords(invoice.grandTotal)}</div>
      </div>

      <div className="thermal-separator" />
      <div className="thermal-footer text-center">
        <div>Purchase Invoice</div>
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
            <p>Loading purchase invoice...</p>
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
            <h3>{error || "Purchase invoice not found"}</h3>
            <p>
              The purchase invoice you're looking for doesn't exist or you don't have permission to
              view it.
            </p>
            <div className="inv-preview-action-buttons">
              <Link to="/purchase-invoices" className="inv-preview-btn inv-preview-btn-primary">
                Back to Purchases
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
              <h1>Purchase Invoice {invoice.invoiceNo}</h1>
              <p className="inv-preview-header-subtitle">
                Supplier: {invoice.supplierName} • Amount:{" "}
                {formatCurrency(invoice.grandTotal)}
              </p>
            </div>
            <div className="inv-preview-header-actions">
              <Link to="/create-purchase-invoice" className="inv-preview-btn inv-preview-btn-primary">
                New Purchase
              </Link>
              <Link to="/purchase-invoices" className="inv-preview-btn inv-preview-btn-outline">
                All Purchases
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
                Due: {formatDate(invoice.dueDate)}
              </span>
            )}
            <span className={`inv-preview-payment-status payment-${invoice.paymentStatus}`}>
              Payment: {invoice.paymentStatus}
            </span>
            {invoice.inventoryUpdated && (
              <span className="inv-preview-inventory-status">
                📦 Stock Updated
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

        {/* Debug Information */}
        {company && (
          <div className="inv-preview-alert inv-preview-alert-info">
            <div className="inv-preview-alert-icon">ℹ️</div>
            <div className="inv-preview-alert-content">
              <strong>Data Loaded Successfully</strong>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Invoice: {invoice.items?.length || 0} items • 
                Company: {company.name} • 
                Dates: {formatDate(invoice.invoiceDate)}
              </div>
              {/* HSN Debug Info */}
              <div style={{ fontSize: '10px', marginTop: '4px', background: '#f8f9fa', padding: '4px', borderRadius: '3px' }}>
                <strong>HSN Debug:</strong> {invoice.items?.filter(item => item.hsnCode || item.hsn).length || 0} items have HSN codes
              </div>
            </div>
          </div>
        )}

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
                  title="Download as PDF (Server-generated)"
                >
                  {pdfLoading && <span className="inv-preview-spinner-small" />}
                  {pdfLoading ? "Generating PDF..." : "Download PDF"}
                </button>
                <button
                  onClick={handlePrint}
                  className="inv-preview-btn inv-preview-btn-primary"
                  title="Print invoice directly"
                >
                  Print ({layoutType === "a4" ? "A4" : "Thermal"})
                </button>
              </div>
              <div className="inv-preview-pdf-help-text">
                <strong>Note:</strong> PDF download uses server-side generation. 
                Print option opens in a new window for saving as PDF (recommended).
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

          <div className="inv-preview-action-card">
            <div className="inv-preview-action-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="inv-preview-action-card-content">
              <div className="inv-preview-action-buttons">
                <Link 
                  to={`/edit-purchase/${invoice._id}`}
                  className="inv-preview-btn inv-preview-btn-warning"
                >
                  ✏️ Edit Invoice
                </Link>
                <Link 
                  to={`/create-purchase-invoice?clone=${invoice._id}`}
                  className="inv-preview-btn inv-preview-btn-secondary"
                >
                  📋 Clone Invoice
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice display (used for print as well) */}
        <div className="inv-preview-invoice-display">
          <div id="purchase-inv-print-content" className="inv-preview-invoice-content">
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
              <strong>{formatDate(invoice.invoiceDate)}</strong>
            </div>
            <div className="inv-preview-summary-item">
              <span>Supplier</span>
              <strong>{invoice.supplierName}</strong>
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
                <h3>Change Purchase Invoice Status</h3>
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

export default PurchaseInvoicePreview;