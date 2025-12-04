// src/pages/Tenants/InvoiceCreate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./InvoiceCreate.css";

const defaultItem = () => ({
  productId: null,
  name: "",
  hsn: "",
  qty: 1,
  unit: "pcs",
  price: 0,
  gstRate: 0,
  discountPercent: 0,
  discountAmount: 0,
});

// Available units list
const availableUnits = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilogram" },
  { value: "g", label: "Gram" },
  { value: "mg", label: "Milligram" },
  { value: "l", label: "Liter" },
  { value: "ml", label: "Milliliter" },
  { value: "m", label: "Meter" },
  { value: "cm", label: "Centimeter" },
  { value: "mm", label: "Millimeter" },
  { value: "sqm", label: "Square Meter" },
  { value: "sqft", label: "Square Feet" },
  { value: "set", label: "Set" },
  { value: "pair", label: "Pair" },
  { value: "dozen", label: "Dozen" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "roll", label: "Roll" },
  { value: "bottle", label: "Bottle" },
  { value: "can", label: "Can" },
  { value: "jar", label: "Jar" },
  { value: "bag", label: "Bag" },
  { value: "carton", label: "Carton" },
  { value: "unit", label: "Unit" },
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "service", label: "Service" },
  { value: "session", label: "Session" },
];

function formatCurrency(num) {
  if (isNaN(num)) return "₹0.00";
  return `₹${Number(num).toFixed(2)}`;
}

function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

function InvoiceCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 🔥 UPDATED FORM with ReverseCharge, SupplyType, paymentMode
  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceType: "Tax Invoice",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    placeOfSupply: "KA",
    notes: "",
    shippingAddress: "",
    shippingName: "",
    transportName: "",
    vehicleNo: "",
    lrNo: "",
    overallDiscountPercent: 0,
    overallDiscountAmount: 0,
    paidAmount: 0,
    paymentMode: "cash",
    status: "Draft",

    // NEW FIELDS
    reverseCharge: "No",        // "Yes" or "No"
    supplyType: "Intra-State",   // "Intra-State" or "Inter-State"
  });

  const [items, setItems] = useState([defaultItem()]);

  const [customerList, setCustomerList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [companyState, setCompanyState] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");

  const [productModal, setProductModal] = useState({ open: false, index: null });
  const [productQuery, setProductQuery] = useState("");

  const lastItemRef = useRef(null);

  // ===========================
  //  INITIAL LOAD
  // ===========================
  useEffect(() => {
    fetchNextInvoiceNo();
    fetchCustomers();
    fetchProducts();
    fetchAuthMe();
  }, []);

  const fetchAuthMe = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data.data) {
        const company = res.data.data.company || res.data.data.companyInfo || res.data.data;
        const state = company?.state || company?.placeOfSupply || null;
        setCompanyState(state);
        setCompanyInfo(company);
      }
    } catch (err) {
      console.warn("Could not fetch company info", err);
    }
  };

  const fetchNextInvoiceNo = async () => {
    try {
      const res = await api.get("/invoices/next-invoice-no");
      if (res.data.success) {
        setForm((p) => ({ ...p, invoiceNo: res.data.nextInvoiceNo }));
      }
    } catch (err) {
      console.log("next invoice error", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      if (res.data.success) setCustomerList(res.data.data || []);
    } catch (err) {
      console.log("customers fetch error", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      if (res.data.success) setProductList(res.data.data || []);
    } catch (err) {
      console.log("products fetch error", err);
    }
  };

  // Global updater
  const updateForm = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // -----------------------------------
  // 🔥 RCM Logic: Disable GST
  // -----------------------------------
  const gstDisabled = form.reverseCharge === "Yes";

  // 🔥 When RCM: force 0 GST on all items
  useEffect(() => {
    if (gstDisabled) {
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          gstRate: 0,
        }))
      );
    }
  }, [gstDisabled]);
  // -----------------------------------
  // ROW CALCULATIONS (per item)
  // -----------------------------------
  const rows = useMemo(() => {
    return items.map((it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.price) || 0;
      const grossLine = qty * price;

      // Base discount
      const discountPercentValue = (grossLine * (Number(it.discountPercent || 0) / 100)) || 0;
      const discountDirect = Number(it.discountAmount || 0) || 0;

      // Take whichever is higher
      const discount = Math.max(discountPercentValue, discountDirect) || 0;
      const taxable = Math.max(0, grossLine - discount);

      // -----------------------------------
      // RCM GST RULE
      // -----------------------------------
      let gstAmount = 0;
      if (!gstDisabled) {
        const rate = Number(it.gstRate || 0);
        gstAmount = (taxable * rate) / 100;
      }

      const totalWithGst = taxable + gstAmount;

      return {
        ...it,
        grossLine,
        discount: Number(discount.toFixed(2)),
        taxable: Number(taxable.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        totalWithGst: Number(totalWithGst.toFixed(2)),
      };
    });
  }, [items, gstDisabled]);

  // -----------------------------------
  // TAX SPLIT based on supply type
  // -----------------------------------
  const computeTaxSplit = (gstAmount) => {
    if (gstDisabled) {
      return { cgst: 0, sgst: 0, igst: 0 };
    }

    // If manually selected, follow supplyType
    if (form.supplyType === "Intra-State") {
      return {
        cgst: +(gstAmount / 2).toFixed(2),
        sgst: +(gstAmount / 2).toFixed(2),
        igst: 0,
      };
    }

    if (form.supplyType === "Inter-State") {
      return {
        cgst: 0,
        sgst: 0,
        igst: +gstAmount.toFixed(2),
      };
    }

    // AUTO MODE: based on place of supply & company
    if (!companyState) {
      return {
        cgst: +(gstAmount / 2).toFixed(2),
        sgst: +(gstAmount / 2).toFixed(2),
        igst: 0,
      };
    }

    if (companyState === form.placeOfSupply) {
      return {
        cgst: +(gstAmount / 2).toFixed(2),
        sgst: +(gstAmount / 2).toFixed(2),
        igst: 0,
      };
    } else {
      return {
        cgst: 0,
        sgst: 0,
        igst: +gstAmount.toFixed(2),
      };
    }
  };

  // -----------------------------------
  // TOTALS (Core Financial Summary)
  // -----------------------------------
  const totals = useMemo(() => {
    let subtotal = 0,
      gstTotal = 0,
      totalDiscount = 0,
      cgstTotal = 0,
      sgstTotal = 0,
      igstTotal = 0,
      totalQty = 0;

    rows.forEach((r) => {
      subtotal += r.taxable;
      gstTotal += gstDisabled ? 0 : r.gstAmount;
      totalDiscount += r.discount;
      totalQty += Number(r.qty || 0);

      const split = computeTaxSplit(r.gstAmount);
      cgstTotal += split.cgst;
      sgstTotal += split.sgst;
      igstTotal += split.igst;
    });

    // Final overall discounts
    const overallDiscountAmountField = Number(form.overallDiscountAmount || 0);
    const overallDiscountPercentField = Number(form.overallDiscountPercent || 0);
    
    const discountFromPercent = (subtotal * overallDiscountPercentField) / 100;
    const finalOverallDiscount =
      overallDiscountAmountField > 0
        ? overallDiscountAmountField
        : discountFromPercent;

    const subtotalAfterOverall = Math.max(0, subtotal - finalOverallDiscount);

    // RCM => gstTotal forced 0
    const effectiveGst = gstDisabled ? 0 : gstTotal;

    const finalAmount = subtotalAfterOverall + effectiveGst;

    const rounded = Math.round(finalAmount);
    const roundOff = +(rounded - finalAmount).toFixed(2);

    const paid = Number(form.paidAmount || 0);
    const balance = Math.max(0, rounded - paid);

    // IF RCM enabled: force split values to 0
    if (gstDisabled) {
      cgstTotal = 0;
      sgstTotal = 0;
      igstTotal = 0;
    }

    // Amount in words helper
    const amountInWords = (num) => {
      const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
      const teens = [
        'ten','eleven','twelve','thirteen','fourteen',
        'fifteen','sixteen','seventeen','eighteen','nineteen'
      ];
      const tens = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

      if (num === 0) return "zero rupees only";

      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const hundred = Math.floor((num % 1000) / 100);
      const remainder = Math.floor(num % 100);

      let words = "";

      const part = (n, unit) => {
        if (n === 0) return "";
        let segment = "";
        if (n < 10) segment = ones[n];
        else if (n < 20) segment = teens[n - 10];
        else segment = tens[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + ones[n % 10] : "");
        return `${segment} ${unit} `;
      };

      words += part(crore, "crore");
      words += part(lakh, "lakh");
      words += part(thousand, "thousand");
      words += part(hundred, "hundred");

      if (remainder > 0) {
        if (words !== "") words += "and ";
        if (remainder < 10) words += ones[remainder];
        else if (remainder < 20) words += teens[remainder - 10];
        else words += tens[Math.floor(remainder / 10)] + (remainder % 10 > 0 ? "-" + ones[remainder % 10] : "");
      }

      return words + " rupees only";
    };

    return {
      subtotal: +subtotal.toFixed(2),
      gstTotal: +effectiveGst.toFixed(2),
      totalDiscount: +(totalDiscount + finalOverallDiscount).toFixed(2),
      cgstTotal: +cgstTotal.toFixed(2),
      sgstTotal: +sgstTotal.toFixed(2),
      igstTotal: +igstTotal.toFixed(2),
      subtotalAfterOverall: +subtotalAfterOverall.toFixed(2),
      grandTotal: +finalAmount.toFixed(2),
      rounded: +rounded.toFixed(2),
      roundOff,
      finalOverallDiscount: +finalOverallDiscount.toFixed(2),
      paid: +paid.toFixed(2),
      balance,
      totalQty,
      amountInWords: amountInWords(rounded).toUpperCase(),
    };
  }, [
    rows,
    form.overallDiscountAmount,
    form.overallDiscountPercent,
    form.paidAmount,
    form.placeOfSupply,
    form.reverseCharge,
    form.supplyType,
    companyState
  ]);
  // -----------------------------------
  // ITEM + FORM HELPERS
  // -----------------------------------
  const handleItemChange = (i, k, v) => {
    setItems((prev) => {
      const arr = [...prev];
      if (["qty", "price", "gstRate", "discountPercent", "discountAmount"].includes(k)) {
        arr[i][k] = v === "" ? "" : Number(v);
      } else {
        arr[i][k] = v;
      }
      return arr;
    });
  };

  const addItem = () => {
    setItems((p) => [...p, defaultItem()]);
    setTimeout(() => lastItemRef.current?.focus(), 80);
  };

  const selectCustomer = (cust) => {
    setForm((p) => ({
      ...p,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      customerAddress: cust.address,
      shippingName: cust.name,
      shippingAddress: cust.address,
    }));
    setCustomerModalOpen(false);
  };

  const selectProduct = (prod) => {
    const i = productModal.index;
    if (i == null) return;
    setItems((prev) => {
      const arr = [...prev];
      arr[i] = {
        ...arr[i],
        productId: prod._id,
        name: prod.name,
        hsn: prod.hsn,
        qty: 1,
        unit: prod.unit || "pcs",
        price: prod.price || 0,
        gstRate: gstDisabled ? 0 : prod.gstRate || 0,
        discountPercent: 0,
        discountAmount: 0,
      };
      return arr;
    });
    setProductModal({ open: false, index: null });
  };

  const validate = () => {
    if (!form.customerName.trim()) {
      alert("Enter customer name");
      return false;
    }
    if (items.length === 0) {
      alert("Add at least one item");
      return false;
    }
    for (const [idx, it] of items.entries()) {
      if (!it.name || it.name.trim() === "") {
        alert(`Item ${idx + 1}: Enter product name`);
        return false;
      }
      if ((Number(it.qty) || 0) <= 0) {
        alert(`Item ${idx + 1}: Quantity must be > 0`);
        return false;
      }
      if ((Number(it.price) || 0) < 0) {
        alert(`Item ${idx + 1}: Price invalid`);
        return false;
      }
    }
    return true;
  };

  // -----------------------------------
  // SUBMIT HANDLER
  // -----------------------------------
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Prepare per-line data for backend
      const invoiceItems = rows.map((r, index) => {
        const taxSplit = computeTaxSplit(r.gstAmount);
        const taxable = Number(r.taxable);
        const gstAmount = gstDisabled ? 0 : Number(r.gstAmount);
        const total = taxable + gstAmount;

        return {
          productId: r.productId || null,
          name: r.name,
          description: r.name,
          hsn: r.hsn,
          qty: Number(r.qty),
          unit: r.unit,
          price: Number(r.price),
          gstRate: gstDisabled ? 0 : Number(r.gstRate),
          discount: Number(r.discount),
          taxable,
          gstAmount,
          cgst: taxSplit.cgst,
          sgst: taxSplit.sgst,
          igst: taxSplit.igst,
          total,
          serialNo: index + 1,
        };
      });

      // Root payload
      const payload = {
        // Basic invoice info
        invoiceNo: form.invoiceNo,
        invoiceType: form.invoiceType,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        status: form.status,

        // Reverse Charge & Supply Type
        reverseCharge: form.reverseCharge,      // "Yes" / "No"
        supplyType: form.supplyType,            // "Intra-State" / "Inter-State"

        // Customer info
        customerName: form.customerName,
        customerPhone: form.customerPhone || "",
        customerEmail: form.customerEmail || "",
        customerAddress: form.customerAddress || "",

        // Shipping info
        shippingName: form.shippingName || form.customerName,
        shippingAddress: form.shippingAddress || form.customerAddress,

        // Tax info
        placeOfSupply: form.placeOfSupply,

        // Transport info
        transportName: form.transportName || "",
        vehicleNo: form.vehicleNo || "",
        lrNo: form.lrNo || "",

        // Notes
        notes: form.notes || "",

        // Items
        items: invoiceItems,

        // Totals (root level, for compatibility)
        subtotal: totals.subtotal,
        gstTotal: totals.gstTotal,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        igstTotal: totals.igstTotal,
        grandTotal: totals.rounded,
        roundOff: totals.roundOff,
        amountInWords: totals.amountInWords,

        // New: total quantity
        totalQty: totals.totalQty,

        // Discounts
        overallDiscountPercent: Number(form.overallDiscountPercent || 0),
        overallDiscountAmount: Number(totals.finalOverallDiscount || 0),

        // Payment info (root helper + nested)
        paidAmount: totals.paid,
        balance: totals.balance,
        paymentMode: form.paymentMode,
        payment: {
          paidAmount: totals.paid,
          method: form.paymentMode,
          balance: totals.balance,
        },

        // Totals object for backend computeInvoiceTotals fallback
        totals: {
          subtotal: totals.subtotal,
          totalDiscount: totals.totalDiscount,
          gstTotal: totals.gstTotal,
          grandTotal: totals.rounded,
          roundOff: totals.roundOff,
          paidAmount: totals.paid,
          balance: totals.balance,
        },

        // Optional company reference
        companyId: companyInfo?._id || null,
      };

      console.log("📤 Sending invoice payload:", JSON.stringify(payload, null, 2));

      const res = await api.post("/invoices", payload);

      if (!res.data.success) {
        throw new Error(res.data.message || "Invoice create failed");
      }

      const created = res.data.data || res.data;

      alert("✅ Invoice created successfully");
      navigate(`/invoice-preview/${created._id || created.id || created._doc?._id}`);
    } catch (err) {
      console.error("❌ Invoice create error:", err);
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // FILTERED LISTS (Customer / Product)
  // -----------------------------------
  const filteredCustomers = useMemo(() => {
    const q = customerQuery.toLowerCase();
    return customerList.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [customerQuery, customerList]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase();
    return productList.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.hsn || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
    );
  }, [productQuery, productList]);

  // -----------------------------------
  // JSX START
  // -----------------------------------
  return (
    <div className="invoice-create-container">
      {/* Header Section */}
      <header className="invoice-create-header">
        <div className="invoice-header-content">
          <div className="invoice-header-title">
            <button className="invoice-back-btn" onClick={() => navigate(-1)}>
              <span className="invoice-back-icon">←</span>
              Back
            </button>
            <div>
              <h1 className="invoice-main-title">Create New Invoice</h1>
              <p className="invoice-subtitle">Create professional GST invoices with ease</p>
            </div>
          </div>

          <div className="invoice-header-actions">
            <button
              className="invoice-btn invoice-btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="invoice-btn invoice-btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Preview"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="invoice-create-main">
        <div className="invoice-content-layout">
          {/* Main Form Column */}
          <div className="invoice-main-form-column">
            {/* Invoice Details Card */}
            <div className="invoice-card">
              <div className="invoice-card-header">
                <h3 className="invoice-card-title">Invoice Details</h3>
              </div>
              <div className="invoice-card-body">
                <div className="invoice-form-grid">
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Invoice Number</label>
                    <input
                      type="text"
                      className="invoice-form-input"
                      value={form.invoiceNo}
                      onChange={(e) => updateForm("invoiceNo", e.target.value)}
                      placeholder="INV-001"
                    />
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Invoice Type</label>
                    <select
                      className="invoice-form-input"
                      value={form.invoiceType}
                      onChange={(e) => updateForm("invoiceType", e.target.value)}
                    >
                      <option>Tax Invoice</option>
                      <option>Retail Invoice</option>
                      <option>Estimate / Quotation</option>
                      <option>Delivery Challan</option>
                    </select>
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Invoice Date</label>
                    <input
                      type="date"
                      className="invoice-form-input"
                      value={form.invoiceDate}
                      onChange={(e) => updateForm("invoiceDate", e.target.value)}
                    />
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Due Date</label>
                    <input
                      type="date"
                      className="invoice-form-input"
                      value={form.dueDate}
                      onChange={(e) => updateForm("dueDate", e.target.value)}
                    />
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Status</label>
                    <select
                      className="invoice-form-input"
                      value={form.status}
                      onChange={(e) => updateForm("status", e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Place of Supply</label>
                    <select
                      className="invoice-form-input"
                      value={form.placeOfSupply}
                      onChange={(e) => updateForm("placeOfSupply", e.target.value)}
                    >
                      <option value="KA">Karnataka</option>
                      <option value="MH">Maharashtra</option>
                      <option value="TN">Tamil Nadu</option>
                      <option value="DL">Delhi</option>
                      <option value="UP">Uttar Pradesh</option>
                      <option value="GJ">Gujarat</option>
                      <option value="RJ">Rajasthan</option>
                      <option value="AP">Andhra Pradesh</option>
                      <option value="TS">Telangana</option>
                      <option value="KL">Kerala</option>
                    </select>
                  </div>

                  {/* NEW: Reverse Charge */}
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Reverse Charge (RCM)</label>
                    <select
                      className="invoice-form-input"
                      value={form.reverseCharge}
                      onChange={(e) => updateForm("reverseCharge", e.target.value)}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    <small className="invoice-help-text">
                      If "Yes", GST will not be charged in this invoice. Tax is payable by recipient under RCM.
                    </small>
                  </div>

                  {/* NEW: Supply Type */}
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Supply Type</label>
                    <select
                      className="invoice-form-input"
                      value={form.supplyType}
                      onChange={(e) => updateForm("supplyType", e.target.value)}
                    >
                      <option value="Intra-State">Intra-State (CGST + SGST)</option>
                      <option value="Inter-State">Inter-State (IGST)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="invoice-card">
              <div className="invoice-card-header">
                <h3 className="invoice-card-title">Customer Information</h3>
                <button
                  className="invoice-btn invoice-btn-outline"
                  onClick={() => setCustomerModalOpen(true)}
                >
                  Browse Customers
                </button>
              </div>
              <div className="invoice-card-body">
                <div className="invoice-form-group">
                  <label className="invoice-form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="invoice-form-input"
                    value={form.customerName}
                    onChange={(e) => updateForm("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="invoice-form-grid">
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="invoice-form-input"
                      value={form.customerPhone}
                      onChange={(e) => updateForm("customerPhone", e.target.value)}
                      placeholder="+91 00000 00000"
                    />
                  </div>
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Email</label>
                    <input
                      type="email"
                      className="invoice-form-input"
                      value={form.customerEmail}
                      onChange={(e) => updateForm("customerEmail", e.target.value)}
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>

                <div className="invoice-form-group">
                  <label className="invoice-form-label">Shipping Name</label>
                  <input
                    type="text"
                    className="invoice-form-input"
                    value={form.shippingName || form.customerName}
                    onChange={(e) => updateForm("shippingName", e.target.value)}
                    placeholder="Name for shipping"
                  />
                </div>

                <div className="invoice-form-group">
                  <label className="invoice-form-label">Shipping Address</label>
                  <textarea
                    className="invoice-form-textarea"
                    rows={2}
                    value={form.shippingAddress || form.customerAddress}
                    onChange={(e) => updateForm("shippingAddress", e.target.value)}
                    placeholder="Shipping address (if different)"
                  />
                </div>

                <div className="invoice-form-group">
                  <label className="invoice-form-label">Customer Address</label>
                  <textarea
                    className="invoice-form-textarea"
                    rows={3}
                    value={form.customerAddress}
                    onChange={(e) => updateForm("customerAddress", e.target.value)}
                    placeholder="Enter complete address"
                  />
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="invoice-card">
              <div className="invoice-card-header">
                <h3 className="invoice-card-title">Items & Services</h3>
                <button
                  className="invoice-btn invoice-btn-primary"
                  onClick={addItem}
                >
                  + Add Item
                </button>
              </div>
              <div className="invoice-card-body-no-padding">
                <div className="invoice-table-container">
                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th className="invoice-text-center">#</th>
                        <th>Product/Service</th>
                        <th>HSN</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Rate</th>
                        <th>Discount</th>
                        <th>GST %</th>
                        <th className="invoice-text-right">Amount</th>
                        <th className="invoice-text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "invoice-table-even" : "invoice-table-odd"}
                        >
                          <td className="invoice-text-center">{index + 1}</td>
                          <td>
                            <div className="invoice-product-input-group">
                              <input
                                type="text"
                                className="invoice-form-input invoice-form-input-small"
                                value={row.name}
                                onChange={(e) =>
                                  handleItemChange(index, "name", e.target.value)
                                }
                                placeholder="Product name"
                                required
                              />
                              <button
                                className="invoice-btn invoice-btn-sm invoice-btn-outline"
                                onClick={() =>
                                  setProductModal({ open: true, index })
                                }
                              >
                                Browse
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="invoice-form-input invoice-form-input-small"
                              value={row.hsn}
                              onChange={(e) =>
                                handleItemChange(index, "hsn", e.target.value)
                              }
                              placeholder="HSN code"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="invoice-form-input invoice-form-input-small invoice-text-center"
                              value={row.qty}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "qty",
                                  Number(e.target.value)
                                )
                              }
                              min="1"
                              step="0.01"
                            />
                          </td>
                          <td>
                            <select
                              className="invoice-form-input invoice-form-input-small invoice-unit-select"
                              value={row.unit}
                              onChange={(e) =>
                                handleItemChange(index, "unit", e.target.value)
                              }
                            >
                              {availableUnits.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="invoice-form-input invoice-form-input-small invoice-text-right"
                              value={row.price}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                              ref={index === rows.length - 1 ? lastItemRef : null}
                              step="0.01"
                            />
                          </td>
                          <td>
                            <div className="invoice-discount-inputs">
                              <input
                                type="number"
                                className="invoice-form-input invoice-form-input-xsmall"
                                value={row.discountPercent}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "discountPercent",
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="%"
                                min="0"
                                step="0.01"
                                title="Discount %"
                              />
                              <input
                                type="number"
                                className="invoice-form-input invoice-form-input-xsmall"
                                value={row.discountAmount}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "discountAmount",
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="₹"
                                min="0"
                                step="0.01"
                                title="Discount amount"
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="invoice-form-input invoice-form-input-small invoice-text-center"
                              value={row.gstRate}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "gstRate",
                                  Number(e.target.value)
                                )
                              }
                              step="0.1"
                              disabled={gstDisabled}
                              title={
                                gstDisabled
                                  ? "GST disabled due to Reverse Charge (RCM)"
                                  : "GST %"
                              }
                            />
                          </td>
                          <td className="invoice-text-right">
                            <span className="invoice-amount">
                              {formatCurrency(row.totalWithGst)}
                            </span>
                          </td>
                          <td className="invoice-text-center">
                            <button
                              className="invoice-btn invoice-btn-sm invoice-btn-danger"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Notes & Transport */}
            <div className="invoice-card">
              <div className="invoice-card-header">
                <h3 className="invoice-card-title">Additional Information</h3>
              </div>
              <div className="invoice-card-body">
                <div className="invoice-form-grid">
                  <div className="invoice-form-group invoice-form-group-fullwidth">
                    <label className="invoice-form-label">Notes</label>
                    <textarea
                      className="invoice-form-textarea"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      placeholder="Any additional notes or T&C..."
                    />
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Transport Name</label>
                    <input
                      className="invoice-form-input"
                      value={form.transportName}
                      onChange={(e) =>
                        updateForm("transportName", e.target.value)
                      }
                    />
                  </div>
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Vehicle No</label>
                    <input
                      className="invoice-form-input"
                      value={form.vehicleNo}
                      onChange={(e) =>
                        updateForm("vehicleNo", e.target.value)
                      }
                    />
                  </div>
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">LR / Waybill No</label>
                    <input
                      className="invoice-form-input"
                      value={form.lrNo}
                      onChange={(e) => updateForm("lrNo", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <-- end of invoice-main-form-column */}
        </div>

        {/* Invoice Summary Section */}
        <div className="invoice-summary-section">
          <div className="invoice-card">
            <div className="invoice-card-header">
              <h3 className="invoice-card-title">Invoice Summary</h3>
            </div>
            <div className="invoice-card-body">
              <div className="invoice-summary-grid">
                <div className="invoice-summary-left">
                  <div className="invoice-summary-item">
                    <span>Subtotal:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Items Discount:</span>
                    <span className="invoice-summary-value">
                      -
                      {formatCurrency(
                        totals.totalDiscount - totals.finalOverallDiscount
                      )}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Overall Discount:</span>
                    <div className="invoice-overall-discount-inputs">
                      <input
                        type="number"
                        className="invoice-form-input invoice-form-input-xsmall"
                        value={form.overallDiscountPercent}
                        onChange={(e) =>
                          updateForm(
                            "overallDiscountPercent",
                            Number(e.target.value || 0)
                          )
                        }
                        placeholder="%"
                      />
                      <input
                        type="number"
                        className="invoice-form-input invoice-form-input-xsmall"
                        value={form.overallDiscountAmount}
                        onChange={(e) =>
                          updateForm(
                            "overallDiscountAmount",
                            Number(e.target.value || 0)
                          )
                        }
                        placeholder="₹"
                      />
                    </div>
                    <span className="invoice-summary-value">
                      -{formatCurrency(totals.finalOverallDiscount)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>CGST:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.cgstTotal)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>SGST:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.sgstTotal)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>IGST:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.igstTotal)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Total Tax (GST):</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.gstTotal)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Total Quantity:</span>
                    <span className="invoice-summary-value">
                      {totals.totalQty}
                    </span>
                  </div>

                  <div className="invoice-summary-divider"></div>

                  <div className="invoice-summary-item invoice-grand-total">
                    <span>Grand Total:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.rounded)}
                    </span>
                  </div>

                  <div className="invoice-summary-item invoice-round-off">
                    <span>Round Off:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.roundOff)}
                    </span>
                  </div>

                  <div className="invoice-summary-item invoice-amount-words">
                    <span>Amount in Words:</span>
                    <span className="invoice-summary-value-small">
                      {totals.amountInWords}
                    </span>
                  </div>
                </div>

                <div className="invoice-summary-right">
                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Paid Amount</label>
                    <input
                      type="number"
                      className="invoice-form-input"
                      value={form.paidAmount}
                      onChange={(e) =>
                        updateForm("paidAmount", Number(e.target.value || 0))
                      }
                    />
                  </div>

                  <div className="invoice-form-group">
                    <label className="invoice-form-label">Payment Mode</label>
                    <select
                      className="invoice-form-input"
                      value={form.paymentMode}
                      onChange={(e) =>
                        updateForm("paymentMode", e.target.value)
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Balance:</span>
                    <span className="invoice-summary-value">
                      {formatCurrency(totals.balance)}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Place of Supply:</span>
                    <span className="invoice-summary-value">
                      {form.placeOfSupply}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Company State:</span>
                    <span className="invoice-summary-value">
                      {companyState || "Not set"}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Supply Type:</span>
                    <span className="invoice-summary-value">
                      {form.supplyType}
                    </span>
                  </div>

                  <div className="invoice-summary-item">
                    <span>Reverse Charge:</span>
                    <span className="invoice-summary-value">
                      {form.reverseCharge}
                    </span>
                  </div>

                  <button
                    className="invoice-btn invoice-btn-primary invoice-btn-block"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save & Preview Invoice"}
                  </button>

                  <div className="invoice-summary-help">
                    <p>All fields marked with * are required</p>
                    <p className="invoice-summary-note">
                      <strong>Note:</strong> Stocks will be reduced after invoice
                      creation.
                      {companyState && form.placeOfSupply ? (
                        form.reverseCharge === "Yes" ? (
                          " GST is not charged in this invoice (Reverse Charge)."
                        ) : companyState === form.placeOfSupply ? (
                          " GST will be split as CGST + SGST (same state)."
                        ) : (
                          " GST will be charged as IGST (inter-state)."
                        )
                      ) : (
                        " GST calculation depends on place of supply."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Customer Selection Modal */}
      {customerModalOpen && (
        <ModalPortal>
          <div className="invoice-modal-overlay">
            <div className="invoice-modal">
              <div className="invoice-modal-header">
                <h3>Select Customer</h3>
                <div className="invoice-search-box">
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    className="invoice-search-input"
                  />
                </div>
              </div>
              <div className="invoice-modal-body">
                {filteredCustomers.length === 0 ? (
                  <div className="invoice-empty-state">
                    <p>No customers found</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer._id}
                      className="invoice-modal-item"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="invoice-modal-item-main">
                        <strong>{customer.name}</strong>
                        <span className="invoice-modal-item-phone">
                          {customer.phone}
                        </span>
                      </div>
                      {customer.email && (
                        <div className="invoice-modal-item-email">
                          {customer.email}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="invoice-modal-footer">
                <button
                  className="invoice-btn invoice-btn-secondary"
                  onClick={() => setCustomerModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Product Selection Modal */}
      {productModal.open && (
        <ModalPortal>
          <div className="invoice-modal-overlay">
            <div className="invoice-modal">
              <div className="invoice-modal-header">
                <h3>Select Product</h3>
                <div className="invoice-search-box">
                  <input
                    type="text"
                    placeholder="Search by product name or HSN code..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    className="invoice-search-input"
                  />
                </div>
              </div>
              <div className="invoice-modal-body">
                {filteredProducts.length === 0 ? (
                  <div className="invoice-empty-state">
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="invoice-modal-item"
                      onClick={() => selectProduct(product)}
                    >
                      <div className="invoice-modal-item-main">
                        <strong>{product.name}</strong>
                        <span className="invoice-product-price">
                          ₹{product.price}
                        </span>
                      </div>
                      <div className="invoice-modal-item-details">
                        {product.hsn && <span>HSN: {product.hsn}</span>}
                        <span>GST: {product.gstRate}%</span>
                        <span className="invoice-product-unit">
                          Unit:{" "}
                          {availableUnits.find(
                            (u) => u.value === (product.unit || "pcs")
                          )?.label || "Pieces"}
                        </span>
                        <span className="invoice-product-stock">
                          Available:{" "}
                          {product.availableStock ??
                            product.currentStock ??
                            0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="invoice-modal-footer">
                <button
                  className="invoice-btn invoice-btn-secondary"
                  onClick={() =>
                    setProductModal({ open: false, index: null })
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default InvoiceCreate;
