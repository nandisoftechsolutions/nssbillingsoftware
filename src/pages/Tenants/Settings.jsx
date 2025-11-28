import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Settings.css";

function Settings() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    state: "",
    stateCode: "",
    bankName: "",
    bankAccount: "",
    ifsc: "",
    about: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      website: "",
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [company, setCompany] = useState(null);
  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [signPreview, setSignPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("company");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formErrors, setFormErrors] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Validate URLs
  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Company name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Email is invalid";
    }

    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      errors.phone = "Phone must be 10 digits";
    }

    if (form.gstNumber && !/^[0-9A-Z]{15}$/.test(form.gstNumber)) {
      errors.gstNumber = "GST number must be 15 characters";
    }

    // Validate social URLs
    Object.entries(form.socialLinks).forEach(([platform, url]) => {
      if (url && !isValidUrl(url)) {
        errors[`social_${platform}`] = `Please enter a valid URL for ${platform}`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Load settings data
  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/settings");

      if (data.success && data.data?.company) {
        const c = data.data.company;
        setCompany(c);

        const social = typeof c.socialLinks === "string"
          ? JSON.parse(c.socialLinks || "{}")
          : c.socialLinks || {};

        setForm({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          address: c.address || "",
          gstNumber: c.gstNumber || "",
          state: c.state || "",
          stateCode: c.stateCode || "",
          bankName: c.bankName || "",
          bankAccount: c.bankAccount || "",
          ifsc: c.ifsc || "",
          about: c.about || "",
          socialLinks: {
            facebook: social.facebook || "",
            instagram: social.instagram || "",
            linkedin: social.linkedin || "",
            youtube: social.youtube || "",
            website: social.website || "",
          },
        });

        setLogoPreview(c.logoUrl || "");
        setSignPreview(c.signatureUrl || "");
      }
    } catch (err) {
      console.error("Load Settings Error:", err);
      showMessage("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("social.")) {
      const field = name.split(".")[1];
      setForm((f) => ({
        ...f,
        socialLinks: { ...f.socialLinks, [field]: value },
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((f) => ({ ...f, [name]: value }));
  };

  // Handle logo upload
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showMessage("error", "Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage("error", "Logo must be less than 2MB");
      return;
    }

    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Handle signature upload
  const handleSignature = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage("error", "Please select an image file");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      showMessage("error", "Signature must be less than 1MB");
      return;
    }

    setSignature(file);
    setSignPreview(URL.createObjectURL(file));
  };

  // Save company settings
  const saveCompanySettings = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showMessage("error", "Please fix the errors before saving");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      
      // Append form data
      Object.keys(form).forEach(key => {
        if (key === 'socialLinks') {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key]);
        }
      });

      // Append files if selected
      if (logo) formData.append('logo', logo);
      if (signature) formData.append('signature', signature);

      const { data } = await api.put("/settings", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        showMessage("success", "Settings saved successfully");
        if (data.data?.company) {
          setCompany(data.data.company);
        }
      } else {
        showMessage("error", data.message || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save Settings Error:", err);
      showMessage("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);

    try {
      if (passwordForm.newPassword.length < 6) {
        showMessage("error", "New password must be at least 6 characters");
        setChangingPassword(false);
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showMessage("error", "Passwords do not match");
        setChangingPassword(false);
        return;
      }

      const { data } = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (data.success) {
        showMessage("success", "Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showMessage("error", data.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Change Password Error:", err);
      showMessage("error", "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="settings-wrapper">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />
      
      <div className={`settings-content ${!sidebarOpen ? 'expanded' : ''}`}>
        {/* Topbar */}
        <div className="settings-topbar">
          <button onClick={toggleSidebar} className="settings-menu-btn">
            ☰
          </button>
          <h1 className="settings-title">Company Settings</h1>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="settings-loading">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="settings-tabs">
              <button
                className={activeTab === "company" ? "tab active" : "tab"}
                onClick={() => setActiveTab("company")}
              >
                <i className="tab-icon">🏢</i>
                Company Profile
              </button>

              <button
                className={activeTab === "password" ? "tab active" : "tab"}
                onClick={() => setActiveTab("password")}
              >
                <i className="tab-icon">🔒</i>
                Change Password
              </button>

              <button
                className={activeTab === "preview" ? "tab active" : "tab"}
                onClick={() => setActiveTab("preview")}
              >
                <i className="tab-icon">👁️</i>
                Preview
              </button>
            </div>

            {/* Company Profile Tab */}
            {activeTab === "company" && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Company Information</h2>
                  <p className="card-sub">Update business profile and branding</p>
                </div>

                <form className="form" onSubmit={saveCompanySettings}>
                  {/* Logo Upload */}
                  <div className="form-section">
                    <h3 className="section-title">Brand Assets</h3>
                    <div className="upload-row">
                      <div className="upload-group">
                        <label className="form-label">Company Logo</label>
                        <div className="upload-box">
                          {logoPreview ? (
                            <div className="upload-preview">
                              <img src={logoPreview} alt="Logo" />
                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() => {
                                  setLogo(null);
                                  setLogoPreview("");
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <i className="upload-icon">📷</i>
                              <span>Click to upload logo</span>
                              <small>PNG, JPG (Max 2MB)</small>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="upload-input"
                            onChange={handleLogo}
                          />
                        </div>
                      </div>

                      <div className="upload-group">
                        <label className="form-label">Authorized Signature</label>
                        <div className="upload-box">
                          {signPreview ? (
                            <div className="upload-preview">
                              <img src={signPreview} alt="Signature" />
                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() => {
                                  setSignature(null);
                                  setSignPreview("");
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <i className="upload-icon">✍️</i>
                              <span>Click to upload signature</span>
                              <small>PNG, JPG (Max 1MB)</small>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="upload-input"
                            onChange={handleSignature}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>
                    <div className="form-group full">
                      <label className="form-label">Company Name *</label>
                      <input
                        type="text"
                        name="name"
                        className={`form-input ${formErrors.name ? 'error' : ''}`}
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          name="email"
                          className={`form-input ${formErrors.email ? 'error' : ''}`}
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          name="phone"
                          className={`form-input ${formErrors.phone ? 'error' : ''}`}
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                        />
                        {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                      </div>
                    </div>

                    <div className="form-group full">
                      <label className="form-label">Address</label>
                      <textarea
                        name="address"
                        className="form-input"
                        value={form.address}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter full business address"
                      ></textarea>
                    </div>
                  </div>

                  {/* GST & State */}
                  <div className="form-section">
                    <h3 className="section-title">Tax Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">GST Number</label>
                        <input
                          type="text"
                          name="gstNumber"
                          className={`form-input ${formErrors.gstNumber ? 'error' : ''}`}
                          maxLength="15"
                          value={form.gstNumber}
                          onChange={handleChange}
                          placeholder="15-character GSTIN"
                          style={{ textTransform: "uppercase" }}
                        />
                        {formErrors.gstNumber && <span className="error-text">{formErrors.gstNumber}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          name="state"
                          className="form-input"
                          value={form.state}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group small">
                        <label className="form-label">State Code</label>
                        <input
                          type="text"
                          name="stateCode"
                          className="form-input"
                          maxLength="2"
                          value={form.stateCode}
                          onChange={handleChange}
                          style={{ textTransform: "uppercase" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="form-section">
                    <h3 className="section-title">Bank Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          className="form-input"
                          value={form.bankName}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Account Number</label>
                        <input
                          type="text"
                          name="bankAccount"
                          className="form-input"
                          value={form.bankAccount}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group small">
                        <label className="form-label">IFSC Code</label>
                        <input
                          type="text"
                          name="ifsc"
                          className="form-input"
                          value={form.ifsc}
                          onChange={handleChange}
                          style={{ textTransform: "uppercase" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="form-section">
                    <h3 className="section-title">About Company</h3>
                    <div className="form-group full">
                      <textarea
                        name="about"
                        className="form-input"
                        rows="4"
                        value={form.about}
                        onChange={handleChange}
                        placeholder="Write a short description about your company..."
                      ></textarea>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="form-section">
                    <h3 className="section-title">Social Media & Website</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Facebook</label>
                        <input
                          type="text"
                          name="social.facebook"
                          className={`form-input ${formErrors.social_facebook ? 'error' : ''}`}
                          value={form.socialLinks.facebook}
                          onChange={handleChange}
                          placeholder="https://facebook.com/yourpage"
                        />
                        {formErrors.social_facebook && <span className="error-text">{formErrors.social_facebook}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Instagram</label>
                        <input
                          type="text"
                          name="social.instagram"
                          className={`form-input ${formErrors.social_instagram ? 'error' : ''}`}
                          value={form.socialLinks.instagram}
                          onChange={handleChange}
                          placeholder="https://instagram.com/yourprofile"
                        />
                        {formErrors.social_instagram && <span className="error-text">{formErrors.social_instagram}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">LinkedIn</label>
                        <input
                          type="text"
                          name="social.linkedin"
                          className={`form-input ${formErrors.social_linkedin ? 'error' : ''}`}
                          value={form.socialLinks.linkedin}
                          onChange={handleChange}
                          placeholder="https://linkedin.com/company/yourcompany"
                        />
                        {formErrors.social_linkedin && <span className="error-text">{formErrors.social_linkedin}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">YouTube</label>
                        <input
                          type="text"
                          name="social.youtube"
                          className={`form-input ${formErrors.social_youtube ? 'error' : ''}`}
                          value={form.socialLinks.youtube}
                          onChange={handleChange}
                          placeholder="https://youtube.com/yourchannel"
                        />
                        {formErrors.social_youtube && <span className="error-text">{formErrors.social_youtube}</span>}
                      </div>
                    </div>

                    <div className="form-group full">
                      <label className="form-label">Website</label>
                      <input
                        type="text"
                        name="social.website"
                        className={`form-input ${formErrors.social_website ? 'error' : ''}`}
                        value={form.socialLinks.website}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                      />
                      {formErrors.social_website && <span className="error-text">{formErrors.social_website}</span>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => window.history.back()}
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="btn-spinner"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Change Password</h2>
                  <p className="card-sub">Update your login password securely</p>
                </div>

                <form className="form" onSubmit={changePassword}>
                  <div className="form-group full">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-input"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        className="form-input"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="At least 6 characters"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-input"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="password-requirements">
                    <p><strong>Password Requirements:</strong></p>
                    <ul>
                      <li>At least 6 characters long</li>
                      <li>Include letters and numbers</li>
                      <li>Use special characters for stronger security</li>
                    </ul>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setActiveTab("company")}
                    >
                      ← Back to Profile
                    </button>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <>
                          <div className="btn-spinner"></div>
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Company Profile Preview</h2>
                  <p className="card-sub">
                    This is how your company details will appear in invoices and documents.
                  </p>
                </div>

                <div className="preview-box">
                  {/* Header */}
                  <div className="preview-header">
                    <div className="preview-logo">
                      {logoPreview || company?.logoUrl ? (
                        <img
                          src={logoPreview || company?.logoUrl}
                          alt="Company Logo"
                        />
                      ) : (
                        <div className="preview-logo-placeholder">
                          <i>🏢</i>
                          <span>Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="preview-company-info">
                      <h2>{form.name || "Your Company Name"}</h2>
                      <p className="preview-email">📧 {form.email || "email@company.com"}</p>
                      {form.phone && <p className="preview-phone">📞 {form.phone}</p>}
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="preview-section">
                    <h3 className="section-title">Business Details</h3>
                    <div className="preview-grid">
                      {form.gstNumber && (
                        <div className="preview-item">
                          <span className="preview-label">GST Number:</span>
                          <strong>{form.gstNumber}</strong>
                        </div>
                      )}
                      {(form.state || form.stateCode) && (
                        <div className="preview-item">
                          <span className="preview-label">State:</span>
                          <strong>
                            {form.state}
                            {form.stateCode && ` (${form.stateCode})`}
                          </strong>
                        </div>
                      )}
                      {form.address && (
                        <div className="preview-item preview-full">
                          <span className="preview-label">Address:</span>
                          <strong>{form.address}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  {(form.bankName || form.bankAccount || form.ifsc) && (
                    <div className="preview-section">
                      <h3 className="section-title">Bank Information</h3>
                      <div className="preview-grid">
                        {form.bankName && (
                          <div className="preview-item">
                            <span className="preview-label">Bank Name:</span>
                            <strong>{form.bankName}</strong>
                          </div>
                        )}
                        {form.bankAccount && (
                          <div className="preview-item">
                            <span className="preview-label">Account Number:</span>
                            <strong>{form.bankAccount}</strong>
                          </div>
                        )}
                        {form.ifsc && (
                          <div className="preview-item">
                            <span className="preview-label">IFSC Code:</span>
                            <strong>{form.ifsc}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* About */}
                  {form.about && (
                    <div className="preview-section">
                      <h3 className="section-title">About Company</h3>
                      <p className="preview-about">{form.about}</p>
                    </div>
                  )}

                  {/* Signature */}
                  <div className="preview-section">
                    <h3 className="section-title">Authorized Signature</h3>
                    <div className="preview-signature">
                      {signPreview || company?.signatureUrl ? (
                        <img
                          src={signPreview || company?.signatureUrl}
                          alt="Authorized Signature"
                        />
                      ) : (
                        <div className="preview-sign-placeholder">
                          <i>✍️</i>
                          <span>No Signature Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  {(form.socialLinks.facebook || form.socialLinks.instagram || 
                    form.socialLinks.linkedin || form.socialLinks.youtube || 
                    form.socialLinks.website) && (
                    <div className="preview-section">
                      <h3 className="section-title">Connect With Us</h3>
                      <div className="preview-social-grid">
                        {form.socialLinks.facebook && (
                          <a href={form.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="preview-social-item">
                            <i>📘</i> Facebook
                          </a>
                        )}
                        {form.socialLinks.instagram && (
                          <a href={form.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="preview-social-item">
                            <i>📷</i> Instagram
                          </a>
                        )}
                        {form.socialLinks.linkedin && (
                          <a href={form.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-item">
                            <i>💼</i> LinkedIn
                          </a>
                        )}
                        {form.socialLinks.youtube && (
                          <a href={form.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="preview-social-item">
                            <i>▶️</i> YouTube
                          </a>
                        )}
                        {form.socialLinks.website && (
                          <a href={form.socialLinks.website} target="_blank" rel="noopener noreferrer" className="preview-social-item">
                            <i>🌐</i> Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Settings;