// src/pages/TermsConditions.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./PolicyPages.css";

function TermsConditions() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  const seoConfig = {
    title: "Terms & Conditions - Nandi Billing Software | Legal Agreement",
    description: "Read Nandi Billing's Terms & Conditions. Legal agreement for GST billing software usage, subscription terms, data ownership, and user responsibilities for Indian businesses.",
    keywords: "terms and conditions, Nandi Billing legal, software agreement, GST billing terms, subscription agreement, user agreement",
    canonical: `${SITE_URL}/terms-conditions`,
    ogImage: `${SITE_URL}/images/terms-og.jpg`
  };

  // Structured Data for Terms & Conditions
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms and Conditions - Nandi Billing Software",
    "description": "Legal terms and conditions for using Nandi Billing GST software services",
    "url": `${SITE_URL}/terms-conditions`,
    "lastReviewed": "2024-12-01",
    "publisher": {
      "@type": "Organization",
      "name": "Nandi Softech Solutions",
      "url": SITE_URL
    }
  };

  return (
    <>
      <Helmet>
        {/* === BASIC META TAGS === */}
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords} />
        <meta name="robots" content="noindex, follow" />
        
        {/* === CANONICAL URL === */}
        <link rel="canonical" href={seoConfig.canonical} />
        
        {/* === OPEN GRAPH TAGS === */}
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:url" content={seoConfig.canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Nandi Billing Software" />
        
        {/* === TWITTER CARD TAGS === */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        
        {/* === STRUCTURED DATA (JSON-LD) === */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* === BREADCRUMB STRUCTURED DATA === */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Terms & Conditions",
                "item": `${SITE_URL}/terms-conditions`
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="policy-page">
        <div className="container">
          <header className="policy-header">
            <nav aria-label="Breadcrumb" className="policy-breadcrumb">
              <Link to="/" title="Return to homepage">Home</Link> &gt; <span>Terms & Conditions</span>
            </nav>
            <h1>Terms & Conditions</h1>
            <p className="policy-subtitle">Legal Agreement for Nandi Billing Software Usage</p>
            <p className="last-updated">Last updated: December 1, 2024</p>
          </header>

          <div className="policy-content">
            <section className="policy-section" aria-labelledby="agreement-terms-heading">
              <h2 id="agreement-terms-heading">📝 Agreement to Terms</h2>
              <p>
                By accessing and using Nandi Billing Software ("the Service"), you accept and agree to be bound 
                by the terms and provisions of this legal agreement. These Terms & Conditions govern your use 
                of our GST billing and inventory management software. If you do not agree to abide by these terms, 
                please do not use this service.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="eligibility-heading">
              <h2 id="eligibility-heading">👤 User Eligibility</h2>
              <p>To use our Service, you must meet the following requirements:</p>
              <ul>
                <li>Be at least 18 years of age or the legal age of majority in your jurisdiction</li>
                <li>Have the legal authority to represent your business or organization</li>
                <li>Provide accurate, current, and complete registration information</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
                <li>Comply with all applicable Indian laws and tax regulations</li>
                <li>Use the Service only for legitimate business purposes</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="service-description-heading">
              <h2 id="service-description-heading">💼 Service Description</h2>
              <p>
                Nandi Billing Software provides comprehensive cloud-based billing, inventory management, 
                and GST compliance solutions specifically designed for Indian businesses. Our services include:
              </p>
              <ul>
                <li>Automated GST-compliant invoice generation with tax calculations</li>
                <li>Real-time inventory tracking and stock management</li>
                <li>Customer relationship management and supplier databases</li>
                <li>Financial reporting, analytics, and business insights</li>
                <li>Mobile application access for on-the-go business management</li>
                <li>Secure data backup, encryption, and disaster recovery</li>
                <li>Multi-user access with role-based permissions</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="subscription-billing-heading">
              <h2 id="subscription-billing-heading">💰 Subscription and Billing Terms</h2>
              
              <h3>Free Trial Period</h3>
              <p>
                We offer a 14-day free trial with full access to core features. No credit card required 
                during the trial period. You may cancel at any time during the trial without incurring charges.
              </p>

              <h3>Paid Subscription Plans</h3>
              <p>
                After the trial period concludes, you must select a subscription plan and provide valid 
                payment information. All subscription fees are billed in advance on either monthly or 
                annual billing cycles, with annual plans offering cost savings.
              </p>

              <h3>Price Modification Policy</h3>
              <p>
                We reserve the right to modify subscription fees with prior notification. Users will 
                receive at least 30 days written notice before any price changes become effective for 
                existing subscriptions.
              </p>

              <h3>Automatic Renewal Process</h3>
              <p>
                All subscriptions automatically renew at the conclusion of each billing period. You may 
                cancel automatic renewal at any time before the renewal date through your account settings.
              </p>

              <h3>Refund Policy</h3>
              <p>
                Subscription fees are non-refundable except as required by applicable law. We offer 
                prorated refunds only in specific circumstances outlined in our separate Refund Policy.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="prohibited-activities-heading">
              <h2 id="prohibited-activities-heading">🚫 Prohibited Activities</h2>
              <p>You expressly agree not to engage in the following activities:</p>
              <ul>
                <li>Use the Service for any unlawful, fraudulent, or malicious purposes</li>
                <li>Attempt to gain unauthorized access to our systems, networks, or other users' data</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive source code</li>
                <li>Use the Service to store, transmit, or distribute viruses or malicious code</li>
                <li>Share, transfer, or sell your account credentials to third parties</li>
                <li>Use the Service to process excessive, fraudulent, or suspicious transactions</li>
                <li>Violate any applicable GST laws, tax regulations, or financial compliance requirements</li>
                <li>Circumvent any security measures or access controls implemented in the Service</li>
                <li>Use automated systems, bots, or scrapers to access the Service</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="data-ownership-heading">
              <h2 id="data-ownership-heading">📊 Data Ownership and Responsibilities</h2>
              <p>
                You retain complete ownership of all business data submitted to the Service. We process 
                your data solely to provide the Service and comply with legal obligations. As the data owner, 
                you are responsible for:
              </p>
              <ul>
                <li>Ensuring the accuracy, completeness, and legality of all submitted data</li>
                <li>Maintaining independent backups of critical business information</li>
                <li>Complying with all applicable data protection and privacy laws</li>
                <li>Obtaining necessary consents for data processing from your customers</li>
                <li>Ensuring data transferred to our Service does not infringe third-party rights</li>
                <li>Promptly notifying us of any data inaccuracies or required updates</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="intellectual-property-heading">
              <h2 id="intellectual-property-heading">⚖️ Intellectual Property Rights</h2>
              <p>
                All intellectual property rights in the Nandi Billing Software, including but not limited to 
                software code, user interface, documentation, trademarks, and branding elements, are the 
                exclusive property of Nandi Softech Solutions. You are granted a limited, non-exclusive, 
                non-transferable, revocable license to use the Service solely for your internal business 
                operations during the subscription term.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="warranties-heading">
              <h2 id="warranties-heading">🛡️ Disclaimer of Warranties</h2>
              <p>
                The Service is provided on an "as is" and "as available" basis without warranties of any kind, 
                either express or implied. While we strive to provide reliable and accurate service, we do not 
                guarantee uninterrupted, timely, secure, or error-free operation. You are solely responsible 
                for verifying the accuracy of GST calculations, tax reports, and compliance documentation 
                generated by the Service.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="liability-heading">
              <h2 id="liability-heading">📈 Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Nandi Softech Solutions shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages, including but not 
                limited to:
              </p>
              <ul>
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Data loss, corruption, or unauthorized access</li>
                <li>Service interruptions, downtime, or performance issues</li>
                <li>GST compliance issues arising from user error or incorrect data input</li>
                <li>Business disruption or operational delays</li>
                <li>Third-party claims or disputes</li>
              </ul>
              <p>
                Our total cumulative liability shall not exceed the total subscription fees paid by you 
                during the six-month period preceding the claim.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="termination-heading">
              <h2 id="termination-heading">🔚 Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account for violations of these terms. 
                Upon termination:
              </p>
              <ul>
                <li>Your right to access and use the Service immediately ceases</li>
                <li>You must discontinue all use of the software and related services</li>
                <li>We may retain your data as required by legal and regulatory obligations</li>
                <li>Any outstanding payments become immediately due and payable</li>
                <li>You may request data export within 30 days of termination</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="gst-compliance-heading">
              <h2 id="gst-compliance-heading">📋 GST Compliance Responsibilities</h2>
              <p>
                While our software is designed to facilitate GST compliance, you retain ultimate 
                responsibility for:
              </p>
              <ul>
                <li>Verifying all GST calculations, tax rates, and return preparations</li>
                <li>Timely filing of GST returns with the appropriate tax authorities</li>
                <li>Maintaining proper records and documentation as required by Indian tax law</li>
                <li>Ensuring correct application of HSN/SAC codes for all products and services</li>
                <li>Complying with e-invoicing requirements and digital signature regulations</li>
                <li>Staying updated with changing GST laws and compliance requirements</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="governing-law-heading">
              <h2 id="governing-law-heading">📞 Governing Law and Dispute Resolution</h2>
              <p>
                These Terms & Conditions shall be governed by and construed in accordance with the laws 
                of India, without regard to its conflict of law provisions. Any disputes, claims, or 
                controversies arising from or relating to these terms shall be subject to the exclusive 
                jurisdiction of the courts located in Bangalore, Karnataka.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="contact-legal-heading">
              <h2 id="contact-legal-heading">📧 Legal Contact Information</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Legal Entity:</strong> Nandi Softech Solutions
                </div>
                <div className="contact-item">
                  <strong>Legal Email:</strong> 
                  <a href="mailto:legal@nandisoftechsolutions.in" title="Contact Legal Department">
                    legal@nandisoftechsolutions.in
                  </a>
                </div>
                <div className="contact-item">
                  <strong>Legal Phone:</strong> 
                  <a href="tel:+918152853260" title="Call Legal Department">
                    +91 8152853260
                  </a>
                </div>
                <div className="contact-item">
                  <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM IST
                </div>
                <div className="contact-item">
                  <strong>Registered Office:</strong> Bangalore, Karnataka, India
                </div>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="modifications-heading">
              <h2 id="modifications-heading">🔄 Terms Modification</h2>
              <div className="policy-note">
                <p>
                  <strong>Important Notice:</strong> We reserve the right to modify these Terms & Conditions 
                  at any time to reflect legal requirements, service changes, or business practices. 
                  Material changes will be communicated via email and notified on our website at least 
                  30 days in advance. Continued use of the Service after changes constitutes acceptance 
                  of the modified terms.
                </p>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="related-documents-heading">
              <h2 id="related-documents-heading">📑 Related Legal Documents</h2>
              <div className="related-links">
                <Link to="/privacy-policy" title="Read Privacy Policy">Privacy Policy</Link>
                <Link to="/refund-policy" title="View Refund Policy">Refund Policy</Link>
                <Link to="/security" title="Security Overview">Security Measures</Link>
                <Link to="/gdpr" title="GDPR Compliance">GDPR Compliance</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default TermsConditions;