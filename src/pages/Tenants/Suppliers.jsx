import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Suppliers.css";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching suppliers...");
      const { data } = await api.get("/suppliers");
      console.log("🏢 Suppliers API Response:", data);
      
      if (data.success) {
        // FIXED: Handle different response structures
        const suppliersData = data.data?.suppliers || data.data || [];
        console.log("📊 Suppliers data:", suppliersData);
        setSuppliers(suppliersData);
      } else {
        console.error("❌ API returned success: false", data.message);
        setSuppliers([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch suppliers:", error);
      showMessage("Failed to load suppliers", "error");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      console.log("📡 Fetching purchases for supplier stats...");
      const { data } = await api.get("/purchases");
      console.log("📦 Purchases API Response:", data);
      
      if (data.success) {
        // FIXED: Handle different response structures
        const purchasesData = data.data?.purchases || data.data || [];
        console.log("📊 Purchases data:", purchasesData.length);
        setPurchases(purchasesData);
      } else {
        console.error("❌ Purchases API returned success: false", data.message);
        setPurchases([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch purchases:", error);
      setPurchases([]);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        // Update existing supplier
        const { data } = await api.put(`/suppliers/${editingSupplier._id}`, form);
        if (data.success) {
          showMessage("Supplier updated successfully");
          setEditingSupplier(null);
        }
      } else {
        // Create new supplier
        const { data } = await api.post("/suppliers", form);
        if (data.success) {
          showMessage("Supplier added successfully");
        }
      }
      
      setShowModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error("❌ Failed to save supplier:", error);
      const errorMsg = error.response?.data?.message || "Failed to save supplier";
      showMessage(errorMsg, "error");
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      gstNumber: supplier.gstNumber || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (supplierId) => {
    try {
      const { data } = await api.delete(`/suppliers/${supplierId}`);
      if (data.success) {
        showMessage("Supplier deleted successfully");
        setDeleteConfirm(null);
        fetchSuppliers();
      }
    } catch (error) {
      console.error("❌ Failed to delete supplier:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete supplier";
      showMessage(errorMsg, "error");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      gstNumber: ""
    });
    setEditingSupplier(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Calculate purchase count for a supplier
  const getPurchaseCount = (supplierId) => {
    if (!supplierId) return 0;
    
    // FIXED: Ensure purchases is an array
    const safePurchases = Array.isArray(purchases) ? purchases : [];
    
    // If we have supplierId in purchases, count by supplierId
    const purchasesBySupplierId = safePurchases.filter(purchase => 
      purchase.supplierId === supplierId
    );
    
    // Also count by supplier name for backward compatibility
    const supplier = suppliers.find(s => s._id === supplierId);
    if (supplier) {
      const purchasesBySupplierName = safePurchases.filter(purchase => 
        purchase.supplierName === supplier.name
      );
      
      // Combine both counts (remove duplicates if any)
      const allPurchases = [...purchasesBySupplierId, ...purchasesBySupplierName];
      const uniquePurchases = allPurchases.filter((purchase, index, self) => 
        index === self.findIndex(p => p._id === purchase._id)
      );
      
      return uniquePurchases.length;
    }
    
    return purchasesBySupplierId.length;
  };

  // Calculate total spent for a supplier
  const getTotalSpent = (supplierId) => {
    if (!supplierId) return 0;
    
    let total = 0;
    
    // FIXED: Ensure purchases is an array
    const safePurchases = Array.isArray(purchases) ? purchases : [];
    
    // Calculate from purchases with supplierId
    const purchasesBySupplierId = safePurchases.filter(purchase => 
      purchase.supplierId === supplierId
    );
    
    purchasesBySupplierId.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        const purchaseTotal = purchase.items.reduce((sum, item) => {
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          return sum + (qty * price);
        }, 0);
        total += purchaseTotal;
      }
    });
    
    // Also calculate from purchases with supplier name for backward compatibility
    const supplier = suppliers.find(s => s._id === supplierId);
    if (supplier) {
      const purchasesBySupplierName = safePurchases.filter(purchase => 
        purchase.supplierName === supplier.name
      );
      
      purchasesBySupplierName.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          const purchaseTotal = purchase.items.reduce((sum, item) => {
            const qty = Number(item.qty) || 0;
            const price = Number(item.price) || 0;
            return sum + (qty * price);
          }, 0);
          total += purchaseTotal;
        }
      });
    }
    
    return total;
  };

  // Calculate overall statistics - FIXED: Added proper array validation
  const calculateStats = () => {
    try {
      // FIXED: Ensure suppliers is always an array
      const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
      
      const totalSuppliers = safeSuppliers.length;
      const suppliersWithGST = safeSuppliers.filter(s => s.gstNumber && s.gstNumber.trim() !== "").length;
      
      // Calculate total spent across all suppliers
      const totalSpent = safeSuppliers.reduce((total, supplier) => {
        return total + getTotalSpent(supplier._id);
      }, 0);

      return {
        totalSuppliers,
        suppliersWithGST,
        totalSpent
      };
    } catch (error) {
      console.error("❌ Error calculating stats:", error);
      return {
        totalSuppliers: 0,
        suppliersWithGST: 0,
        totalSpent: 0
      };
    }
  };

  const stats = calculateStats();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number);
  };

  if (loading) {
    return (
      <div className="suppliers-container">
        <Sidebar />
        <div className="suppliers-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading suppliers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers-container">
      <Sidebar />
      <div className="suppliers-content">
        {/* Header Section */}
        <div className="suppliers-header">
          <div className="header-info">
            <h1>🏢 Suppliers</h1>
            <p>Manage your suppliers and purchase contacts</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Add Supplier
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Summary Stats */}
        <div className="suppliers-stats">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.totalSuppliers)}</h3>
              <p>Total Suppliers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{formatNumber(stats.suppliersWithGST)}</h3>
              <p>With GST</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalSpent)}</h3>
              <p>Total Spent</p>
            </div>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="suppliers-grid">
          {/* FIXED: Ensure suppliers is an array before mapping */}
          {Array.isArray(suppliers) && suppliers.map(supplier => {
            const purchaseCount = getPurchaseCount(supplier._id);
            const totalSpent = getTotalSpent(supplier._id);
            
            return (
              <div key={supplier._id} className="supplier-card">
                <div className="supplier-header">
                  <h3 className="supplier-name">{supplier.name}</h3>
                  {supplier.gstNumber && (
                    <span className="gst-badge">GST: {supplier.gstNumber}</span>
                  )}
                </div>
                
                <div className="supplier-info">
                  {supplier.phone && (
                    <div className="info-item">
                      <span className="icon">📞</span>
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="info-item">
                      <span className="icon">✉️</span>
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="info-item">
                      <span className="icon">📍</span>
                      <span className="address">{supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="supplier-stats">
                  <div className="stat">
                    <span className="stat-label">Purchases:</span>
                    <span className="stat-value">{formatNumber(purchaseCount)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Spent:</span>
                    <span className="stat-value">{formatCurrency(totalSpent)}</span>
                  </div>
                </div>

                <div className="supplier-actions">
                  <Link 
                    to={`/create-purchase-invoice?supplier=${supplier._id}`}
                    className="btn-primary btn-sm"
                  >
                    📥 Create Purchase
                  </Link>
                  <div className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(supplier)}
                      title="Edit Supplier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => setDeleteConfirm(supplier)}
                      title="Delete Supplier"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* FIXED: Check if suppliers is array and empty */}
          {(!Array.isArray(suppliers) || suppliers.length === 0) && (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No suppliers yet</h3>
              <p>Add your first supplier to start recording purchases</p>
              <button 
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                Add First Supplier
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Supplier Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                <button 
                  className="modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Supplier Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      required
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.gstNumber}
                      onChange={(e) => setForm({...form, gstNumber: e.target.value})}
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-input"
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      rows="3"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content delete-confirm">
              <div className="modal-header">
                <h3>Confirm Delete</h3>
                <button 
                  className="modal-close"
                  onClick={() => setDeleteConfirm(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                </p>
                <div className="supplier-stats-delete">
                  <div className="stat">
                    <span className="stat-label">Total Purchases:</span>
                    <span className="stat-value">{formatNumber(getPurchaseCount(deleteConfirm._id))}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Spent:</span>
                    <span className="stat-value">{formatCurrency(getTotalSpent(deleteConfirm._id))}</span>
                  </div>
                </div>
                <p className="warning-text">
                  ⚠️ This action cannot be undone. Any purchase records associated with this supplier will be kept but will show "Unknown Supplier".
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-danger"
                  onClick={() => handleDelete(deleteConfirm._id)}
                >
                  🗑️ Delete Supplier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Suppliers;