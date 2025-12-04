import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import "./Pricing.css";

// Global API Helper
import api from "../../utils/api";

function Pricing() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  const seoConfig = {
    title: "Nandi Billing Pricing - Affordable GST Billing Plans for Indian Businesses",
    description:
      "Choose the perfect Nandi Billing plan. Start with 7-day free trial. Affordable monthly & yearly GST billing software plans for shops, retailers & SMEs in India.",
    keywords:
      "Nandi Billing pricing, GST software cost, billing software plans, affordable accounting software, SME business software pricing, free trial billing software",
    canonical: `${SITE_URL}/pricing`,
    ogImage: `${SITE_URL}/images/pricing-og-image.jpg`,
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Nandi Billing Software",
    description:
      "GST billing and inventory management software for Indian small businesses",
    url: SITE_URL,
    brand: {
      "@type": "Brand",
      name: "Nandi Softech Solutions",
    },
    offers: {
      "@type": "AggregateOffer",
      offerCount: "3",
      lowPrice: "0",
      highPrice: "2999",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingType, setBillingType] = useState("monthly");

  // Demo trial end date
  const trialEnd = new Date("2025-11-27");
  const today = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24))
  );

  // ---------------------------------------------------------
  // FETCH PLANS - CORRECT PUBLIC ENDPOINT
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log("🔄 Fetching plans: GET /admin/plans/public");

        const res = await api.get("/admin/plans/public", {
          timeout: 30000,
        });

        console.log("🟢 Raw Plans Response:", res.data);

        let plansData = [];

        if (Array.isArray(res.data)) {
          plansData = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          plansData = res.data.data;
        } else if (res.data?.plans && Array.isArray(res.data.plans)) {
          plansData = res.data.plans;
        } else {
          console.warn("⚠️ Unexpected plans response format:", res.data);
          plansData = [];
        }

        console.log(`🟢 Processed ${plansData.length} plans`);
        setPlans(plansData);
      } catch (err) {
        console.error("❌ Plans API Error:", err);

        if (err.code === "ECONNABORTED") {
          setError(
            "⏳ Server timeout. If backend is waking up, retry in 30 seconds."
          );
        } else if (err.response) {
          setError(
            err.response.data?.message ||
              `Server Error (${err.response.status})`
          );
        } else if (err.request) {
          setError(
            "Cannot reach server. Ensure backend is running and accessible."
          );
        } else {
          setError(err.message || "Failed to load plans");
        }

        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // ---------------------------------------------------------
  // BUY HANDLER
  // ---------------------------------------------------------
  const handleBuy = async (plan) => {
    setSelectedPlan(plan);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (plan.isFreeTrial) {
        alert(`🎉 Your 7-day free trial for ${plan.name} has started!`);
      } else {
        alert(`🎉 Payment successful! Welcome to ${plan.name} plan!`);
      }
    } finally {
      setSelectedPlan(null);
    }
  };

  // ---------------------------------------------------------
  // BILLING LOGIC
  // ---------------------------------------------------------
  const toggleBilling = () =>
    setBillingType(billingType === "monthly" ? "yearly" : "monthly");

  const getDisplayPrice = (plan) => {
    if (plan.isFreeTrial) return "FREE";

    let price =
      billingType === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    if (price === undefined || price === null) return "0";

    return price.toLocaleString("en-IN");
  };

  const getPeriodText = (plan) =>
    plan.isFreeTrial
      ? "/7 days"
      : billingType === "yearly"
      ? "/year"
      : "/month";

  const getButtonText = (plan) =>
    selectedPlan?._id === plan._id
      ? plan.isFreeTrial
        ? "Starting Trial..."
        : "Processing..."
      : "Choose Plan";

  // ---------------------------------------------------------
  // UI STATES
  // ---------------------------------------------------------
  if (loading)
    return (
      <>
        <Helmet>
          <title>Loading Plans - Nandi Billing Pricing</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="nandiX-loading-container">
          <div className="nandiX-spinner"></div>
          <p>Loading plans...</p>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Helmet>
          <title>Error Loading Plans - Nandi Billing</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="nandiX-error-container">
          <div className="nandiX-error-msg">❌ {error}</div>
          <button
            className="nandiX-retry-btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </>
    );

  // ---------------------------------------------------------
  // SAFE PLAN ARRAY
  // ---------------------------------------------------------
  const safePlans = Array.isArray(plans) ? plans : [];
  const hasPaidPlans = safePlans.some((p) => !p.isFreeTrial);

  // ---------------------------------------------------------
  // RENDER PAGE
  // ---------------------------------------------------------
  return (
    <>
      <Helmet>
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Nandi Softech Solutions" />
        <link rel="canonical" href={seoConfig.canonical} />
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:url" content={seoConfig.canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="nandiX-wrapper">
        <header className="nandiX-header">
          <h1 className="nandiX-title">
            Pricing That <span className="nandiX-highlight">Grows With You</span>
          </h1>
          <p className="nandiX-subtitle">
            Start with a 7-day free trial. No credit card required.
          </p>
        </header>

        {daysLeft > 0 && (
          <div className="nandiX-trial-banner">
            Your trial ends in <strong>{daysLeft} days</strong>
          </div>
        )}

        {hasPaidPlans && (
          <div className="nandiX-toggle-box">
            <span className={billingType === "monthly" ? "active" : ""}>
              Monthly
            </span>

            <label className="nandiX-switch">
              <input
                type="checkbox"
                checked={billingType === "yearly"}
                onChange={toggleBilling}
              />
              <span className="nandiX-slider"></span>
            </label>

            <span className={billingType === "yearly" ? "active" : ""}>
              Yearly <span className="nandiX-save">Save 20%</span>
            </span>
          </div>
        )}

        <section className="nandiX-grid">
          {safePlans.length === 0 ? (
            <div className="nandiX-no-plans">
              <div className="nandiX-no-plans-icon">📋</div>
              <h2>No Plans Available</h2>
              <p>Please check back later.</p>
            </div>
          ) : (
            safePlans.map((plan) => (
              <article
                key={plan._id}
                className={`nandiX-card ${
                  plan.popular ? "nandiX-popular" : ""
                }`}
              >
                {plan.popular && (
                  <div className="nandiX-popular-tag">🔥 Most Popular</div>
                )}

                <h2 className="nandiX-plan-name">{plan.name}</h2>

                <p className="nandiX-plan-description">
                  {plan.description || "No description available"}
                </p>

                <div className="nandiX-price-box">
                  {!plan.isFreeTrial && <span className="rupee">₹</span>}
                  <span className="nandiX-price">{getDisplayPrice(plan)}</span>
                  <span className="nandiX-period">{getPeriodText(plan)}</span>
                </div>

                <ul className="nandiX-features">
                  {Array.isArray(plan.features) ? (
                    plan.features.map((f, i) => (
                      <li
                        key={i}
                        className={f.included ? "included" : "not-included"}
                      >
                        {f.included ? "✓" : "✗"} {f.text}
                      </li>
                    ))
                  ) : (
                    <li className="included">✓ Basic features included</li>
                  )}
                </ul>

                <button
                  className="nandiX-btn"
                  onClick={() => handleBuy(plan)}
                  disabled={selectedPlan?._id === plan._id}
                >
                  {getButtonText(plan)}
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </>
  );
}

export default Pricing;
