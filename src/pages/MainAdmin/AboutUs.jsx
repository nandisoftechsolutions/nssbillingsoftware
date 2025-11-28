// src/pages/MainAdmin/AboutUs.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./AboutUs.css";

// ⭐ Correct Vite-safe imports
import nandiLogo from "../../assets/nandibillinglogo.png";
import ceoImage from "../../assets/ceo.png";

function AboutUs() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  // SEO Configuration for About Page
  const seoConfig = {
    title: "About Nandi Billing - GST Software Built for Indian Businesses | Our Story",
    description: "Learn about Nandi Billing Software - founded by Arjun Nandi. GST billing software designed specifically for Indian SMEs. Our mission, values, and journey.",
    keywords: "about Nandi Billing, Nandi Softech Solutions, GST software company, Indian billing software, Arjun Nandi founder, SME business software",
    canonical: `${SITE_URL}/about`,
    ogImage: `${SITE_URL}/images/about-og-image.jpg`
  };

  // Structured Data for About Page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Nandi Billing Software",
    "description": "Learn about Nandi Billing Software and Nandi Softech Solutions - GST billing software built for Indian small and medium businesses",
    "url": `${SITE_URL}/about`,
    "publisher": {
      "@type": "Organization",
      "name": "Nandi Softech Solutions",
      "description": "Provider of GST billing and inventory management software for Indian businesses",
      "url": SITE_URL,
      "logo": `${SITE_URL}/images/logo.png`,
      "foundingDate": "2020",
      "founder": {
        "@type": "Person",
        "name": "Arjun Nandi"
      }
    }
  };

  const milestones = [
    {
      year: "2020",
      title: "Nandi Softech Solutions Founded",
      description:
        "Arjun Nandi started Nandi Softech Solutions with a clear mission: make billing and GST compliance simple for Indian businesses.",
    },
    {
      year: "2021",
      title: "Nandi Billing Software Launched",
      description:
        "The first version of Nandi Billing Software went live, helping small shops generate GST-ready invoices with ease.",
    },
    {
      year: "2022",
      title: "Multi-Tenant Platform & SaaS",
      description:
        "Shifted to a modern multi-tenant architecture, allowing multiple businesses to use the same secure, scalable platform.",
    },
    {
      year: "2023",
      title: "Real Businesses, Real Deployments",
      description:
        "Nandi Billing Software started powering cafes, retail shops, and service businesses with real-time inventory & billing.",
    },
    {
      year: "2024",
      title: "Growing With Indian SMEs",
      description:
        "From solo development to a growing ecosystem, Nandi Softech Solutions continues to focus on affordable, practical tools.",
    },
  ];

  const values = [
    {
      icon: "🧾",
      title: "Built for Indian GST",
      description:
        "From the first line of code, Nandi Billing Software was designed around Indian GST rules, HSN codes, and real-world shop needs.",
    },
    {
      icon: "💡",
      title: "Practical Innovation",
      description:
        "Every feature is inspired by real business problems faced by Indian shop owners and SMEs.",
    },
    {
      icon: "🤝",
      title: "Trust & Simplicity",
      description:
        "Clean, simple screens that anyone can use with minimal training.",
    },
    {
      icon: "🚀",
      title: "Growth for Everyone",
      description:
        "Helping small businesses grow confidently through better billing and inventory insights.",
    },
  ];

  const founder = {
    name: "Arjun Nandi",
    role: "Founder & CEO, Nandi Softech Solutions",
    image: ceoImage,
    intro:
      "A self-taught full-stack developer and teacher, Arjun built Nandi Billing Software from scratch to solve real problems faced by Indian businesses.",
    highlights: [
      "Built multiple full-stack SaaS products",
      "Expertise in multi-tenant architecture",
      "Experience with Razorpay, authentication, deployments",
      "Understands true needs of Indian small businesses",
    ],
  };

  // Founder Structured Data
  const founderStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Arjun Nandi",
    "jobTitle": "Founder & CEO",
    "worksFor": {
      "@type": "Organization",
      "name": "Nandi Softech Solutions"
    },
    "description": "Founder of Nandi Softech Solutions and creator of Nandi Billing Software - GST billing software for Indian businesses",
    "email": "arjun@nandisoftechsolutions.in",
    "url": SITE_URL
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
        
        {/* === FOUNDER STRUCTURED DATA === */}
        <script type="application/ld+json">
          {JSON.stringify(founderStructuredData)}
        </script>
        
        {/* === ORGANIZATION STRUCTURED DATA === */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Nandi Softech Solutions",
            "alternateName": "Nandi Billing Software",
            "url": SITE_URL,
            "logo": `${SITE_URL}/images/logo.png`,
            "description": "Provider of GST billing and inventory management software for Indian small and medium businesses",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Bangalore",
              "addressRegion": "Karnataka",
              "addressCountry": "IN"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-8152853260",
              "contactType": "customer service",
              "areaServed": "IN",
              "availableLanguage": ["English", "Hindi", "Kannada"]
            },
            "founder": {
              "@type": "Person",
              "name": "Arjun Nandi"
            },
            "foundingDate": "2020",
            "sameAs": [
              "https://www.youtube.com/@NandiSoftechSolutions"
            ]
          })}
        </script>
      </Helmet>

      {/* ========== ABOUT PAGE CONTENT ========== */}
      <div className="about-page">
        {/* HERO */}
        <section className="about-hero">
          <div className="container">
            <div className="text-center mb-5">
              <img
                src={nandiLogo}
                alt="Nandi Billing Software - GST Ready Business Solution"
                width="120"
                className="shadow-sm rounded-3"
                loading="eager"
              />
              <h1 className="about-hero-brand">Nandi Billing Software</h1>
              <p className="about-hero-tagline">GST Ready Business Solution</p>
            </div>

            <div className="row align-items-center">
              <div className="col-lg-6">
                <h2 className="about-hero-title">
                  Empowering{" "}
                  <span className="text-gradient">Small & Medium Businesses</span>{" "}
                  with Smart Billing
                </h2>

                <p className="about-hero-subtitle">
                  Built by <strong>Arjun Nandi</strong>, Nandi Billing Software
                  simplifies GST billing, inventory and daily business operations for Indian SMEs.
                </p>

                <div className="about-hero-stats">
                  <div className="stat-item">
                    <div className="stat-number">5000+</div>
                    <div className="stat-label">Invoices Generated</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">99.9%</div>
                    <div className="stat-label">Uptime</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">3+</div>
                    <div className="stat-label">Live Products</div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="about-hero-image">
                  <div className="floating-element element-1">
                    <div className="element-icon">🧾</div>
                    <span>Billing</span>
                  </div>

                  <div className="floating-element element-2">
                    <div className="element-icon">📊</div>
                    <span>Reports</span>
                  </div>

                  <div className="floating-element element-3">
                    <div className="element-icon">📦</div>
                    <span>Inventory</span>
                  </div>

                  <div className="hero-main-image">
                    <div className="image-placeholder">
                      <h3>Nandi Softech Solutions</h3>
                      <p>Made in India • Built for SMEs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="story-section">
          <div className="container">
            <div className="row g-4 align-items-start">
              <div className="col-lg-7">
                <h2 className="section-title">Our Story</h2>

                <p>
                  Nandi Softech Solutions was created to solve a real problem —
                  small businesses in India needed simple, affordable billing
                  software that understands GST compliance and local business needs.
                </p>

                <p>
                  With real-world experience and an understanding of how Indian
                  shops operate, Arjun Nandi built a system that is both powerful
                  and easy to use - no complex training required.
                </p>

                <p>
                  Today, Nandi Billing Software serves shops, wholesalers, traders, 
                  cafes and service businesses across India, helping them manage 
                  GST billing and inventory efficiently.
                </p>
              </div>

              <div className="col-lg-5">
                <div className="founder-card">
                  <div className="founder-photo-wrap">
                    <img
                      src={ceoImage}
                      alt="Arjun Nandi - Founder & CEO of Nandi Softech Solutions"
                      className="founder-photo"
                      loading="lazy"
                    />
                  </div>

                  <div className="founder-info">
                    <h3 className="founder-name">{founder.name}</h3>
                    <p className="founder-role">{founder.role}</p>
                    <p className="founder-intro">{founder.intro}</p>

                    <ul className="founder-highlights">
                      {founder.highlights.map((item, index) => (
                        <li key={index}>
                          <span className="founder-bullet">✔</span> {item}
                        </li>
                      ))}
                    </ul>

                    <div className="founder-contact">
                      <a
                        href="mailto:arjun@nandisoftechsolutions.in"
                        className="btn btn-sm btn-primary me-2"
                        title="Email Arjun Nandi - Founder"
                        aria-label="Email Arjun Nandi, Founder of Nandi Softech Solutions"
                      >
                        ✉ Email Arjun
                      </a>
                      <Link
                        to="/contact"
                        className="btn btn-sm btn-outline-secondary"
                        title="Contact Nandi Billing Support"
                        aria-label="Contact Nandi Billing Support Team"
                      >
                        📞 Contact Us
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MISSION + VISION */}
            <div className="row mission-vision-row">
              <div className="col-lg-6">
                <div className="mission-card">
                  <div className="card-icon">🎯</div>
                  <h3>Our Mission</h3>
                  <p>Simple, powerful billing tools for every Indian business.</p>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="vision-card">
                  <div className="card-icon">🚀</div>
                  <h3>Our Vision</h3>
                  <p>To be India's most trusted SME billing software.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="values-section">
          <div className="container">
            <h2 className="section-title text-center mb-5">What We Believe</h2>

            <div className="row g-4">
              {values.map((value, index) => (
                <div key={index} className="col-lg-3 col-md-6">
                  <div className="value-card">
                    <div className="value-icon">{value.icon}</div>
                    <h4>{value.title}</h4>
                    <p>{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MILESTONES */}
        <section className="timeline-section">
          <div className="container">
            <h2 className="section-title text-center mb-5">Our Journey</h2>

            <div className="timeline">
              {milestones.map((m, i) => (
                <div key={i} className={`timeline-item ${i % 2 ? "right" : "left"}`}>
                  <div className="timeline-content">
                    <div className="timeline-year">{m.year}</div>
                    <h4>{m.title}</h4>
                    <p>{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <div className="container">
            <div className="cta-card">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={nandiLogo}
                      width="60"
                      className="me-3 rounded-3"
                      alt="Nandi Billing Software Logo"
                      loading="lazy"
                    />
                    <div>
                      <h3 className="cta-title mb-0">
                        Ready to Start with Nandi Billing Software?
                      </h3>
                      <p className="cta-subtitle mb-0">
                        Built for real Indian businesses.
                      </p>
                    </div>
                  </div>

                  <p className="cta-description mb-0">
                    Generate GST invoices, track inventory and grow your business efficiently with our made-in-India software.
                  </p>
                </div>

                <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                  <Link 
                    to="/register" 
                    className="btn btn-primary btn-lg me-2"
                    title="Start Free Trial - Nandi Billing"
                    aria-label="Start free trial of Nandi Billing Software"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    to="/pricing"
                    className="btn btn-outline-light btn-lg mt-2 mt-lg-0"
                    title="View Pricing Plans - Nandi Billing"
                    aria-label="View Nandi Billing pricing plans"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default AboutUs;