import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminPlans.css";

// Icon Components
const PlanIcon = () => <span className="icon">⚙️</span>;
const BackIcon = () => <span className="icon">←</span>;
const StatsIcon = () => <span className="icon">📊</span>;
const PopularIcon = () => <span className="icon">⭐</span>;
const TrialIcon = () => <span className="icon">🎉</span>;
const ActiveIcon = () => <span className="icon">✅</span>;
const EditIcon = () => <span className="icon">✏️</span>;
const DeleteIcon = () => <span className="icon">🗑️</span>;
const PlusIcon = () => <span className="icon">➕</span>;
const CheckIcon = () => <span className="icon">✓</span>;
const CloseIcon = () => <span className="icon">×</span>;
const LoadingIcon = () => <span className="icon">⏳</span>;
const ColorIcon = () => <span className="icon">🎨</span>;
const FeatureIcon = () => <span className="icon">🎯</span>;
const PriceIcon = () => <span className="icon">💰</span>;
const SettingsIcon = () => <span className="icon">⚙️</span>;

function AdminPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      primary: "#3b82f6",
      secondary: "#60a5fa"
    },
    features: [{ text: "", included: true, tooltip: "" }],
    allowedUpgrades: [],
    allowedDowngrades: []
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [availablePlans, setAvailablePlans] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch plans from database
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/admin/plans");
      
      if (response.data?.success) {
        setPlans(response.data.data || []);
        // Extract unique plan names for upgrade/downgrade selection
        const planNames = [...new Set(response.data.data.map(p => p.name))];
        setAvailablePlans(planNames.length ? planNames : ['Trial', 'Basic', 'Professional', 'Enterprise']);
      } else {
        setPlans(response.data || []);
      }
    } catch (err) {
      console.error("Error loading plans:", err);
      const errorMessage = err.response?.data?.message || "Failed to load plans";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle form input changes
  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Handle color scheme changes
  const updateColorScheme = (key, value) => {
    setForm(prev => ({ 
      ...prev, 
      colorScheme: {
        ...prev.colorScheme,
        [key]: value
      }
    }));
  };

  // Handle feature changes
  const updateFeature = (index, key, value) => {
    const updatedFeatures = [...form.features];
    updatedFeatures[index][key] = value;
    setForm(prev => ({ ...prev, features: updatedFeatures }));
  };

  // Add new feature
  const addFeature = () => {
    setForm(prev => ({
      ...prev,
      features: [...prev.features, { text: "", included: true, tooltip: "" }]
    }));
  };

  // Remove feature
  const removeFeature = (index) => {
    if (form.features.length > 1) {
      const updatedFeatures = [...form.features];
      updatedFeatures.splice(index, 1);
      setForm(prev => ({ ...prev, features: updatedFeatures }));
    }
  };

  // Toggle plan selection for upgrades/downgrades
  const togglePlanSelection = (planType, planName) => {
    const currentArray = [...form[planType]];
    const index = currentArray.indexOf(planName);
    
    if (index > -1) {
      currentArray.splice(index, 1);
    } else {
      currentArray.push(planName);
    }
    
    setForm(prev => ({ ...prev, [planType]: currentArray }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    if (!form.name.trim()) errors.push("Plan name is required");
    if (!form.planCode.trim()) errors.push("Plan code is required");
    if (form.monthlyPrice === "" || form.monthlyPrice < 0) errors.push("Valid monthly price is required");
    if (form.yearlyPrice === "" || form.yearlyPrice < 0) errors.push("Valid yearly price is required");

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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(`❌ Validation Failed:\n${validationErrors.join('\n')}`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    setFormLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API
      const submitData = {
        ...form,
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        trialPeriodDays: Number(form.trialPeriodDays),
        maxUsers: Number(form.maxUsers),
        maxInvoices: Number(form.maxInvoices),
        storageLimit: Number(form.storageLimit),
        displayOrder: Number(form.displayOrder),
        features: form.features.filter(feature => feature.text.trim() !== ''),
        badge: form.badge || "",
        allowedUpgrades: form.allowedUpgrades || [],
        allowedDowngrades: form.allowedDowngrades || []
      };

      let response;
      if (editingId) {
        response = await api.put(`/admin/plans/${editingId}`, submitData);
        setSuccess("✅ Plan updated successfully");
      } else {
        response = await api.post("/admin/plans", submitData);
        setSuccess("✅ Plan created successfully");
      }

      resetForm();
      fetchPlans();
      setActiveTab("plans");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Save error:", err);
      const errorMessage = err.response?.data?.message || "Failed to save plan";
      setError(`❌ ${errorMessage}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit plan
  const handleEdit = (plan) => {
    setForm({
      ...emptyForm,
      ...plan,
      features: plan.features?.length ? 
        plan.features.map(f => ({ 
          text: f.text || "", 
          included: f.included !== false, 
          tooltip: f.tooltip || "" 
        })) : 
        [{ text: "", included: true, tooltip: "" }],
      allowedUpgrades: plan.allowedUpgrades || [],
      allowedDowngrades: plan.allowedDowngrades || [],
      badge: plan.badge || ""
    });
    setEditingId(plan._id);
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete plan
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan? This action cannot be undone.")) return;

    try {
      setLoading(true);
      await api.delete(`/admin/plans/${id}`);
      setSuccess("🗑️ Plan deleted successfully");
      fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("❌ Failed to delete plan");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Toggle plan activation
  const togglePlanActivation = async (plan) => {
    try {
      setLoading(true);
      await api.put(`/admin/plans/${plan._id}`, { 
        isActive: !plan.isActive 
      });
      setSuccess(`Plan ${!plan.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Toggle activation error:", err);
      setError("❌ Failed to update plan status");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    resetForm();
    setActiveTab("plans");
  };

  // Toggle plan expansion on mobile
  const togglePlanExpansion = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  // Filter plans based on search
  const filteredPlans = plans.filter(plan =>
    plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.planCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Plan statistics
  const planStats = {
    total: plans.length,
    popular: plans.filter(p => p.popular).length,
    freeTrial: plans.filter(p => p.isFreeTrial).length,
    active: plans.filter(p => p.isActive).length
  };

  // Icon options
  const iconOptions = ["📦", "🚀", "🏢", "💎", "⭐", "👑", "🎯", "💼", "🔧", "⚡"];
  
  // Badge options
  const badgeOptions = ["", "Limited", "Popular", "Best Value", "Recommended", "New", "Featured"];

  return (
    <div className="admin-plans-container">
      <AdminSidebar />
      
      <main className="admin-plans-main">
        {/* Header Section */}
        <header className="admin-plans-header">
          <div className="header-content">
            <div className="header-left">
              <div className="breadcrumb">
                <span onClick={() => navigate("/admin/dashboard")}>Dashboard</span>
                <span className="separator">/</span>
                <span className="current">Subscription Plans</span>
              </div>
              <div className="header-title">
                <h1><PlanIcon /> Plan Management</h1>
                <p className="subtitle">Create and manage subscription plans with advanced configurations</p>
              </div>
            </div>
            <div className="header-right">
              <button
                className="btn btn-secondary back-btn"
                onClick={() => navigate("/admin/dashboard")}
                title="Back to Dashboard"
              >
                <BackIcon /> {!isMobile && 'Dashboard'}
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon primary">
                <StatsIcon />
              </div>
              <div className="stat-content">
                <h3>{planStats.total}</h3>
                <p>Total Plans</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon warning">
                <PopularIcon />
              </div>
              <div className="stat-content">
                <h3>{planStats.popular}</h3>
                <p>Popular</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon info">
                <TrialIcon />
              </div>
              <div className="stat-content">
                <h3>{planStats.freeTrial}</h3>
                <p>Free Trials</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon success">
                <ActiveIcon />
              </div>
              <div className="stat-content">
                <h3>{planStats.active}</h3>
                <p>Active</p>
              </div>
            </div>
          </div>
        </header>

        {/* Alerts */}
        <div className="alerts-container">
          {error && (
            <div className="alert alert-error slide-in">
              <div className="alert-content">
                <span className="icon">❌</span>
                <span>{error}</span>
              </div>
              <button className="alert-close" onClick={() => setError(null)}>
                <CloseIcon />
              </button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success slide-in">
              <div className="alert-content">
                <span className="icon">✅</span>
                <span>{success}</span>
              </div>
              <button className="alert-close" onClick={() => setSuccess(null)}>
                <CloseIcon />
              </button>
            </div>
          )}
        </div>

        <div className="admin-plans-content">
          {/* Tabs and Search */}
          <div className="content-header">
            <div className="tabs-container">
              <button 
                className={`tab ${activeTab === 'form' ? 'active' : ''}`}
                onClick={() => setActiveTab('form')}
              >
                {editingId ? '✏️ Edit Plan' : '➕ Create Plan'}
              </button>
              <button 
                className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
                onClick={() => setActiveTab('plans')}
              >
                📋 View Plans ({plans.length})
              </button>
            </div>

            {activeTab === 'plans' && (
              <div className="search-container">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTerm('')}
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && activeTab === 'plans' && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading plans...</p>
            </div>
          )}

          {/* Form Section */}
          {activeTab === 'form' && (
            <div className="form-section">
              <div className="form-card">
                <div className="form-header">
                  <h3 className="form-title">
                    {editingId ? '✏️ Edit Plan' : '➕ Create New Plan'}
                  </h3>
                  {editingId && (
                    <button 
                      className="btn btn-secondary cancel-btn"
                      onClick={cancelEdit}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="plan-form">
                  {/* Basic Information */}
                  <div className="form-group-section">
                    <h4 className="section-title">
                      <SettingsIcon /> Basic Information
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label required">Plan Name</label>
                        <select
                          className="form-select"
                          value={form.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          required
                        >
                          <option value="">Select Plan Type</option>
                          <option value="Trial">Trial</option>
                          <option value="Basic">Basic</option>
                          <option value="Professional">Professional</option>
                          <option value="Enterprise">Enterprise</option>
                          <option value="Premium">Premium</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Plan Code</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="BASIC_PLAN"
                          value={form.planCode}
                          onChange={(e) => updateField("planCode", e.target.value.toUpperCase())}
                          required
                          pattern="[A-Z0-9_]+"
                        />
                        <small className="form-help">Uppercase, numbers, and underscores only</small>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Badge</label>
                        <select
                          className="form-select"
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
                        <div className="icon-selector">
                          {iconOptions.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              className={`icon-option ${form.icon === icon ? 'selected' : ''}`}
                              onClick={() => updateField("icon", icon)}
                              title={icon}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="form-group-section">
                    <h4 className="section-title">
                      <PriceIcon /> Pricing & Limits
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label required">Monthly Price (₹)</label>
                        <div className="input-with-suffix">
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
                          <span className="input-suffix">₹</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Yearly Price (₹)</label>
                        <div className="input-with-suffix">
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
                          <span className="input-suffix">₹</span>
                        </div>
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
                  <div className="form-group-section">
                    <h4 className="section-title">
                      <ColorIcon /> Color Scheme
                    </h4>
                    <div className="color-grid">
                      <div className="color-group">
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
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="color-group">
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
                            placeholder="#60a5fa"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-group-section">
                    <h4 className="section-title">Description</h4>
                    <div className="form-group">
                      <textarea
                        className="form-textarea"
                        placeholder="Describe the plan features and benefits..."
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows="3"
                        maxLength="500"
                      />
                      <div className="char-count">
                        {form.description.length}/500 characters
                      </div>
                    </div>
                  </div>

                  {/* Plan Settings */}
                  <div className="form-group-section">
                    <h4 className="section-title">Plan Settings</h4>
                    <div className="toggle-grid">
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          className="toggle-checkbox"
                          checked={form.popular}
                          onChange={(e) => updateField("popular", e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">
                          <span className="toggle-icon">⭐</span>
                          Mark as Popular
                        </span>
                      </label>

                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          className="toggle-checkbox"
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
                          className="toggle-checkbox"
                          checked={form.isActive}
                          onChange={(e) => updateField("isActive", e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">
                          <span className="toggle-icon">✅</span>
                          Active Plan
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="form-group-section">
                    <div className="section-header">
                      <h4 className="section-title">
                        <FeatureIcon /> Features
                      </h4>
                      <button 
                        type="button" 
                        className="btn btn-secondary add-feature-btn"
                        onClick={addFeature}
                      >
                        <PlusIcon /> Add Feature
                      </button>
                    </div>
                    
                    <div className="features-container">
                      {form.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <div className="feature-content">
                            <input
                              type="text"
                              className="feature-input"
                              placeholder="Feature description *"
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
                                className="toggle-checkbox"
                                checked={feature.included}
                                onChange={(e) => updateFeature(index, "included", e.target.checked)}
                              />
                              <span className="toggle-slider small"></span>
                              <span className="toggle-label">Included</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            className="btn-icon remove-feature-btn"
                            onClick={() => removeFeature(index)}
                            disabled={form.features.length === 1}
                            title="Remove Feature"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={cancelEdit}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary submit-btn"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <LoadingIcon /> Saving...
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
            <div className="plans-section">
              {filteredPlans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>{searchTerm ? 'No Matching Plans' : 'No Plans Yet'}</h3>
                  <p>
                    {searchTerm 
                      ? 'Try a different search term'
                      : 'Create your first subscription plan to get started'
                    }
                  </p>
                  {!searchTerm && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveTab('form')}
                    >
                      <PlusIcon /> Create First Plan
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile/Tablet Cards View */}
                  {isMobile || isTablet ? (
                    <div className="plans-cards">
                      {filteredPlans.map((plan) => (
                        <div 
                          key={plan._id} 
                          className={`plan-card ${!plan.isActive ? 'inactive' : ''} ${expandedPlan === plan._id ? 'expanded' : ''}`}
                          onClick={() => isMobile && togglePlanExpansion(plan._id)}
                        >
                          <div className="plan-card-header">
                            <div className="plan-info">
                              <span className="plan-icon">{plan.icon || '📦'}</span>
                              <div className="plan-details">
                                <div className="plan-name">{plan.name}</div>
                                <div className="plan-code">{plan.planCode}</div>
                                {plan.tagline && (
                                  <div className="plan-tagline">{plan.tagline}</div>
                                )}
                              </div>
                              {plan.badge && (
                                <span className="plan-badge">{plan.badge}</span>
                              )}
                            </div>
                            <div className="plan-status">
                              {!plan.isActive && <span className="status-badge inactive">Inactive</span>}
                              {plan.popular && <span className="status-badge popular">⭐ Popular</span>}
                              {plan.isFreeTrial && <span className="status-badge trial">🎉 Trial</span>}
                            </div>
                          </div>

                          <div className="plan-card-body">
                            <div className="pricing-info">
                              <div className="price-item">
                                <span className="price-label">Monthly</span>
                                <span className="price-value">₹{plan.monthlyPrice}</span>
                              </div>
                              <div className="price-item">
                                <span className="price-label">Yearly</span>
                                <span className="price-value">₹{plan.yearlyPrice}</span>
                              </div>
                            </div>

                            {(expandedPlan === plan._id || !isMobile) && (
                              <>
                                <div className="limits-info">
                                  <div className="limit-item">
                                    <span className="limit-label">Users</span>
                                    <span className="limit-value">{plan.maxUsers}</span>
                                  </div>
                                  <div className="limit-item">
                                    <span className="limit-label">Invoices</span>
                                    <span className="limit-value">{plan.maxInvoices}/mo</span>
                                  </div>
                                  <div className="limit-item">
                                    <span className="limit-label">Storage</span>
                                    <span className="limit-value">{plan.storageLimit}MB</span>
                                  </div>
                                </div>

                                {plan.description && (
                                  <div className="plan-description">
                                    {plan.description}
                                  </div>
                                )}

                                <div className="plan-features">
                                  <div className="features-count">
                                    {plan.features?.length || 0} features
                                  </div>
                                  <div className="features-preview">
                                    {plan.features?.slice(0, 3).map((feature, idx) => (
                                      <div key={idx} className="feature-preview">
                                        <span className={`feature-indicator ${feature.included ? 'included' : 'excluded'}`}>
                                          {feature.included ? <CheckIcon /> : <CloseIcon />}
                                        </span>
                                        <span className="feature-text">{feature.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="plan-card-actions">
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-status"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlanActivation(plan);
                                }}
                                title={plan.isActive ? 'Deactivate' : 'Activate'}
                                disabled={loading}
                              >
                                {plan.isActive ? '❌' : '✅'}
                              </button>
                              <button
                                className="btn-icon btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(plan);
                                }}
                                title="Edit Plan"
                                disabled={loading}
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(plan._id);
                                }}
                                title="Delete Plan"
                                disabled={loading}
                              >
                                <DeleteIcon />
                              </button>
                              {isMobile && (
                                <button
                                  className="btn-icon btn-expand"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlanExpansion(plan._id);
                                  }}
                                  title={expandedPlan === plan._id ? 'Collapse' : 'Expand'}
                                >
                                  {expandedPlan === plan._id ? '▲' : '▼'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Desktop Table View */
                    <div className="plans-table-container">
                      <div className="table-responsive">
                        <table className="plans-table">
                          <thead>
                            <tr>
                              <th>Plan</th>
                              <th>Code</th>
                              <th>Pricing</th>
                              <th>Limits</th>
                              <th>Status</th>
                              <th>Features</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPlans.map((plan) => (
                              <tr key={plan._id} className={!plan.isActive ? 'inactive' : ''}>
                                <td className="plan-cell">
                                  <div className="plan-info">
                                    <span className="plan-icon">{plan.icon || '📦'}</span>
                                    <div className="plan-details">
                                      <div className="plan-name">
                                        {plan.name}
                                        {plan.badge && (
                                          <span className="plan-badge">{plan.badge}</span>
                                        )}
                                      </div>
                                      <div className="plan-code">{plan.planCode}</div>
                                      {plan.tagline && (
                                        <div className="plan-tagline">{plan.tagline}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="code-cell">
                                  <code>{plan.planCode}</code>
                                </td>
                                <td className="pricing-cell">
                                  <div className="pricing-info">
                                    <div className="price-item">
                                      <span className="price-label">Monthly:</span>
                                      <span className="price-value">₹{plan.monthlyPrice}</span>
                                    </div>
                                    <div className="price-item">
                                      <span className="price-label">Yearly:</span>
                                      <span className="price-value">₹{plan.yearlyPrice}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="limits-cell">
                                  <div className="limits-info">
                                    <div className="limit-item">
                                      <span className="limit-label">Users:</span>
                                      <span className="limit-value">{plan.maxUsers}</span>
                                    </div>
                                    <div className="limit-item">
                                      <span className="limit-label">Invoices:</span>
                                      <span className="limit-value">{plan.maxInvoices}</span>
                                    </div>
                                    <div className="limit-item">
                                      <span className="limit-label">Storage:</span>
                                      <span className="limit-value">{plan.storageLimit}MB</span>
                                    </div>
                                  </div>
                                </td>
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
                                <td className="features-cell">
                                  <div className="features-count">
                                    {plan.features?.length || 0} features
                                  </div>
                                </td>
                                <td className="actions-cell">
                                  <div className="action-buttons">
                                    <button
                                      className="btn-icon btn-status"
                                      onClick={() => togglePlanActivation(plan)}
                                      title={plan.isActive ? 'Deactivate' : 'Activate'}
                                      disabled={loading}
                                    >
                                      {plan.isActive ? '❌' : '✅'}
                                    </button>
                                    <button
                                      className="btn-icon btn-edit"
                                      onClick={() => handleEdit(plan)}
                                      title="Edit Plan"
                                      disabled={loading}
                                    >
                                      <EditIcon />
                                    </button>
                                    <button
                                      className="btn-icon btn-delete"
                                      onClick={() => handleDelete(plan._id)}
                                      title="Delete Plan"
                                      disabled={loading}
                                    >
                                      <DeleteIcon />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Table Summary */}
                  {filteredPlans.length > 0 && (
                    <div className="table-summary">
                      <div className="summary-info">
                        Showing {filteredPlans.length} of {plans.length} plans
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setActiveTab('form')}
                      >
                        <PlusIcon /> Create New Plan
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPlans;