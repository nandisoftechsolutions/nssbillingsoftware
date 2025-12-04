// src/pages/MainAdmin/Register.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./Register.css";
import nandiLogo from "../../assets/nandibillinglogo.png";
import { Helmet } from "react-helmet";

function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    businessType: "Retail",
    industryType: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // Load Razorpay once
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }
  }, []);

  // Load plans
  const loadPlans = async () => {
    try {
      const res = await api.get("/admin/plans/public");
      const list = res.data?.data || [];

      const normalized = list.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        icon: p.icon || "📦",
        isFreeTrial: p.isFreeTrial,
        finalPrice: p.yearlyPrice || p.monthlyPrice || 0,
      }));

      setPlans(normalized);

      const freePlan = normalized.find((p) => p.isFreeTrial);
      setSelectedPlan(freePlan);
    } catch {
      setError("Failed to load plans.");
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Form changes
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // Validation
  const validate = () => {
    if (!form.companyName.trim()) return "Company name is required";
    if (!form.ownerName.trim()) return "Owner name is required";
    if (!form.businessType) return "Business type is required";
    if (!form.industryType.trim()) return "Industry type is required";

    if (!form.phone.trim()) return "Phone number is required";
    if (!/^[6-9]\d{9}$/.test(form.phone))
      return "Enter a valid 10-digit phone number";

    if (!form.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email))
      return "Enter a valid email address";

    if (!form.password.trim())
      return "Password is required";
    if (form.password.length < 6)
      return "Password must be at least 6 characters";

    if (form.password !== form.confirmPassword)
      return "Passwords do not match";

    if (!form.acceptTerms)
      return "Please accept Terms & Conditions";

    if (!selectedPlan)
      return "Please select a plan";

    return null;
  };

  // Main submit
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);

    try {
      // Check existing user
      const chk = await api.post("/auth/check-existing", {
        email: form.email,
        phone: form.phone,
      });

      if (chk.data.exists) {
        setError("User already registered. Please login.");
        setLoading(false);
        return;
      }

      // If trial → ₹1 transaction
      if (selectedPlan.isFreeTrial) {
        const orderRes = await api.post("/subscription/create-order", {
          amount: 1,
          planId: selectedPlan._id,
          planName: selectedPlan.name,
          isTrial: true,
        });

        const order = orderRes.data.order;
        if (!order?.id) throw new Error("Order creation failed");

        const razorOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: "INR",
          name: "Nandi Billing Software",
          description: "Free Trial Activation",
          order_id: order.id,
          handler: async (response) => {
            try {
              const verify = await api.post("/subscription/verify-payment", {
                ...response,
                ...form,
                planId: selectedPlan._id,
                isTrialVerification: true,
                trialDays: 7,
              });

              if (!verify.data.success) {
                setError("Trial activation failed");
                return;
              }

              localStorage.setItem("token", verify.data.token);
              navigate("/dashboard");
            } catch {
              setError("Verification failed");
            }
          },
        };

        new window.Razorpay(razorOptions).open();
        return;
      }

      // Paid plan
      const paid = await api.post("/subscription/create-order", {
        amount: selectedPlan.finalPrice,
        planId: selectedPlan._id,
        planName: selectedPlan.name,
      });

      const order = paid.data.order;
      if (!order?.id) throw new Error("Order creation failed");

      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Nandi Billing Software",
        description: selectedPlan.name,
        order_id: order.id,
        handler: async (resPay) => {
          const verify = await api.post("/subscription/verify-payment", {
            ...resPay,
            ...form,
            planId: selectedPlan._id,
            planPrice: selectedPlan.finalPrice,
          });

          if (!verify.data.success) {
            setError("Payment failed");
            return;
          }

          localStorage.setItem("token", verify.data.token);
          navigate("/dashboard");
        },
      }).open();
    } catch {
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register — Nandi Billing Software</title>
      </Helmet>

      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{
          background: "linear-gradient(135deg, #5b8df7 0%, #6c47ce 100%)",
          padding: "22px",
        }}
      >
        <div className="nandiReg-card shadow-lg">
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src={nandiLogo}
              width={110}
              className="shadow-sm rounded-3"
            />
            <h1 className="fw-bold text-dark mt-3 nandiReg-title">
              Register Your Business
            </h1>
            <p className="text-muted small">Join the Nandi family ❤️</p>
          </div>

          {/* Error */}
          {error && <div className="alert alert-danger text-center">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="row">
              {/* Company */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-control"
                  value={form.companyName}
                  onChange={handleChange}
                />
              </div>

              {/* Owner */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Owner Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  className="form-control"
                  value={form.ownerName}
                  onChange={handleChange}
                />
              </div>

              {/* Business Type */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Business Type *</label>
                <select
                  name="businessType"
                  className="form-select"
                  value={form.businessType}
                  onChange={handleChange}
                >
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>Service</option>
                  <option>Manufacturing</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Industry */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Industry Type *</label>
                <input
                  type="text"
                  name="industryType"
                  className="form-control"
                  placeholder="Grocery, Mobile, Hardware..."
                  value={form.industryType}
                  onChange={handleChange}
                />
              </div>

              {/* Phone */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Phone *</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirm Password */}
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Terms */}
              <div className="col-12 mb-3">
                <label className="fw-semibold">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    className="form-check-input me-2"
                    onChange={handleChange}
                  />
                  Accept Terms & Conditions
                </label>
              </div>
            </div>

            {/* Plan Selection */}
            <h4 className="fw-bold mt-4 nandiReg-section-title">Choose Your Plan</h4>

            <div className="nandiReg-plan-grid">
              {plans.map((p) => (
                <div
                  key={p._id}
                  className={`nandiReg-plan-card ${
                    selectedPlan?._id === p._id ? "nandiReg-selected" : ""
                  }`}
                  onClick={() => setSelectedPlan(p)}
                >
                  <div className="nandiReg-plan-header">
                    <span className="nandiReg-plan-icon">{p.icon}</span>
                    <h5 className="mb-0">{p.name}</h5>
                  </div>

                  {p.isFreeTrial ? (
                    <p className="nandiReg-price-free">
                      7-Day Trial (₹1 verification)
                    </p>
                  ) : (
                    <p className="nandiReg-price">₹{p.finalPrice}</p>
                  )}

                  <small className="text-muted">{p.description}</small>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 mt-4 nandiReg-btn"
            >
              {loading
                ? "Processing..."
                : selectedPlan?.isFreeTrial
                ? "Start Free Trial"
                : `Pay ₹${selectedPlan?.finalPrice}`}
            </button>

            {/* Login CTA */}
            <p className="text-center mt-3 text-muted fw-semibold">
              Already have an account?{" "}
              <Link to="/login" className="text-primary">
                Login Here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default Register;
