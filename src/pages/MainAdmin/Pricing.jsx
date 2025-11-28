import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import "./Pricing.css";

// ✅ Import the global API helper (Nandi Softech Standard)
import api from "../../utils/api";

function Pricing() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  // SEO Configuration for Pricing Page
  const seoConfig = {
    title: "Nandi Billing Pricing - Affordable GST Billing Plans for Indian Businesses",
    description: "Choose the perfect Nandi Billing plan. Start with 7-day free trial. Affordable monthly & yearly GST billing software plans for shops, retailers & SMEs in India.",
    keywords: "Nandi Billing pricing, GST software cost, billing software plans, affordable accounting software, SME business software pricing, free trial billing software",
    canonical: `${SITE_URL}/pricing`,
    ogImage: `${SITE_URL}/images/pricing-og-image.jpg`
  };

  // Structured Data for Pricing Page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Nandi Billing Software",
    "description": "GST billing and inventory management software for Indian small businesses",
    "url": SITE_URL,
    "brand": {
      "@type": "Brand",
      "name": "Nandi Softech Solutions"
    },
    "offers": {
      "@type": "AggregateOffer",
      "offerCount": "3",
      "lowPrice": "0",
      "highPrice": "2999",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    }
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

  /* ---------------------------------------------------------
      FETCH PLANS USING AXIOS + GLOBAL API HELPER
  ---------------------------------------------------------- */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log("🔄 Fetching plans from:", "/admin/plans");
        
        // Add timeout and better error handling
        const res = await api.get("/admin/plans", {
          timeout: 30000, // 30 second timeout for Render free tier
        });
        
        console.log("✅ Plans API Response:", res.data);
        
        // Handle different response formats - FIXED VERSION
        let plansData = [];
        
        if (res.data && res.data.success) {
          // Format: { success: true, data: [...], count: X }
          plansData = res.data.data || [];
        } else if (Array.isArray(res.data)) {
          // Format: [...]
          plansData = res.data;
        } else if (res.data && Array.isArray(res.data.plans)) {
          // Format: { plans: [...] }
          plansData = res.data.plans;
        } else if (res.data && Array.isArray(res.data.data)) {
          // Format: { data: [...] }
          plansData = res.data.data;
        } else {
          console.warn("⚠️ Unexpected API response format:", res.data);
          plansData = [];
        }
        
        console.log(`✅ Processed ${plansData.length} plans`);
        setPlans(plansData);
        setError(null);
      } catch (err) {
        console.error("❌ Plans fetch error:", err);
        
        // Detailed error handling
        if (err.code === 'ECONNABORTED') {
          setError("Request timeout - server might be starting up. Please try again in 30 seconds.");
        } else if (err.response) {
          // Server responded with error status
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
        } else if (err.request) {
          // No response received
          setError("Cannot connect to server. Please check your internet connection.");
        } else {
          // Other errors
          setError(err.message || "Failed to load plans");
        }
        
        // Ensure plans is always an array even on error
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  /* ---------------------------------------------------------
      BUY HANDLER
  ---------------------------------------------------------- */
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

  /* ---------------------------------------------------------
      BILLING LOGIC
  ---------------------------------------------------------- */
  const toggleBilling = () =>
    setBillingType(billingType === "monthly" ? "yearly" : "monthly");

  const getDisplayPrice = (plan) => {
    if (plan.isFreeTrial) return "FREE";

    let price =
      billingType === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    // Handle undefined/null prices
    if (price === undefined || price === null) {
      return "0";
    }

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

  /* ---------------------------------------------------------
      LOADING SCREEN
  ---------------------------------------------------------- */
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
          <p className="nandiX-loading-note">This may take a moment on first load</p>
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
            aria-label="Retry loading pricing plans"
          >
            Retry
          </button>
          <p className="nandiX-error-help">
            If this continues, check if the backend is running at:<br/>
            <code>https://nandi-billing-backend.onrender.com</code>
          </p>
        </div>
      </>
    );

  // Safety check - ensure plans is always an array before rendering
  const safePlans = Array.isArray(plans) ? plans : [];
  
  // Check if there are paid plans for billing toggle
  const hasPaidPlans = safePlans.some(plan => !plan.isFreeTrial);

  // Generate structured data for plans
  const plansStructuredData = safePlans.map(plan => ({
    "@type": "Offer",
    "name": plan.name,
    "description": plan.description,
    "price": plan.isFreeTrial ? "0" : (plan.monthlyPrice || "0"),
    "priceCurrency": "INR",
    "eligibleRegion": {
      "@type": "Country",
      "name": "IN"
    },
    "seller": {
      "@type": "Organization",
      "name": "Nandi Softech Solutions"
    }
  }));

  return (
    <>
      {/* ========== REACT HELMET SEO ========== */}
      <Helmet>
        {/* === BASIC META TAGS === */}
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Nandi Softech Solutions" />
        
        {/* === CANONICAL URL === */}
        <link rel="canonical" href={seoConfig.canonical} />
        
        {/* === OPEN GRAPH TAGS === */}
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:url" content={seoConfig.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Nandi Billing Software" />
        <meta property="og:locale" content="en_IN" />
        
        {/* === TWITTER CARD TAGS === */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        <meta name="twitter:image" content={seoConfig.ogImage} />
        <meta name="twitter:site" content="@nandibilling" />
        
        {/* === ADDITIONAL SEO META TAGS === */}
        <meta name="language" content="English" />
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Bangalore, Karnataka" />
        
        {/* === STRUCTURED DATA (JSON-LD) === */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* === PRICING PLANS STRUCTURED DATA === */}
        {safePlans.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Nandi Billing Pricing Plans",
              "description": "Available pricing plans for Nandi Billing GST software",
              "numberOfItems": safePlans.length,
              "itemListElement": safePlans.map((plan, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": plan.name,
                  "description": plan.description,
                  "offers": {
                    "@type": "Offer",
                    "price": plan.isFreeTrial ? "0" : (plan.monthlyPrice || "0"),
                    "priceCurrency": "INR",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "billingIncrement": plan.isFreeTrial ? 7 : 1,
                      "unitCode": plan.isFreeTrial ? "DAY" : "MON",
                      "billingDuration": plan.isFreeTrial ? "P7D" : "P1M"
                    }
                  }
                }
              }))
            })}
          </script>
        )}
      </Helmet>

      {/* ========== PRICING PAGE CONTENT ========== */}
      <div className="nandiX-wrapper">

        {/* Header */}
        <header className="nandiX-header">
          <h1 className="nandiX-title">
            Pricing That <span className="nandiX-highlight">Grows With You</span>
          </h1>
          <p className="nandiX-subtitle">
            Start with a 7-day free trial. No credit card required. Perfect GST billing software for Indian shops and SMEs.
          </p>
        </header>

        {/* Trial Banner */}
        {daysLeft > 0 && (
          <div className="nandiX-trial-banner" role="alert" aria-live="polite">
            <p>
              Your trial ends in <strong>{daysLeft} days</strong>
            </p>
          </div>
        )}

        {/* Billing Toggle - Only show if there are paid plans */}
        {hasPaidPlans && (
          <div className="nandiX-toggle-box">
            <span className={billingType === "monthly" ? "active" : ""}>Monthly</span>

            <label className="nandiX-switch">
              <input
                type="checkbox"
                checked={billingType === "yearly"}
                onChange={toggleBilling}
                aria-label="Switch between monthly and yearly billing"
              />
              <span className="nandiX-slider"></span>
            </label>

            <span className={billingType === "yearly" ? "active" : ""}>
              Yearly <span className="nandiX-save">Save 20%</span>
            </span>
          </div>
        )}

        {/* Pricing Grid */}
        <section className="nandiX-grid" aria-label="Pricing plans">
          {safePlans.length === 0 ? (
            <div className="nandiX-no-plans">
              <div className="nandiX-no-plans-icon">📋</div>
              <h2>No Plans Available</h2>
              <p>Please check back later or contact support.</p>
            </div>
          ) : (
            safePlans.map((plan) => (
              <article
                className={`nandiX-card ${plan.popular ? "nandiX-popular" : ""}`}
                key={plan._id || plan.id}
                aria-labelledby={`plan-${plan._id || plan.id}-title`}
              >
                {plan.popular && (
                  <div className="nandiX-popular-tag" aria-label="Most popular plan">🔥 Most Popular</div>
                )}

                <h2 id={`plan-${plan._id || plan.id}-title`} className="nandiX-plan-name">
                  {plan.name || "Unnamed Plan"}
                </h2>
                <p className="nandiX-plan-description">{plan.description || "No description available"}</p>

                {/* Price Section */}
                <div className="nandiX-price-box">
                  {!plan.isFreeTrial && <span className="rupee" aria-label="Indian Rupees">₹</span>}
                  <span className="nandiX-price">{getDisplayPrice(plan)}</span>
                  <span className="nandiX-period">{getPeriodText(plan)}</span>
                </div>

                {/* Features */}
                <ul className="nandiX-features" aria-label="Plan features">
                  {Array.isArray(plan.features) ? (
                    plan.features.map((f, index) => (
                      <li
                        key={index}
                        className={f.included ? "included" : "not-included"}
                        aria-label={f.included ? `Included: ${f.text || "Feature"}` : `Not included: ${f.text || "Feature"}`}
                      >
                        {f.included ? "✓" : "✗"} {f.text || "Feature"}
                      </li>
                    ))
                  ) : (
                    <li className="included" aria-label="Basic features included">✓ Basic features included</li>
                  )}
                </ul>

                {/* Button */}
                <button
                  className="nandiX-btn"
                  onClick={() => handleBuy(plan)}
                  disabled={selectedPlan?._id === plan._id}
                  aria-label={`Choose ${plan.name} plan for ${getDisplayPrice(plan)}${getPeriodText(plan)}`}
                  aria-describedby={`plan-${plan._id || plan.id}-title`}
                >
                  {getButtonText(plan)}
                </button>

              </article>
            ))
          )}
        </section>

        {/* Additional Information */}
        <section className="nandiX-additional-info" aria-label="Additional pricing information">
          <div className="nandiX-info-grid">
            <div className="nandiX-info-card">
              <h3>💳 No Hidden Fees</h3>
              <p>Transparent pricing with no setup costs or hidden charges. Cancel anytime.</p>
            </div>
            <div className="nandiX-info-card">
              <h3>🛡️ Secure Payments</h3>
              <p>All payments processed securely through Razorpay with bank-level encryption.</p>
            </div>
            <div className="nandiX-info-card">
              <h3>📞 Priority Support</h3>
              <p>Get dedicated support with faster response times on paid plans.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="nandiX-faq-section" aria-label="Frequently asked questions about pricing">
          <h2>Pricing FAQ</h2>
          <div className="nandiX-faq-grid">
            <div className="nandiX-faq-item">
              <h4>Can I change plans later?</h4>
              <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="nandiX-faq-item">
              <h4>Is GST compliance included?</h4>
              <p>All plans include full GST compliance features - automatic tax calculation, HSN codes, and e-invoicing.</p>
            </div>
            <div className="nandiX-faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>We accept all major credit/debit cards, UPI, net banking, and popular wallets through Razorpay.</p>
            </div>
            <div className="nandiX-faq-item">
              <h4>Do you offer discounts for annual billing?</h4>
              <p>Yes! Save 20% when you choose annual billing instead of monthly payments.</p>
            </div>
          </div>
        </section>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', fontSize: '12px'}}>
            <strong>Debug Info:</strong> Loaded {safePlans.length} plans from backend
            <br />
            <small>Response format: {plans && typeof plans}</small>
          </div>
        )}
      </div>
    </>
  );
}

export default Pricing;