// frontend/src/pages/RenewPlan.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../utils/api";

function RenewPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [suspendedInfo, setSuspendedInfo] = useState(null);
  const [expiredInfo, setExpiredInfo] = useState(null);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ---------------------------------------------------
  // 1️⃣ Load Razorpay script
  // ---------------------------------------------------
  useEffect(() => {
    const initializeRazorpay = async () => {
      try {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          return;
        }

        const loadRazorpay = () =>
          new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
              console.log("✅ Razorpay SDK loaded successfully");
              setRazorpayLoaded(true);
              resolve(true);
            };
            script.onerror = () => {
              console.error("❌ Failed to load Razorpay SDK");
              setRazorpayLoaded(false);
              resolve(false);
            };
            document.body.appendChild(script);
          });

        await loadRazorpay();
      } catch (err) {
        console.error("Razorpay initialization error:", err);
        setError(
          "Payment system initialization failed. Please refresh the page."
        );
        setRazorpayLoaded(false);
      }
    };

    initializeRazorpay();
  }, []);

  // ---------------------------------------------------
  // 2️⃣ Init page: read suspended/expired info + email + plans
  // ---------------------------------------------------
  useEffect(() => {
    const initializePage = async () => {
      try {
        let resolvedEmail = "";

        // 1) From sessionStorage
        const storedSuspendedInfo = sessionStorage.getItem("suspendedInfo");
        const storedExpiredInfo = sessionStorage.getItem("expiredInfo");
        const storedUserEmail = sessionStorage.getItem("userEmail");

        console.log("🔍 Checking stored data:", {
          storedSuspendedInfo: !!storedSuspendedInfo,
          storedExpiredInfo: !!storedExpiredInfo,
          storedUserEmail,
        });

        if (storedSuspendedInfo) {
          setSuspendedInfo(JSON.parse(storedSuspendedInfo));
        }
        if (storedExpiredInfo) {
          setExpiredInfo(JSON.parse(storedExpiredInfo));
        }
        if (storedUserEmail) {
          resolvedEmail = storedUserEmail;
        }

        // 2) From navigation state (coming from /login redirect)
        if (location.state?.from === "login") {
          if (location.state.stoppedInfo) {
            setSuspendedInfo(location.state.stoppedInfo);
          }
          if (location.state.expiredInfo) {
            setExpiredInfo(location.state.expiredInfo);
          }
          if (location.state.userEmail) {
            resolvedEmail = location.state.userEmail;
          }
        }

        // 3) From localStorage fallback
        if (!resolvedEmail) {
          const savedEmail = localStorage.getItem("userEmail");
          if (savedEmail) {
            resolvedEmail = savedEmail;
          }
        }

        if (resolvedEmail) {
          setUserEmail(resolvedEmail);
          await fetchUserDetails(resolvedEmail);
        } else {
          setError(
            "Unable to identify your account. Please enter your email address below."
          );
        }

        // Always load plans
        await fetchPlans();
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load renewal page. Please try again.");
        setLoading(false);
      }
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ---------------------------------------------------
  // 3️⃣ Fetch user details by email (for header display)
  // ---------------------------------------------------
  const fetchUserDetails = async (email) => {
    try {
      // If you later build a real endpoint: /auth/find-user-by-email
      // you can call it here. For now, we derive basic info.
      const userDetails = {
        email,
        name: email.split("@")[0],
        company: email.split("@")[0] + " Company",
      };
      setUserDetails(userDetails);
    } catch (err) {
      console.error("Error fetching user details:", err);
      const basicDetails = {
        email,
        name: email.split("@")[0],
        company: "Your Company",
      };
      setUserDetails(basicDetails);
    }
  };

  // ---------------------------------------------------
  // 4️⃣ Fetch plans from API (with demo fallback)
  // ---------------------------------------------------
  const fetchPlans = async () => {
  try {
    // 🔥 Use public upgrade plans API (NO AUTH required)
    const response = await api.get("/upgrade/plans");

    console.log("📦 Raw plans API response:", response.data);

    let plansData = [];

    if (response.data && Array.isArray(response.data.data)) {
      plansData = response.data.data;
    } else if (Array.isArray(response.data)) {
      plansData = response.data;
    } else {
      throw new Error("Invalid plans data received");
    }

    const normalized = plansData.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description || `${p.name} Plan`,
      yearlyPrice: Number(p.yearlyPrice) || 0,
      monthlyPrice: Number(p.monthlyPrice) || 0,
      price: Number(p.yearlyPrice) || Number(p.price) || 0,
      features: p.features || [],
    }));

    setPlans(normalized);
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    setError("Failed to load plans. Showing sample plans.");
    setPlans(getDemoPlans());
  } finally {
    setLoading(false);
  }
};


    // Normalize plan prices for safety
   



  // Demo plans fallback
  const getDemoPlans = () => [
    {
      _id: "1",
      name: "Basic",
      description: "Perfect for small businesses",
      yearlyPrice: 4999,
      monthlyPrice: 499,
      features: [
        "Up to 100 invoices/month",
        "Basic reporting",
        "Email support",
      ],
    },
    {
      _id: "2",
      name: "Professional",
      description: "Ideal for growing businesses",
      yearlyPrice: 9999,
      monthlyPrice: 999,
      features: [
        "Unlimited invoices",
        "Advanced reporting",
        "Priority support",
        "Multi-user access",
      ],
    },
    {
      _id: "3",
      name: "Enterprise",
      description: "For large organizations",
      yearlyPrice: 19999,
      monthlyPrice: 1999,
      features: [
        "Unlimited everything",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom features",
      ],
    },
  ];

  // Helper for feature text
  const getFeatureText = (feature) => {
    if (typeof feature === "string") return feature;
    if (typeof feature === "object" && feature !== null) {
      return (
        feature.text ||
        feature.name ||
        feature.description ||
        JSON.stringify(feature)
      );
    }
    return String(feature);
  };

  // ---------------------------------------------------
  // 5️⃣ Razorpay Checkout
  // ---------------------------------------------------
  const openRazorpayCheckout = (order, plan) => {
    if (!window.Razorpay) {
      alert("Payment SDK not loaded. Please refresh the page.");
      setPaying(false);
      setSelectedPlan(null);
      return;
    }

    const razorpayKeyToUse = order.keyId;

    if (!razorpayKeyToUse) {
      alert("Payment configuration error. Please contact support.");
      setPaying(false);
      setSelectedPlan(null);
      return;
    }

    const options = {
      key: razorpayKeyToUse,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "Nandi Billing Software",
      description: `${plan.name} Plan Renewal`,
      order_id: order.id,
      prefill: {
        name: userDetails?.name || userEmail?.split("@")[0] || "Customer",
        email: userEmail || "customer@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#667eea",
      },
      handler: async function (response) {
        try {
          setPaying(true);
          console.log("💰 Payment successful, verifying...", response);

          // Verify payment with backend
          const verifyResponse = await api.post("/renewal/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: plan._id,
            planName: plan.name,
            planPrice: plan.yearlyPrice || plan.price,
            planDuration: "Yearly",
            userEmail: userEmail,
          });

          console.log("✅ Verification response:", verifyResponse.data);

          if (verifyResponse.data.success) {
            alert(
              "✅ Payment successful! Your account has been renewed. You can now login."
            );

            // Clear ALL stored data completely
            sessionStorage.clear();
            localStorage.removeItem("suspendedInfo");
            localStorage.removeItem("expiredInfo");
            localStorage.removeItem("userEmail");

            console.log("🧹 Cleared all stored session data");

            setTimeout(() => {
              navigate("/login", {
                state: {
                  renewalSuccess: true,
                  message:
                    "Your account has been successfully renewed! Please login with your credentials.",
                },
              });
            }, 1000);
          } else {
            alert(
              `Payment verification failed: ${verifyResponse.data.message}`
            );
          }
        } catch (err) {
          console.error("Payment verification error:", err);
          const errorMsg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Payment verification failed. If amount was deducted, please contact support with your payment ID.";
          alert(`Verification Error: ${errorMsg}`);
        } finally {
          setPaying(false);
          setSelectedPlan(null);
        }
      },
      modal: {
        ondismiss: function () {
          console.log("Payment modal dismissed");
          if (!paying) {
            setSelectedPlan(null);
          }
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay initialization error:", err);
      alert("Failed to initialize payment. Please try again.");
      setPaying(false);
      setSelectedPlan(null);
    }
  };

  // ---------------------------------------------------
  // 6️⃣ Handle Plan Renewal click
  // ---------------------------------------------------
  const handleRenew = async (plan) => {
    try {
      if (!userEmail) {
        setError("Please enter your email address to proceed with renewal.");
        return;
      }

      if (!razorpayLoaded) {
        setError(
          "Payment system is still loading. Please wait a moment and try again."
        );
        return;
      }

      setPaying(true);
      setSelectedPlan(plan.name);
      setError("");

      const amount = plan.yearlyPrice || plan.price;
      if (!amount || amount === 0) {
        alert("Invalid plan price. Please contact support.");
        setPaying(false);
        setSelectedPlan(null);
        return;
      }

      console.log("🔄 Creating order for plan:", plan.name, "Amount:", amount);

      const orderResponse = await api.post("/renewal/create-order", {
        amount: amount,
        planName: plan.name,
        planDuration: "Yearly",
        userEmail: userEmail,
      });

      console.log("📦 Order response:", orderResponse.data);

      if (orderResponse.data.success && orderResponse.data.order) {
        console.log(
          "✅ Order created successfully:",
          orderResponse.data.order.id
        );
        openRazorpayCheckout(orderResponse.data.order, plan);
      } else {
        throw new Error(
          orderResponse.data.message || "Failed to create payment order"
        );
      }
    } catch (err) {
      console.error("Renewal error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to process renewal. Please try again or contact support.";
      setError(errorMessage);
      setPaying(false);
      setSelectedPlan(null);
    }
  };

  // Manual payment fallback
  const handleManualPayment = (plan) => {
    const amount = (plan.yearlyPrice || plan.price || 0).toLocaleString(
      "en-IN"
    );
    const message = `To manually renew your ${plan.name} plan (₹${amount}/year), please contact support at support@nandisoftech.com with your account email: ${
      userEmail || "your email"
    }`;
    alert(message);
  };

  // Email input
  const handleEmailInput = (e) => {
    setUserEmail(e.target.value);
    setError("");
  };

  // Confirm email & fetch details
  const confirmEmail = async () => {
    if (userEmail) {
      setError("");
      await fetchUserDetails(userEmail);
      sessionStorage.setItem("userEmail", userEmail);
    } else {
      setError("Please enter your email address");
    }
  };

  // ---------------------------------------------------
  // 7️⃣ Render
  // ---------------------------------------------------
  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-secondary">Loading renewal details...</p>
      </div>
    );
  }

  return (
    <div
      className="py-5"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">🔄 Renew Your Plan</h2>
            <p className="text-muted mb-0">
              {userDetails ? (
                <>
                  Account: <strong>{userDetails.email}</strong>
                  {userDetails.name && ` (${userDetails.name})`}
                </>
              ) : userEmail ? (
                <>
                  Account: <strong>{userEmail}</strong>
                </>
              ) : (
                "Account renewal required"
              )}
              {suspendedInfo
                ? " - Your account has been suspended."
                : " - Your subscription has expired."}
            </p>
          </div>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/login")}
          >
            <i className="bi bi-arrow-left me-2"></i>Back to Login
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="row mb-4">
            <div className="col-lg-8 mx-auto">
              <div className="alert alert-danger border-0 rounded-3 text-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Razorpay loading status */}
        {!razorpayLoaded && (
          <div className="row mb-4">
            <div className="col-lg-8 mx-auto">
              <div className="alert alert-warning border-0 rounded-3 text-center">
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></div>
                Loading payment system... Please wait
              </div>
            </div>
          </div>
        )}

        {/* Email Input if missing */}
        {!userEmail && (
          <div className="row mb-4">
            <div className="col-lg-6 mx-auto">
              <div className="card border-0 rounded-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-3">
                    Enter Your Email Address
                  </h5>
                  <p className="text-muted small mb-3">
                    Please enter the email address associated with your account
                    to proceed with renewal.
                  </p>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      value={userEmail}
                      onChange={handleEmailInput}
                      placeholder="Enter your email address"
                    />
                  </div>
                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={confirmEmail}
                  >
                    <i className="bi bi-check-circle me-2"></i>Confirm Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status card */}
        <div className="row mb-4">
          <div className="col-lg-8 mx-auto">
            <div
              className={`card shadow-lg border-0 rounded-4 overflow-hidden ${
                suspendedInfo ? "border-danger" : "border-warning"
              }`}
            >
              <div className="card-body p-4 text-center">
                <div className="mb-3">
                  {suspendedInfo ? (
                    <i className="bi bi-shield-exclamation fs-1 text-danger"></i>
                  ) : (
                    <i className="bi bi-calendar-x fs-1 text-warning"></i>
                  )}
                </div>
                <h5
                  className={`fw-bold mb-2 ${
                    suspendedInfo ? "text-danger" : "text-dark"
                  }`}
                >
                  {suspendedInfo ? "Account Suspended" : "Subscription Expired"}
                </h5>
                <p className="mb-3">
                  {suspendedInfo
                    ? suspendedInfo.message
                    : expiredInfo?.message || "Your subscription period has ended."}
                </p>

                {expiredInfo?.expiredOn && (
                  <p className="small mb-2">
                    Expired On:{" "}
                    <strong>
                      {new Date(
                        expiredInfo.expiredOn
                      ).toLocaleDateString()}
                    </strong>
                  </p>
                )}

                {expiredInfo?.planName && (
                  <p className="small mb-2">
                    Previous Plan: <strong>{expiredInfo.planName}</strong>
                  </p>
                )}

                {suspendedInfo?.contactEmail && (
                  <p className="small mb-3">
                    Contact Support:{" "}
                    <a
                      href={`mailto:${suspendedInfo.contactEmail}`}
                      className="text-decoration-none"
                    >
                      {suspendedInfo.contactEmail}
                    </a>
                  </p>
                )}

                <div className="alert alert-info border-0 mt-3">
                  <small>
                    💡 <strong>Note:</strong> You need to renew your subscription
                    to restore access to all features. For immediate assistance,
                    contact our support team.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans list (only when email is known) */}
        {userEmail && (
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <h4 className="fw-bold text-dark mb-0">
                📦 Choose a Renewal Plan
              </h4>
              <span className="text-muted small">
                All plans include secure cloud backup, multi-user access and
                priority support.
              </span>
            </div>

            <div className="row">
              {plans.length > 0 ? (
                plans.map((plan, index) => (
                  <div className="col-md-4 mb-4" key={plan._id || index}>
                    <div
                      className={`card shadow-sm border-0 rounded-4 h-100 plan-card ${
                        selectedPlan === plan.name
                          ? "border-primary border-2"
                          : ""
                      }`}
                    >
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="fw-bold mb-0 text-dark">
                            {plan.name}
                          </h5>
                          {index === 1 && (
                            <span className="badge bg-success">Popular</span>
                          )}
                        </div>

                        <p className="text-muted small flex-grow-1">
                          {plan.description ||
                            "Comprehensive billing solution"}
                        </p>

                        <div className="mb-3">
                          <div className="fw-bold fs-5 text-primary">
                            ₹{" "}
                            {(
                              plan.yearlyPrice ||
                              plan.price ||
                              0
                            ).toLocaleString("en-IN")}{" "}
                            <span className="fs-6 text-muted">/ year</span>
                          </div>
                          {plan.monthlyPrice && (
                            <small className="text-muted">
                              ~ ₹{" "}
                              {plan.monthlyPrice.toLocaleString("en-IN")} /
                              month
                            </small>
                          )}
                        </div>

                        <ul className="list-unstyled small text-muted mb-3">
                          {(plan.features || [
                            "Secure Cloud Storage",
                            "Multi-user Access",
                            "Priority Support",
                            "Automatic Backups",
                          ]).map((feature, idx) => (
                            <li key={idx} className="mb-1">
                              <i className="bi bi-check-circle-fill text-success me-2"></i>
                              {getFeatureText(feature)}
                            </li>
                          ))}
                        </ul>

                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-primary w-100 fw-semibold py-2"
                            disabled={paying || !razorpayLoaded}
                            onClick={() => handleRenew(plan)}
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea, #764ba2)",
                              border: "none",
                            }}
                          >
                            {paying && selectedPlan === plan.name ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                ></span>
                                Processing...
                              </>
                            ) : !razorpayLoaded ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                ></span>
                                Loading Payment...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-credit-card me-2"></i>
                                Pay with Razorpay
                              </>
                            )}
                          </button>

                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleManualPayment(plan)}
                            disabled={paying}
                          >
                            <i className="bi bi-bank me-2"></i>
                            Manual Bank Transfer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info text-center">
                    <i className="bi bi-info-circle me-2"></i>
                    No plans available at the moment. Please contact support.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support section */}
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card border-0 rounded-4 bg-light">
              <div className="card-body text-center p-4">
                <h5 className="fw-bold text-dark mb-2">Need Immediate Help?</h5>
                <p className="text-muted mb-3">
                  Our support team is available to help you with renewal and
                  any other questions.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <a
                    href="mailto:support@nandisoftech.com"
                    className="btn btn-primary"
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Email Support
                  </a>
                  <a href="tel:+919876543210" className="btn btn-success">
                    <i className="bi bi-telephone me-2"></i>
                    Call Support
                  </a>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/login")}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Login
                  </button>
                </div>

                <div className="mt-4 p-3 bg-white rounded-3 border">
                  <h6 className="fw-bold text-dark mb-2">
                    💳 Secure Payment
                  </h6>
                  <p className="small text-muted mb-2">
                    All payments are processed securely through Razorpay. We
                    support:
                  </p>
                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-credit-card me-1"></i>Cards
                    </span>
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-bank me-1"></i>Net Banking
                    </span>
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-phone me-1"></i>UPI
                    </span>
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-wallet me-1"></i>Wallets
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect styles */}
      <style>{`
        .plan-card {
          transition: all 0.3s ease-in-out;
        }
        .plan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

export default RenewPlan;
