// src/pages/PrivacyPolicy.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./PolicyPages.css";

function PrivacyPolicy() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  const seoConfig = {
    title: "Privacy Policy - Nandi Billing Software | Data Protection & GDPR Compliance",
    description: "Nandi Billing's Privacy Policy: Learn how we protect your business data, ensure GDPR compliance, and secure GST information for Indian SMEs. Your privacy is our priority.",
    keywords: "privacy policy Nandi Billing, data protection, GDPR compliance India, business data security, GST data privacy, Indian software privacy",
    canonical: `${SITE_URL}/privacy-policy`,
    ogImage: `${SITE_URL}/images/privacy-policy-og.jpg`
  };

  // Structured Data for Privacy Policy
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - Nandi Billing Software",
    "description": "Privacy Policy for Nandi Billing Software explaining data protection and privacy practices",
    "url": `${SITE_URL}/privacy-policy`,
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
        <meta name="robots" content="noindex, follow" /> {/* Legal pages typically noindex */}
        
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
                "name": "Privacy Policy",
                "item": `${SITE_URL}/privacy-policy`
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="policy-page">
        <div className="container">
          <header className="policy-header">
            <nav aria-label="Breadcrumb" className="policy-breadcrumb">
              <Link to="/" title="Return to homepage">Home</Link> &gt; <span>Privacy Policy</span>
            </nav>
            <h1>Privacy Policy</h1>
            <p className="policy-subtitle">How we protect and handle your business data</p>
            <p className="last-updated">Last updated: December 1, 2024</p>
          </header>

          <div className="policy-content">
            <section className="policy-section" aria-labelledby="introduction-heading">
              <h2 id="introduction-heading">🔒 Introduction</h2>
              <p>
                Nandi Softech Solutions ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our GST billing software and services. We comply with Indian data protection 
                laws and international privacy standards including GDPR principles.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="information-collected-heading">
              <h2 id="information-collected-heading">📊 Information We Collect</h2>
              
              <h3>Personal Information</h3>
              <p>When you register for our service, we collect essential information including:</p>
              <ul>
                <li>Full name and business contact details</li>
                <li>Business name, address, and registration information</li>
                <li>GST number and other tax identification details</li>
                <li>Email address and verified phone number</li>
                <li>Secure payment and billing information</li>
                <li>Business registration documents when required</li>
              </ul>

              <h3>Business Data</h3>
              <p>To provide comprehensive billing services, we process:</p>
              <ul>
                <li>Customer and supplier contact information</li>
                <li>Invoice data and transaction records</li>
                <li>Inventory details and product catalogs</li>
                <li>Financial reports and business analytics</li>
                <li>GST return preparation data</li>
                <li>Purchase and sales order information</li>
              </ul>

              <h3>Technical Information</h3>
              <p>For service improvement and security, we automatically collect:</p>
              <ul>
                <li>IP address and browser specifications</li>
                <li>Device information and operating system details</li>
                <li>Usage patterns and feature interaction data</li>
                <li>System performance metrics and error logs</li>
                <li>Security event logs and access patterns</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="data-usage-heading">
              <h2 id="data-usage-heading">🎯 How We Use Your Information</h2>
              <p>We use the collected information exclusively for legitimate business purposes:</p>
              <ul>
                <li>Providing and maintaining our GST billing software services</li>
                <li>Generating GST-compliant invoices and financial reports</li>
                <li>Sending critical system updates and security notifications</li>
                <li>Enhancing software features based on user feedback and analytics</li>
                <li>Delivering personalized customer support and training</li>
                <li>Complying with Indian tax laws and regulatory requirements</li>
                <li>Preventing fraudulent activities and ensuring system integrity</li>
                <li>Business analytics to improve service quality and user experience</li>
                <li>Account management and subscription processing</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="data-sharing-heading">
              <h2 id="data-sharing-heading">🤝 Data Sharing and Disclosure</h2>
              <p>We maintain strict confidentiality and do not sell your personal information. Limited sharing occurs with:</p>
              
              <h3>Trusted Service Providers</h3>
              <ul>
                <li>Secure cloud hosting providers for data storage and processing</li>
                <li>Payment gateways for secure transaction processing</li>
                <li>Communication platforms for customer support and notifications</li>
                <li>Analytics services for product improvement and user experience</li>
                <li>Backup and disaster recovery service providers</li>
              </ul>

              <h3>Legal and Regulatory Requirements</h3>
              <p>We may disclose information when legally obligated, including:</p>
              <ul>
                <li>Compliance with GST regulations and tax authorities</li>
                <li>Response to valid legal requests, court orders, or subpoenas</li>
                <li>Protection of our legal rights, user safety, and system security</li>
                <li>Investigation of potential policy violations or fraudulent activities</li>
                <li>Business transfers, mergers, or acquisitions scenarios</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="data-security-heading">
              <h2 id="data-security-heading">🛡️ Data Security</h2>
              <p>We implement enterprise-grade security measures including:</p>
              <ul>
                <li>256-bit SSL encryption for all data transmissions</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication and role-based access controls</li>
                <li>Automated data backup and disaster recovery systems</li>
                <li>Comprehensive employee privacy training programs</li>
                <li>Secure data centers with physical access controls</li>
                <li>Network security monitoring and intrusion detection</li>
                <li>Regular security patches and system updates</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="data-retention-heading">
              <h2 id="data-retention-heading">📁 Data Retention</h2>
              <p>We retain your information for legally required periods and business needs:</p>
              <ul>
                <li>Active service period plus 30 days for account recovery purposes</li>
                <li>7 years for financial records as per Indian tax laws and GST regulations</li>
                <li>Legal dispute resolution periods as necessary</li>
                <li>Business continuity and audit requirements</li>
                <li>Compliance with statutory retention periods</li>
              </ul>
              <p>You can request data deletion subject to our legal obligations and retention requirements.</p>
            </section>

            <section className="policy-section" aria-labelledby="user-rights-heading">
              <h2 id="user-rights-heading">🔍 Your Privacy Rights</h2>
              <p>As a user, you have comprehensive rights under applicable data protection laws:</p>
              <ul>
                <li><strong>Access Right:</strong> Review and access your personal information</li>
                <li><strong>Correction Right:</strong> Update inaccurate or incomplete data</li>
                <li><strong>Deletion Right:</strong> Request data erasure where applicable</li>
                <li><strong>Processing Objection:</strong> Object to certain data processing activities</li>
                <li><strong>Data Portability:</strong> Export your data in machine-readable format</li>
                <li><strong>Consent Withdrawal:</strong> Revoke permissions at any time</li>
                <li><strong>Restriction Right:</strong> Limit processing of your data in specific circumstances</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="cookies-heading">
              <h2 id="cookies-heading">🍪 Cookies and Tracking Technologies</h2>
              <p>
                We use essential cookies and similar technologies to enhance your experience, 
                analyze service usage, and personalize content. Our cookie usage includes:
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for basic functionality and security</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Session Cookies:</strong> Maintain your login session securely</li>
              </ul>
              <p>
                You can manage cookie preferences through your browser settings, though some features 
                may require essential cookies to function properly.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="data-transfers-heading">
              <h2 id="data-transfers-heading">🌐 Data Storage and Transfers</h2>
              <p>
                Your business data is stored on secure servers located within India, ensuring 
                compliance with local data protection regulations. We implement adequate safeguards 
                and standard contractual clauses for any necessary international data transfers 
                to ensure your data remains protected according to Indian privacy standards.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="children-privacy-heading">
              <h2 id="children-privacy-heading">👶 Children's Privacy</h2>
              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly 
                collect personal information from children. If you become aware that a child has provided 
                us with personal information, please contact us immediately.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="contact-heading">
              <h2 id="contact-heading">📞 Contact Our Privacy Team</h2>
              <p>For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer:</p>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Data Protection Officer:</strong> Arjun Nandi
                </div>
                <div className="contact-item">
                  <strong>Email:</strong> 
                  <a href="mailto:privacy@nandisoftechsolutions.in" title="Email Privacy Team">
                    privacy@nandisoftechsolutions.in
                  </a>
                </div>
                <div className="contact-item">
                  <strong>Phone:</strong> 
                  <a href="tel:+918152853260" title="Call Privacy Team">
                    +91 8152853260
                  </a>
                </div>
                <div className="contact-item">
                  <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 7:00 PM IST
                </div>
                <div className="contact-item">
                  <strong>Registered Office:</strong> Bangalore, Karnataka, India
                </div>
                <div className="contact-item">
                  <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 48 hours
                </div>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="complaints-heading">
              <h2 id="complaints-heading">⚖️ Complaints and Grievances</h2>
              <p>
                If you have concerns about how we handle your personal information, please contact our 
                Data Protection Officer first. If you are not satisfied with our response, you have the 
                right to lodge a complaint with the appropriate data protection authority in your jurisdiction.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="updates-heading">
              <h2 id="updates-heading">🔄 Policy Updates</h2>
              <div className="policy-note">
                <p>
                  <strong>Important:</strong> We may update this Privacy Policy to reflect legal changes, 
                  technological advancements, or service improvements. Significant updates will be 
                  communicated via email and notified on our website with a 30-day advance notice. 
                  Continued use of our services after updates constitutes acceptance of the revised policy.
                </p>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="related-policies-heading">
              <h2 id="related-policies-heading">📑 Related Policies</h2>
              <div className="related-links">
                <Link to="/terms-conditions" title="View Terms of Service">Terms of Service</Link>
                <Link to="/refund-policy" title="View Refund Policy">Refund Policy</Link>
                <Link to="/security" title="Learn About Security">Security Overview</Link>
                <Link to="/gdpr" title="GDPR Compliance">GDPR Compliance</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy;