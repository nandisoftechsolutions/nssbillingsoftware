// src/pages/Tenants/InvoicePreview.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./InvoicePreview.css";

// Icons
import {
  FiDownload,
  FiPrinter,
  FiShare2,
  FiEdit,
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  MdPayments,
  MdCalendarToday,
  MdPerson,
  MdDescription,
  MdLocalShipping,
  MdAccountBalance,
  MdCheckCircle,
  MdPendingActions,
  MdCancel,
  MdError,
  MdDrafts,
  MdDiscount,
  MdReceipt,
} from "react-icons/md";

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
  const [layoutType, setLayoutType] = useState("tax"); // "tax" | "thermal"
  const [shareLoading, setShareLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const VALID_STATUSES = {
    DRAFT: "Draft",
    PENDING: "Pending",
    PAID: "Paid",
    OVERDUE: "Overdue",
    CANCELLED: "Cancelled",
  };

  const statusIcons = {
    paid: <MdCheckCircle className="invoice-status-icon" />,
    pending: <MdPendingActions className="invoice-status-icon" />,
    overdue: <MdError className="invoice-status-icon" />,
    cancelled: <MdCancel className="invoice-status-icon" />,
    draft: <MdDrafts className="invoice-status-icon" />,
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid") return "status-badge status-paid";
    if (normalized === "pending") return "status-badge status-pending";
    if (normalized === "overdue") return "status-badge status-overdue";
    if (normalized === "cancelled" || normalized === "canceled")
      return "status-badge status-cancelled";
    if (normalized === "draft") return "status-badge status-draft";
    return "status-badge status-default";
  };

  const normalizeStatus = (s) => {
    if (!s) return VALID_STATUSES.DRAFT;
    const key = String(s).trim().toLowerCase();
    if (key === "paid") return VALID_STATUSES.PAID;
    if (key === "pending") return VALID_STATUSES.PENDING;
    if (key === "overdue") return VALID_STATUSES.OVERDUE;
    if (key === "cancelled" || key === "canceled")
      return VALID_STATUSES.CANCELLED;
    if (key === "draft") return VALID_STATUSES.DRAFT;
    return s;
  };

  /* -----------------------------
     Image URL Normalizer
  ----------------------------- */
  const getFullImageUrl = (rawUrl) => {
    if (!rawUrl) return null;

    const url = String(rawUrl).trim();

    // Already full URL or data URL
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }

    // Try to derive base from REACT_APP_API_URL (strip /api etc.)
    let baseOrigin = window.location.origin;
    const apiBase = process.env.REACT_APP_API_URL;

    if (apiBase) {
      try {
        const apiURL = new URL(apiBase);
        baseOrigin = `${apiURL.protocol}//${apiURL.host}`;
      } catch {
        // fallback to window.origin
      }
    }

    // If url already starts with "/", just attach to origin
    if (url.startsWith("/")) {
      return `${baseOrigin}${url}`;
    }

    // Otherwise assume it's plain filename in /uploads
    return `${baseOrigin}/uploads/${url}`;
  };

  const handleImageLoad = () => {
    setImagesLoaded(true);
  };

  /* -----------------------------
     Fetch Company Settings - UPDATED
  ----------------------------- */
  const fetchCompanySettings = async () => {
    try {
      const { data } = await api.get("/settings");

      // Handle multiple possible shapes
      let companyData = null;
      
      if (data?.success && data.data?.company) {
        companyData = data.data.company;
      } else if (data?.company) {
        companyData = data.company;
      } else if (data?.data) {
        companyData = data.data;
      }

      if (companyData) {
        // Extract all company details
        const extractedCompany = {
          name: companyData.name || companyData.companyName || "",
          address: companyData.address || companyData.businessAddress || "",
          city: companyData.city || "",
          state: companyData.state || "",
          pincode: companyData.pincode || companyData.zipCode || "",
          phone: companyData.phone || companyData.mobile || companyData.contactNumber || "",
          email: companyData.email || "",
          website: companyData.website || "",
          gstNumber: companyData.gstNumber || companyData.gstin || "",
          stateCode: companyData.stateCode || "",
          panNumber: companyData.panNumber || companyData.pan || "",
          bankName: companyData.bankName || "",
          bankAccount: companyData.bankAccount || companyData.accountNumber || "",
          ifsc: companyData.ifsc || companyData.ifscCode || "",
          bankBranch: companyData.bankBranch || companyData.branch || "",
          terms: companyData.terms || companyData.termsAndConditions || "",
          footerNote: companyData.footerNote || companyData.note || "",
          authorizedSignatory: companyData.authorizedSignatory || companyData.signatoryName || ""
        };

        // Set logo if available
        const logoCandidate =
          companyData.logoUrl ||
          companyData.logo ||
          companyData.companyLogo ||
          companyData.headerLogo;

        if (logoCandidate) {
          setLogoUrl(getFullImageUrl(logoCandidate));
        }

        // Set signature if available
        const signatureCandidate =
          companyData.signatureUrl ||
          companyData.signature ||
          companyData.authorizedSignature ||
          companyData.sign;

        if (signatureCandidate) {
          setSignatureUrl(getFullImageUrl(signatureCandidate));
        } else {
          setSignatureUrl(null);
        }

        setCompany(extractedCompany);
        return extractedCompany;
      }

      // fallback to /auth/me
      try {
        const me = await api.get("/auth/me");
        const meCompany = me?.data?.company || null;
        if (meCompany) {
          const extractedCompany = {
            name: meCompany.name || meCompany.companyName || "",
            address: meCompany.address || meCompany.businessAddress || "",
            city: meCompany.city || "",
            state: meCompany.state || "",
            pincode: meCompany.pincode || meCompany.zipCode || "",
            phone: meCompany.phone || meCompany.mobile || meCompany.contactNumber || "",
            email: meCompany.email || "",
            website: meCompany.website || "",
            gstNumber: meCompany.gstNumber || meCompany.gstin || "",
            stateCode: meCompany.stateCode || "",
            panNumber: meCompany.panNumber || meCompany.pan || "",
            bankName: meCompany.bankName || "",
            bankAccount: meCompany.bankAccount || meCompany.accountNumber || "",
            ifsc: meCompany.ifsc || meCompany.ifscCode || "",
            bankBranch: meCompany.bankBranch || meCompany.branch || "",
            terms: meCompany.terms || meCompany.termsAndConditions || "",
            footerNote: meCompany.footerNote || meCompany.note || "",
            authorizedSignatory: meCompany.authorizedSignatory || meCompany.signatoryName || ""
          };

          const logoCandidate =
            meCompany.logoUrl ||
            meCompany.logo ||
            meCompany.companyLogo ||
            meCompany.headerLogo;

          if (logoCandidate) {
            setLogoUrl(getFullImageUrl(logoCandidate));
          }

          const signatureCandidate =
            meCompany.signatureUrl ||
            meCompany.signature ||
            meCompany.authorizedSignature ||
            meCompany.sign;

          if (signatureCandidate) {
            setSignatureUrl(getFullImageUrl(signatureCandidate));
          } else {
            setSignatureUrl(null);
          }

          setCompany(extractedCompany);
          return extractedCompany;
        }
      } catch (err) {
        console.error("Failed to fetch from /auth/me:", err);
      }

      return null;
    } catch (err) {
      console.error("Failed company settings:", err);
      return null;
    }
  };

  /* -----------------------------
     PDF Helper
  ----------------------------- */
  const fetchInvoicePdfBlob = async () => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: "blob",
      timeout: 30000,
    });

    if (!response.data) throw new Error("No PDF data received from server");

    return new Blob([response.data], { type: "application/pdf" });
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount)) return "₹0.00";
    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getPaymentModeText = (mode) => {
    const modeMap = {
      cash: "Cash",
      upi: "UPI",
      card: "Card",
      bank_transfer: "Bank Transfer",
      cheque: "Cheque",
      credit: "Credit",
      debit: "Debit Card",
      net_banking: "Net Banking",
      wallet: "Wallet",
    };
    if (!mode) return "Cash";
    return modeMap[String(mode).toLowerCase()] || mode || "Cash";
  };

  /* -----------------------------
     Fetch Invoice + Company
  ----------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setImagesLoaded(false);

        // Invoice
        const invoiceResponse = await api.get(`/invoices/${id}`);
        if (!invoiceResponse.data?.success || !invoiceResponse.data.data) {
          setError("Invoice not found");
          return;
        }

        const invoiceData = invoiceResponse.data.data;
        setInvoice(invoiceData);

        // Company - always fetch from settings API
        const comp = await fetchCompanySettings();
        
        if (!comp) {
          // If no company settings, check if invoice has company data
          if (invoiceData.companyId && typeof invoiceData.companyId === "object") {
            const companyData = invoiceData.companyId;
            const extractedCompany = {
              name: companyData.name || companyData.companyName || "Company Name",
              address: companyData.address || companyData.businessAddress || "Company Address",
              city: companyData.city || "City",
              state: companyData.state || "State",
              pincode: companyData.pincode || companyData.zipCode || "Pincode",
              phone: companyData.phone || companyData.mobile || companyData.contactNumber || "",
              email: companyData.email || "email@company.com",
              website: companyData.website || "",
              gstNumber: companyData.gstNumber || companyData.gstin || "",
              stateCode: companyData.stateCode || "",
              panNumber: companyData.panNumber || companyData.pan || "",
              bankName: companyData.bankName || "",
              bankAccount: companyData.bankAccount || companyData.accountNumber || "",
              ifsc: companyData.ifsc || companyData.ifscCode || "",
              bankBranch: companyData.bankBranch || companyData.branch || "",
              terms: companyData.terms || companyData.termsAndConditions || "",
              footerNote: companyData.footerNote || companyData.note || "",
              authorizedSignatory: companyData.authorizedSignatory || companyData.signatoryName || ""
            };

            setCompany(extractedCompany);

            const logoCandidate =
              companyData.logoUrl ||
              companyData.logo ||
              companyData.companyLogo ||
              companyData.headerLogo;

            if (logoCandidate) setLogoUrl(getFullImageUrl(logoCandidate));

            const signatureCandidate =
              companyData.signatureUrl ||
              companyData.signature ||
              companyData.authorizedSignature ||
              companyData.sign;

            if (signatureCandidate) {
              setSignatureUrl(getFullImageUrl(signatureCandidate));
            } else {
              setSignatureUrl(null);
            }
          } else {
            // Minimal fallback
            const defaultCompany = {
              name: "Company Name",
              address: "Company Address",
              city: "City",
              state: "State",
              pincode: "Pincode",
              phone: "",
              email: "email@company.com",
              website: "",
              gstNumber: "",
              stateCode: "",
              panNumber: "",
              bankName: "",
              bankAccount: "",
              ifsc: "",
              bankBranch: "",
              terms: "",
              footerNote: "",
              authorizedSignatory: ""
            };
            setCompany(defaultCompany);
            setLogoUrl(null);
            setSignatureUrl(null);
          }
        }
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
    else {
      setError("Invalid invoice ID");
      setLoading(false);
    }
  }, [id]);

  /* -----------------------------
     Totals
  ----------------------------- */
  const calculateTotals = () => {
    if (!invoice) return {};

    const subtotal = Number(invoice.subtotal || 0);
    const totalDiscount = Number(invoice.totalDiscount || 0);
    const itemDiscounts = Number(invoice.itemDiscounts || 0);
    const overallDiscount = Number(invoice.overallDiscount || 0);
    const discountType = invoice.discountType || "percentage";
    const discountValue = Number(invoice.discountValue || 0);
    const gstTotal = Number(invoice.gstTotal || 0);
    const cgstTotal = Number(invoice.cgstTotal || 0);
    const sgstTotal = Number(invoice.sgstTotal || 0);
    const igstTotal = Number(invoice.igstTotal || 0);
    const roundOff = Number(invoice.roundOff || 0);
    const grandTotal = Number(invoice.grandTotal || 0);
    const totalQty = Number(invoice.totalQty || 0);
    const paidAmount =
      Number(invoice.paidAmount || invoice.payment?.paidAmount || 0);
    const balance =
      Number(invoice.balance || invoice.payment?.balance || 0);

    const taxableAfterDiscount = Math.max(0, subtotal - totalDiscount);

    return {
      subtotal,
      totalDiscount,
      itemDiscounts,
      overallDiscount,
      discountType,
      discountValue,
      taxableAfterDiscount,
      gstTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff,
      grandTotal,
      totalQty,
      paidAmount,
      balance,
      reverseCharge: invoice.reverseCharge || "No",
      supplyType: invoice.supplyType || "Intra-State",
    };
  };

  const generateAmountInWords = (amount) => {
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const numToWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100)
        return (
          b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "")
        );
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " and " + numToWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          numToWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + numToWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          numToWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + numToWords(n % 100000) : "")
        );
      return (
        numToWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + numToWords(n % 10000000) : "")
      );
    };

    const rupees = Math.floor(amount || 0);
    const paise = Math.round(((amount || 0) - rupees) * 100);

    let words = "";
    if (rupees > 0) {
      words += numToWords(rupees) + " Rupees";
    }
    if (paise > 0) {
      if (words) words += " and ";
      words += numToWords(paise) + " Paise";
    }
    if (!words) words = "Zero Rupees";

    return words + " Only";
  };

  const formatIndianCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /* -----------------------------
     TAX INVOICE LAYOUT - UPDATED
  ----------------------------- */
  const TaxInvoice = () => {
    if (!invoice || !company) return null;

    const totals = calculateTotals();
    const isRCM = invoice.reverseCharge === "Yes";
    const supplyType =
      invoice.supplyType ||
      (company.stateCode === invoice.placeOfSupply
        ? "Intra-State"
        : "Inter-State");

    const calculateItemTotals = () => {
      let itemDiscountTotal = 0;
      let itemTaxableTotal = 0;
      let itemGrandTotal = 0;

      if (invoice.items) {
        invoice.items.forEach((item) => {
          const discount = Number(item.discount || 0);
          const taxable = Number(item.taxable || 0);
          const total = Number(item.total || 0);

          itemDiscountTotal += discount;
          itemTaxableTotal += taxable;
          itemGrandTotal += total;
        });
      }

      return { itemDiscountTotal, itemTaxableTotal, itemGrandTotal };
    };

    const { itemDiscountTotal, itemTaxableTotal, itemGrandTotal } =
      calculateItemTotals();

    return (
      <div id="invoice-print-area" className="invoice-tax-exact">
        {/* Header */}
        <div className="header-section">
          <div className="company-info">
            {logoUrl ? (
              <div className="company-logo-container">
                <img
                  src={logoUrl}
                  alt={company.name || "Company Logo"}
                  className="company-logo"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    console.error("Failed to load logo:", logoUrl);
                    e.target.style.display = "none";
                    const fallback =
                      e.target.parentNode.querySelector(
                        ".company-name-fallback"
                      );
                    if (fallback) fallback.style.display = "block";
                  }}
                  crossOrigin="anonymous"
                />
                <div
                  className="company-name-fallback"
                  style={{ display: "none" }}
                >
                  <div className="company-name">
                    {company.name || "Company Name"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="company-name">
                {company.name || "Company Name"}
              </div>
            )}
            <div className="company-details">
              <div>{company.address || "Address"}</div>
              <div>
                {company.city || "City"}, {company.state || "State"} -{" "}
                {company.pincode || "Pincode"}
              </div>
              {company.phone && <div>Phone: {company.phone}</div>}
              {company.email && <div>Email: {company.email}</div>}
              {company.website && <div>Website: {company.website}</div>}
              {company.gstNumber && (
                <div className="gst-badge">
                  GSTIN: {company.gstNumber}
                </div>
              )}
              {(company.stateCode || company.panNumber) && (
                <div>
                  {company.stateCode && `State Code: ${company.stateCode}`}
                  {company.stateCode && company.panNumber && " | "}
                  {company.panNumber && `PAN: ${company.panNumber}`}
                </div>
              )}
            </div>
          </div>

          <div className="invoice-title">
            <h1>TAX INVOICE</h1>
            <div className="invoice-meta">
              <div>
                <strong>Invoice No:</strong> {invoice.invoiceNo}
              </div>
              <div>
                <strong>Invoice Date:</strong>{" "}
                {formatDate(invoice.invoiceDate)}
              </div>
              <div>
                <strong>Due Date:</strong>{" "}
                {invoice.dueDate
                  ? formatDate(invoice.dueDate)
                  : "On Receipt"}
              </div>
              <div>
                <strong>Place of Supply:</strong>{" "}
                {invoice.placeOfSupply || "Not Specified"}
              </div>
            </div>
          </div>
        </div>

        {/* GST note */}
        <div className="gst-note">
          <strong>Note:</strong> This is a tax invoice under Section 31
          of the CGST Act, 2017. All taxes as applicable.
        </div>

        {/* Details */}
        <div className="details-section">
          {/* BILL TO */}
          <div className="bill-to">
            <div className="section-title">BILL TO</div>
            <div className="detail-row">
              <div className="detail-label">Name:</div>
              <div>{invoice.customerName || "Customer Name"}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Address:</div>
              <div
                dangerouslySetInnerHTML={{
                  __html: (invoice.customerAddress || "Customer Address").replace(/\n/g, "<br>"),
                }}
              />
            </div>
            {invoice.customerGstin && (
              <div className="detail-row">
                <div className="detail-label">GSTIN:</div>
                <div>{invoice.customerGstin}</div>
              </div>
            )}
            <div className="detail-row">
              <div className="detail-label">State:</div>
              <div>
                {invoice.customerState || "Not Specified"} (
                {invoice.customerStateCode || "Not Specified"})
              </div>
            </div>
            {(invoice.contactPerson || invoice.customerPhone) && (
              <div className="detail-row">
                <div className="detail-label">Contact:</div>
                <div>
                  {invoice.contactPerson && <>{invoice.contactPerson}<br /></>}
                  {invoice.customerPhone}
                </div>
              </div>
            )}
          </div>

          {/* SHIP TO */}
          {(invoice.shippingName || invoice.shippingAddress) && (
            <div className="ship-to">
              <div className="section-title">SHIP TO (If different)</div>
              <div className="detail-row">
                <div className="detail-label">Name:</div>
                <div>
                  {invoice.shippingName || invoice.customerName || "Customer Name"}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Address:</div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: (
                      invoice.shippingAddress ||
                      invoice.customerAddress ||
                      "Customer Address"
                    ).replace(/\n/g, "<br>"),
                  }}
                />
              </div>
              <div className="detail-row">
                <div className="detail-label">State:</div>
                <div>
                  {invoice.shippingState || invoice.customerState || "Not Specified"}{" "}
                  ({invoice.shippingStateCode || invoice.customerStateCode || "Not Specified"})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <table>
          <thead>
            <tr>
              <th width="30">#</th>
              <th width="250">Description of Goods/Services</th>
              <th width="80">HSN/SAC</th>
              <th width="60" className="text-center">
                Qty
              </th>
              <th width="80" className="text-right">
                Rate (₹)
              </th>
              <th width="90" className="text-right">
                Discount (₹)
              </th>
              <th width="80" className="text-right">
                Taxable Value (₹)
              </th>
              <th width="50" className="text-center">
                GST%
              </th>
              <th width="80" className="text-right">
                CGST (₹)
              </th>
              <th width="80" className="text-right">
                SGST (₹)
              </th>
              <th width="80" className="text-right">
                IGST (₹)
              </th>
              <th width="90" className="text-right">
                Total (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items &&
              invoice.items.map((item, index) => {
                const qty = Number(item.qty) || 0;
                const rate = Number(item.price) || 0;
                const gstRate = isRCM ? 0 : Number(item.gstRate || 0);
                const discount = Number(item.discount || 0);
                const taxable = Number(item.taxable || 0);
                const total = Number(item.total || 0);
                const cgst = Number(item.cgst || 0);
                const sgst = Number(item.sgst || 0);
                const igst = Number(item.igst || 0);

                return (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <div className="item-description">
                        <strong>{item.name || "Item"}</strong>
                        {item.description && (
                          <div className="item-desc">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {item.hsn || item.sac || "N/A"}
                    </td>
                    <td className="text-center">{qty}</td>
                    <td className="text-right">
                      {formatIndianCurrency(rate)}
                    </td>
                    <td className="text-right">
                      {discount > 0
                        ? formatIndianCurrency(discount)
                        : "-"}
                    </td>
                    <td className="text-right">
                      {formatIndianCurrency(taxable)}
                    </td>
                    <td className="text-center">
                      {isRCM ? "RCM" : `${gstRate}%`}
                    </td>
                    <td className="text-right">
                      {isRCM
                        ? "0.00"
                        : formatIndianCurrency(cgst || 0)}
                    </td>
                    <td className="text-right">
                      {isRCM
                        ? "0.00"
                        : formatIndianCurrency(sgst || 0)}
                    </td>
                    <td className="text-right">
                      {isRCM
                        ? "0.00"
                        : formatIndianCurrency(igst || 0)}
                    </td>
                    <td className="text-right">
                      {formatIndianCurrency(total)}
                    </td>
                  </tr>
                );
              })}

            {/* Totals row */}
            {(() => {
              const totalsLocal = calculateTotals();
              const { itemDiscountTotal, itemTaxableTotal, itemGrandTotal } =
                (() => {
                  let d = 0,
                    t = 0,
                    g = 0;
                  (invoice.items || []).forEach((it) => {
                    d += Number(it.discount || 0);
                    t += Number(it.taxable || 0);
                    g += Number(it.total || 0);
                  });
                  return { itemDiscountTotal: d, itemTaxableTotal: t, itemGrandTotal: g };
                })();

              return (
                <tr style={{ background: "#f9f9f9" }}>
                  <td colSpan="5" className="text-right">
                    <strong>Total</strong>
                  </td>
                  <td className="text-right">
                    <strong>
                      {itemDiscountTotal > 0
                        ? formatIndianCurrency(itemDiscountTotal)
                        : "-"}
                    </strong>
                  </td>
                  <td className="text-right">
                    <strong>
                      {formatIndianCurrency(itemTaxableTotal)}
                    </strong>
                  </td>
                  <td />
                  <td className="text-right">
                    <strong>
                      {isRCM
                        ? "0.00"
                        : formatIndianCurrency(totalsLocal.cgstTotal)}
                    </strong>
                  </td>
                  <td className="text-right">
                    <strong>
                      {isRCM
                        ? "0.00"
                        : formatIndianCurrency(totalsLocal.sgstTotal)}
                    </strong>
                  </td>
                  <td className="text-right">
                    <strong>
                      {isRCM
                        ? "0.00"
                        : formatIndianCurrency(totalsLocal.igstTotal)}
                    </strong>
                  </td>
                  <td className="text-right">
                    <strong>
                      {formatIndianCurrency(itemGrandTotal)}
                    </strong>
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>

        {/* Amount in Words */}
        {(() => {
          const totalsLocal = calculateTotals();
          return (
            <div className="amount-words">
              <strong>Amount in Words:</strong>{" "}
              {invoice.amountInWords ||
                generateAmountInWords(totalsLocal.grandTotal)}
            </div>
          );
        })()}

        {/* Combined Left and Right Sections */}
        <div className="combined-sections">
          {/* Left Section - Bank Details & Terms */}
          <div className="left-section">
            {/* Bank Details */}
            {(company.bankName || company.bankAccount || company.ifsc) && (
              <div className="bank-details">
                <div className="section-title">BANK DETAILS</div>
                {company.bankName && (
                  <div className="detail-row">
                    <div className="detail-label">Bank Name:</div>
                    <div>{company.bankName}</div>
                  </div>
                )}
                <div className="detail-row">
                  <div className="detail-label">Account Name:</div>
                  <div>
                    {company.name || "Company Name"}
                  </div>
                </div>
                {company.bankAccount && (
                  <div className="detail-row">
                    <div className="detail-label">Account No:</div>
                    <div>{company.bankAccount}</div>
                  </div>
                )}
                {company.ifsc && (
                  <div className="detail-row">
                    <div className="detail-label">IFSC Code:</div>
                    <div>{company.ifsc}</div>
                  </div>
                )}
                {company.bankBranch && (
                  <div className="detail-row">
                    <div className="detail-label">Branch:</div>
                    <div>{company.bankBranch}</div>
                  </div>
                )}
              </div>
            )}

            {/* Terms */}
            <div className="terms-section">
              <div className="section-title">TERMS & CONDITIONS</div>
              <div className="terms-content">
                <div>
                  <strong>Payment Terms:</strong>{" "}
                  {invoice.paymentTerms ||
                    "Net 30 days from invoice date"}
                </div>
                <div>
                  <strong>Late Payment:</strong> 1.5% per month
                  interest on overdue amounts
                </div>
                <div>
                  <strong>Delivery:</strong> Services delivered
                  electronically
                </div>
                <div>
                  <strong>Validity:</strong> This invoice is valid
                  for 30 days
                </div>
                <div>
                  <strong>Dispute:</strong> Any dispute subject to{" "}
                  {company.city || "Gurugram"} jurisdiction
                </div>
                <div>
                  <strong>Contact:</strong> {company.email ||
                    ""}{" "}
                  | {company.phone || ""}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Summary */}
          <div className="right-section">
            {(() => {
              const totalsLocal = calculateTotals();
              const { itemDiscountTotal } = (() => {
                let d = 0;
                (invoice.items || []).forEach((it) => {
                  d += Number(it.discount || 0);
                });
                return { itemDiscountTotal: d };
              })();

              return (
                <div className="summary-section">
                  <div className="summary-row">
                    <span>Total Amount:</span>
                    <span>₹ {formatIndianCurrency(totalsLocal.subtotal)}</span>
                  </div>

                  {itemDiscountTotal > 0 && (
                    <div className="summary-row discount-row">
                      <span>Item Discounts:</span>
                      <span>
                        - ₹ {formatIndianCurrency(itemDiscountTotal)}
                      </span>
                    </div>
                  )}

                  {totalsLocal.overallDiscount > 0 && (
                    <div className="summary-row discount-row">
                      <span>
                        {totalsLocal.discountType === "percentage"
                          ? `Discount (${totalsLocal.discountValue}%)`
                          : "Invoice Discount"}
                        :
                      </span>
                      <span>
                        - ₹{" "}
                        {formatIndianCurrency(totalsLocal.overallDiscount)}
                      </span>
                    </div>
                  )}

                  {totalsLocal.totalDiscount > 0 && (
                    <div className="summary-row discount-row">
                      <span>Total Discount:</span>
                      <span>
                        - ₹ {formatIndianCurrency(totalsLocal.totalDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Taxable Value:</span>
                    <span>
                      ₹{" "}
                      {formatIndianCurrency(
                        totalsLocal.taxableAfterDiscount
                      )}
                    </span>
                  </div>

                  {!isRCM && supplyType === "Intra-State" && (
                    <>
                      <div className="summary-row">
                        <span>
                          CGST @{" "}
                          {invoice.items?.[0]?.cgstRate ||
                            invoice.items?.[0]?.gstRate / 2 ||
                            9}
                          %:
                        </span>
                        <span>
                          ₹ {formatIndianCurrency(totalsLocal.cgstTotal)}
                        </span>
                      </div>
                      <div className="summary-row">
                        <span>
                          SGST @{" "}
                          {invoice.items?.[0]?.sgstRate ||
                            invoice.items?.[0]?.gstRate / 2 ||
                            9}
                          %:
                        </span>
                        <span>
                          ₹ {formatIndianCurrency(totalsLocal.sgstTotal)}
                        </span>
                      </div>
                    </>
                  )}

                  {!isRCM && supplyType === "Inter-State" && (
                    <div className="summary-row">
                      <span>
                        IGST @{" "}
                        {invoice.items?.[0]?.igstRate ||
                          invoice.items?.[0]?.gstRate ||
                          18}
                        %:
                      </span>
                      <span>
                        ₹ {formatIndianCurrency(totalsLocal.igstTotal)}
                      </span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Total GST:</span>
                    <span>
                      {isRCM
                        ? "RCM Applied"
                        : `₹ ${formatIndianCurrency(
                            totalsLocal.gstTotal
                          )}`}
                    </span>
                  </div>

                  {totalsLocal.roundOff !== 0 && (
                    <div className="summary-row">
                      <span>Round Off:</span>
                      <span>
                        {totalsLocal.roundOff > 0 ? "+" : "-"}₹{" "}
                        {formatIndianCurrency(
                          Math.abs(totalsLocal.roundOff)
                        )}
                      </span>
                    </div>
                  )}

                  <div className="summary-row summary-total">
                    <span>Invoice Total:</span>
                    <span>
                      ₹ {formatIndianCurrency(totalsLocal.grandTotal)}
                    </span>
                  </div>

                  {totalsLocal.paidAmount > 0 && (
                    <div className="summary-row">
                      <span>Paid Amount:</span>
                      <span>
                        ₹ {formatIndianCurrency(totalsLocal.paidAmount)}
                      </span>
                    </div>
                  )}

                  {totalsLocal.balance > 0 && (
                    <div className="summary-row">
                      <span>Balance Due:</span>
                      <span>
                        ₹ {formatIndianCurrency(totalsLocal.balance)}
                      </span>
                    </div>
                  )}

                  <div className="summary-row summary-total">
                    <span>Amount Payable:</span>
                    <span>
                      ₹{" "}
                      {formatIndianCurrency(
                        totalsLocal.grandTotal - totalsLocal.paidAmount
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Signature */}
        <div className="signature-section">
          <div className="signature-box">
            <div>Customer's Signature/Stamp</div>
            <div className="signature-line"></div>
            <div>Name & Date</div>
          </div>
          <div className="signature-box">
            <div>
              For{" "}
              {company.name || "Company Name"}
            </div>
            {signatureUrl ? (
              <>
                <div className="signature-image-container">
                  <img
                    src={signatureUrl}
                    alt="Authorized Signature"
                    className="signature-image"
                    onLoad={handleImageLoad}
                    onError={(e) => {
                      console.error(
                        "Failed to load signature:",
                        signatureUrl
                      );
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML =
                        '<div class="signature-line"></div>';
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
                <div>Authorized Signatory</div>
              </>
            ) : (
              <>
                <div className="signature-line"></div>
                <div>Authorized Signatory</div>
                <div className="signature-name">
                  {company.authorizedSignatory || company.name?.split(" ")[0] || "Manager"}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>
            This is a computer-generated invoice. No signature
            required. Subject to terms and conditions mentioned
            above.
          </div>
          <div>
            {company.gstNumber && `GSTIN: ${company.gstNumber}`}
            {company.gstNumber && company.website && " | "}
            {company.website && company.website}
            {company.website && company.phone && " | "}
            {company.phone && company.phone}
          </div>
        </div>
      </div>
    );
  };

  /* -----------------------------
     THERMAL LAYOUT - UPDATED
  ----------------------------- */
  const ThermalInvoice = () => {
    if (!invoice || !company) return null;

    const totals = calculateTotals();
    const isRCM = invoice.reverseCharge === "Yes";
    const supplyType =
      invoice.supplyType ||
      (company.stateCode === invoice.placeOfSupply
        ? "Intra-State"
        : "Inter-State");

    return (
      <div id="invoice-thermal-area" className="invoice-thermal-exact">
        <div className="thermal-header">
          <div className="thermal-company-name">
            {company.name || "Company Name"}
          </div>
          <div className="thermal-company-address">
            {company.address || "Address"}, {company.city || "City"}
          </div>
          <div className="thermal-contact">
            {company.phone && `Ph: ${company.phone}`}
            {company.phone && company.gstNumber && " | "}
            {company.gstNumber && `GSTIN: ${company.gstNumber.substring(0, 12)}${company.gstNumber.length > 12 ? '...' : ''}`}
          </div>
        </div>

        <div className="thermal-invoice-title">
          <div className="thermal-title-main">TAX INVOICE</div>
          <div className="thermal-title-details">
            <div>
              Invoice No: <strong>{invoice.invoiceNo}</strong>
            </div>
            <div>
              Date: <strong>{formatDate(invoice.invoiceDate)}</strong>
            </div>
          </div>
        </div>

        <div className="thermal-section">
          <div className="thermal-section-title">CUSTOMER DETAILS</div>
          <div className="thermal-detail-row">
            <span>Name:</span>
            <span>{invoice.customerName || "Customer"}</span>
          </div>
          <div className="thermal-detail-row">
            <span>Address:</span>
            <span className="thermal-address">
              {(invoice.customerAddress || "Address").replace(
                /<br\s*\/?>/gi,
                ", "
              )}
            </span>
          </div>
          {invoice.customerGstin && (
            <div className="thermal-detail-row">
              <span>GSTIN:</span>
              <span>{invoice.customerGstin}</span>
            </div>
          )}
          {invoice.customerPhone && (
            <div className="thermal-detail-row">
              <span>Phone:</span>
              <span>{invoice.customerPhone}</span>
            </div>
          )}
        </div>

        <div className="thermal-section">
          <div className="thermal-section-title">ITEMS</div>
          <div className="thermal-items-header">
            <span className="thermal-item-name">Description</span>
            <span className="thermal-item-qty">Qty</span>
            <span className="thermal-item-rate">Rate</span>
            <span className="thermal-item-total">Amount</span>
          </div>

          {invoice.items &&
            invoice.items.slice(0, 5).map((item, index) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.price) || 0;
              const total =
                Number(item.total || item.price * item.qty) || 0;

              return (
                <div
                  key={index}
                  className="thermal-item-row"
                >
                  <span className="thermal-item-name">
                    {item.name || "Item"}
                  </span>
                  <span className="thermal-item-qty">
                    {qty}
                  </span>
                  <span className="thermal-item-rate">
                    {formatIndianCurrency(rate)}
                  </span>
                  <span className="thermal-item-total">
                    {formatIndianCurrency(total)}
                  </span>
                </div>
              );
            })}

          {invoice.items && invoice.items.length > 5 && (
            <div className="thermal-more-items">
              + {invoice.items.length - 5} more items
            </div>
          )}
        </div>

        <div className="thermal-section thermal-summary">
          <div className="thermal-summary-row">
            <span>Subtotal:</span>
            <span>₹ {formatIndianCurrency(totals.subtotal)}</span>
          </div>

          {totals.totalDiscount > 0 && (
            <div className="thermal-summary-row discount">
              <span>Discount:</span>
              <span>
                - ₹ {formatIndianCurrency(totals.totalDiscount)}
              </span>
            </div>
          )}

          <div className="thermal-summary-row">
            <span>Taxable Amt:</span>
            <span>
              ₹ {formatIndianCurrency(totals.taxableAfterDiscount)}
            </span>
          </div>

          {!isRCM && (
            <div className="thermal-summary-row">
              <span>
                GST (
                {supplyType === "Intra-State"
                  ? "CGST+SGST"
                  : "IGST"}
                ):
              </span>
              <span>
                ₹ {formatIndianCurrency(totals.gstTotal)}
              </span>
            </div>
          )}

          {isRCM && (
            <div className="thermal-summary-row">
              <span>GST:</span>
              <span>RCM</span>
            </div>
          )}

          {totals.roundOff !== 0 && (
            <div className="thermal-summary-row">
              <span>Round Off:</span>
              <span>
                {totals.roundOff > 0 ? "+" : "-"}₹{" "}
                {formatIndianCurrency(
                  Math.abs(totals.roundOff)
                )}
              </span>
            </div>
          )}

          <div className="thermal-summary-total">
            <span>GRAND TOTAL:</span>
            <span>
              ₹ {formatIndianCurrency(totals.grandTotal)}
            </span>
          </div>

          {totals.paidAmount > 0 && (
            <div className="thermal-summary-row">
              <span>Paid:</span>
              <span>
                ₹ {formatIndianCurrency(totals.paidAmount)}
              </span>
            </div>
          )}

          {totals.balance > 0 && (
            <div className="thermal-summary-row">
              <span>Balance:</span>
              <span>
                ₹ {formatIndianCurrency(totals.balance)}
              </span>
            </div>
          )}
        </div>

        <div className="thermal-amount-words">
          Amt in Words:{" "}
          {(
            invoice.amountInWords ||
            generateAmountInWords(totals.grandTotal)
          ).substring(0, 80)}
          ...
        </div>

        <div className="thermal-section">
          <div className="thermal-section-title">PAYMENT INFO</div>
          <div className="thermal-detail-row">
            <span>Mode:</span>
            <span>{getPaymentModeText(invoice.paymentMode)}</span>
          </div>
          {invoice.paymentReference && (
            <div className="thermal-detail-row">
              <span>Ref No:</span>
              <span>{invoice.paymentReference}</span>
            </div>
          )}
          <div className="thermal-detail-row">
            <span>Status:</span>
            <span className={getStatusClass(invoice.status)}>
              {normalizeStatus(invoice.status)}
            </span>
          </div>
        </div>

        <div className="thermal-footer">
          <div className="thermal-terms">
            Subject to {company.city || "Jurisdiction"} jurisdiction.
            E.& O.E.
          </div>
          <div className="thermal-signature">
            <div className="thermal-signature-line"></div>
            <div>
              For{" "}
              {company.name?.substring(0, 20) ||
                "Company"}
            </div>
            {signatureUrl && (
              <div className="thermal-signature-image">
                <img
                  src={signatureUrl}
                  alt="Signature"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    console.error(
                      "Failed to load thermal signature:",
                      signatureUrl
                    );
                    e.target.style.display = "none";
                  }}
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </div>
          <div className="thermal-thankyou">
            Thank you for your business!
          </div>
        </div>

        <div className="thermal-note">
          This is a computer generated invoice. Valid without
          signature.
        </div>
      </div>
    );
  };

  /* -----------------------------
     PRINT
  ----------------------------- */
  const handlePrint = () => {
    const printAreaId =
      layoutType === "thermal"
        ? "invoice-thermal-area"
        : "invoice-print-area";
    const printContent = document.getElementById(printAreaId);
    if (!printContent) return alert("No content found for printing");

    const title = invoice?.invoiceNo || "Invoice";
    const win = window.open("", "_blank");

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((el) => el.outerHTML)
      .join("");

    let content = printContent.innerHTML;

    const printStyles =
      layoutType === "thermal"
        ? `
      <style>
        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            background: white !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-thermal-exact {
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 auto !important;
            padding: 1mm !important;
            border: none !important;
            background: white !important;
            color: black !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .thermal-header {
            text-align: center !important;
            margin-bottom: 2mm !important;
            border-bottom: 1px dashed #000 !important;
            padding-bottom: 2mm !important;
          }
          .thermal-company-name {
            font-weight: bold !important;
            font-size: 11px !important;
            margin-bottom: 1mm !important;
            text-transform: uppercase !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .thermal-invoice-title {
            text-align: center !important;
            margin: 2mm 0 !important;
            border: 1px solid #000 !important;
            padding: 2mm !important;
            background: #f0f0f0 !important;
            font-weight: bold !important;
          }
          .thermal-section {
            margin: 2mm 0 !important;
            border-top: 1px dashed #ccc !important;
            padding-top: 2mm !important;
            page-break-inside: avoid !important;
          }
          .thermal-section-title {
            font-weight: bold !important;
            text-decoration: underline !important;
            margin-bottom: 1mm !important;
            font-size: 9px !important;
          }
          .thermal-items-header {
            display: flex !important;
            justify-content: space-between !important;
            font-weight: bold !important;
            border-bottom: 1px solid #000 !important;
            padding-bottom: 1mm !important;
            margin-bottom: 1mm !important;
            font-size: 8px !important;
          }
          .thermal-item-row {
            display: flex !important;
            justify-content: space-between !important;
            margin: 1mm 0 !important;
            font-size: 8px !important;
            page-break-inside: avoid !important;
          }
          .thermal-summary-total {
            font-weight: bold !important;
            font-size: 10px !important;
            border-top: 2px solid #000 !important;
            padding-top: 1mm !important;
            margin-top: 1mm !important;
            page-break-inside: avoid !important;
          }
          .thermal-signature-line {
            border-top: 1px solid #000 !important;
            width: 50mm !important;
            margin: 2mm auto !important;
            height: 1px !important;
          }
          .thermal-signature-image img {
            max-height: 15mm !important;
            max-width: 40mm !important;
            margin: 1mm auto !important;
            display: block !important;
          }
          .thermal-note {
            font-size: 7px !important;
            text-align: center !important;
            margin-top: 2mm !important;
            color: #666 !important;
            font-style: italic !important;
          }
          button, .no-print, .action-buttons, .layout-selector, .header-actions {
            display: none !important;
          }
          .thermal-item-name { width: 35mm !important; overflow: hidden; text-overflow: ellipsis; }
          .thermal-item-qty { width: 8mm !important; text-align: right; }
          .thermal-item-rate { width: 12mm !important; text-align: right; }
          .thermal-item-total { width: 15mm !important; text-align: right; }
          .thermal-address {
            word-break: break-word !important;
            max-width: 50mm !important;
          }
        }
      </style>
    `
        : `
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        @media print {
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-tax-exact {
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 15mm !important;
            background: white !important;
            color: black !important;
            position: relative !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .header-section {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            margin-bottom: 15px !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 15px !important;
            page-break-after: avoid !important;
          }
          .company-info { flex: 1 !important; }
          .company-name {
            font-size: 18px !important;
            font-weight: bold !important;
            margin-bottom: 5px !important;
            color: #000 !important;
          }
          .company-logo {
            max-height: 60px !important;
            max-width: 200px !important;
            margin-bottom: 10px !important;
            display: block !important;
          }
          .company-details {
            font-size: 10px !important;
            line-height: 1.3 !important;
          }
          .gst-badge {
            background: #f0f0f0 !important;
            padding: 2px 5px !important;
            border-radius: 3px !important;
            font-weight: bold !important;
            display: inline-block !important;
            margin-top: 3px !important;
          }
          .invoice-title h1 {
            font-size: 20px !important;
            text-align: right !important;
            margin: 0 0 5px 0 !important;
            color: #000 !important;
          }
          .invoice-meta {
            text-align: right !important;
            font-size: 10px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 15px 0 !important;
            page-break-inside: avoid !important;
          }
          th {
            background: #f5f5f5 !important;
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            font-size: 9px !important;
            font-weight: bold !important;
            text-align: left !important;
          }
          td {
            border: 1px solid #ddd !important;
            padding: 4px 6px !important;
            font-size: 9px !important;
            vertical-align: top !important;
          }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          .combined-sections {
            display: flex !important;
            justify-content: space-between !important;
            margin: 15px 0 !important;
            page-break-inside: avoid !important;
          }
          .left-section {
            width: 48% !important;
          }
          .right-section {
            width: 48% !important;
          }
          .summary-section {
            border: 1px solid #ddd !important;
            padding: 10px !important;
            background: #f9f9f9 !important;
            page-break-inside: avoid !important;
          }
          .summary-row {
            display: flex !important;
            justify-content: space-between !important;
            margin: 3px 0 !important;
            font-size: 10px !important;
          }
          .summary-total {
            font-weight: bold !important;
            font-size: 12px !important;
            border-top: 2px solid #000 !important;
            padding-top: 5px !important;
            margin-top: 5px !important;
          }
          .bank-details, .terms-section {
            border: 1px solid #ddd !important;
            padding: 10px !important;
            background: #f9f9f9 !important;
            margin-bottom: 10px !important;
            page-break-inside: avoid !important;
          }
          .amount-words {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            margin: 10px 0 !important;
            background: #f9f9f9 !important;
            font-size: 10px !important;
            page-break-inside: avoid !important;
          }
          .signature-section {
            display: flex !important;
            justify-content: space-between !important;
            margin: 30px 0 20px 0 !important;
            page-break-inside: avoid !important;
          }
          .signature-box {
            text-align: center !important;
            width: 45% !important;
            font-size: 10px !important;
          }
          .signature-line {
            border-top: 1px solid #000 !important;
            width: 80% !important;
            margin: 10px auto !important;
            height: 1px !important;
          }
          .signature-image {
            max-height: 40px !important;
            max-width: 120px !important;
            margin: 5px auto !important;
            display: block !important;
          }
          .footer {
            text-align: center !important;
            font-size: 8px !important;
            color: #666 !important;
            border-top: 1px solid #ddd !important;
            padding-top: 5px !important;
            margin-top: 10px !important;
            page-break-inside: avoid !important;
          }
          .details-section {
            display: flex !important;
            justify-content: space-between !important;
            margin: 15px 0 !important;
            font-size: 10px !important;
            page-break-inside: avoid !important;
          }
          .bill-to, .ship-to {
            width: 48% !important;
            border: 1px solid #ddd !important;
            padding: 8px !important;
            background: #f9f9f9 !important;
          }
          .section-title {
            font-weight: bold !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 3px !important;
            margin-bottom: 5px !important;
            font-size: 11px !important;
          }
          button, .no-print, .action-buttons, .layout-selector, .header-actions,
          .preview-header, .quick-stats, .layout-tabs, .export-actions, .additional-actions {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${printStyles}
          ${styles}
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              const images = document.querySelectorAll('img');
              const loadImage = (img) => {
                return new Promise((resolve) => {
                  if (img.complete) {
                    resolve();
                  } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    setTimeout(() => resolve(), 2000);
                  }
                });
              };
              const loadAllImages = async () => {
                const promises = Array.from(images).map(img => loadImage(img));
                await Promise.all(promises);
                setTimeout(printNow, 500);
              };
              if (images.length === 0) {
                setTimeout(printNow, 500);
              } else {
                loadAllImages();
              }
              function printNow() {
                window.print();
                setTimeout(() => {
                  window.close();
                }, 1000);
              }
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  /* -----------------------------
     Download PDF
  ----------------------------- */
  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      if (!invoice) throw new Error("Invoice not loaded");

      const blob = await fetchInvoicePdfBlob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  /* -----------------------------
     Share
  ----------------------------- */
  const handleShare = async () => {
    if (!invoice || !company) return;

    try {
      setShareLoading(true);

      const formattedDate = new Date(
        invoice.invoiceDate
      ).toLocaleDateString("en-IN");

      const message = `Invoice No: ${invoice.invoiceNo}
Date: ${formattedDate}
Customer: ${invoice.customerName}
Amount: ${formatCurrency(invoice.grandTotal)}
Status: ${normalizeStatus(invoice.status)}

From: ${company.name}`;

      const pdf = await fetchInvoicePdfBlob();
      const fileName = `invoice-${invoice.invoiceNo}.pdf`;
      const file = new File([pdf], fileName, {
        type: "application/pdf",
      });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo}`,
          text: message,
          files: [file],
        });
        return;
      }

      const subject = `Invoice ${invoice.invoiceNo} - ${company.name}`;
      const body = `Dear ${
        invoice.customerName
      },\n\nPlease find attached invoice ${
        invoice.invoiceNo
      }.\n\nTotal Amount: ${formatCurrency(
        invoice.grandTotal
      )}\nDue Date: ${
        invoice.dueDate ? formatDate(invoice.dueDate) : "N/A"
      }\n\nThank you for your business!\n\n${company.name}`;

      const mailtoLink = `mailto:${invoice.customerEmail || ""}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    } catch (err) {
      alert("Failed to share invoice");
    } finally {
      setShareLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  const handleStatusChange = async (newStatusRaw) => {
    if (!invoice) return;
    const newStatus = normalizeStatus(newStatusRaw);
    const oldStatus = normalizeStatus(invoice.status);

    if (newStatus === oldStatus) {
      setShowStatusModal(false);
      return;
    }

    try {
      setUpdatingStatus(true);

      const { data } = await api.patch(`/invoices/${id}/status`, {
        status: newStatus,
      });

      if (!data?.success) throw new Error("Update failed");

      setInvoice((p) => ({ ...p, status: newStatus }));
      setShowStatusModal(false);

      alert(`Status changed to ${newStatus}`);
    } catch (err) {
      alert("Failed to change status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* -----------------------------
     RENDER STATES
  ----------------------------- */
  if (loading) {
    return (
      <div className="invoice-preview-container">
        <Sidebar />
        <div className="invoice-preview-content">
          <div className="loading-screen">
            <div className="spinner"></div>
            <h3>Loading Invoice...</h3>
            <p>Please wait while we fetch your invoice details</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="invoice-preview-container">
        <Sidebar />
        <div className="invoice-preview-content">
          <div className="error-screen">
            <div className="error-icon">⚠️</div>
            <h3>{error || "Invoice Not Found"}</h3>
            <p>
              The invoice you're looking for doesn't exist or you
              don't have permission to view it.
            </p>
            <div className="error-actions">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
              >
                <FiChevronLeft /> Go Back
              </button>
              <Link to="/invoices" className="btn btn-primary">
                View All Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(invoice.status);
  const totals = calculateTotals();
  const isRCM = invoice.reverseCharge === "Yes";
  const supplyType =
    invoice.supplyType ||
    (company?.stateCode === invoice.placeOfSupply
      ? "Intra-State"
      : "Inter-State");

  /* -----------------------------
     MAIN UI
  ----------------------------- */
  return (
    <div className="invoice-preview-container">
      <Sidebar />

      <div className="invoice-preview-content">
        {/* Header */}
        <div className="preview-header">
          <div className="header-left">
            <button
              onClick={() => navigate(-1)}
              className="btn-back"
            >
              <FiChevronLeft /> Back
            </button>
            <div className="invoice-title">
              <h1>
                <MdReceipt className="icon" />
                {invoice.invoiceType || "Tax Invoice"} #
                {invoice.invoiceNo}
              </h1>
              <div className="invoice-subtitle">
                <span className="customer-name">
                  <MdPerson /> {invoice.customerName}
                </span>
                <span className="invoice-date">
                  <MdCalendarToday />{" "}
                  {formatDate(invoice.invoiceDate)}
                </span>
                <span className="invoice-amount">
                  <MdPayments />{" "}
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className={getStatusClass(normalizedStatus)}>
              {statusIcons[normalizedStatus.toLowerCase()] ||
                statusIcons.pending}
              {normalizedStatus}
            </div>

            <div className="action-buttons">
              <button
                onClick={() => setShowStatusModal(true)}
                className="btn btn-outline"
              >
                Change Status
              </button>
              <Link
                to={`/edit-invoice/${id}`}
                className="btn btn-outline"
              >
                <FiEdit /> Edit
              </Link>
              <button
                onClick={handlePrint}
                className="btn btn-primary"
              >
                <FiPrinter /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon total-amount">
              <MdPayments />
            </div>
            <div className="stat-info">
              <span className="stat-label">Grand Total</span>
              <span className="stat-value">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon items-count">
              <MdDescription />
            </div>
            <div className="stat-info">
              <span className="stat-label">Items</span>
              <span className="stat-value">
                {invoice.items?.length || 0}
              </span>
            </div>
          </div>

          {totals.totalDiscount > 0 && (
            <div className="stat-card">
              <div className="stat-icon discount-amount">
                <MdDiscount />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Discount</span>
                <span className="stat-value discount">
                  -{formatCurrency(totals.totalDiscount)}
                </span>
              </div>
            </div>
          )}

          <div className="stat-card">
            <div className="stat-icon gst-amount">
              <MdAccountBalance />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total GST</span>
              <span className="stat-value">
                {isRCM ? "RCM" : formatCurrency(totals.gstTotal)}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon supply-type">
              <MdLocalShipping />
            </div>
            <div className="stat-info">
              <span className="stat-label">Supply Type</span>
              <span className="stat-value">{supplyType}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rcm-status">
              {isRCM ? <MdError /> : <MdCheckCircle />}
            </div>
            <div className="stat-info">
              <span className="stat-label">RCM</span>
              <span className="stat-value">
                {isRCM ? "Applied" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Selector */}
        <div className="layout-selector">
          <div className="layout-tabs">
            <button
              className={`layout-tab ${
                layoutType === "tax" ? "active" : ""
              }`}
              onClick={() => setLayoutType("tax")}
            >
              Professional GST Invoice
            </button>
            <button
              className={`layout-tab ${
                layoutType === "thermal" ? "active" : ""
              }`}
              onClick={() => setLayoutType("thermal")}
            >
              Thermal (80mm)
            </button>
          </div>

          <div className="export-actions">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="btn btn-success"
            >
              <FiDownload />{" "}
              {pdfLoading ? "Downloading..." : "Download PDF"}
            </button>
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="btn btn-whatsapp"
            >
              <FiShare2 />{" "}
              {shareLoading ? "Sharing..." : "Share"}
            </button>
            <button
              onClick={() => copyToClipboard(invoice.invoiceNo)}
              className="btn btn-outline"
            >
              <FiCopy /> Copy Invoice No
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="invoice-preview-wrapper">
          {layoutType === "tax" && <TaxInvoice />}
          {layoutType === "thermal" && <ThermalInvoice />}
        </div>

        {/* Additional Details */}
        <div className="additional-actions">
          <button
            className="btn btn-outline"
            onClick={() =>
              setShowMoreDetails(!showMoreDetails)
            }
          >
            <FiChevronRight
              style={{
                transform: showMoreDetails
                  ? "rotate(90deg)"
                  : "none",
              }}
            />
            {showMoreDetails
              ? "Hide Details"
              : "Show More Details"}
          </button>

          {showMoreDetails && (
            <div className="more-details">
              <div className="details-grid">
                <div className="detail-section">
                  <h4>Payment Information</h4>
                  <p>
                    Mode:{" "}
                    {getPaymentModeText(invoice.paymentMode)}
                  </p>
                  <p>
                    Reference:{" "}
                    {invoice.paymentReference || "N/A"}
                  </p>
                  <p>Status: {normalizedStatus}</p>
                  {totals.paidAmount > 0 && (
                    <p>
                      Paid Amount:{" "}
                      {formatCurrency(totals.paidAmount)}
                    </p>
                  )}
                  {totals.balance > 0 && (
                    <p>
                      Balance Due:{" "}
                      {formatCurrency(totals.balance)}
                    </p>
                  )}
                </div>
                <div className="detail-section">
                  <h4>Tax Details</h4>
                  <p>
                    Place of Supply: {invoice.placeOfSupply}
                  </p>
                  <p>Supply Type: {supplyType}</p>
                  <p>
                    Reverse Charge:{" "}
                    {isRCM ? "Yes (RCM)" : "No"}
                  </p>
                  <p>
                    Total GST:{" "}
                    {isRCM
                      ? "RCM Applied"
                      : formatCurrency(totals.gstTotal)}
                  </p>
                  {!isRCM && supplyType === "Intra-State" && (
                    <>
                      <p>
                        CGST:{" "}
                        {formatCurrency(totals.cgstTotal)}
                      </p>
                      <p>
                        SGST:{" "}
                        {formatCurrency(totals.sgstTotal)}
                      </p>
                    </>
                  )}
                  {!isRCM && supplyType === "Inter-State" && (
                    <p>
                      IGST:{" "}
                      {formatCurrency(totals.igstTotal)}
                    </p>
                  )}
                </div>
                <div className="detail-section">
                  <h4>Invoice Summary</h4>
                  <p>
                    Invoice Type:{" "}
                    {invoice.invoiceType || "Tax Invoice"}
                  </p>
                  <p>
                    Total Items:{" "}
                    {invoice.items?.length || 0}
                  </p>
                  <p>
                    Total Qty: {totals.totalQty || 0}
                  </p>
                  <p>
                    Subtotal:{" "}
                    {formatCurrency(totals.subtotal)}
                  </p>
                  {totals.totalDiscount > 0 && (
                    <p>
                      Total Discount:{" "}
                      {formatCurrency(totals.totalDiscount)}
                    </p>
                  )}
                  <p>
                    Round Off:{" "}
                    {formatCurrency(totals.roundOff)}
                  </p>
                  {(invoice.transportName ||
                    invoice.vehicleNo ||
                    invoice.lrNo) && (
                    <div className="transport-info">
                      <h5>Transport Details:</h5>
                      {invoice.transportName && (
                        <p>
                          Transport: {invoice.transportName}
                        </p>
                      )}
                      {invoice.vehicleNo && (
                        <p>
                          Vehicle No: {invoice.vehicleNo}
                        </p>
                      )}
                      {invoice.lrNo && (
                        <p>LR No: {invoice.lrNo}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Modal */}
        {showStatusModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowStatusModal(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Change Invoice Status</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowStatusModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Current status:{" "}
                  <strong className={getStatusClass(normalizedStatus)}>
                    {normalizedStatus}
                  </strong>
                </p>

                <div className="status-options">
                  {Object.values(VALID_STATUSES).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() =>
                          handleStatusChange(status)
                        }
                        disabled={
                          updatingStatus ||
                          normalizedStatus === status
                        }
                        className={`status-option ${getStatusClass(
                          status
                        )} ${
                          normalizedStatus === status
                            ? "active"
                            : ""
                        }`}

                      >
                        {status}
                        {normalizedStatus === status &&
                          " ✓"}
                      </button>
                    )
                  )}
                </div>

                {updatingStatus && (
                  <div className="updating-status">
                    <div className="spinner-small"></div>
                    Updating status...
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
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