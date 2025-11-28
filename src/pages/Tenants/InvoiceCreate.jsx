import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./InvoiceCreate.css";

function InvoiceCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ----------------------------------------
     FORM STATE
  ---------------------------------------- */
  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    placeOfSupply: "KA",
    notes: "",
  });

  const [items, setItems] = useState([
    { productId: null, name: "", hsn: "", qty: 1, price: 0, gstRate: 0 },
  ]);

  const [totals, setTotals] = useState({
    subtotal: 0,
    gstTotal: 0,
    grandTotal: 0,
    roundOff: 0,
  });

  /* ----------------------------------------
     POPUPS
  ---------------------------------------- */
  const [customerModal, setCustomerModal] = useState(false);
  const [productModal, setProductModal] = useState({
    open: false,
    index: null,
  });

  const [customerList, setCustomerList] = useState([]);
  const [productList, setProductList] = useState([]);

  /* ----------------------------------------
     FETCH INVOICE NO
  ---------------------------------------- */
  const fetchNextInvoiceNo = async () => {
    try {
      const res = await api.get("/invoices/next-invoice-no");
      if (res.data.success) {
        setForm((p) => ({ ...p, invoiceNo: res.data.nextInvoiceNo }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ----------------------------------------
     FETCH CUSTOMERS & PRODUCTS
  ---------------------------------------- */
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      if (res.data.success) setCustomerList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      if (res.data.success) setProductList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNextInvoiceNo();
    fetchCustomers();
    fetchProducts();
  }, []);

  /* ----------------------------------------
     TOTAL CALCULATION
  ---------------------------------------- */
  const calculateTotals = () => {
    let subtotal = 0;
    let gstTotal = 0;

    items.forEach((it) => {
      const lineTotal = Number(it.qty) * Number(it.price);
      subtotal += lineTotal;
      gstTotal += (lineTotal * Number(it.gstRate)) / 100;
    });

    const grandTotal = subtotal + gstTotal;
    const roundOff = Number(grandTotal.toFixed(0)) - grandTotal;

    setTotals({
      subtotal,
      gstTotal,
      grandTotal: Number(grandTotal.toFixed(0)),
      roundOff,
    });
  };

  useEffect(() => {
    calculateTotals();
  }, [items]);

  /* ----------------------------------------
     HANDLERS
  ---------------------------------------- */
  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "qty" || field === "price" || field === "gstRate"
      ? Number(value)
      : value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: null, name: "", hsn: "", qty: 1, price: 0, gstRate: 0 },
    ]);
  };

  const deleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const selectCustomer = (cust) => {
    setForm({
      ...form,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      customerAddress: cust.address,
    });
    setCustomerModal(false);
  };

  const selectProduct = (prod) => {
    const updated = [...items];
    updated[productModal.index] = {
      productId: prod._id,
      name: prod.name,
      hsn: prod.hsn,
      qty: 1,
      price: prod.price,
      gstRate: prod.gstRate,
    };
    setItems(updated);
    setProductModal({ open: false, index: null });
  };

  /* ----------------------------------------
     SUBMIT
  ---------------------------------------- */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!form.customerName) {
        alert("Enter customer name");
        setLoading(false);
        return;
      }

      if (items.length === 0) {
        alert("Add at least one item");
        setLoading(false);
        return;
      }

      const payload = { ...form, items };

      const res = await api.post("/invoices", payload);

      if (res.data.success) {
        const id = res.data.data?._id;
        alert("Invoice saved!");
        navigate(`/invoice-preview/${id}`);
      } else {
        alert(res.data.message || "Failed to create invoice");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating invoice");
    }
    setLoading(false);
  };

  /* ----------------------------------------
     JSX
  ---------------------------------------- */
  return (
    <div className="invoice-page">
      <Sidebar />

      <div className="invoice-container">
        <div className="header">
          <h1>Create Invoice</h1>
          <p>Simple GST invoice creation</p>
        </div>

        <div className="invoice-form">
          {/* CUSTOMER SECTION */}
          <div className="section-card">
            <h3>Customer Details</h3>
            <button
              type="button"
              className="btn-browse"
              onClick={() => setCustomerModal(true)}
            >
              Browse Customers
            </button>

            <div className="grid-2">
              <div>
                <label>Customer Name</label>
                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Phone</label>
                <input
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Email</label>
                <input
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Address</label>
                <textarea
                  name="customerAddress"
                  value={form.customerAddress}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* INVOICE DETAILS */}
          <div className="section-card">
            <h3>Invoice Details</h3>

            <div className="grid-3">
              <div>
                <label>Invoice No</label>
                <input
                  name="invoiceNo"
                  value={form.invoiceNo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={form.invoiceDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="section-card">
            <h3>Invoice Items</h3>

            <div className="table-container">
              <table className="item-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>GST %</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((it, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>

                      <td>
                        <button
                          type="button"
                          className="btn-browse small"
                          onClick={() =>
                            setProductModal({ open: true, index })
                          }
                        >
                          {it.name || "Select"}
                        </button>
                      </td>

                      <td>
                        <input
                          value={it.hsn}
                          onChange={(e) =>
                            handleItemChange(index, "hsn", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={it.qty}
                          onChange={(e) =>
                            handleItemChange(index, "qty", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={it.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={it.gstRate}
                          onChange={(e) =>
                            handleItemChange(index, "gstRate", e.target.value)
                          }
                        />
                      </td>

                      <td>{(it.qty * it.price).toFixed(2)}</td>

                      <td>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => deleteItem(index)}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn-add" onClick={addItem}>
              + Add Item
            </button>
          </div>

          {/* SUMMARY */}
          <div className="section-card summary">
            <h3>Summary</h3>

            <div className="summary-grid">
              <div>
                <strong>Subtotal:</strong> ₹{totals.subtotal.toFixed(2)}
              </div>
              <div>
                <strong>GST:</strong> ₹{totals.gstTotal.toFixed(2)}
              </div>
              <div>
                <strong>Grand Total:</strong> ₹{totals.grandTotal}
              </div>
              <div>
                <strong>Round Off:</strong> ₹{totals.roundOff.toFixed(2)}
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="section-card">
            <h3>Notes</h3>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </div>

      {/* CUSTOMER MODAL */}
      {customerModal && (
        <div className="inv-create-modal-overlay">
          <div className="inv-create-modal-content">
            <div className="modal-header">
              <h3>Select Customer</h3>
            </div>

            <div className="inv-create-modal-body">
              {customerList.map((cust) => (
                <div
                  key={cust._id}
                  className="modal-item"
                  onClick={() => selectCustomer(cust)}
                >
                  <strong>{cust.name}</strong>
                  <br />
                  <small>{cust.phone}</small>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCustomerModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {productModal.open && (
        <div className="inv-create-modal-overlay">
          <div className="inv-create-modal-content">
            <div className="modal-header">
              <h3>Select Product</h3>
            </div>

            <div className="inv-create-modal-body">
              {productList.map((prod) => (
                <div
                  key={prod._id}
                  className="modal-item"
                  onClick={() => selectProduct(prod)}
                >
                  <strong>{prod.name}</strong>
                  <br />
                  <small>
                    ₹{prod.price} {prod.hsn && `| HSN ${prod.hsn}`}
                  </small>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setProductModal({ open: false, index: null })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceCreate;
