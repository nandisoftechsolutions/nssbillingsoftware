import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminPlans.css";

function AdminPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const emptyForm = {
    name: "",
    planCode: "",
    monthlyPrice: "",
    yearlyPrice: "",
    trialPeriodDays: 7,
    billingCycle: "yearly",
    maxUsers: 1,
    maxInvoices: 100,
    storageLimit: 1024,
    badge: "",
    icon: "📦",
    tagline: "",
    description: "",
    popular: false,
    isFreeTrial: false,
    isActive: true,
    displayOrder: 0,
    colorScheme: {
      primary: "#0052ff",
      secondary: "#667eea"
    },
    features: [{ text: "", included: true, tooltip: "" }],
    allowedUpgrades: [],
    allowedDowngrades: []
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [availablePlans, setAvailablePlans] = useState([]);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // FETCH PLANS FROM DB
  const fetchPlans = async () => {
    try {
      const response = await api.get("/admin/plans");
      if (response.data?.success) {
        setPlans(response.data.data || []);
        setAvailablePlans(['Trial', 'Basic', 'Professional', 'Enterprise']);
      } else {
        setPlans(response.data || []);
      }
    } catch (err) {
      console.error("Error loading plans:", err);
      alert("Failed to load plans");
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // HANDLE INPUT CHANGE
  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // HANDLE COLOR SCHEME CHANGE
  const updateColorScheme = (key, value) => {
    setForm({ 
      ...form, 
      colorScheme: {
        ...form.colorScheme,
        [key]: value
      }
    });
  };

  // HANDLE FEATURE CHANGE
  const updateFeature = (index, key, value) => {
    const updated = [...form.features];
    updated[index][key] = value;
    setForm({ ...form, features: updated });
  };

  // ADD NEW FEATURE
  const addFeature = () => {
    setForm({
      ...form,
      features: [...form.features, { text: "", included: true, tooltip: "" }],
    });
  };

  // REMOVE FEATURE
  const removeFeature = (index) => {
    if (form.features.length > 1) {
      const updated = [...form.features];
      updated.splice(index, 1);
      setForm({ ...form, features: updated });
    }
  };

  // HANDLE UPGRADE/DOWNGRADE SELECTION
  const togglePlanSelection = (planType, planName) => {
    const currentArray = [...form[planType]];
    const index = currentArray.indexOf(planName);
    
    if (index > -1) {
      currentArray.splice(index, 1);
    } else {
      currentArray.push(planName);
    }
    
    setForm({ ...form, [planType]: currentArray });
  };

  // VALIDATE FORM DATA BEFORE SUBMISSION
  const validateForm = () => {
    const errors = [];

    // Check for empty feature texts
    const emptyFeatures = form.features.filter(feature => !feature.text.trim());
    if (emptyFeatures.length > 0) {
      errors.push("All features must have text content");
    }

    // Validate plan code format
    if (form.planCode && !/^[A-Z0-9_]+$/.test(form.planCode)) {
      errors.push("Plan code must contain only uppercase letters, numbers, and underscores");
    }

    return errors;
  };

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form before submission
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        alert(`❌ Validation Error:\n${validationErrors.join('\n')}`);
        setLoading(false);
        return;
      }

      // Prepare data for API - filter out empty features
      const submitData = {
        ...form,
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        trialPeriodDays: Number(form.trialPeriodDays),
        maxUsers: Number(form.maxUsers),
        maxInvoices: Number(form.maxInvoices),
        storageLimit: Number(form.storageLimit),
        displayOrder: Number(form.displayOrder),
        // Filter out empty features
        features: form.features.filter(feature => feature.text.trim() !== ''),
        // Ensure badge is empty string if no value
        badge: form.badge || "",
        // Ensure arrays are properly set
        allowedUpgrades: form.allowedUpgrades || [],
        allowedDowngrades: form.allowedDowngrades || []
      };

      // Remove empty badge if needed
      if (!submitData.badge) {
        delete submitData.badge;
      }

      let response;
      if (editingId) {
        response = await api.put(`/admin/plans/${editingId}`, submitData);
        alert("✅ Plan updated successfully");
      } else {
        response = await api.post("/admin/plans", submitData);
        alert("✅ Plan added successfully");
      }

      setForm(emptyForm);
      setEditingId(null);
      fetchPlans();
      setActiveTab("plans");
    } catch (err) {
      console.error("Save error:", err);
      
      // Enhanced error handling
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(error => 
          `${error.field}: ${error.message}`
        ).join('\n');
        alert(`❌ Validation Failed:\n${errorMessages}`);
      } else if (err.response?.data?.message) {
        alert(`❌ Error: ${err.response.data.message}`);
      } else {
        alert("❌ Failed to save plan. Please check your data and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // VALIDATE PLAN DATA BEFORE SUBMISSION (OPTIONAL PRE-VALIDATION)
  const validatePlanData = async () => {
    try {
      const submitData = {
        ...form,
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        features: form.features.filter(feature => feature.text.trim() !== '')
      };

      await api.post("/admin/plans/validate", submitData);
      return { isValid: true, message: "Plan data is valid" };
    } catch (err) {
      return { 
        isValid: false, 
        message: err.response?.data?.message || "Validation failed" 
      };
    }
  };

  // EDIT
  const handleEdit = (plan) => {
    setForm({
      ...emptyForm,
      ...plan,
      // Ensure features array is properly formatted
      features: plan.features?.length ? 
        plan.features.map(f => ({ 
          text: f.text || "", 
          included: f.included !== false, 
          tooltip: f.tooltip || "" 
        })) : 
        [{ text: "", included: true, tooltip: "" }],
      // Ensure arrays are properly set
      allowedUpgrades: plan.allowedUpgrades || [],
      allowedDowngrades: plan.allowedDowngrades || [],
      // Ensure badge is properly set
      badge: plan.badge || ""
    });
    setEditingId(plan._id);
    setActiveTab("form");
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      await api.delete(`/admin/plans/${id}`);
      alert("🗑️ Plan deleted successfully");
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to delete plan");
    }
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  // TOGGLE PLAN ACTIVATION
  const togglePlanActivation = async (plan) => {
    try {
      await api.put(`/admin/plans/${plan._id}`, { 
        isActive: !plan.isActive 
      });
      alert(`Plan ${!plan.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
    } catch (err) {
      alert("❌ Failed to update plan status");
    }
  };

  // Plan statistics
  const planStats = {
    total: plans.length,
    popular: plans.filter(p => p.popular).length,
    freeTrial: plans.filter(p => p.isFreeTrial).length,
    active: plans.filter(p => p.isActive).length,
    inactive: plans.filter(p => !p.isActive).length
  };

  // Icons options - matches backend enum
  const iconOptions = ["📦", "🚀", "🏢", "💎", "⭐", "👑", "🎯"];
  
  // Badge options - matches backend enum
  const badgeOptions = ["", "Limited", "Popular", "Best Value", "Recommended"];

  return (
    <div className="nandi-admin-layout">
      <AdminSidebar />

      <main className="nandi-admin-main">
        {/* Header */}
        <header className="admin-plans-header">
          <div className="admin-plans-header-content">
            <div className="admin-plans-header-left">
              <div className="admin-breadcrumb">Admin / Plans</div>
              <h1 className="admin-title">⚙️ Manage Subscription Plans</h1>
              <p className="admin-subtitle">
                Create and manage subscription plans with advanced settings
              </p>
            </div>
            <div className="admin-plans-header-right">
              <button
                className="admin-back-btn"
                onClick={() => navigate("/admin/dashboard")}
              >
                <span className="back-icon">⬅️</span>
                {!isMobile && <span>Back to Dashboard</span>}
              </button>
            </div>
          </div>
        </header>

        <div className="admin-plans-content">
          {/* Stats Overview */}
          <div className="plans-stats-grid">
            <div className="plan-stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{planStats.total}</div>
                <div className="stat-label">Total Plans</div>
              </div>
            </div>
            <div className="plan-stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{planStats.popular}</div>
                <div className="stat-label">Popular Plans</div>
              </div>
            </div>
            <div className="plan-stat-card">
              <div className="stat-icon">🎉</div>
              <div className="stat-content">
                <div className="stat-value">{planStats.freeTrial}</div>
                <div className="stat-label">Free Trials</div>
              </div>
            </div>
            <div className="plan-stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{planStats.active}</div>
                <div className="stat-label">Active Plans</div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="plans-tabs">
            <button 
              className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
              onClick={() => setActiveTab('form')}
            >
              {editingId ? '✏️ Edit Plan' : '➕ Create Plan'}
            </button>
            <button 
              className={`tab-button ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              📋 All Plans ({plans.length})
            </button>
          </div>

          {/* Form Section */}
          {activeTab === 'form' && (
            <div className="plans-form-section">
              <div className="plan-form-card">
                <div className="form-header">
                  <h3 className="form-title">
                    {editingId ? '✏️ Edit Plan' : '➕ Create New Plan'}
                  </h3>
                  {editingId && (
                    <button 
                      type="button" 
                      className="cancel-edit-btn"
                      onClick={cancelEdit}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="plan-form">
                  {/* Basic Information */}
                  <div className="form-section">
                    <h4 className="section-title">📝 Basic Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Plan Name *</label>
                        <select
                          className="form-input"
                          value={form.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          required
                        >
                          <option value="">Select Plan Type</option>
                          <option value="Trial">Trial</option>
                          <option value="Basic">Basic</option>
                          <option value="Professional">Professional</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Plan Code *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., BASIC_PLAN"
                          value={form.planCode}
                          onChange={(e) => updateField("planCode", e.target.value.toUpperCase())}
                          required
                          pattern="[A-Z0-9_]+"
                          title="Uppercase letters, numbers, and underscores only"
                        />
                        <small className="form-help">Uppercase letters, numbers, and underscores only</small>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Badge</label>
                        <select
                          className="form-input"
                          value={form.badge}
                          onChange={(e) => updateField("badge", e.target.value)}
                        >
                          {badgeOptions.map(badge => (
                            <option key={badge} value={badge}>
                              {badge || "No Badge"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Icon</label>
                        <select
                          className="form-input"
                          value={form.icon}
                          onChange={(e) => updateField("icon", e.target.value)}
                        >
                          {iconOptions.map(icon => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Display Order</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0"
                          value={form.displayOrder}
                          onChange={(e) => updateField("displayOrder", e.target.value)}
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tagline</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Short catchy phrase"
                          value={form.tagline}
                          onChange={(e) => updateField("tagline", e.target.value)}
                          maxLength="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Limits */}
                  <div className="form-section">
                    <h4 className="section-title">💰 Pricing & Limits</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Monthly Price (₹) *</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0"
                          value={form.monthlyPrice}
                          onChange={(e) => updateField("monthlyPrice", e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Yearly Price (₹) *</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0"
                          value={form.yearlyPrice}
                          onChange={(e) => updateField("yearlyPrice", e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Trial Period (Days)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="7"
                          value={form.trialPeriodDays}
                          onChange={(e) => updateField("trialPeriodDays", e.target.value)}
                          min="0"
                          max="30"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max Users</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="1"
                          value={form.maxUsers}
                          onChange={(e) => updateField("maxUsers", e.target.value)}
                          min="1"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max Invoices/Month</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="100"
                          value={form.maxInvoices}
                          onChange={(e) => updateField("maxInvoices", e.target.value)}
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Storage Limit (MB)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="1024"
                          value={form.storageLimit}
                          onChange={(e) => updateField("storageLimit", e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div className="form-section">
                    <h4 className="section-title">🎨 Color Scheme</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Primary Color</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            className="color-picker"
                            value={form.colorScheme.primary}
                            onChange={(e) => updateColorScheme("primary", e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-input color-value"
                            value={form.colorScheme.primary}
                            onChange={(e) => updateColorScheme("primary", e.target.value)}
                            placeholder="#0052ff"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Secondary Color</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            className="color-picker"
                            value={form.colorScheme.secondary}
                            onChange={(e) => updateColorScheme("secondary", e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-input color-value"
                            value={form.colorScheme.secondary}
                            onChange={(e) => updateColorScheme("secondary", e.target.value)}
                            placeholder="#667eea"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-section">
                    <h4 className="section-title">📄 Description</h4>
                    <div className="form-group">
                      <textarea
                        className="form-textarea"
                        placeholder="Detailed plan description..."
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows="3"
                        maxLength="200"
                      />
                      <small className="form-help">{form.description.length}/200 characters</small>
                    </div>
                  </div>

                  {/* Plan Settings */}
                  <div className="form-section">
                    <h4 className="section-title">⚙️ Plan Settings</h4>
                    <div className="toggle-grid">
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          className="toggle-input"
                          checked={form.popular}
                          onChange={(e) => updateField("popular", e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">
                          <span className="toggle-icon">⭐</span>
                          Mark as Popular Plan
                        </span>
                      </label>

                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          className="toggle-input"
                          checked={form.isFreeTrial}
                          onChange={(e) => updateField("isFreeTrial", e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">
                          <span className="toggle-icon">🎉</span>
                          Free Trial Plan
                        </span>
                      </label>

                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          className="toggle-input"
                          checked={form.isActive}
                          onChange={(e) => updateField("isActive", e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">
                          <span className="toggle-icon">✅</span>
                          Plan is Active
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Upgrade/Downgrade Rules */}
                  <div className="form-section">
                    <h4 className="section-title">🔄 Plan Transitions</h4>
                    <div className="transition-grid">
                      <div className="transition-group">
                        <label className="transition-label">Allowed Upgrades</label>
                        <div className="plan-checkboxes">
                          {availablePlans.map(plan => (
                            <label key={`upgrade-${plan}`} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={form.allowedUpgrades.includes(plan)}
                                onChange={() => togglePlanSelection('allowedUpgrades', plan)}
                              />
                              <span className="checkmark"></span>
                              {plan}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="transition-group">
                        <label className="transition-label">Allowed Downgrades</label>
                        <div className="plan-checkboxes">
                          {availablePlans.map(plan => (
                            <label key={`downgrade-${plan}`} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={form.allowedDowngrades.includes(plan)}
                                onChange={() => togglePlanSelection('allowedDowngrades', plan)}
                              />
                              <span className="checkmark"></span>
                              {plan}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4 className="section-title">🎯 Features</h4>
                      <button 
                        type="button" 
                        className="add-feature-btn"
                        onClick={addFeature}
                      >
                        ➕ Add Feature
                      </button>
                    </div>
                    
                    <div className="features-list">
                      {form.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <div className="feature-inputs">
                            <input
                              type="text"
                              className="feature-text"
                              placeholder="Enter feature description *"
                              value={feature.text}
                              onChange={(e) => updateFeature(index, "text", e.target.value)}
                              required
                            />
                            <input
                              type="text"
                              className="feature-tooltip"
                              placeholder="Tooltip (optional)"
                              value={feature.tooltip}
                              onChange={(e) => updateFeature(index, "tooltip", e.target.value)}
                            />
                            <label className="feature-toggle">
                              <input
                                type="checkbox"
                                checked={feature.included}
                                onChange={(e) => updateFeature(index, "included", e.target.checked)}
                              />
                              <span className="toggle-slider small"></span>
                              <span className="toggle-label">Included</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            className="remove-feature-btn"
                            onClick={() => removeFeature(index)}
                            disabled={form.features.length === 1}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                    <small className="form-help">
                      * Feature text is required. Empty features will be automatically removed.
                    </small>
                  </div>

                  {/* Submit Button */}
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Saving...
                        </>
                      ) : editingId ? (
                        'Update Plan'
                      ) : (
                        'Create Plan'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Plans List Section */}
          {activeTab === 'plans' && (
            <div className="plans-list-section">
              {plans.length === 0 ? (
                <div className="empty-plans">
                  <div className="empty-icon">📋</div>
                  <h3>No Plans Created</h3>
                  <p>Get started by creating your first subscription plan</p>
                  <button 
                    className="create-first-plan-btn"
                    onClick={() => setActiveTab('form')}
                  >
                    ➕ Create First Plan
                  </button>
                </div>
              ) : isMobile ? (
                // Mobile Cards View
                <div className="plans-cards">
                  {plans.map((plan) => (
                    <div key={plan._id} className={`plan-card ${!plan.isActive ? 'inactive' : ''}`}>
                      <div className="plan-card-header">
                        <div className="plan-name-section">
                          <span className="plan-icon">{plan.icon || '📦'}</span>
                          <div>
                            <h4 className="plan-name">{plan.name}</h4>
                            <div className="plan-code">{plan.planCode}</div>
                          </div>
                          {plan.badge && (
                            <span className="plan-badge">{plan.badge}</span>
                          )}
                        </div>
                        <div className="plan-flags">
                          {!plan.isActive && <span className="flag inactive">❌ Inactive</span>}
                          {plan.popular && <span className="flag popular">⭐ Popular</span>}
                          {plan.isFreeTrial && <span className="flag trial">🎉 Free Trial</span>}
                        </div>
                      </div>
                      
                      <div className="plan-card-body">
                        <div className="plan-pricing">
                          <div className="price-item">
                            <span className="price-label">Monthly:</span>
                            <span className="price-value">₹{plan.monthlyPrice}</span>
                          </div>
                          <div className="price-item">
                            <span className="price-label">Yearly:</span>
                            <span className="price-value">₹{plan.yearlyPrice}</span>
                          </div>
                        </div>
                        
                        <div className="plan-limits">
                          <div className="limit-item">
                            <span className="limit-label">Users:</span>
                            <span className="limit-value">{plan.maxUsers}</span>
                          </div>
                          <div className="limit-item">
                            <span className="limit-label">Invoices:</span>
                            <span className="limit-value">{plan.maxInvoices}/mo</span>
                          </div>
                          <div className="limit-item">
                            <span className="limit-label">Storage:</span>
                            <span className="limit-value">{plan.storageLimit}MB</span>
                          </div>
                        </div>
                        
                        {plan.tagline && (
                          <p className="plan-tagline">{plan.tagline}</p>
                        )}
                      </div>

                      <div className="plan-card-actions">
                        <button
                          className="btn-action toggle-active"
                          onClick={() => togglePlanActivation(plan)}
                        >
                          {plan.isActive ? '❌ Deactivate' : '✅ Activate'}
                        </button>
                        <button
                          className="btn-action edit"
                          onClick={() => handleEdit(plan)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDelete(plan._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <div className="plans-table-container">
                  <table className="plans-table">
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Code</th>
                        <th>Monthly</th>
                        <th>Yearly</th>
                        <th>Users</th>
                        <th>Invoices</th>
                        <th>Storage</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan._id} className={!plan.isActive ? 'inactive-row' : ''}>
                          <td className="plan-name-cell">
                            <div className="plan-name-content">
                              <span className="plan-icon">{plan.icon || '📦'}</span>
                              <div>
                                <div className="plan-name">{plan.name}</div>
                                {plan.badge && (
                                  <div className="plan-badge-small">{plan.badge}</div>
                                )}
                                <div className="plan-tagline-small">{plan.tagline}</div>
                              </div>
                            </div>
                          </td>
                          <td className="plan-code-cell">
                            <code>{plan.planCode}</code>
                          </td>
                          <td className="price-cell">₹{plan.monthlyPrice}</td>
                          <td className="price-cell">₹{plan.yearlyPrice}</td>
                          <td className="limit-cell">{plan.maxUsers}</td>
                          <td className="limit-cell">{plan.maxInvoices}</td>
                          <td className="limit-cell">{plan.storageLimit}MB</td>
                          <td className="status-cell">
                            <div className="status-badges">
                              {!plan.isActive && (
                                <span className="status-badge inactive" title="Inactive">❌</span>
                              )}
                              {plan.popular && (
                                <span className="status-badge popular" title="Popular">⭐</span>
                              )}
                              {plan.isFreeTrial && (
                                <span className="status-badge trial" title="Free Trial">🎉</span>
                              )}
                            </div>
                          </td>
                          <td className="actions-cell">
                            <div className="action-buttons">
                              <button
                                className="btn-action toggle-active"
                                onClick={() => togglePlanActivation(plan)}
                                title={plan.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {plan.isActive ? '❌' : '✅'}
                              </button>
                              <button
                                className="btn-action edit"
                                onClick={() => handleEdit(plan)}
                                title="Edit Plan"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-action delete"
                                onClick={() => handleDelete(plan._id)}
                                title="Delete Plan"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPlans;