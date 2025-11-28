import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./Upgrade.css";

function Upgrade() {
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [remainingDays, setRemainingDays] = useState(0);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen((p) => !p);

  const calculateRemainingDays = (expiresAt) => {
    if (!expiresAt) return 0;
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      if (isNaN(expiry.getTime())) return 0;
      const diff = expiry - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 0;
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError("Failed to load Razorpay");
    document.body.appendChild(script);
  }, []);

  // Load subscription & plans
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const sub = await api.get("/upgrade/subscription-details");
        if (sub.data?.success) {
          setSubscriptionDetails(sub.data.data);

          const exp =
            sub.data.data?.subscription?.expiresAt ||
            sub.data.data?.tenant?.expiresAt;

          setRemainingDays(calculateRemainingDays(exp));
        }

        const planRes = await api.get("/upgrade/plans");
        if (planRes.data?.success) {
          const list = planRes.data.data.map((p) => ({
            _id: p._id,
            name: p.name,
            yearlyPrice: Number(p.yearlyPrice || 0),
            monthlyPrice: Number(p.monthlyPrice || 0),
            popular: !!p.popular,
            description: p.description,
            features: Array.isArray(p.features)
              ? p.features.map((f) =>
                  typeof f === "string" ? { text: f, included: true } : f
                )
              : [],
          }));
          setPlans(list);
        }
      } catch (e) {
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize trial subscription
  const initializeSubscription = async () => {
    try {
      setInitializing(true);
      const res = await api.post("/upgrade/initialize-subscription");

      if (res.data?.success) {
        const sub = await api.get("/upgrade/subscription-details");
        if (sub.data?.success) {
          setSubscriptionDetails(sub.data.data);
          const exp = sub.data.data?.subscription?.expiresAt;
          setRemainingDays(calculateRemainingDays(exp));
        }
      }
    } catch {
      setError("Failed to initialize subscription");
    } finally {
      setInitializing(false);
    }
  };

  // Upgrade handler
  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan.name);
      setError("");

      const price = Number(plan.yearlyPrice);

      const email =
        subscriptionDetails?.company?.email ||
        JSON.parse(localStorage.getItem("user") || "{}").email ||
        "customer@example.com";

      // Option C — sending both readable + numeric duration
      const orderRes = await api.post("/upgrade/create-order", {
        amount: price,
        planId: plan._id,
        planName: plan.name,
        planDuration: "Yearly",
        numericDuration: 12,
        userEmail: email,
      });

      if (!orderRes.data?.success)
        throw new Error(orderRes.data?.message || "Order creation failed");

      openRazorpay(orderRes.data.data, plan, email);
    } catch (err) {
      setError(err?.message || "Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  // Razorpay open + verify
  const openRazorpay = (orderData, plan, email) => {
    if (!window.Razorpay) {
      setError("Payment window failed to load. Refresh the page.");
      return;
    }

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: "INR",
      name: "Nandi Billing Software",
      description: `${plan.name} - Yearly Plan`,
      order_id: orderData.orderId,

      prefill: {
        name: subscriptionDetails?.company?.name || "Customer",
        email: email,
        contact: subscriptionDetails?.company?.phone || "9999999999",
      },

      handler: async (response) => {
        try {
          setLoading(true);

          const verifyRes = await api.post("/upgrade/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,

            planId: plan._id,
            planName: plan.name,
            planPrice: plan.yearlyPrice,

            planDuration: "Yearly",
            numericDuration: 12,
            userEmail: email,
          });

          if (verifyRes.data?.success) {
            alert("Payment Successful!");
            window.location.reload();
          } else {
            setError("Payment verification failed");
          }
        } catch {
          setError("Failed to verify payment");
        } finally {
          setLoading(false);
        }
      },

      modal: {
        ondismiss: () => {
          setLoading(false);
          setSelectedPlan(null);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const currentSub = subscriptionDetails?.subscription;
  const currentPlan = currentSub?.planName || "Trial";
  const status = currentSub?.status || "trial";
  const isTrial = status === "trial";

  const expiresAt =
    currentSub?.expiresAt || subscriptionDetails?.tenant?.expiresAt;

  const getStatusDisplay = () => {
    if (isTrial) {
      if (remainingDays > 0)
        return `Trial - ${remainingDays} day${remainingDays !== 1 ? "s" : ""} left`;
      return "Trial Expired";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusBadgeClass = () => {
    if (isTrial) {
      if (remainingDays <= 0) return "status-badge status-trial-expired";
      if (remainingDays <= 3) return "status-badge status-trial-expiring";
      return "status-badge status-trial";
    }
    return `status-badge status-${status}`;
  };

  return (
    <div className="upgrade-wrapper">
      <Sidebar sidebarOpen={sidebarOpen} />

      <div className={`upgrade-content ${!sidebarOpen ? "expanded" : ""}`}>
        <div className="upgrade-topbar">
          <button onClick={toggleSidebar} className="upgrade-menu-btn">☰</button>
          <div className="upgrade-header-content">
            <h1 className="upgrade-title">Upgrade Subscription</h1>
            <p className="upgrade-subtitle">
              Choose the right plan for your business
            </p>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            <div className="error-message">{error}</div>
            <button onClick={() => setError("")} className="error-close">
              ×
            </button>
          </div>
        )}

        {/* Account Card */}
        <div className="account-card">
          <div className="account-card-header">
            <h3>Account Details</h3>
            <div className="status-indicator">
              <span className={getStatusBadgeClass()}>{getStatusDisplay()}</span>

              {isTrial && remainingDays > 0 && (
                <div className="trial-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min((remainingDays / 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="trial-days-text">
                    {remainingDays} of 30 days remaining
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="account-grid">
            <div className="account-item">
              <label>Company Name</label>
              <p>{subscriptionDetails?.company?.name}</p>
            </div>

            <div className="account-item">
              <label>Email</label>
              <p>{subscriptionDetails?.company?.email}</p>
            </div>

            <div className="account-item">
              <label>Current Plan</label>
              <p className="current-tag">{currentPlan}</p>
            </div>

            <div className="account-item">
              <label>Billing Cycle</label>
              <p>{isTrial ? "Trial Period" : "Yearly Billing"}</p>
            </div>

            {expiresAt && (
              <div className="account-item">
                <label>{isTrial ? "Trial Ends" : "Renews On"}</label>
                <p>{new Date(expiresAt).toDateString()}</p>
              </div>
            )}
          </div>

          {!currentSub && (
            <button
              onClick={initializeSubscription}
              disabled={initializing}
              className="initialize-btn"
            >
              {initializing ? "Initializing..." : "Initialize Subscription"}
            </button>
          )}
        </div>

        {/* Plans Section */}
        <div className="plans-section">
          <h2 className="section-title">Choose Your Plan</h2>

          {!razorpayLoaded && (
            <div className="payment-loading">
              <div className="payment-spinner"></div>
              <p>Loading payment system...</p>
            </div>
          )}

          <div className="plans-grid">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`plan-card ${plan.popular ? "popular" : ""} ${
                  currentPlan === plan.name ? "current-plan" : ""
                }`}
              >
                {plan.popular && <div className="popular-badge">MOST POPULAR</div>}
                {currentPlan === plan.name && (
                  <div className="current-badge">CURRENT PLAN</div>
                )}

                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <p className="plan-desc">{plan.description}</p>
                </div>

                <div className="price-box">
                  <h2>₹{plan.yearlyPrice}</h2>
                  <span>/year</span>
                </div>

                <ul className="feature-list">
                  {plan.features.map((f, i) => (
                    <li key={i} className={f.included ? "included" : "excluded"}>
                      {f.included ? "✓" : "✗"} {f.text}
                    </li>
                  ))}
                </ul>

                <button
                  className={`primary-btn ${
                    loading && selectedPlan === plan.name ? "loading" : ""
                  }`}
                  disabled={loading || !razorpayLoaded}
                  onClick={() => handleUpgrade(plan)}
                >
                  {loading && selectedPlan === plan.name
                    ? "Processing..."
                    : "Upgrade Now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upgrade;
