import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./PurchaseInvoiceCreate.css";

/* ============================================================
   📥 PURCHASE INVOICE CREATE PAGE
   - Auto-load next invoice number
   - Supplier:
       ✔ Type name → auto-fill if existing
       ✔ Use datalist dropdown
       ✔ Modal for choosing supplier
       ✔ If new → auto-create on submit
       ✔ If backend says "already exists" → fetch & use existing
   - Products:
       ✔ Datalist search
       ✔ Auto-fill HSN/Rate/GST/Unit
       ✔ Show current stock
   - Live totals (subtotal, GST, round off, grand total)
============================================================ */

function PurchaseInvoiceCreate() {
  const navigate = useNavigate();

  /* ------------------------------------
     🧾 BASIC FORM STATE
  ------------------------------------ */
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: today,
    placeOfSupply: "",

    supplierName: "",
    supplierPhone: "",
    supplierEmail: "",
    supplierAddress: "",
    supplierGstNumber: "",
  });

  /* ------------------------------------
     🧑‍💼 SUPPLIER STATE
  ------------------------------------ */
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  /* ------------------------------------
     📦 PRODUCT ITEMS LIST
  ------------------------------------ */
  const [items, setItems] = useState([
    {
      name: "",
      hsn: "",
      qty: 1,
      price: 0,
      gstRate: 0,
      productId: null,
      unit: "pcs",
    },
  ]);

  const [allProducts, setAllProducts] = useState([]);

  /* ------------------------------------
     ⚙️ GENERAL UI STATES
  ------------------------------------ */
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  /* ============================================================
     🚀 LOAD INITIAL DATA (Invoice No, Suppliers, Products)
  ============================================================ */

  // Next Invoice Number
  useEffect(() => {
    const loadInvoiceNumber = async () => {
      try {
        const res = await api.get("/purchases/next-invoice-no");
        if (res.data?.success && res.data?.nextInvoiceNo) {
          setForm((prev) => ({
            ...prev,
            invoiceNo: res.data.nextInvoiceNo,
          }));
        }
      } catch (err) {
        console.error("Invoice no load error:", err);
      }
    };
    loadInvoiceNumber();
  }, []);

  // Suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await api.get("/suppliers");
        if (res.data?.success) {
          const data = res.data.data;
          const list = Array.isArray(data?.suppliers) ? data.suppliers : Array.isArray(data) ? data : [];
          setAllSuppliers(list);
        }
      } catch (err) {
        console.error("Suppliers load error:", err);
      }
    };
    loadSuppliers();
  }, []);

  // Products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/products");
        if (res.data?.success) {
          const data = res.data.data;
          const list = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
          setAllProducts(list);
        }
      } catch (err) {
        console.error("Product load error:", err);
      }
    };
    loadProducts();
  }, []);

  /* ============================================================
     🧑‍💼 SUPPLIER HANDLING
  ============================================================ */

  // When user types supplier name
  const handleSupplierInput = (value) => {
    setForm((prev) => ({
      ...prev,
      supplierName: value,
    }));

    if (!value.trim()) {
      setSelectedSupplier(null);
      return;
    }

    const match = allSuppliers.find(
      (s) => s.name.toLowerCase() === value.trim().toLowerCase()
    );

    if (match) {
      setSelectedSupplier(match);
      setForm((prev) => ({
        ...prev,
        supplierPhone: match.phone || "",
        supplierEmail: match.email || "",
        supplierAddress: match.address || "",
        supplierGstNumber: match.gstNumber || "",
      }));
    } else {
      // New supplier
      setSelectedSupplier(null);
    }
  };

  // Select from modal
  const selectSupplierModal = (s) => {
    setSelectedSupplier(s);
    setForm((prev) => ({
      ...prev,
      supplierName: s.name || "",
      supplierPhone: s.phone || "",
      supplierEmail: s.email || "",
      supplierAddress: s.address || "",
      supplierGstNumber: s.gstNumber || "",
    }));
    setShowSupplierModal(false);
  };

  // Create supplier if needed (or fetch if already exists)
  const createSupplierIfNeeded = async () => {
    // If an existing supplier is selected, just return it
    if (selectedSupplier) return selectedSupplier;

    const name = form.supplierName.trim();
    if (!name) return null;

    const payload = {
      name,
      phone: form.supplierPhone || "",
      email: form.supplierEmail || "",
      address: form.supplierAddress || "",
      gstNumber: form.supplierGstNumber || "",
    };

    try {
      const res = await api.post("/suppliers", payload);
      if (res.data?.success && res.data?.data) {
        const supplier = res.data.data;
        setAllSuppliers((prev) => [...prev, supplier]);
        setSelectedSupplier(supplier);
        return supplier;
      }
    } catch (err) {
      console.error("Create supplier error:", err);
      const msg = err?.response?.data?.message?.toLowerCase() || "";

      // If backend says "already exists", fetch it & use
      if (msg.includes("already exists")) {
        try {
          const res2 = await api.get(
            "/suppliers?search=" + encodeURIComponent(name)
          );
          if (res2.data?.success) {
            const data = res2.data.data;
            const list = Array.isArray(data?.suppliers)
              ? data.suppliers
              : Array.isArray(data)
              ? data
              : [];
            if (list.length > 0) {
              const found = list[0];
              setSelectedSupplier(found);
              return found;
            }
          }
        } catch (e2) {
          console.error("Fetch existing supplier after conflict error:", e2);
        }
      }
    }

    return null;
  };

  /* ============================================================
     📦 PRODUCT HANDLING
  ============================================================ */

  // When product name changes → auto-fill from master products
  const handleProductNameChange = (index, value) => {
    const updated = [...items];
    updated[index].name = value;

    const p = allProducts.find(
      (x) => x.name.toLowerCase() === value.trim().toLowerCase()
    );

    if (p) {
      updated[index] = {
        ...updated[index],
        name: p.name,
        hsn: p.hsn || "",
        price: p.price || 0,
        gstRate: p.gstRate || 0,
        productId: p._id,
        unit: p.unit || "pcs",
      };
    } else {
      updated[index].productId = null;
    }

    setItems(updated);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        hsn: "",
        qty: 1,
        price: 0,
        gstRate: 0,
        productId: null,
        unit: "pcs",
      },
    ]);
  };

  const removeItemRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getStock = (productId) => {
    if (!productId) return null;
    const product = allProducts.find((p) => p._id === productId);
    if (!product) return null;
    return product.currentStock || 0;
  };

  /* ============================================================
     💰 TOTAL CALCULATIONS
  ============================================================ */
  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    items.forEach((it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.price) || 0;
      const gstRate = Number(it.gstRate) || 0;

      const total = qty * price;
      const gst = (total * gstRate) / 100;

      subtotal += total;
      totalGst += gst;
    });

    const grand = subtotal + totalGst;
    const roundOff = Math.round(grand) - grand;
    const final = Math.round(grand);

    return {
      subtotal: subtotal.toFixed(2),
      totalGst: totalGst.toFixed(2),
      roundOff: roundOff.toFixed(2),
      final,
    };
  };

  const totals = calculateTotals();

  /* ============================================================
     🧾 SUBMIT HANDLER
  ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (processing) return;

    setMessage("");
    setProcessing(true);

    try {
      // 1️⃣ Basic Validations
      if (!form.supplierName.trim()) {
        setMessage("❌ Supplier name required");
        setProcessing(false);
        return;
      }

      if (!form.placeOfSupply.trim()) {
        setMessage("❌ Place of supply required");
        setProcessing(false);
        return;
      }

      if (!items.length) {
        setMessage("❌ At least one purchase item is required");
        setProcessing(false);
        return;
      }

      if (
        items.some(
          (item) =>
            !item.name.trim() ||
            Number(item.qty) <= 0 ||
            Number(item.price) <= 0
        )
      ) {
        setMessage("❌ Invalid item details");
        setProcessing(false);
        return;
      }

      // 2️⃣ Ensure Supplier Exists (Create if new / Fetch if exists)
      const supplier = await createSupplierIfNeeded();

      if (!supplier) {
        setMessage("❌ Supplier could not be created or found");
        setProcessing(false);
        return;
      }

      // 3️⃣ Prepare Purchase Items
      const purchaseItems = items.map((it) => ({
        name: it.name,
        hsn: it.hsn || "",
        qty: Number(it.qty),
        price: Number(it.price),
        gstRate: Number(it.gstRate),
        productId:
          it.productId && String(it.productId).length === 24
            ? it.productId
            : undefined,
        unit: it.unit || "pcs",
        description: it.description || "",
        category: it.category || "",
        brand: it.brand || "",
        sku: it.sku || "",
        minStock: Number(it.minStock) || 0,
        maxStock: Number(it.maxStock) || 0,
      }));

      // 4️⃣ Final Payload
      const payload = {
        invoiceNo: form.invoiceNo,
        invoiceDate: form.invoiceDate,
        placeOfSupply: form.placeOfSupply,

        supplierName: supplier.name,
        supplierId: supplier._id,
        supplierPhone: supplier.phone || "",
        supplierEmail: supplier.email || "",
        supplierAddress: supplier.address || "",
        supplierGstNumber: supplier.gstNumber || "",

        items: purchaseItems,
        subtotal: Number(totals.subtotal),
        totalTax: Number(totals.totalGst),
        roundOff: Number(totals.roundOff),
        grandTotal: Number(totals.final),

        paymentStatus: "pending",
        paymentMethod: "cash",
        status: "finalized",
        notes: "",
      };

      // 5️⃣ API Call
      const res = await api.post("/purchases", payload);

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to create purchase");
      }

      setMessage("✅ Purchase invoice created successfully!");

      // 6️⃣ Redirect
      setTimeout(() => {
        navigate("/purchase-invoices");
      }, 1200);
    } catch (err) {
      console.error("Invoice create error:", err);
      let msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create purchase invoice";

      if (msg.toLowerCase().includes("duplicate")) {
        msg = "❌ Invoice number already exists. Please change invoice number.";
      }

      setMessage(msg);
    }

    setProcessing(false);
  };

  /* ============================================================
     🎨 JSX UI
  ============================================================ */

  return (
    <div className="purchase-page">
      {/* Sidebar */}
      <Sidebar />

      <div className="purchase-container">
        {/* HEADER */}
        <div className="header">
          <h1>📥 Create Purchase Invoice</h1>
          <p>Record supplier purchases & auto-update stock</p>
        </div>

        {/* ALERT MESSAGE */}
        {message && (
          <div
            className={
              message.includes("❌")
                ? "alert danger"
                : message.includes("⚠️")
                ? "alert warn"
                : "alert success"
            }
          >
            {message}
          </div>
        )}

        {/* FORM START */}
        <form className="purchase-form" onSubmit={handleSubmit}>
          {/* PURCHASE DETAILS */}
          <section className="section-card">
            <h3>📋 Purchase Details</h3>

            <div className="grid-3">
              {/* Invoice Number */}
              <div>
                <label>Invoice No *</label>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceNo: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label>Invoice Date *</label>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* Place of Supply */}
              <div>
                <label>Place of Supply *</label>
                <input
                  type="text"
                  value={form.placeOfSupply}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      placeOfSupply: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
          </section>

          {/* SUPPLIER DETAILS */}
          <section className="section-card">
            <h3>🏢 Supplier Details</h3>

            {/* Selected Supplier Badge */}
            {selectedSupplier && (
              <div className="selected-supplier">
                <b>Selected:</b> {selectedSupplier.name}
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => {
                    setSelectedSupplier(null);
                    // Keep entered name; clear other fields
                    setForm((prev) => ({
                      ...prev,
                      supplierPhone: "",
                      supplierEmail: "",
                      supplierAddress: "",
                      supplierGstNumber: "",
                    }));
                  }}
                >
                  Change
                </button>
              </div>
            )}

            <div className="grid-3">
              {/* Supplier Name */}
              <div>
                <label>Supplier Name *</label>
                <div className="inline-input">
                  <input
                    type="text"
                    value={form.supplierName}
                    onChange={(e) => handleSupplierInput(e.target.value)}
                    list="supplier-list"
                    required
                  />
                  <datalist id="supplier-list">
                    {allSuppliers.map((s) => (
                      <option key={s._id} value={s.name} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    className="btn-browse"
                    onClick={() => setShowSupplierModal(true)}
                  >
                    📘
                  </button>
                </div>
              </div>

              {/* GST */}
              <div>
                <label>GST Number</label>
                <input
                  type="text"
                  value={form.supplierGstNumber}
                  onChange={(e) =>
                    !selectedSupplier &&
                    setForm((prev) => ({
                      ...prev,
                      supplierGstNumber: e.target.value,
                    }))
                  }
                  disabled={!!selectedSupplier}
                />
              </div>

              {/* Phone */}
              <div>
                <label>Phone</label>
                <input
                  type="text"
                  value={form.supplierPhone}
                  onChange={(e) =>
                    !selectedSupplier &&
                    setForm((prev) => ({
                      ...prev,
                      supplierPhone: e.target.value,
                    }))
                  }
                  disabled={!!selectedSupplier}
                />
              </div>
            </div>

            {/* Email + Address */}
            <div className="grid-2">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={form.supplierEmail}
                  onChange={(e) =>
                    !selectedSupplier &&
                    setForm((prev) => ({
                      ...prev,
                      supplierEmail: e.target.value,
                    }))
                  }
                  disabled={!!selectedSupplier}
                />
              </div>

              <div>
                <label>Address</label>
                <textarea
                  rows="2"
                  value={form.supplierAddress}
                  onChange={(e) =>
                    !selectedSupplier &&
                    setForm((prev) => ({
                      ...prev,
                      supplierAddress: e.target.value,
                    }))
                  }
                  disabled={!!selectedSupplier}
                />
              </div>
            </div>
          </section>

          {/* ITEMS TABLE */}
          <section className="section-card">
            <div className="flex-between">
              <h3>📦 Items ({items.length})</h3>
              <button
                type="button"
                className="btn-add"
                onClick={addItemRow}
              >
                + Add Item
              </button>
            </div>

            <div className="table-container">
              <table className="item-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product *</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate (₹)</th>
                    <th>GST%</th>
                    <th>Total</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const stock = getStock(item.productId);
                    const total = (Number(item.qty || 0) * Number(item.price || 0)).toFixed(2);

                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>

                        {/* Product */}
                        <td>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleProductNameChange(index, e.target.value)
                            }
                            list="product-list"
                            required
                          />
                        </td>

                        {/* HSN */}
                        <td>
                          <input
                            value={item.hsn}
                            onChange={(e) =>
                              updateItem(index, "hsn", e.target.value)
                            }
                          />
                        </td>

                        {/* Qty */}
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(index, "qty", e.target.value)
                            }
                          />
                        </td>

                        {/* Unit */}
                        <td>
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(index, "unit", e.target.value)
                            }
                          >
                            <option value="pcs">pcs</option>
                            <option value="kg">kg</option>
                            <option value="box">box</option>
                            <option value="pack">pack</option>
                          </select>
                        </td>

                        {/* Rate */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(index, "price", e.target.value)
                            }
                            required
                          />
                        </td>

                        {/* GST */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.gstRate}
                            onChange={(e) =>
                              updateItem(index, "gstRate", e.target.value)
                            }
                          />
                        </td>

                        {/* Amount */}
                        <td>₹{total}</td>

                        {/* Stock */}
                        <td>
                          {stock === null ? (
                            <span className="new-product">New</span>
                          ) : (
                            <span>{stock}</span>
                          )}
                        </td>

                        {/* Delete */}
                        <td>
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => removeItemRow(index)}
                            >
                              🗑
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product Datalist */}
            <datalist id="product-list">
              {allProducts.map((p) => (
                <option key={p._id} value={p.name} />
              ))}
            </datalist>
          </section>

          {/* SUMMARY */}
          <section className="section-card summary">
            <h3>💰 Summary</h3>

            <div className="summary-grid">
              <div>
                <span>Subtotal:</span>
                <b>₹{totals.subtotal}</b>
              </div>
              <div>
                <span>GST:</span>
                <b>₹{totals.totalGst}</b>
              </div>
              <div>
                <span>Round Off:</span>
                <b>₹{totals.roundOff}</b>
              </div>
              <div className="grand">
                <span>Grand Total:</span>
                <b>₹{totals.final}</b>
              </div>
            </div>
          </section>

          {/* ACTION BUTTONS */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/purchase-invoices")}
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={processing}>
              {processing ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>

        {/* SUPPLIER MODAL */}
        {showSupplierModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Select Supplier</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowSupplierModal(false)}
                >
                  ✖
                </button>
              </div>

              <div className="modal-body">
                {allSuppliers.length === 0 && (
                  <p>No suppliers found. Add a new one by typing in the form.</p>
                )}

                {allSuppliers.map((s) => (
                  <div
                    key={s._id}
                    className="modal-item"
                    onClick={() => selectSupplierModal(s)}
                  >
                    <b>{s.name}</b>
                    <small>
                      {s.phone || "No Phone"}{" "}
                      {s.gstNumber ? `| GST: ${s.gstNumber}` : ""}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseInvoiceCreate;
