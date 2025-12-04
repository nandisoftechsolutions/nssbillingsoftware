import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./PurchaseInvoiceForm.css";

function EditPurchaseInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    invoiceNo: "",
    invoiceDate: "",
    supplierName: "",
    supplierId: "",
    supplierPhone: "",
    supplierEmail: "",
    supplierAddress: "",
    supplierGstNumber: "",
    placeOfSupply: "",
    purchaseOrderNo: "",
    dueDate: "",
    items: [],
    subtotal: 0,
    totalTax: 0,
    discount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    roundOff: 0,
    grandTotal: 0,
    notes: "",
    paymentStatus: "pending",
    paymentMethod: "cash",
    paymentTerms: "",
    status: "completed"
  });

  useEffect(() => {
    fetchInvoiceData();
    fetchDropdownData();
    // eslint-disable-next-line
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await api.get("/products");
      if (productsData && productsData.success) {
        setProducts(productsData.data?.products || productsData.data || []);
      } else if (productsData) {
        setProducts(productsData.data || []);
      }

      // Fetch suppliers
      const { data: suppliersData } = await api.get("/suppliers");
      if (suppliersData && suppliersData.success) {
        setSuppliers(suppliersData.data?.suppliers || suppliersData.data || []);
      } else if (suppliersData) {
        setSuppliers(suppliersData.data || []);
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);

      const { data: invoiceData } = await api.get(`/purchases/${id}`);

      console.log("📦 Invoice API Response:", invoiceData);

      if (invoiceData && invoiceData.success) {
        const invoice = invoiceData.data;
        setInvoice(invoice);

        // Normalize items
        const processedItems = (invoice.items || []).map(item => {
          // item may have different field names depending on backend
          const qty = Number(item.qty ?? item.quantity ?? 0) || 0;
          const rate = Number(item.rate ?? item.price ?? item.amount ?? 0) || 0;
          const gstRate = Number(item.gstRate ?? item.taxRate ?? 0) || 0;
          const total = Number(item.total ?? qty * rate) || qty * rate;
          const taxAmount = Number(item.taxAmount ?? (total * gstRate) / 100) || ((total * gstRate) / 100);
          const grandTotal = Number(item.grandTotal ?? total + taxAmount) || total + taxAmount;

          return {
            _id: item._id || undefined,
            productId: (item.productId && (item.productId._id || item.productId)) || "",
            name: item.name || item.productName || "",
            hsn: item.hsn || item.hsnCode || "",
            qty,
            rate, // local field used in UI - will be mapped to price on submit
            gstRate,
            unit: item.unit || "pcs",
            description: item.description || "",
            category: item.category || "",
            brand: item.brand || "",
            sku: item.sku || "",
            total,
            taxAmount,
            grandTotal
          };
        });

        // Ensure totals are correct
        const initialForm = {
          invoiceNo: invoice.invoiceNo || "",
          invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          supplierName: invoice.supplierName || "",
          supplierId: invoice.supplierId?._id || invoice.supplierId || "",
          supplierPhone: invoice.supplierPhone || "",
          supplierEmail: invoice.supplierEmail || "",
          supplierAddress: invoice.supplierAddress || "",
          supplierGstNumber: invoice.supplierGstNumber || invoice.supplierGSTIN || "",
          placeOfSupply: invoice.placeOfSupply || "",
          purchaseOrderNo: invoice.purchaseOrderNo || "",
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
          items: processedItems,
          subtotal: Number(invoice.subtotal) || processedItems.reduce((s, it) => s + (Number(it.total) || 0), 0),
          totalTax: Number(invoice.totalTax) || processedItems.reduce((s, it) => s + (Number(it.taxAmount) || 0), 0),
          discount: Number(invoice.discount) || 0,
          shippingCharges: Number(invoice.shippingCharges) || 0,
          otherCharges: Number(invoice.otherCharges) || 0,
          roundOff: Number(invoice.roundOff) || 0,
          grandTotal: Number(invoice.grandTotal) || processedItems.reduce((s, it) => s + (Number(it.grandTotal) || 0), 0),
          notes: invoice.notes || "",
          paymentStatus: invoice.paymentStatus || "pending",
          paymentMethod: invoice.paymentMethod || "cash",
          paymentTerms: invoice.paymentTerms || "",
          status: invoice.status || "completed"
        };

        // Recalculate to be safe and consistent
        setFormData(prev => ({ ...prev, ...initialForm }));
        calculateTotals(processedItems, {
          discount: initialForm.discount,
          shippingCharges: initialForm.shippingCharges,
          otherCharges: initialForm.otherCharges
        });
      } else {
        throw new Error("Failed to fetch invoice");
      }

    } catch (error) {
      console.error("Error fetching invoice:", error);
      alert("Failed to load purchase invoice");
      navigate("/purchases");
    } finally {
      setLoading(false);
    }
  };

  // calculateTotals accepts optional override charges for immediate recalculation
  const calculateTotals = (items, overrides = {}) => {
    const safeItems = Array.isArray(items) ? items : formData.items;
    const subtotal = safeItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const totalTax = safeItems.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);

    const discount = Number(overrides.discount ?? formData.discount) || 0;
    const shippingCharges = Number(overrides.shippingCharges ?? formData.shippingCharges) || 0;
    const otherCharges = Number(overrides.otherCharges ?? formData.otherCharges) || 0;

    const totalBeforeRound = subtotal + totalTax - discount + shippingCharges + otherCharges;
    const grandTotalRounded = Math.round(totalBeforeRound);
    const roundOff = Number((grandTotalRounded - totalBeforeRound).toFixed(2)) || 0;

    // update formData with safe numbers
    setFormData(prev => ({
      ...prev,
      items: safeItems,
      subtotal: Number(subtotal.toFixed(2)) || 0,
      totalTax: Number(totalTax.toFixed(2)) || 0,
      discount,
      shippingCharges,
      otherCharges,
      roundOff,
      grandTotal: Number(grandTotalRounded) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.invoiceNo || !formData.invoiceDate || !formData.supplierName || formData.items.length === 0) {
      alert("Please fill in all required fields and add at least one item");
      return;
    }

    // Item validation
    const invalidItems = formData.items.filter(item =>
      !item.name || (Number(item.qty) || 0) <= 0 || (Number(item.rate) || 0) < 0
    );

    if (invalidItems.length > 0) {
      alert("Please ensure all items have valid names, quantities > 0, and prices >= 0");
      return;
    }

    try {
      setSaving(true);

      // Ensure totals are up-to-date before submit
      calculateTotals(formData.items);

      // Prepare payload consistent with backend expectations:
      // backend expects qty, price, gstRate, productId, total, taxAmount, grandTotal
      const submitItems = formData.items.map(item => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.rate ?? item.price) || 0; // map rate -> price
        const gstRate = Number(item.gstRate) || 0;
        const total = Number(item.total) || Number((qty * price).toFixed(2)) || 0;
        const taxAmount = Number(item.taxAmount) || Number(((total * gstRate) / 100).toFixed(2)) || 0;
        const grandTotal = Number(item.grandTotal) || Number((total + taxAmount).toFixed(2)) || 0;

        return {
          name: item.name || "",
          hsn: item.hsn || "",
          qty,
          price,
          gstRate,
          unit: item.unit || "pcs",
          description: item.description || "",
          category: item.category || "",
          brand: item.brand || "",
          sku: item.sku || "",
          productId: item.productId || null,
          total,
          taxAmount,
          grandTotal
        };
      });

      // Prepare totals safely
      const submitData = {
        ...formData,
        // Overwrite with safe numeric values
        items: submitItems,
        subtotal: Number(formData.subtotal) || submitItems.reduce((s, it) => s + (Number(it.total) || 0), 0),
        totalTax: Number(formData.totalTax) || submitItems.reduce((s, it) => s + (Number(it.taxAmount) || 0), 0),
        discount: Number(formData.discount) || 0,
        shippingCharges: Number(formData.shippingCharges) || 0,
        otherCharges: Number(formData.otherCharges) || 0,
        roundOff: Number(formData.roundOff) || 0,
        grandTotal: Number(formData.grandTotal) || submitItems.reduce((s, it) => s + (Number(it.grandTotal) || 0), 0)
      };

      // Final sanity: ensure no NaN anywhere
      if (Number.isNaN(submitData.subtotal) || Number.isNaN(submitData.totalTax) || Number.isNaN(submitData.grandTotal)) {
        throw new Error("Invalid numeric totals detected before submit");
      }

      console.log("📤 Submitting data:", submitData);

      const { data } = await api.put(`/purchases/${id}`, submitData);

      if (data && data.success) {
        alert("✅ Purchase invoice updated successfully!");
        navigate(`/purchase-invoice-preview/${id}`);
      } else {
        // better handling for server error messages
        const serverMsg = data?.message || JSON.stringify(data) || "Unknown server error";
        console.error("Server responded with failure:", data);
        throw new Error(serverMsg);
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert(`❌ Failed to update purchase invoice: ${error.message || error.toString()}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    // update and recalc totals for fields that affect totals
    setFormData(prev => {
      const newState = { ...prev, [field]: value };

      // If user changed charges or discount, recalc totals
      if (['discount', 'shippingCharges', 'otherCharges'].includes(field)) {
        calculateTotals(newState.items, {
          discount: Number(newState.discount) || 0,
          shippingCharges: Number(newState.shippingCharges) || 0,
          otherCharges: Number(newState.otherCharges) || 0
        });
      }

      return newState;
    });
  };

  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = suppliers.find(s => s._id === supplierId);
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: selectedSupplier._id,
        supplierName: selectedSupplier.name || "",
        supplierPhone: selectedSupplier.phone || "",
        supplierEmail: selectedSupplier.email || "",
        supplierAddress: selectedSupplier.address || "",
        supplierGstNumber: selectedSupplier.gstNumber || selectedSupplier.gstin || ""
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };

    // For numeric fields convert safely
    if (['qty', 'rate', 'gstRate'].includes(field)) {
      // ensure we keep numeric values but store as original for display
      item[field] = value === "" ? "" : Number(value);
    } else {
      item[field] = value;
    }

    // Recalculate item totals when qty, rate, or gstRate changes
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = Number(item.gstRate) || 0;

    const total = Number((qty * rate).toFixed(2)) || 0;
    const taxAmount = Number(((total * gstRate) / 100).toFixed(2)) || 0;
    const grandTotal = Number((total + taxAmount).toFixed(2)) || 0;

    item.total = total;
    item.taxAmount = taxAmount;
    item.grandTotal = grandTotal;

    updatedItems[index] = item;

    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find(p => p._id === productId);
    if (selectedProduct) {
      const updatedItems = [...formData.items];
      const item = {
        ...updatedItems[index],
        productId: selectedProduct._id,
        name: selectedProduct.name || "",
        hsn: selectedProduct.hsn || selectedProduct.hsnCode || "",
        rate: Number(selectedProduct.price || selectedProduct.costPrice || 0),
        gstRate: Number(selectedProduct.gstRate || selectedProduct.taxRate || 0),
        unit: selectedProduct.unit || "pcs",
        description: selectedProduct.description || "",
        category: selectedProduct.category || "",
        brand: selectedProduct.brand || "",
        sku: selectedProduct.sku || ""
      };

      // Recalculate totals with default qty
      const qty = Number(item.qty) || 1;
      const total = Number((qty * item.rate).toFixed(2));
      const taxAmount = Number(((total * item.gstRate) / 100).toFixed(2));
      const grandTotal = Number((total + taxAmount).toFixed(2));

      item.total = total;
      item.taxAmount = taxAmount;
      item.grandTotal = grandTotal;

      updatedItems[index] = item;
      setFormData(prev => ({ ...prev, items: updatedItems }));
      calculateTotals(updatedItems);
    }
  };

  const addNewItem = () => {
    const newItem = {
      productId: "",
      name: "",
      hsn: "",
      qty: 1,
      rate: 0,
      gstRate: 0,
      unit: "pcs",
      description: "",
      category: "",
      brand: "",
      sku: "",
      total: 0,
      taxAmount: 0,
      grandTotal: 0
    };

    setFormData(prev => {
      const items = [...prev.items, newItem];
      // recalc
      calculateTotals(items);
      return { ...prev, items };
    });
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="invoice-form-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading purchase invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-form-container">
        <Sidebar />
        <div className="main-content">
          <div className="error-state">
            <h3>Invoice not found</h3>
            <Link to="/purchases" className="btn-primary">
              Back to Purchases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-form-container">
      <Sidebar />
      <div className="main-content">
        <div className="form-header">
          <h1>✏️ Edit Purchase Invoice</h1>
          <p>Edit purchase details and update inventory</p>
          <div className="invoice-info">
            <strong>Editing:</strong> {formData.invoiceNo} - {formData.supplierName}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="invoice-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>📋 Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => handleChange('invoiceNo', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Invoice Date *</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleChange('invoiceDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Place of Supply</label>
                <input
                  type="text"
                  value={formData.placeOfSupply}
                  onChange={(e) => handleChange('placeOfSupply', e.target.value)}
                  placeholder="e.g., KA"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Order No.</label>
                <input
                  type="text"
                  value={formData.purchaseOrderNo}
                  onChange={(e) => handleChange('purchaseOrderNo', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="form-section">
            <h3>🏢 Supplier Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Select Supplier</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} {supplier.gstNumber ? `- ${supplier.gstNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => handleChange('supplierName', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Supplier GSTIN</label>
                <input
                  type="text"
                  value={formData.supplierGstNumber}
                  onChange={(e) => handleChange('supplierGstNumber', e.target.value)}
                  placeholder="Supplier GST number"
                />
              </div>
              <div className="form-group">
                <label>Supplier Phone</label>
                <input
                  type="text"
                  value={formData.supplierPhone}
                  onChange={(e) => handleChange('supplierPhone', e.target.value)}
                  placeholder="Supplier phone"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Supplier Email</label>
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => handleChange('supplierEmail', e.target.value)}
                  placeholder="Supplier email"
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Supplier Address</label>
              <textarea
                value={formData.supplierAddress}
                onChange={(e) => handleChange('supplierAddress', e.target.value)}
                rows="3"
                placeholder="Supplier full address"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>📦 Items ({formData.items.length})</h3>
              <button type="button" onClick={addNewItem} className="btn-secondary">
                + Add Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="empty-items">
                <p>No items added. Please add at least one item.</p>
              </div>
            ) : (
              formData.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-header">
                    <h4>Item #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="btn-danger"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Select Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} {product.sku ? `- ${product.sku}` : ''} {product.gstRate ? `(${product.gstRate}% GST)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        required
                        placeholder="Product name"
                      />
                    </div>
                    <div className="form-group">
                      <label>HSN Code</label>
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        placeholder="HSN code"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value === "" ? "" : Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">Kilogram</option>
                        <option value="meter">Meter</option>
                        <option value="litre">Litre</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="set">Set</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Rate (₹) *</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value === "" ? "" : Number(e.target.value))}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>GST Rate (%)</label>
                      <input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', e.target.value === "" ? "" : Number(e.target.value))}
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="GST percentage"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Product description"
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        placeholder="Category"
                      />
                    </div>
                    <div className="form-group">
                      <label>Brand</label>
                      <input
                        type="text"
                        value={item.brand}
                        onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                        placeholder="Brand"
                      />
                    </div>
                    <div className="form-group">
                      <label>SKU</label>
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                        placeholder="SKU"
                      />
                    </div>
                  </div>

                  <div className="item-totals">
                    <div className="total-row">
                      <span>Item Total:</span>
                      <strong>{formatCurrency(item.total)}</strong>
                    </div>
                    <div className="total-row">
                      <span>Tax Amount ({item.gstRate}% GST):</span>
                      <strong>{formatCurrency(item.taxAmount)}</strong>
                    </div>
                    <div className="total-row grand">
                      <span>Item Grand Total:</span>
                      <strong>{formatCurrency(item.grandTotal)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals Section */}
          <div className="form-section">
            <h3>💰 Totals</h3>
            <div className="totals-grid">
              <div className="total-item">
                <label>Subtotal:</label>
                <span>{formatCurrency(formData.subtotal)}</span>
              </div>
              <div className="total-item">
                <label>Total Tax:</label>
                <span>{formatCurrency(formData.totalTax)}</span>
              </div>
              <div className="total-item">
                <label>Discount (₹):</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => handleChange('discount', Number(e.target.value || 0))}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="total-item">
                <label>Shipping Charges (₹):</label>
                <input
                  type="number"
                  value={formData.shippingCharges}
                  onChange={(e) => handleChange('shippingCharges', Number(e.target.value || 0))}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="total-item">
                <label>Other Charges (₹):</label>
                <input
                  type="number"
                  value={formData.otherCharges}
                  onChange={(e) => handleChange('otherCharges', Number(e.target.value || 0))}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="total-item">
                <label>Round Off:</label>
                <span>{formatCurrency(formData.roundOff)}</span>
              </div>
              <div className="total-item grand-total">
                <label>Grand Total:</label>
                <span>{formatCurrency(formData.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h3>📝 Additional Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Status</label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => handleChange('paymentStatus', e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                placeholder="e.g., Net 30 days"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows="3"
                placeholder="Any additional notes or terms..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/purchases")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || formData.items.length === 0}
            >
              {saving ? "🔄 Updating..." : "💾 Update Purchase Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPurchaseInvoice;
