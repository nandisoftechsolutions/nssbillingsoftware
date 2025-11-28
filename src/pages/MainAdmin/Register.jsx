// frontend/src/pages/MainAdmin/Register.jsx
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
  const url = "https://nssbillingsoftware.vercel.app/register";
  const title = "Register — Nandi Billing Software";
  const desc = "Create your Nandi Billing Software account. Get started with GST-compliant billing, inventory and sales tracking.";


  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    email: "",
    password: "",
  });

  /* ---------------------------------------------------------
     Load Razorpay script
  --------------------------------------------------------- */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  /* ---------------------------------------------------------
     Load Plans — public route
  --------------------------------------------------------- */
  const loadPlans = async () => {
    try {
      const response = await api.get("/admin/plans");

      let plansData = [];

      if (response.data?.success) {
        plansData = response.data.data;
      } else if (Array.isArray(response.data)) {
        plansData = response.data;
      } else if (response.data?.plans) {
        plansData = response.data.plans;
      }

      const normalized = plansData.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description || `${p.name} Plan`,
        monthlyPrice: p.monthlyPrice || 0,
        yearlyPrice: p.yearlyPrice || 0,
        isFreeTrial: p.isFreeTrial || false,
        finalPrice: p.yearlyPrice || p.monthlyPrice || 0,
        features: p.features || [],
        icon: p.icon,
        popular: p.popular || false,
      }));

      setPlans(normalized);

      // Auto-select free trial
      const free = normalized.find((p) => p.isFreeTrial);
      if (free) setSelectedPlan(free);
    } catch (err) {
      setError("Failed to load plans");
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  /* ---------------------------------------------------------
     Handle form input
  --------------------------------------------------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ============================================================
     REGISTER (Free trial + Payment)
  ============================================================ */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedPlan) {
      setError("Please select a plan!");
      return;
    }

    if (!form.companyName || !form.phone || !form.email || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ Check if already exists */
      const check = await api.post("/auth/check-existing", {
        email: form.email,
        phone: form.phone,
      });

      if (check.data.exists) {
        setError("Business already registered. Please login.");
        setLoading(false);
        return;
      }

      /* 2️⃣ FREE TRIAL (NO PAYMENT) */
      if (selectedPlan.isFreeTrial || selectedPlan.finalPrice === 0) {
        const res = await api.post("/subscription/free-trial", {
          ...form,
        });

        if (!res.data.success) {
          setError(res.data.message || "Free Trial failed");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("tenantId", res.data.tenantId);
        localStorage.setItem("companyId", res.data.company.id);
        localStorage.setItem("companyName", res.data.company.name);

        alert("🎉 Free Trial Activated!");
        navigate("/dashboard");
        return;
      }

      /* 3️⃣ PAID REGISTRATION */
      if (!window.Razorpay) {
        setError("Payment system not loaded");
        setLoading(false);
        return;
      }

      const orderRes = await api.post("/subscription/create-order", {
        amount: selectedPlan.finalPrice,  // FIXED — backend converts to paise
        planName: selectedPlan.name,
        planId: selectedPlan._id,
      });

      if (!orderRes.data?.order?.id) {
        throw new Error("Order creation failed");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.data.order.amount,
        currency: "INR",
        name: "Nandi Billing Software",
        description: `${selectedPlan.name} - Registration`,
        order_id: orderRes.data.order.id,

        handler: async (response) => {
          try {
            const verify = await api.post("/subscription/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,

              ...form,
              planName: selectedPlan.name,
              planId: selectedPlan._id,
              planPrice: selectedPlan.finalPrice,
            });

            if (!verify.data.success) {
              setError("Payment verification failed.");
              return;
            }

            localStorage.setItem("token", verify.data.token);
            localStorage.setItem("tenantId", verify.data.tenantId);
            localStorage.setItem("companyId", verify.data.company.id);
            localStorage.setItem("companyName", verify.data.company.name);

            alert("🎉 Registration Successful!");
            navigate("/dashboard");
          } catch (err) {
            console.error(err);
            setError("Payment verification failed.");
          }
        },

        prefill: {
          name: form.companyName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#ff6600" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     Button Text
  --------------------------------------------------------- */
  const getButtonText = () => {
    if (loading) return "Processing...";
    if (!selectedPlan) return "Select a Plan";

    if (selectedPlan.isFreeTrial || selectedPlan.finalPrice === 0)
      return "Start Free Trial";

    return `Pay ₹${selectedPlan.finalPrice} & Register`;
  };

  return (
    <>
    <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={url} />
      </Helmet>
    
    <div className="nandiReg-wrapper">
      <div className="nandiReg-card">
        <div className="nandiReg-header">
          <img src={nandiLogo} width={120} height={120} alt="Nandi Logo" />
          <h2 className="nandiReg-title">Register Your Business</h2>
          <p className="nandiReg-subtitle">Join Nandi Billing Software</p>
        </div>

        {error && <div className="nandiReg-error">{error}</div>}

        <form onSubmit={handleRegister}>
          {/* Inputs */}
          <div className="nandiReg-input-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="nandiReg-input-group">
            <label>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="nandiReg-input-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="nandiReg-input-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          {/* Plans */}
          <div className="nandiReg-plans-section">
            <h5 className="nandiReg-section-title">Choose Your Plan</h5>

            {plans.length === 0 ? (
              <div className="nandiReg-loading">Loading plans...</div>
            ) : (
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
                      <span className="nandiReg-plan-icon">{p.icon || "📦"}</span>
                      <h4>{p.name}</h4>
                    </div>

                    <div className="nandiReg-price-section">
                      {p.isFreeTrial ? (
                        <h3 className="nandiReg-price-free">FREE</h3>
                      ) : (
                        <h3 className="nandiReg-price">₹{p.finalPrice}</h3>
                      )}
                      <p className="nandiReg-billing">per year</p>
                    </div>

                    <p className="nandiReg-desc">{p.description}</p>

                    {selectedPlan?._id === p._id && (
                      <div className="nandiReg-selected-badge">Selected</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="nandiReg-btn" disabled={loading || !selectedPlan}>
            {getButtonText()}
          </button>

          <p className="nandiReg-login-text">
            Already have an account?{" "}
            <Link className="nandiReg-login-link" to="/login">
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
