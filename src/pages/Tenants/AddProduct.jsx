import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./AddProduct.css";

function PurchaseInvoiceCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    supplierName: "",
    supplierPhone: "",
    supplierEmail: "",
    supplierAddress: "",
    supplierGstNumber: "",
    placeOfSupply: "KA",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceNo: "",
    paymentStatus: "pending",
    paymentMethod: "cash",
    notes: ""
  });

  const [items, setItems] = useState([
    {
      name: "",
      hsn: "",
      qty: 1,
      price: 0,
      gstRate: 18,
      productId: null,
      unit: "pcs",
    },
  ]);

  const [tenant, setTenant] = useState(null);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [nextInvoiceNo, setNextInvoiceNo] = useState("");

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importMapping, setImportMapping] = useState({
    name: "name",
    hsn: "hsn",
    qty: "qty",
    price: "price",
    gstRate: "gstRate",
    unit: "unit",
  });

  const availableUnits = [
    "pcs",
    "kg",
    "meter",
    "litre",
    "pack",
    "box",
    "set",
    "pair",
    "dozen",
    "gram",
    "ton",
  ];

  // ---------- Utility ----------
  const round = (n) =>
    Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
  const fmt = (v) => `₹${round(v).toFixed(2)}`;

  // ---------- Load Tenant + Dropdowns + Invoice Number ----------
  useEffect(() => {
    (async () => {
      try {
        const [authRes, setRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/settings"),
        ]);

        let company = {};
        if (authRes.data?.success && authRes.data.company) {
          company = authRes.data.company;
        }
        if (setRes.data?.success && setRes.data.company) {
          company = { ...company, ...setRes.data.company };
        }

        setTenant(company);

        if (company._id) {
          await Promise.all([loadDropdowns(), loadNextInvoiceNumber()]);
        }
      } catch (err) {
        console.error("Error loading company info:", err);
      }
    })();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [s, p] = await Promise.all([
        api.get("/suppliers?limit=1000"),
        api.get("/products?limit=1000"),
      ]);

      setAllSuppliers(s.data?.data?.suppliers || s.data?.data || []);
      setAllProducts(p.data?.data?.products || p.data?.data || []);
    } catch (e) {
      console.error("Dropdown load failed:", e);
    }
  };

  const loadNextInvoiceNumber = async () => {
    try {
      const response = await api.get("/purchases/next-invoice-no");
      if (response.data.success) {
        setNextInvoiceNo(response.data.nextInvoiceNo);
        setForm((prev) => ({
          ...prev,
          invoiceNo: response.data.nextInvoiceNo,
        }));
      } else {
        throw new Error(
          response.data.message || "Failed to load invoice number"
        );
      }
    } catch (error) {
      console.error("Error loading next invoice number:", error);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const defaultInvoiceNo = `PUR-${timestamp}-001`;
      setNextInvoiceNo(defaultInvoiceNo);
      setForm((prev) => ({ ...prev, invoiceNo: defaultInvoiceNo }));
      setMessage("⚠️ Using auto-generated invoice number");
    }
  };

  // ---------- CSV Import ----------
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("❌ Please upload a CSV file");
      return;
    }

    setImportFile(file);
    previewFile(file);
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      parseCSV(csvText);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      setMessage(
        "❌ CSV file must have at least a header row and one data row"
      );
      return;
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/"/g, ""));
    const previewData = lines.slice(1, 6).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    setImportPreview(previewData);

    const autoMapping = {};
    headers.forEach((header) => {
      const lower = header.toLowerCase();
      if (
        lower.includes("product") ||
        lower.includes("name") ||
        lower.includes("item")
      ) {
        autoMapping.name = header;
      } else if (lower.includes("hsn") || lower.includes("code")) {
        autoMapping.hsn = header;
      } else if (lower.includes("qty") || lower.includes("quantity")) {
        autoMapping.qty = header;
      } else if (
        lower.includes("price") ||
        lower.includes("rate") ||
        lower.includes("cost")
      ) {
        autoMapping.price = header;
      } else if (lower.includes("gst") || lower.includes("tax")) {
        autoMapping.gstRate = header;
      } else if (lower.includes("unit") || lower.includes("uom")) {
        autoMapping.unit = header;
      }
    });

    setImportMapping((prev) => ({ ...prev, ...autoMapping }));
    setShowImportModal(true);
  };

  const handleImportMappingChange = (field, value) => {
    setImportMapping((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const processImport = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      const lines = csvText.split("\n").filter((line) => line.trim());
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));

      const importedItems = lines
        .slice(1)
        .map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          const productName = row[importMapping.name];
          if (!productName) return null;

          const existingProduct = allProducts.find(
            (p) =>
              p.name &&
              p.name.toLowerCase() === (productName || "").toLowerCase()
          );

          return {
            name: productName,
            hsn: row[importMapping.hsn] || "",
            qty: parseFloat(row[importMapping.qty]) || 1,
            price: parseFloat(row[importMapping.price]) || 0,
            gstRate: parseFloat(row[importMapping.gstRate]) || 18,
            unit: row[importMapping.unit] || "pcs",
            productId: existingProduct?._id || null,
          };
        })
        .filter(
          (item) =>
            item && item.name && Number(item.price) > 0 && Number(item.qty) > 0
        );

      if (importedItems.length === 0) {
        setMessage("❌ No valid items found in the file");
        return;
      }

      setItems(importedItems);
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      setMessage(`✅ Successfully imported ${importedItems.length} items`);
    };

    reader.readAsText(importFile);
  };

  const downloadTemplate = () => {
    const templateData = [
      ["Product Name", "HSN Code", "Quantity", "Price", "GST Rate", "Unit"],
      ["Example Product 1", "123456", "10", "100.00", "18", "pcs"],
      ["Example Product 2", "789012", "5", "250.50", "12", "pcs"],
    ];

    const csvContent = templateData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "purchase-items-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Supplier ----------
  const handleSupplierChange = (e) => {
    const name = e.target.value;
    const s = allSuppliers.find((x) => x.name === name);

    if (s) {
      setSelectedSupplier(s);
      setForm((prev) => ({
        ...prev,
        supplierName: s.name,
        supplierPhone: s.phone || "",
        supplierEmail: s.email || "",
        supplierAddress: s.address || "",
        supplierGstNumber: s.gstNumber || "",
      }));
      setMessage(`✅ Selected existing supplier: ${s.name}`);
    } else {
      setSelectedSupplier(null);
      setForm((prev) => ({
        ...prev,
        supplierName: name,
      }));
    }
  };

  const openSupplierModal = () => setShowSupplierModal(true);
  const closeSupplierModal = () => setShowSupplierModal(false);

  const selectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setForm((prev) => ({
      ...prev,
      supplierName: supplier.name,
      supplierPhone: supplier.phone || "",
      supplierEmail: supplier.email || "",
      supplierAddress: supplier.address || "",
      supplierGstNumber: supplier.gstNumber || "",
    }));
    setMessage(`✅ Selected supplier: ${supplier.name}`);
    closeSupplierModal();
  };

  // FIXED: Better supplier handling - only create if truly new
  const saveOrUpdateSupplier = async () => {
    if (!form.supplierName.trim()) {
      throw new Error("Supplier name is required");
    }

    // First, check locally if supplier exists
    const existingSupplier = allSuppliers.find(
      (s) =>
        s.name &&
        s.name.toLowerCase() === form.supplierName.trim().toLowerCase()
    );

    if (existingSupplier) {
      setSelectedSupplier(existingSupplier);
      setMessage(`✅ Using existing supplier: ${existingSupplier.name}`);
      return existingSupplier;
    }

    // Supplier doesn't exist locally, try to create
    try {
      const newSupplier = {
        name: form.supplierName.trim(),
        phone: form.supplierPhone || "",
        email: form.supplierEmail || "",
        address: form.supplierAddress || "",
        gstNumber: form.supplierGstNumber || "",
      };

      const response = await api.post("/suppliers", newSupplier);
      if (response.data.success) {
        const saved = response.data.data;
        await loadDropdowns(); // Refresh the list
        setSelectedSupplier(saved);
        setMessage(`✅ New supplier created: ${saved.name}`);
        return saved;
      }
      throw new Error(response.data.message || "Failed to save supplier");
    } catch (error) {
      console.error("Supplier creation error:", error);
      
      // If creation failed due to duplicate, find the existing one
      if (error.response?.status === 400) {
        await loadDropdowns(); // Refresh to get latest data
        const existing = allSuppliers.find(
          (s) =>
            s.name &&
            s.name.toLowerCase() === form.supplierName.trim().toLowerCase()
        );
        if (existing) {
          setSelectedSupplier(existing);
          setMessage(`✅ Supplier already exists: ${existing.name}`);
          return existing;
        }
      }
      
      throw new Error(
        error.response?.data?.message || "Failed to save supplier"
      );
    }
  };

  const addNewSupplier = async () => {
    if (!form.supplierName.trim()) return;
    if (processing) return;

    try {
      setProcessing(true);
      const saved = await saveOrUpdateSupplier();
      if (saved) {
        closeSupplierModal();
      }
    } catch (err) {
      setMessage(
        "❌ Failed to add supplier: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setProcessing(false);
    }
  };

  const clearSupplierSelection = () => {
    setSelectedSupplier(null);
    setForm((prev) => ({
      ...prev,
      supplierName: "",
      supplierPhone: "",
      supplierEmail: "",
      supplierAddress: "",
      supplierGstNumber: "",
    }));
    setMessage("Supplier selection cleared");
  };

  // ---------- Product ----------
  const handleProductChange = (index, e) => {
    const val = e.target.value;
    const next = [...items];
    next[index].name = val;

    const p = allProducts.find((x) => x.name === val);
    if (p) {
      next[index] = {
        ...next[index],
        name: p.name,
        hsn: p.hsn,
        price: p.price,
        gstRate: p.gstRate,
        unit: p.unit || "pcs",
        productId: p._id,
      };
    } else {
      next[index].productId = null;
    }

    setItems(next);
  };

  const changeItem = (index, key, value) => {
    const next = [...items];
    next[index][key] = value;

    if (key === "name") {
      const p = allProducts.find((x) => x.name === value);
      if (!p) {
        next[index].productId = null;
      }
    }

    setItems(next);
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        hsn: "",
        qty: 1,
        price: 0,
        gstRate: 18,
        productId: null,
        unit: "pcs",
      },
    ]);
  };

  const removeRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const openProductModal = (index) => {
    setCurrentProductIndex(index);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setCurrentProductIndex(null);
  };

  const selectProduct = (product) => {
    if (currentProductIndex === null) return;
    const next = [...items];
    next[currentProductIndex] = {
      ...next[currentProductIndex],
      name: product.name,
      hsn: product.hsn,
      price: product.price,
      gstRate: product.gstRate,
      unit: product.unit || "pcs",
      productId: product._id,
    };
    setItems(next);
    setMessage(`✅ Selected product: ${product.name}`);
    closeProductModal();
  };

  const addNewProduct = async () => {
    if (currentProductIndex === null) return;
    const item = items[currentProductIndex];
    if (!item.name.trim()) return;

    try {
      setProcessing(true);

      const newProduct = {
        name: item.name.trim(),
        hsn: item.hsn,
        price: Number(item.price) || 0,
        gstRate: Number(item.gstRate) || 0,
        unit: item.unit || "pcs",
        currentStock: 0,
        openingStock: 0,
      };

      const response = await api.post("/products", newProduct);
      if (response.data.success) {
        await loadDropdowns();
        setMessage("✅ Product added successfully!");
        
        // Update the current item with the new product ID
        const nextItems = [...items];
        nextItems[currentProductIndex].productId = response.data.data._id;
        setItems(nextItems);
        
        closeProductModal();
      } else {
        throw new Error(response.data.message || "Failed to add product");
      }
    } catch (error) {
      setMessage(
        "❌ Failed to add product: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setProcessing(false);
    }
  };

  const addQuickProduct = (productName) => {
    const product = allProducts.find((p) => p.name === productName);
    if (!product) return;

    const newItem = {
      name: product.name,
      hsn: product.hsn,
      qty: 1,
      price: product.price,
      gstRate: product.gstRate,
      unit: product.unit || "pcs",
      productId: product._id,
    };

    setItems((prev) => [...prev, newItem]);
    setMessage(`✅ Added ${product.name} to purchase items`);
  };

  const getProductStock = (productId) => {
    if (!productId) return null;
    const product = allProducts.find((p) => p._id === productId);
    return product ? product.currentStock : null;
  };

  // ---------- Totals ----------
  const totals = useMemo(() => {
    let taxable = 0,
      cgst = 0,
      sgst = 0,
      igst = 0;

    const sameState =
      tenant &&
      form.placeOfSupply &&
      tenant.stateCode?.toUpperCase() === form.placeOfSupply.toUpperCase();

    items.forEach((it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.price) || 0;
      const line = qty * price;
      const gst = (line * (Number(it.gstRate) || 0)) / 100;

      taxable += line;
      if (sameState) {
        cgst += gst / 2;
        sgst += gst / 2;
      } else {
        igst += gst;
      }
    });

    const sub = round(taxable);
    const totalTax = round(cgst + sgst + igst);
    const grand = round(sub + totalTax);
    const roundOff = round(Math.round(grand) - grand);
    const final = round(grand + roundOff);

    return { sub, cgst, sgst, igst, totalTax, grand, roundOff, final };
  }, [items, tenant, form.placeOfSupply]);

  // ---------- Submit ----------
  const generatePurchaseInvoice = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage("");

    if (!form.supplierName.trim()) {
      setMessage("❌ Please enter supplier name");
      setProcessing(false);
      return;
    }

    if (
      items.some(
        (item) => !item.name.trim() || Number(item.price) <= 0 || item.qty <= 0
      )
    ) {
      setMessage(
        "❌ Please fill all product details and ensure quantities and prices are positive"
      );
      setProcessing(false);
      return;
    }

    try {
      let savedSupplier = selectedSupplier;

      if (!savedSupplier) {
        setMessage("🔍 Checking supplier...");
        savedSupplier = await saveOrUpdateSupplier();
        if (!savedSupplier) {
          throw new Error("Failed to save supplier information");
        }
      }

      // Prepare items according to Purchase model schema
      const invoiceItems = items.map((item) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        const total = qty * price;
        const taxAmount = (total * (Number(item.gstRate) || 0)) / 100;
        const grandTotal = total + taxAmount;

        const itemData = {
          name: item.name.trim(),
          hsn: item.hsn || "",
          qty: qty,
          price: price,
          gstRate: Number(item.gstRate) || 0,
          total: total,
          taxAmount: taxAmount,
          grandTotal: grandTotal
        };

        if (item.productId && /^[0-9a-fA-F]{24}$/.test(item.productId)) {
          itemData.productId = item.productId;
        }

        return itemData;
      });

      // Prepare purchase data according to backend Purchase model
      const purchaseData = {
        invoiceNo: form.invoiceNo,
        invoiceDate: form.invoiceDate,
        supplierName: form.supplierName,
        supplierPhone: form.supplierPhone,
        supplierEmail: form.supplierEmail,
        supplierAddress: form.supplierAddress,
        placeOfSupply: form.placeOfSupply,
        items: invoiceItems,
        subtotal: totals.sub,
        totalTax: totals.totalTax,
        roundOff: totals.roundOff,
        grandTotal: totals.final,
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        status: "finalized"
      };

      const { data } = await api.post("/purchases", purchaseData);
      if (!data.success) {
        throw new Error(data.message || "Failed to create purchase invoice");
      }

      setMessage("✅ Purchase invoice created successfully! Inventory updated.");

      setTimeout(() => {
        navigate("/purchase-invoices");
      }, 1200);
    } catch (err) {
      console.error("Purchase invoice error:", err);
      let errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate purchase invoice";

      if (
        errorMessage.includes("duplicate key") ||
        errorMessage.includes("invoice number already exists")
      ) {
        errorMessage =
          "❌ Invoice number already exists. Please use a different invoice number.";
        await loadNextInvoiceNumber();
      } else if (errorMessage.toLowerCase().includes("supplier")) {
        errorMessage = `❌ ${errorMessage}. Please check supplier details.`;
      }

      setMessage(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pinv-create-container">
      <Sidebar />

      <div className="pinv-create-main-content">
        {/* HEADER */}
        <div className="pinv-create-header-section">
          <h1>📥 Create Purchase Invoice</h1>
          <p className="pinv-create-subtitle">
            Record purchases and update your inventory in one smooth step
          </p>
        </div>

        {/* ALERT */}
        {message && (
          <div
            className={`pinv-create-alert ${
              message.includes("✅")
                ? "pinv-create-alert-success"
                : message.includes("❌")
                ? "pinv-create-alert-danger"
                : message.includes("⚠️")
                ? "pinv-create-alert-warning"
                : message.includes("🔍")
                ? "pinv-create-alert-info"
                : "pinv-create-alert-info"
            }`}
          >
            {message}
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="pinv-create-quick-actions-section">
          {allProducts.length > 0 && (
            <div className="pinv-create-quick-actions-card">
              <h3>🚀 Quick Add Products</h3>
              <p className="pinv-create-quick-actions-note">
                Tap to instantly add commonly purchased products
              </p>
              <div className="pinv-create-quick-products-grid">
                {allProducts.slice(0, 6).map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    className="pinv-create-quick-product-btn"
                    onClick={() => addQuickProduct(product.name)}
                    disabled={processing}
                  >
                    <span className="pinv-create-product-name">
                      {product.name}
                    </span>
                    <span className="pinv-create-product-price">
                      ₹{product.price}
                    </span>
                    <span className="pinv-create-product-stock">
                      Stock: {product.currentStock || 0}{" "}
                      {product.unit || "pcs"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* IMPORT CARD */}
          <div className="pinv-create-import-card">
            <div className="pinv-create-import-card-header">
              <div>
                <h3>📤 Import Products from CSV</h3>
                <p className="pinv-create-import-description">
                  Bulk import purchase items with complete product details.
                </p>
              </div>
              <button
                type="button"
                className="pinv-create-btn-template"
                onClick={downloadTemplate}
                disabled={processing}
              >
                📋 Download Template
              </button>
            </div>

            <div className="pinv-create-import-actions">
              <div className="file-upload-area">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file-input"
                  id="file-import"
                  disabled={processing}
                />
                <label htmlFor="file-import" className="file-upload-label">
                  <span className="upload-icon">⬆</span>
                  <span>
                    {importFile
                      ? importFile.name
                      : processing
                      ? "Processing..."
                      : "Choose CSV File"}
                  </span>
                </label>
              </div>
              <p className="pinv-create-import-help">
                <strong>CSV Format:</strong> Product Name, HSN Code, Quantity,
                Price, GST Rate, Unit
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={generatePurchaseInvoice}
          className={`pinv-create-form-card ${
            processing ? "pinv-create-loading" : ""
          }`}
        >
          {/* PURCHASE DETAILS */}
          <div className="pinv-create-form-section">
            <h3>📋 Purchase Details</h3>
            <div className="pinv-create-form-grid">
              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">
                  Purchase Invoice Number *
                </label>
                <input
                  type="text"
                  className="pinv-create-form-input"
                  value={form.invoiceNo}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceNo: e.target.value,
                    }))
                  }
                  required
                  disabled={processing}
                  placeholder="PUR-20241201-0001"
                />
                <small className="pinv-create-form-help">
                  Auto-generated: {nextInvoiceNo}
                </small>
              </div>

              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  className="pinv-create-form-input"
                  value={form.invoiceDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceDate: e.target.value,
                    }))
                  }
                  required
                  disabled={processing}
                />
              </div>

              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">
                  Place of Supply *
                </label>
                <input
                  className="pinv-create-form-input"
                  value={form.placeOfSupply}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      placeOfSupply: e.target.value,
                    }))
                  }
                  required
                  disabled={processing}
                  placeholder="e.g., KA"
                />
              </div>
            </div>
          </div>

          {/* SUPPLIER */}
          <div className="pinv-create-form-section">
            <h3>🏢 Supplier Information</h3>

            {selectedSupplier && (
              <div className="pinv-create-selected-supplier-badge">
                <span>
                  ✅ Selected: <strong>{selectedSupplier.name}</strong>
                </span>
                <span>
                  {selectedSupplier.gstNumber && (
                    <> | GST: {selectedSupplier.gstNumber}</>
                  )}
                </span>
                <button
                  type="button"
                  className="pinv-create-btn-clear-supplier"
                  onClick={clearSupplierSelection}
                  disabled={processing}
                >
                  Change Supplier
                </button>
              </div>
            )}

            <div className="pinv-create-form-grid">
              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">
                  Supplier Name *
                </label>
                <div className="pinv-create-input-with-button">
                  <input
                    type="text"
                    className="pinv-create-form-input"
                    value={form.supplierName}
                    onChange={handleSupplierChange}
                    required
                    disabled={processing}
                    placeholder="Select or enter supplier name"
                    list="supplier-suggestions"
                  />
                  <datalist id="supplier-suggestions">
                    {allSuppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier.name} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    className="pinv-create-btn-add-supplier"
                    onClick={openSupplierModal}
                    disabled={processing}
                    title="Browse all suppliers"
                  >
                    🏢
                  </button>
                </div>
                {!selectedSupplier && form.supplierName && (
                  <small className="pinv-create-form-help">
                    💡 Start typing to select existing supplier or enter new supplier details
                  </small>
                )}
              </div>

              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">GST Number</label>
                <input
                  type="text"
                  className="pinv-create-form-input"
                  value={form.supplierGstNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supplierGstNumber: e.target.value,
                    }))
                  }
                  disabled={processing || !!selectedSupplier}
                  placeholder="Supplier GST number"
                />
              </div>

              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">Phone</label>
                <input
                  type="tel"
                  className="pinv-create-form-input"
                  value={form.supplierPhone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supplierPhone: e.target.value,
                    }))
                  }
                  disabled={processing || !!selectedSupplier}
                  placeholder="Supplier phone number"
                />
              </div>

              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">Email</label>
                <input
                  type="email"
                  className="pinv-create-form-input"
                  value={form.supplierEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supplierEmail: e.target.value,
                    }))
                  }
                  disabled={processing || !!selectedSupplier}
                  placeholder="Supplier email"
                />
              </div>

              <div className="pinv-create-form-group pinv-create-full-width">
                <label className="pinv-create-form-label">Address</label>
                <textarea
                  className="pinv-create-form-input"
                  rows="3"
                  value={form.supplierAddress}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supplierAddress: e.target.value,
                    }))
                  }
                  disabled={processing || !!selectedSupplier}
                  placeholder="Supplier full address"
                />
              </div>
            </div>
          </div>

          {/* PAYMENT INFORMATION */}
          <div className="pinv-create-form-section">
            <h3>💳 Payment Information</h3>
            <div className="pinv-create-form-grid">
              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">Payment Status</label>
                <select
                  className="pinv-create-form-input"
                  value={form.paymentStatus}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentStatus: e.target.value,
                    }))
                  }
                  disabled={processing}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div className="pinv-create-form-group">
                <label className="pinv-create-form-label">Payment Method</label>
                <select
                  className="pinv-create-form-input"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  disabled={processing}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="pinv-create-form-group pinv-create-full-width">
                <label className="pinv-create-form-label">Notes</label>
                <textarea
                  className="pinv-create-form-input"
                  rows="2"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={processing}
                  placeholder="Additional notes or comments"
                />
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="pinv-create-form-section">
            <div className="pinv-create-section-header">
              <h3>📦 Purchased Items ({items.length} items)</h3>
              <div className="pinv-create-section-actions">
                <button
                  type="button"
                  className="pinv-create-btn-import"
                  onClick={() => setShowImportModal(true)}
                  disabled={processing}
                >
                  📤 Import Items
                </button>
                <button
                  type="button"
                  className="pinv-create-btn-add"
                  onClick={addRow}
                  disabled={processing}
                >
                  + Add Item
                </button>
              </div>
            </div>

            <div className="pinv-create-table-container">
              <table className="pinv-create-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name *</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Purchase Rate (₹) *</th>
                    <th>GST %</th>
                    <th>Amount (₹)</th>
                    <th>Current Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const currentStock = getProductStock(item.productId);
                    const lineTotal =
                      (Number(item.qty) || 0) * (Number(item.price) || 0);

                    return (
                      <tr key={index}>
                        <td className="pinv-create-text-center">
                          {index + 1}
                        </td>
                        <td>
                          <div className="pinv-create-input-with-button">
                            <input
                              type="text"
                              className="pinv-create-table-input"
                              value={item.name}
                              onChange={(e) =>
                                handleProductChange(index, e)
                              }
                              required
                              disabled={processing}
                              placeholder="Product name"
                              list="product-suggestions"
                            />
                            <datalist id="product-suggestions">
                              {allProducts.map((product) => (
                                <option key={product._id} value={product.name} />
                              ))}
                            </datalist>
                            <button
                              type="button"
                              className="pinv-create-btn-add-product"
                              onClick={() => openProductModal(index)}
                              disabled={processing}
                              title="Browse all products"
                            >
                              📦
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            className="pinv-create-table-input"
                            value={item.hsn}
                            onChange={(e) =>
                              changeItem(index, "hsn", e.target.value)
                            }
                            disabled={processing}
                            placeholder="HSN"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            className="pinv-create-table-input pinv-create-text-center"
                            value={item.qty}
                            onChange={(e) =>
                              changeItem(index, "qty", e.target.value)
                            }
                            disabled={processing}
                          />
                        </td>
                        <td>
                          <select
                            className="pinv-create-table-input"
                            value={item.unit}
                            onChange={(e) =>
                              changeItem(index, "unit", e.target.value)
                            }
                            disabled={processing}
                          >
                            {availableUnits.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pinv-create-table-input pinv-create-text-right"
                            value={item.price}
                            onChange={(e) =>
                              changeItem(index, "price", e.target.value)
                            }
                            required
                            disabled={processing}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="pinv-create-table-input pinv-create-text-center"
                            value={item.gstRate}
                            onChange={(e) =>
                              changeItem(index, "gstRate", e.target.value)
                            }
                            disabled={processing}
                            placeholder="18"
                          />
                        </td>
                        <td className="pinv-create-text-right pinv-create-amount-cell">
                          {fmt(lineTotal)}
                        </td>
                        <td className="pinv-create-text-center pinv-create-stock-cell">
                          {currentStock !== null ? (
                            <span className="pinv-create-current-stock">
                              {currentStock} {item.unit}
                              <br />
                              <small>
                                After:{" "}
                                {currentStock + (Number(item.qty) || 0)}
                              </small>
                            </span>
                          ) : (
                            <span className="pinv-create-new-product">
                              New Product
                            </span>
                          )}
                        </td>
                        <td className="pinv-create-text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="pinv-create-btn-remove"
                              onClick={() => removeRow(index)}
                              disabled={processing}
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* INVENTORY INFO */}
          <div className="pinv-create-info-card">
            <h4>📦 Inventory Update</h4>
            <p>This purchase will automatically update your inventory:</p>
            <ul>
              <li>
                ✅ <strong>Existing products:</strong> Stock quantity will be
                increased
              </li>
              <li>
                ✅ <strong>New products:</strong> Added to inventory with all
                details
              </li>
              <li>
                ✅ <strong>Product details:</strong> Name, HSN, Unit, Price, GST Rate
              </li>
              <li>
                ✅ <strong>Stock tracking:</strong> Current stock + purchase
                quantity = New stock
              </li>
              <li>
                ✅ <strong>Supplier management:</strong> Supplier information
                saved automatically
              </li>
            </ul>
          </div>

          {/* SUMMARY */}
          <div className="pinv-create-summary-card">
            <h3>💰 Purchase Summary</h3>
            <div className="pinv-create-summary-grid">
              <div className="pinv-create-summary-item">
                <span>Taxable Value:</span>
                <span className="pinv-create-amount">{fmt(totals.sub)}</span>
              </div>
              <div className="pinv-create-summary-item">
                <span>CGST:</span>
                <span className="pinv-create-amount">{fmt(totals.cgst)}</span>
              </div>
              <div className="pinv-create-summary-item">
                <span>SGST:</span>
                <span className="pinv-create-amount">{fmt(totals.sgst)}</span>
              </div>
              <div className="pinv-create-summary-item">
                <span>IGST:</span>
                <span className="pinv-create-amount">{fmt(totals.igst)}</span>
              </div>
              <div className="pinv-create-summary-item pinv-create-total">
                <span>Total Tax:</span>
                <span className="pinv-create-amount">{fmt(totals.totalTax)}</span>
              </div>
              <div className="pinv-create-summary-item pinv-create-total">
                <span>Round Off:</span>
                <span className="pinv-create-amount">
                  {fmt(totals.roundOff)}
                </span>
              </div>
              <div className="pinv-create-summary-item pinv-create-grand-total">
                <span>Total Purchase Amount:</span>
                <span className="pinv-create-amount">
                  {fmt(totals.final)}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pinv-create-form-actions">
            <button
              type="button"
              className="pinv-create-btn-secondary"
              onClick={() => navigate("/purchase-invoices")}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pinv-create-btn-primary"
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="pinv-create-spinner"></span>
                  Creating Purchase Invoice...
                </>
              ) : (
                <>📥 Create Purchase Invoice &amp; Update Inventory</>
              )}
            </button>
          </div>
        </form>

        {/* IMPORT MODAL */}
        {showImportModal && (
          <div className="pinv-create-modal-overlay">
            <div className="pinv-create-modal-content pinv-create-import-modal">
              <div className="pinv-create-modal-header">
                <h3>Import Products from CSV File</h3>
                <button
                  type="button"
                  className="pinv-create-modal-close"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="pinv-create-modal-body">
                {importPreview.length > 0 ? (
                  <>
                    <div className="pinv-create-import-preview">
                      <h4>File Preview (First 5 rows)</h4>
                      <div className="pinv-create-preview-table">
                        <table>
                          <thead>
                            <tr>
                              {Object.keys(importPreview[0] || {}).map(
                                (header) => (
                                  <th key={header}>{header}</th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map(
                                  (value, cellIndex) => (
                                    <td key={cellIndex}>{value}</td>
                                  )
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="pinv-create-mapping-section">
                      <h4>Column Mapping</h4>
                      <p>Map your CSV columns to the required fields:</p>
                      <div className="pinv-create-mapping-grid">
                        {Object.keys(importMapping).map((field) => (
                          <div
                            key={field}
                            className="pinv-create-mapping-item"
                          >
                            <label>
                              {field === "name" && "Product Name *"}
                              {field === "hsn" && "HSN Code"}
                              {field === "qty" && "Quantity *"}
                              {field === "price" && "Price *"}
                              {field === "gstRate" && "GST Rate"}
                              {field === "unit" && "Unit"}
                            </label>
                            <select
                              value={importMapping[field] || ""}
                              onChange={(e) =>
                                handleImportMappingChange(
                                  field,
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select Column</option>
                              {Object.keys(importPreview[0] || {}).map(
                                (header) => (
                                  <option key={header} value={header}>
                                    {header}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pinv-create-no-preview">
                    <p>No file selected or unable to preview file.</p>
                  </div>
                )}
              </div>
              <div className="pinv-create-modal-footer">
                <button
                  type="button"
                  className="pinv-create-btn-secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pinv-create-btn-primary"
                  onClick={processImport}
                  disabled={
                    !importMapping.name ||
                    !importMapping.price ||
                    !importMapping.qty
                  }
                >
                  Import {importPreview.length} Items
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUPPLIER MODAL */}
        {showSupplierModal && (
          <div className="pinv-create-modal-overlay">
            <div className="pinv-create-modal-content pinv-create-supplier-modal">
              <div className="pinv-create-modal-header">
                <h3>Select Supplier</h3>
                <button
                  type="button"
                  className="pinv-create-modal-close"
                  onClick={closeSupplierModal}
                >
                  ×
                </button>
              </div>
              <div className="pinv-create-modal-body">
                <div className="pinv-create-supplier-search">
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    className="pinv-create-search-input"
                  />
                </div>
                <div className="pinv-create-supplier-list">
                  {allSuppliers.length > 0 ? (
                    allSuppliers.map((supplier) => (
                      <div
                        key={supplier._id}
                        className={`pinv-create-supplier-item ${selectedSupplier?._id === supplier._id ? 'pinv-create-supplier-selected' : ''}`}
                        onClick={() => selectSupplier(supplier)}
                      >
                        <div className="pinv-create-supplier-name">
                          {supplier.name}
                        </div>
                        <div className="pinv-create-supplier-details">
                          {supplier.gstNumber && (
                            <span className="pinv-create-gst-badge">
                              GST: {supplier.gstNumber}
                            </span>
                          )}
                          {supplier.phone && <span>📞 {supplier.phone}</span>}
                          {supplier.email && <span>✉️ {supplier.email}</span>}
                          {supplier.address && (
                            <span className="pinv-create-supplier-address">📍 {supplier.address}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pinv-create-no-suppliers">
                      No suppliers found
                    </div>
                  )}
                </div>
              </div>
              <div className="pinv-create-modal-footer">
                <button
                  type="button"
                  className="pinv-create-btn-add-new-supplier"
                  onClick={addNewSupplier}
                  disabled={!form.supplierName.trim() || processing}
                >
                  {processing
                    ? "Adding..."
                    : `➕ Add New Supplier: "${form.supplierName}"`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT MODAL */}
        {showProductModal && (
          <div className="pinv-create-modal-overlay">
            <div className="pinv-create-modal-content pinv-create-product-modal">
              <div className="pinv-create-modal-header">
                <h3>Select Product</h3>
                <button
                  type="button"
                  className="pinv-create-modal-close"
                  onClick={closeProductModal}
                >
                  ×
                </button>
              </div>
              <div className="pinv-create-modal-body">
                <div className="pinv-create-product-search">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="pinv-create-search-input"
                  />
                </div>
                <div className="pinv-create-product-list">
                  {allProducts.length > 0 ? (
                    allProducts.map((product) => (
                      <div
                        key={product._id}
                        className="pinv-create-product-item"
                        onClick={() => selectProduct(product)}
                      >
                        <div className="pinv-create-product-name">
                          {product.name}
                        </div>
                        <div className="pinv-create-product-details">
                          <span className="pinv-create-product-price">
                            ₹{product.price}
                          </span>
                          {product.hsn && <span>HSN: {product.hsn}</span>}
                          <span>GST: {product.gstRate}%</span>
                          <span className="pinv-create-product-stock">
                            Stock: {product.currentStock || 0}{" "}
                            {product.unit || "pcs"}
                          </span>
                          {product.unit && <span>Unit: {product.unit}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pinv-create-no-products">
                      No products found
                    </div>
                  )}
                </div>
              </div>
              <div className="pinv-create-modal-footer">
                <button
                  type="button"
                  className="pinv-create-btn-add-new-product"
                  onClick={addNewProduct}
                  disabled={
                    currentProductIndex === null ||
                    !items[currentProductIndex]?.name.trim() ||
                    processing
                  }
                >
                  {processing
                    ? "Adding..."
                    : `➕ Add New Product: "${
                        items[currentProductIndex]?.name || ""
                      }"`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseInvoiceCreate;