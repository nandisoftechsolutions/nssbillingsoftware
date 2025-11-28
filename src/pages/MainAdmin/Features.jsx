// src/pages/Features.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./Features.css";

function Features() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  // SEO Configuration for Features Page
  const seoConfig = {
    title: "Nandi Billing Features - Complete GST Billing & Inventory Management Software",
    description: "Explore Nandi Billing's powerful features: GST invoicing, inventory management, POS billing, accounting reports, mobile app & more. Perfect for Indian businesses.",
    keywords: "GST billing features, inventory management software, POS billing system, accounting software India, business management features, Nandi Billing capabilities",
    canonical: `${SITE_URL}/features`,
    ogImage: `${SITE_URL}/images/features-og-image.jpg`
  };

  // Structured Data for Features Page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Nandi Billing Features - Complete Business Management Software",
    "description": "Explore all features of Nandi Billing software including GST invoicing, inventory management, and business analytics.",
    "url": `${SITE_URL}/features`,
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Nandi Billing Software",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, PWA, Android, iOS",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      },
      "featureList": [
        "GST Compliant Invoicing",
        "Inventory Management", 
        "Billing & POS",
        "Accounting & Reports",
        "Customer Management",
        "Purchase Management",
        "Mobile App",
        "Cloud Backup"
      ]
    }
  };

  const features = [
    {
      icon: "🧾",
      title: "GST Compliant Invoicing",
      description:
        "Generate fully GST-compliant invoices with automatic tax calculations, HSN codes, and professional templates.",
      points: [
        "Auto GST calculation (CGST, SGST, IGST)",
        "HSN/SAC code integration",
        "Multiple invoice templates",
        "E-invoicing ready",
      ],
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      icon: "📦",
      title: "Inventory Management",
      description:
        "Complete inventory control with stock tracking, low stock alerts, and batch management.",
      points: [
        "Real-time stock tracking",
        "Low stock alerts",
        "Batch & expiry management",
        "Multi-location inventory",
      ],
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      icon: "💰",
      title: "Billing & POS",
      description:
        "Fast and efficient point-of-sale billing with barcode scanning and multiple payment options.",
      points: [
        "Barcode scanning",
        "Quick billing interface",
        "Multiple payment modes",
        "Customer display support",
      ],
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      icon: "📊",
      title: "Accounting & Reports",
      description:
        "Comprehensive financial reports, profit & loss statements, and business analytics.",
      points: [
        "Profit & Loss reports",
        "GST returns preparation",
        "Balance sheets",
        "Business analytics",
      ],
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
    {
      icon: "🤝",
      title: "Customer Management",
      description:
        "Manage customer relationships with detailed profiles, credit limits, and communication history.",
      points: [
        "Customer database",
        "Credit management",
        "Loyalty programs",
        "Communication history",
      ],
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    },
    {
      icon: "🛒",
      title: "Purchase Management",
      description:
        "Streamline your purchase process with supplier management and purchase order tracking.",
      points: [
        "Supplier management",
        "Purchase orders",
        "GRN processing",
        "Payment tracking",
      ],
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    },
    {
      icon: "📱",
      title: "Mobile App",
      description:
        "Access your business data anywhere with our mobile application for Android and iOS.",
      points: [
        "Mobile billing",
        "Stock checking",
        "Sales reports",
        "Customer management",
      ],
      gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    },
    {
      icon: "☁️",
      title: "Cloud Backup",
      description:
        "Automatic cloud backup ensures your data is safe and accessible from anywhere.",
      points: [
        "Auto cloud backup",
        "Data security",
        "Multi-device sync",
        "Disaster recovery",
      ],
      gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    },
  ];

  const industrySolutions = [
    {
      industry: "Retail Stores",
      features: [
        "Quick billing",
        "Barcode support",
        "Customer loyalty",
        "Inventory management",
      ],
      icon: "🏪",
      color: "#667eea",
    },
    {
      industry: "Restaurants",
      features: ["Table management", "KOT printing", "Recipe management", "Waiter app"],
      icon: "🍕",
      color: "#f093fb",
    },
    {
      industry: "Medical Stores",
      features: [
        "Expiry tracking",
        "Prescription management",
        "GST compliance",
        "Stock alerts",
      ],
      icon: "⚕️",
      color: "#4facfe",
    },
    {
      industry: "Wholesale",
      features: ["Bulk pricing", "Order management", "Credit tracking", "Multi-location"],
      icon: "📦",
      color: "#43e97b",
    },
  ];

  const externalFeatures = [
    {
      icon: "🔒",
      title: "Bank-Level Security",
      description:
        "Enterprise-grade security with SSL encryption and regular security audits to protect your business data.",
      stats: "99.9% Uptime",
      features: [
        "256-bit SSL Encryption",
        "Regular Security Audits",
        "GDPR Compliant",
        "Data Backup",
      ],
      badge: "Secure",
    },
    {
      icon: "🚀",
      title: "Lightning Fast Performance",
      description:
        "Optimized for speed with cloud infrastructure that ensures quick loading and smooth operation.",
      stats: "< 2s Load Time",
      features: ["Cloud Optimized", "CDN Enabled", "Cached Responses", "Fast Queries"],
      badge: "Fast",
    },
    {
      icon: "🌐",
      title: "Multi-Platform Support",
      description:
        "Access your business data from anywhere with web, mobile, and desktop applications.",
      stats: "3 Platforms",
      features: ["Web Application", "Mobile Apps", "Desktop Version", "API Access"],
      badge: "Universal",
    },
  ];

  // Industry Solutions Structured Data
  const industryStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Industry Solutions",
    "description": "Nandi Billing software solutions for different industries",
    "numberOfItems": 4,
    "itemListElement": industrySolutions.map((solution, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": `${solution.industry} Billing Solution`,
        "description": `Nandi Billing software features for ${solution.industry.toLowerCase()}`,
        "serviceType": "Business Software",
        "areaServed": "India",
        "audience": {
          "@type": "BusinessAudience",
          "name": solution.industry
        }
      }
    }))
  };

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
        
        {/* === INDUSTRY SOLUTIONS STRUCTURED DATA === */}
        <script type="application/ld+json">
          {JSON.stringify(industryStructuredData)}
        </script>
      </Helmet>

      {/* ========== FEATURES PAGE CONTENT ========== */}
      <div className="nandiFeat-page">
        {/* HERO SECTION */}
        <section className="nandiFeat-hero">
          <div className="container">
            <div className="row align-items-center g-4">
              {/* Left */}
              <div className="col-lg-6">
                <div className="nandiFeat-hero-text">
                  <p className="nandiFeat-eyebrow">Nandi Billing Software · Made for Indian Businesses</p>
                  <h1 className="nandiFeat-hero-title">
                    Powerful Features for{" "}
                    <span className="nandiFeat-gradient-text">Your Business Growth</span>
                  </h1>
                  <p className="nandiFeat-hero-subtitle">
                    Manage billing, inventory, GST and reporting in one simple, powerful platform
                    crafted specially for Indian small & medium businesses.
                  </p>

                  <div className="nandiFeat-hero-actions">
                    <Link 
                      to="/register" 
                      className="btn nandiFeat-btn-primary"
                      title="Start Free Trial - Nandi Billing Features"
                      aria-label="Start free trial of Nandi Billing features"
                    >
                      Start Free Trial
                    </Link>
                    <Link 
                      to="/pricing" 
                      className="btn nandiFeat-btn-outline"
                      title="View Pricing Plans - Nandi Billing"
                      aria-label="View Nandi Billing pricing plans"
                    >
                      View Pricing
                    </Link>
                  </div>

                  <div className="nandiFeat-hero-stats">
                    <div className="nandiFeat-stat-chip">
                      <span className="nandiFeat-stat-label">5000+</span>
                      <span className="nandiFeat-stat-text">Businesses Trust Us</span>
                    </div>
                    <div className="nandiFeat-stat-chip">
                      <span className="nandiFeat-stat-label">99.9%</span>
                      <span className="nandiFeat-stat-text">Uptime</span>
                    </div>
                    <div className="nandiFeat-stat-chip">
                      <span className="nandiFeat-stat-label">24/7</span>
                      <span className="nandiFeat-stat-text">Support</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="col-lg-6">
                <div className="nandiFeat-hero-visual">
                  <div className="nandiFeat-floating-tag nandiFeat-tag-1">
                    <div className="nandiFeat-tag-icon">🧾</div>
                    <span>GST Invoicing</span>
                  </div>
                  <div className="nandiFeat-floating-tag nandiFeat-tag-2">
                    <div className="nandiFeat-tag-icon">📊</div>
                    <span>Analytics</span>
                  </div>
                  <div className="nandiFeat-floating-tag nandiFeat-tag-3">
                    <div className="nandiFeat-tag-icon">📦</div>
                    <span>Inventory</span>
                  </div>

                  <div className="nandiFeat-dashboard-card">
                    <div className="nandiFeat-dashboard-header">
                      <div className="nandiFeat-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="nandiFeat-dashboard-title">Business Dashboard</span>
                    </div>
                    <div className="nandiFeat-dashboard-body">
                      <div className="nandiFeat-chart">
                        <div className="nandiFeat-bar" style={{ height: "60%" }}></div>
                        <div className="nandiFeat-bar" style={{ height: "85%" }}></div>
                        <div className="nandiFeat-bar" style={{ height: "45%" }}></div>
                        <div className="nandiFeat-bar" style={{ height: "92%" }}></div>
                        <div className="nandiFeat-bar" style={{ height: "70%" }}></div>
                      </div>
                      <div className="nandiFeat-dashboard-stats">
                        <div className="nandiFeat-dashboard-stat">
                          <span className="nandiFeat-dashboard-value">₹1.2L</span>
                          <span className="nandiFeat-dashboard-label">Today's Sales</span>
                        </div>
                        <div className="nandiFeat-dashboard-stat">
                          <span className="nandiFeat-dashboard-value">48</span>
                          <span className="nandiFeat-dashboard-label">Invoices</span>
                        </div>
                        <div className="nandiFeat-dashboard-stat">
                          <span className="nandiFeat-dashboard-value">92%</span>
                          <span className="nandiFeat-dashboard-label">Stock Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="nandiFeat-hero-badge">
                    <span className="nandiFeat-hero-badge-pill">GST Ready · Multi-tenant · Cloud</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EXTERNAL (INFRASTRUCTURE) FEATURES */}
        <section className="nandiFeat-external">
          <div className="container">
            <div className="nandiFeat-section-header text-center">
              <h2 className="nandiFeat-section-title">Enterprise-Grade Infrastructure</h2>
              <p className="nandiFeat-section-subtitle">
                Built on modern technology to keep your business fast, secure and always available.
              </p>
            </div>

            <div className="row g-4">
              {externalFeatures.map((feature, index) => (
                <div key={index} className="col-lg-4 col-md-6">
                  <div className="nandiFeat-external-card">
                    <div className="nandiFeat-external-badge">{feature.badge}</div>
                    <div className="nandiFeat-external-header">
                      <div className="nandiFeat-external-icon">{feature.icon}</div>
                      <div className="nandiFeat-external-stat">{feature.stats}</div>
                    </div>
                    <h3 className="nandiFeat-external-title">{feature.title}</h3>
                    <p className="nandiFeat-external-desc">{feature.description}</p>
                    <ul className="nandiFeat-external-list">
                      {feature.features.map((point, i) => (
                        <li key={i}>
                          <span className="nandiFeat-check">✓</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CORE FEATURE GRID */}
        <section className="nandiFeat-core">
          <div className="container">
            <div className="nandiFeat-section-header text-center">
              <h2 className="nandiFeat-section-title">
                Complete Business Management in One Platform
              </h2>
              <p className="nandiFeat-section-subtitle">
                Billing, inventory, accounting, customers, purchases and more — all connected.
              </p>
            </div>

            <div className="row g-4">
              {features.map((feature, index) => (
                <div key={index} className="col-lg-6">
                  <div className="nandiFeat-feature-card">
                    <div
                      className="nandiFeat-feature-iconWrap"
                      style={{ background: feature.gradient }}
                    >
                      <div className="nandiFeat-feature-icon">{feature.icon}</div>
                    </div>
                    <div className="nandiFeat-feature-content">
                      <h3 className="nandiFeat-feature-title">{feature.title}</h3>
                      <p className="nandiFeat-feature-desc">{feature.description}</p>
                      <ul className="nandiFeat-feature-list">
                        {feature.points.map((point, i) => (
                          <li key={i}>
                            <span className="nandiFeat-check">✓</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                      <div className="nandiFeat-feature-actions">
                        <Link 
                          to="/register" 
                          className="nandiFeat-link"
                          title={`Try ${feature.title} - Nandi Billing`}
                          aria-label={`Try ${feature.title} feature`}
                        >
                          Try this feature →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INDUSTRY SOLUTIONS */}
        <section className="nandiFeat-industry">
          <div className="container">
            <div className="nandiFeat-section-header text-center">
              <h2 className="nandiFeat-section-title">Built for Your Industry</h2>
              <p className="nandiFeat-section-subtitle">
                Ready-to-use configurations for the most common Indian business types.
              </p>
            </div>

            <div className="row g-4">
              {industrySolutions.map((solution, index) => (
                <div key={index} className="col-lg-3 col-md-6 col-sm-6">
                  <div className="nandiFeat-industry-card">
                    <div
                      className="nandiFeat-industry-iconWrap"
                      style={{ backgroundColor: solution.color }}
                    >
                      <span className="nandiFeat-industry-icon">{solution.icon}</span>
                    </div>
                    <h3 className="nandiFeat-industry-name">{solution.industry}</h3>
                    <ul className="nandiFeat-industry-list">
                      {solution.features.map((f, i) => (
                        <li key={i}>
                          <span className="nandiFeat-bullet">•</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="nandiFeat-industry-actions">
                      <Link
                        to="/contact"
                        className="btn nandiFeat-industry-btn"
                        style={{ backgroundColor: solution.color }}
                        title={`Learn More About ${solution.industry} Solution`}
                        aria-label={`Learn more about ${solution.industry} solution`}
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="nandiFeat-cta">
          <div className="container">
            <div className="nandiFeat-cta-card">
              <div className="row align-items-center g-3">
                <div className="col-lg-8">
                  <h2 className="nandiFeat-cta-title">
                    Ready to Transform Your Business with Nandi Billing Software?
                  </h2>
                  <p className="nandiFeat-cta-subtitle">
                    Join thousands of Indian businesses already using Nandi Softech Solutions to
                    simplify billing, GST and accounting.
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <div className="nandiFeat-cta-actions">
                    <Link 
                      to="/register" 
                      className="btn nandiFeat-btn-light"
                      title="Get Started with Nandi Billing Features"
                      aria-label="Get started with Nandi Billing features"
                    >
                      Get Started Free
                    </Link>
                    <Link 
                      to="/pricing" 
                      className="btn nandiFeat-btn-ghost"
                      title="View All Pricing Plans"
                      aria-label="View all pricing plans"
                    >
                      View Plans
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Features;