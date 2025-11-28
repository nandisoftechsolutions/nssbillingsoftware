// src/pages/MainAdmin/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./Landing.css";

// 🔹 Make sure these 3 files exist in: src/assets/
import heroImage from "../../assets/hero.png";
import mobileAppImage from "../../assets/mobile.png";
import featuresImage from "../../assets/features.png";

function Landing() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  // SEO Configuration
  const seoConfig = {
    title: "Nandi Billing Software – Best GST Billing Software for Small Businesses",
    description: "Create GST invoices in 8 seconds with India's fastest billing software. Free GST billing, inventory management, stock tracking & business reports for small businesses.",
    keywords: "GST billing software, billing software India, free GST billing app, invoice generator, inventory management, small business software, Nandi Billing, POS billing system, accounting software",
    canonical: SITE_URL,
    ogImage: `${SITE_URL}/images/og-image.jpg`
  };

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Nandi Billing Software",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, PWA, Android, iOS",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1400",
      "bestRating": "5"
    },
    "author": {
      "@type": "Organization",
      "name": "Nandi Softech Solutions",
      "url": SITE_URL
    },
    "description": "Super-fast GST billing, inventory management & business reporting software for small businesses in India."
  };

  const dynamicData = {
    hero: {
      title: "The Best <span>GST Billing Software</span> for Small Businesses",
      subtitle:
        "Create GST bills in <strong>8 seconds</strong>, increase stock rotation <strong>2.8× faster</strong> and collect <strong>97% payments on time.</strong>",
      trustedCount: "1 Crore +",
      youtubeChannel: "https://www.youtube.com/@NandiSoftechSolutions",
    },
    stats: [
      { number: "10,000+", label: "Happy Customers" },
      { number: "₹500Cr+", label: "Business Processed" },
      { number: "50,000+", label: "Invoices Generated" },
      { number: "99.9%", label: "Uptime Guarantee" },
    ],
    features: [
      {
        icon: "🧾",
        title: "GST-Compliant Invoices",
        text: "Generate accurate GST invoices instantly with automatic tax calculations.",
      },
      {
        icon: "📦",
        title: "Smart Inventory",
        text: "Track stock levels, manage suppliers, and automate purchase orders.",
      },
      {
        icon: "📊",
        title: "Business Reports",
        text: "Get real-time insights with profit & loss, sales, and expense reports.",
      },
      {
        icon: "🏢",
        title: "Multi-Business",
        text: "Manage multiple businesses or branches from a single dashboard.",
      },
      {
        icon: "💳",
        title: "Payment Tracking",
        text: "Automate payment reminders and track outstanding payments easily.",
      },
      {
        icon: "🔒",
        title: "Data Security",
        text: "Bank-level security with automatic backups and data encryption.",
      },
    ],
    showcase: {
      title: "Everything You Need to Grow Your Business",
      description:
        "From billing to inventory, accounting to reports — Nandi Billing has all the tools to help your business succeed.",
      features: [
        "One-click GST invoice generation",
        "Automatic inventory management",
        "Real-time business insights",
        "Mobile app for on-the-go access",
        "Multi-user collaboration",
        "Customer & vendor management",
      ],
    },
    pricing: {
      title: "Simple, Transparent Pricing",
      subtitle: "Start free. Upgrade when you're ready.",
      popularPlan: {
        name: "Professional Plan",
        price: "₹2,999",
        period: "/month",
        description: "Perfect for growing businesses with advanced needs.",
        features: [
          "Unlimited invoices & customers",
          "Advanced inventory management",
          "Priority support",
          "Multi-user access (up to 5)",
          "Custom branding",
          "API access",
        ],
      },
    },
    testimonials: [
      {
        name: "Rajesh Kumar",
        business: "Retail Store Owner",
        text: "Nandi Billing reduced my billing time by 80%. The GST features are incredibly accurate!",
        rating: 5,
      },
      {
        name: "Priya Sharma",
        business: "Wholesale Distributor",
        text: "Inventory management became so easy. I can now track stock levels in real-time.",
        rating: 5,
      },
      {
        name: "Amit Patel",
        business: "Service Provider",
        text: "The mobile app lets me create invoices anywhere. My business has never been more organized.",
        rating: 5,
      },
    ],
    mobileApp: {
      title: "Access Anywhere, Anytime — PWA Ready",
      description:
        "Nandi Billing works seamlessly as a Progressive Web App (PWA). Install it directly from your Chrome browser and use it like a native mobile app — no app store required!",
      features: [
        "Install directly from Chrome browser",
        "Works offline — create invoices without internet",
        "Fast loading — instant access to your data",
        "No app store downloads required",
        "Automatic updates",
        "Secure and reliable",
      ],
      installationSteps: [
        "Open Nandi Billing in Chrome browser",
        "Tap on 'Install App' or 'Add to Home Screen'",
        "Follow the prompt to install",
        "Launch like a native app from your home screen",
      ],
    },
    finalCta: {
      title: "Ready to Transform Your Business?",
      description: "Join 10,000+ businesses that trust Nandi Billing for their growth.",
      note: "No credit card required • 7-day free trial • Setup in 2 minutes",
    },
  };

  const handlePlayClick = () => {
    window.open(dynamicData.hero.youtubeChannel, "_blank");
  };

  const handleInstallClick = () => {
    alert(
      "To install Nandi Billing as a PWA:\n\n1. Open this site in Chrome browser\n2. Click the 'Install' icon in the address bar\n3. Or go to Chrome menu → 'Install Nandi Billing'\n4. Launch from your home screen like a native app!"
    );
  };

  const handleChromeInstructions = () => {
    alert(
      "📱 Chrome PWA Installation:\n\n• On Android: Tap Chrome menu (⋮) → 'Add to Home screen'\n• On iOS: Tap Share button → 'Add to Home Screen'\n• On Desktop: Click install icon in address bar\n\nYour app will work offline and update automatically!"
    );
  };

  const getHeroImage = () => heroImage || "";
  const getMobileAppImage = () => mobileAppImage || "";
  const getFeaturesImage = () => featuresImage || "";

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
        
        {/* === ADDITIONAL SCHEMA MARKUP === */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Nandi Softech Solutions",
            "url": SITE_URL,
            "logo": `${SITE_URL}/images/logo.png`,
            "description": "Provider of India's best GST billing and inventory management software for small businesses",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "IN"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-XXXXXXXXXX",
              "contactType": "customer service"
            }
          })}
        </script>
      </Helmet>

      {/* ========== LANDING PAGE CONTENT ========== */}
      <div className="nandi-landing">
        
        {/* 🌟 HERO SECTION */}
        <section className="nandi-hero-section d-flex align-items-center">
          <div className="container">
            <div className="row align-items-center gy-4">

              {/* LEFT CONTENT - TEXT */}
              <div className="col-lg-6 text-center text-lg-start">
                <h1
                  className="fw-bold display-5 nandi-hero-title mb-3"
                  dangerouslySetInnerHTML={{ __html: dynamicData.hero.title }}
                />
                <p
                  className="nandi-hero-sub mb-4"
                  dangerouslySetInnerHTML={{ __html: dynamicData.hero.subtitle }}
                />

                {/* CALL TO ACTION BUTTONS */}
                <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
                  <Link 
                    to="/register" 
                    className="btn fw-bold px-4 py-2 nandi-cta-btn"
                    title="Start Free GST Billing - No Credit Card Required"
                    aria-label="Start free GST billing with Nandi Software"
                  >
                    🚀 Start Free Billing
                  </Link>
                  <Link 
                    to="/contact" 
                    className="btn fw-bold px-4 py-2 nandi-demo-btn"
                    title="Book Free Demo - See Nandi Billing in Action"
                    aria-label="Book a free demo of Nandi Billing Software"
                  >
                    🎯 Book Free Demo
                  </Link>
                </div>

                {/* TRUST BADGE */}
                <div className="nandi-trusted d-flex flex-column flex-lg-row gap-2 align-items-center justify-content-center justify-content-lg-start">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png"
                    alt="Trusted by businesses across India"
                    width="28"
                    height="28"
                    loading="lazy"
                  />
                  <span className="text-light">
                    <strong>Trusted by {dynamicData.hero.trustedCount} businesses across India</strong>
                  </span>
                </div>
              </div>

              {/* RIGHT CONTENT - HERO IMAGE */}
              <div className="col-lg-6 text-center">
                <div className="nandi-hero-media position-relative mx-auto">
                  <img
                    src={getHeroImage()}
                    alt="Nandi Billing Software Dashboard - GST Invoice and Inventory Management"
                    className="img-fluid rounded-4 shadow-lg nandi-hero-image"
                    width="600"
                    height="400"
                    loading="eager"
                    onError={(e) => {
                      e.target.src =
                        "https://img.freepik.com/free-vector/businessman-analyzing-growth-charts_23-2148862056.jpg";
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-light rounded-circle nandi-play-btn shadow"
                    onClick={handlePlayClick}
                    aria-label="Watch Nandi Billing Software demo video"
                    title="Watch how Nandi Billing works"
                  >
                    ▶
                  </button>
                </div>
                <p className="text-light small mt-3 opacity-75">
                  Watch how Nandi Billing simplifies your workflow
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 📊 STATS SECTION */}
        <section className="nandi-stats-section">
          <div className="container">
            <div className="row g-3">
              {dynamicData.stats.map((item, index) => (
                <div className="col-6 col-md-3" key={index}>
                  <div className="nandi-stat-card">
                    <div className="nandi-stat-number">{item.number}</div>
                    <div className="nandi-stat-label">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 💼 WHY CHOOSE SECTION */}
        <section className="nandi-why">
          <div className="container text-center">
            <h2 className="fw-bold text-primary mb-3">
              Why Choose Nandi Billing Software?
            </h2>
            <p className="text-muted mb-5">
              Everything you need to run your business efficiently
            </p>
            <div className="row g-4">
              {dynamicData.features.map((feature, index) => (
                <div className="col-md-6 col-lg-4" key={index}>
                  <div className="nandi-feature card border-0 shadow-sm h-100 hover-lift">
                    <div className="card-body p-4">
                      <div className="nandi-feature-icon mb-3">
                        {feature.icon}
                      </div>
                      <h3 className="h5 fw-bold text-dark">{feature.title}</h3>
                      <p className="text-muted mb-0">{feature.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 🎯 FEATURES SHOWCASE */}
        <section className="nandi-showcase">
          <div className="container">
            <div className="row align-items-center gy-4">
              <div className="col-lg-6">
                <h2 className="fw-bold text-white display-6 mb-3">
                  {dynamicData.showcase.title}
                </h2>
                <p className="text-light mb-4 fs-5">
                  {dynamicData.showcase.description}
                </p>
                <div className="nandi-feature-list">
                  {dynamicData.showcase.features.map((feature, index) => (
                    <div key={index} className="text-light mb-2 fs-6">
                      ✅ {feature}
                    </div>
                  ))}
                </div>
                <Link
                  to="/features"
                  className="btn btn-light btn-lg fw-bold mt-4 px-4"
                  title="Explore All Features of Nandi Billing Software"
                >
                  Explore All Features
                </Link>
              </div>
              <div className="col-lg-6 text-center">
                <img
                  src={getFeaturesImage()}
                  alt="Nandi Billing Features Dashboard - Business Management Tools"
                  className="img-fluid rounded-4 shadow nandi-features-image"
                  width="550"
                  height="400"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      "https://img.freepik.com/free-vector/flat-design-data-driven-illustration_23-2148976918.jpg";
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 💰 PRICING PREVIEW */}
        <section className="nandi-pricing-preview">
          <div className="container text-center">
            <h2 className="fw-bold text-primary mb-3">
              {dynamicData.pricing.title}
            </h2>
            <p className="text-muted mb-5">{dynamicData.pricing.subtitle}</p>

            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className="nandi-pricing-card card border-0 shadow-lg">
                  <div className="card-body p-5">
                    <div className="nandi-popular-badge">Most Popular</div>
                    <h3 className="text-primary fw-bold">
                      {dynamicData.pricing.popularPlan.name}
                    </h3>
                    <div className="nandi-price display-5 fw-bold text-dark mb-3">
                      {dynamicData.pricing.popularPlan.price}
                      <span className="fs-6 text-muted">
                        {dynamicData.pricing.popularPlan.period}
                      </span>
                    </div>
                    <p className="text-muted mb-4">
                      {dynamicData.pricing.popularPlan.description}
                    </p>

                    <div className="nandi-features-list text-start mb-4">
                      {dynamicData.pricing.popularPlan.features.map(
                        (feature, index) => (
                          <div
                            key={index}
                            className="d-flex align-items-center mb-2"
                          >
                            <span className="text-success me-2">✓</span>
                            <span>{feature}</span>
                          </div>
                        )
                      )}
                    </div>

                    <Link
                      to="/pricing"
                      className="btn btn-primary btn-lg fw-bold w-100"
                      title="View All Pricing Plans - Nandi Billing"
                    >
                      View All Plans
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/pricing"
                className="text-primary fw-bold text-decoration-none"
                title="Compare All Nandi Billing Pricing Plans"
              >
                Compare all plans →
              </Link>
            </div>
          </div>
        </section>

        {/* 🏆 TESTIMONIALS */}
        <section className="nandi-testimonials">
          <div className="container">
            <h2 className="fw-bold text-center text-primary mb-5">
              What Our Customers Say
            </h2>
            <div className="row g-4">
              {dynamicData.testimonials.map((testimonial, index) => (
                <div className="col-md-4" key={index}>
                  <div className="nandi-testimonial card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="nandi-stars mb-3">
                        {"★".repeat(testimonial.rating)}
                      </div>
                      <p className="text-muted mb-4 fst-italic">
                        "{testimonial.text}"
                      </p>
                      <div className="d-flex align-items-center">
                        <div className="nandi-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="h6 fw-bold mb-1">{testimonial.name}</h4>
                          <small className="text-muted">
                            {testimonial.business}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 📱 MOBILE / PWA SECTION */}
        <section className="nandi-mobile text-white">
          <div className="container">
            <div className="row align-items-center gy-4">
              <div className="col-lg-6 text-center text-lg-start">
                <h2 className="fw-bold display-6 mb-4">
                  {dynamicData.mobileApp.title}
                </h2>
                <p className="mb-4 fs-5">{dynamicData.mobileApp.description}</p>

                <div className="nandi-app-features mb-4">
                  <h3 className="h5 fw-bold mb-3">🌟 PWA Benefits:</h3>
                  {dynamicData.mobileApp.features.map((feature, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center mb-2"
                    >
                      <span className="text-warning me-3">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="nandi-installation-steps mb-4">
                  <h3 className="h5 fw-bold mb-3">📥 Easy Installation:</h3>
                  {dynamicData.mobileApp.installationSteps.map(
                    (step, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-start mb-2"
                      >
                        <span className="badge bg-primary me-3 mt-1">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="d-flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn btn-warning fw-bold px-4 py-3"
                    onClick={handleInstallClick}
                    title="Install Nandi Billing as PWA App"
                  >
                    <div className="d-flex align-items-center">
                      <span className="fs-4 me-2">📱</span>
                      <div className="text-start">
                        <small>Install as</small>
                        <br />
                        <strong>PWA App</strong>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light fw-bold px-4 py-3"
                    onClick={handleChromeInstructions}
                    title="Chrome Browser Installation Instructions"
                  >
                    <div className="d-flex align-items-center">
                      <span className="fs-4 me-2">🌐</span>
                      <div className="text-start">
                        <small>Chrome</small>
                        <br />
                        <strong>Instructions</strong>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-3">
                  <small className="text-light opacity-75">
                    💡 <strong>Pro Tip:</strong> Works on Chrome, Edge, Safari &
                    Firefox browsers
                  </small>
                </div>
              </div>

              <div className="col-lg-6 text-center">
                <div className="nandi-pwa-demo position-relative">
                  <img
                    src={getMobileAppImage()}
                    alt="Nandi Billing PWA Mobile App - Progressive Web Application"
                    className="img-fluid rounded-4 shadow-lg nandi-mobile-image"
                    width="550"
                    height="400"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        "https://img.freepik.com/free-psd/smartphone-mock-up_1310-812.jpg";
                    }}
                  />
                  <div className="nandi-pwa-badge position-absolute top-0 start-0 m-3">
                    <span className="badge bg-success fs-6 p-2">PWA READY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🚀 FINAL CTA */}
        <section className="nandi-final-cta text-white">
          <div className="container text-center">
            <h2 className="fw-bold display-5 mb-3">
              {dynamicData.finalCta.title}
            </h2>
            <p className="mb-4 fs-5">{dynamicData.finalCta.description}</p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link
                to="/register"
                className="btn btn-warning btn-lg fw-bold px-5"
                title="Start Free Trial - Nandi Billing Software"
              >
                🚀 Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="btn btn-outline-light btn-lg fw-bold px-5"
                title="Book Demo - See Nandi Billing Features"
              >
                📅 Book Demo
              </Link>
            </div>
            <p className="mt-3 small opacity-75">{dynamicData.finalCta.note}</p>
          </div>
        </section>
      </div>
    </>
  );
}

export default Landing;