// src/pages/GSTAssistance.jsx
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import "./GSTAssistance.css";

function GSTAssistance() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    business: "",
    message: "",
    serviceType: "gst-registration"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        mobile: "",
        business: "",
        message: "",
        serviceType: "gst-registration"
      });
      
      // Scroll to success message
      document.getElementById('form-success').scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>GST Registration & Filing Assistance | Expert GST Services | Nandi Softech</title>
        <meta
          name="description"
          content="Professional GST registration, filing & return services. Get expert guidance for GST compliance, CA consultation, and government portal support. Fast & reliable assistance."
        />
        <meta
          name="keywords"
          content="GST registration, GST filing, GST return, GST compliance, GST services, GST consultant, GST portal help, business GST, tax filing, GSTIN"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Nandi Softech" />
        <meta property="og:title" content="Expert GST Registration & Filing Assistance" />
        <meta
          property="og:description"
          content="Complete GST compliance services with expert guidance and CA support"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nssbillingsoftware.vercel.app/gst-services" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GST Services - Nandi Softech" />
        <meta
          name="twitter:description"
          content="Professional GST registration and filing assistance"
        />
        <link
          rel="canonical"
          href="https://nssbillingsoftware.vercel.app/gst-services"
        />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "GST Registration & Filing Services",
              "provider": {
                "@type": "Organization",
                "name": "Nandi Softech",
                "url": "https://nssbillingsoftware.vercel.app"
              },
              "serviceType": "Tax Consulting",
              "description": "Professional GST registration, filing and compliance services",
              "areaServed": "India",
              "offers": {
                "@type": "Offer",
                "category": "Professional Services"
              }
            }
          `}
        </script>
      </Helmet>

      <div className="gst-assist-wrapper">
        {/* ======= TOP ADS SLOT ======= */}
        <div className="ads-space ads-top">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
          <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </div>

        {/* ---------- HERO SECTION ---------- */}
        <section className="gst-assist-hero shadow-lg">
          <div className="hero-content">
            <h1 className="hero-title">Professional GST Registration & Filing Services</h1>
            <p className="hero-subtitle">
              Complete GST compliance assistance with expert guidance on the official GST Portal. 
              Get your GSTIN quickly with our step-by-step support.
            </p>
            <div className="hero-badges">
              <span className="badge">✓ Expert CA Support</span>
              <span className="badge">✓ 100% Online Process</span>
              <span className="badge">✓ Affordable Pricing</span>
            </div>
            <a href="#form" className="btn btn-warning btn-lg mt-4 cta-button">
              Start Your GST Registration 🚀
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">GST Registrations</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">99%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </section>

        {/* ======= ADS BANNER ======= */}
        <div className="ads-space ads-banner">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="2345678901"
            data-ad-format="horizontal"
            data-full-width-responsive="true"></ins>
        </div>

        {/* ---------- SERVICES OVERVIEW ---------- */}
        <section className="gst-services-overview">
          <h2 className="section-title">Our GST Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📋</div>
              <h3>GST Registration</h3>
              <p>Complete assistance for new GST registration including document preparation and application</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📊</div>
              <h3>Monthly Filing</h3>
              <p>Regular GST filing services with compliance reminders and error checking</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🔧</div>
              <h3>Amendments & Corrections</h3>
              <p>Rectify errors in GST returns and make necessary amendments</p>
            </div>
            <div className="service-card">
              <div className="service-icon">👨‍💼</div>
              <h3>CA Consultation</h3>
              <p>Expert consultation for complex GST matters and compliance issues</p>
            </div>
          </div>
        </section>

        {/* ---------- WHO WE HELP ---------- */}
        <section className="gst-section">
          <h2 className="section-title">Who Needs GST Registration?</h2>
          <div className="target-audience">
            <div className="audience-category">
              <h3>🎯 Mandatory Registration</h3>
              <ul className="checklist">
                <li>Businesses with turnover &gt; ₹40 Lakhs (₹20L for services)</li>
                <li>E-commerce sellers & operators</li>
                <li>Inter-state suppliers</li>
                <li>Casual taxable persons</li>
              </ul>
            </div>
            <div className="audience-category">
              <h3>💼 Recommended For</h3>
              <ul className="checklist">
                <li>Small Shops & Retailers</li>
                <li>Service Providers (Consultancy, IT, Repair)</li>
                <li>Manufacturers & Traders</li>
                <li>Freelancers & Professionals</li>
                <li>Restaurants & Hotels</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ADS SLOT */}
        <div className="ads-space ads-mid">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="3456789012"
            data-ad-format="rectangle"
            data-full-width-responsive="true"></ins>
        </div>

        {/* ---------- STEP BY STEP PROCESS ---------- */}
        <section className="gst-section process-section">
          <h2 className="section-title">Our 5-Step GST Process</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Document Collection</h3>
                <p>We collect and verify all required documents</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Application Filing</h3>
                <p>File application on Government GST Portal</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Verification</h3>
                <p>Department verification and approval</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>GSTIN Generation</h3>
                <p>Receive your 15-digit GSTIN number</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Ongoing Support</h3>
                <p>Monthly filing and compliance assistance</p>
              </div>
            </div>
          </div>
        </section>

        {/* ADS BETWEEN SECTIONS */}
        <div className="ads-space ads-midlong">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="4567890123"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
        </div>

        {/* ---------- DOCUMENTS REQUIRED ---------- */}
        <section className="gst-section documents-section">
          <h2 className="section-title">Required Documents</h2>
          <div className="documents-grid">
            <div className="document-card">
              <div className="doc-icon">📄</div>
              <h4>Identity Proof</h4>
              <ul>
                <li>PAN Card</li>
                <li>Aadhaar Card</li>
                <li>Passport Size Photo</li>
              </ul>
            </div>
            <div className="document-card">
              <div className="doc-icon">🏢</div>
              <h4>Business Proof</h4>
              <ul>
                <li>Business Address Proof</li>
                <li>Rent Agreement (if rented)</li>
                <li>Property Tax Receipt</li>
              </ul>
            </div>
            <div className="document-card">
              <div className="doc-icon">🏦</div>
              <h4>Bank Details</h4>
              <ul>
                <li>Canceled Cheque</li>
                <li>Bank Statement</li>
                <li>Bank Account Number</li>
              </ul>
            </div>
            <div className="document-card">
              <div className="doc-icon">📝</div>
              <h4>Additional</h4>
              <ul>
                <li>Digital Signature</li>
                <li>Business Registration</li>
                <li>Authorization Letter</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- BENEFITS ---------- */}
        <section className="gst-section benefits-section">
          <h2 className="section-title">Why Choose Our GST Services?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>⚡ Fast Processing</h3>
              <p>Quick turnaround time for GST registration and filing</p>
            </div>
            <div className="benefit-card">
              <h3>👨‍💼 Expert Support</h3>
              <p>Dedicated CA and tax expert assistance</p>
            </div>
            <div className="benefit-card">
              <h3>💸 Transparent Pricing</h3>
              <p>No hidden charges, affordable packages</p>
            </div>
            <div className="benefit-card">
              <h3>🔒 Secure & Confidential</h3>
              <p>Your documents and data are completely secure</p>
            </div>
            <div className="benefit-card">
              <h3>📱 Easy Tracking</h3>
              <p>Track your application status in real-time</p>
            </div>
            <div className="benefit-card">
              <h3>🔄 Lifetime Support</h3>
              <p>Ongoing compliance and filing assistance</p>
            </div>
          </div>
        </section>

        {/* SIDE ADS (FOR DESKTOP) */}
        <div className="ads-space ads-side">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="5678901234"
            data-ad-format="vertical"
            data-full-width-responsive="true"></ins>
        </div>

        {/* BOTTOM ADS */}
        <div className="ads-space ads-bottom">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="6789012345"
            data-ad-format="horizontal"
            data-full-width-responsive="true"></ins>
        </div>

        {/* ---------- CONTACT FORM ---------- */}
        <section className="gst-contact" id="form">
          <div className="contact-header">
            <h2 className="section-title">Get Free GST Consultation</h2>
            <p className="contact-subtitle">
              Fill the form below and our GST expert will contact you within 30 minutes
            </p>
          </div>

          {isSubmitted ? (
            <div id="form-success" className="success-message shadow-lg">
              <div className="success-icon">✅</div>
              <h3>Thank You!</h3>
              <p>Your GST assistance request has been received. Our team will contact you within 30 minutes.</p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="btn btn-outline-primary"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form className="gst-form shadow-lg" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number *</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="business">Business Name *</label>
                  <input
                    type="text"
                    id="business"
                    name="business"
                    value={formData.business}
                    onChange={handleChange}
                    placeholder="Your business/shop name"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="serviceType">Service Required *</label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                >
                  <option value="gst-registration">GST Registration</option>
                  <option value="gst-filing">Monthly GST Filing</option>
                  <option value="gst-return">GST Return Filing</option>
                  <option value="gst-amendment">GST Amendment</option>
                  <option value="consultation">CA Consultation</option>
                  <option value="other">Other Service</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Additional Details</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell us about your requirements, turnover, or any specific questions..."
                />
              </div>
              
              <div className="form-footer">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    'Submit Request for Free Consultation'
                  )}
                </button>
                <p className="form-note">
                  By submitting, you agree to our Terms & Privacy Policy. We'll contact you shortly.
                </p>
              </div>
            </form>
          )}
          
          {/* FAQ SECTION */}
          <div className="faq-section">
            <h3 className="faq-title">Frequently Asked Questions</h3>
            <div className="faq-grid">
              <div className="faq-item">
                <h4>How long does GST registration take?</h4>
                <p>Typically 5-7 working days after document submission, subject to department approval.</p>
              </div>
              <div className="faq-item">
                <h4>What are the charges for GST services?</h4>
                <p>We offer affordable packages starting from ₹999 for basic registration. Contact for detailed pricing.</p>
              </div>
              <div className="faq-item">
                <h4>Do you provide post-registration support?</h4>
                <p>Yes, we provide monthly filing reminders and ongoing compliance support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SCHEMA MARKUP FOR FAQ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How long does GST registration take?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Typically 5-7 working days after document submission, subject to department approval."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are the charges for GST services?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We offer affordable packages starting from ₹999 for basic registration. Contact for detailed pricing."
                  }
                }
              ]
            }
          `}
        </script>
      </div>
    </>
  );
}

export default GSTAssistance;