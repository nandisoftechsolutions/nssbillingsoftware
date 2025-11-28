// src/pages/MainAdmin/RefundPolicy.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./PolicyPages.css";

function RefundPolicy() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  const seoConfig = {
    title: "Refund Policy - Nandi Billing Software | Money Back Guarantee",
    description: "Nandi Billing's Refund Policy: Learn about our 30-day money-back guarantee, cancellation process, and refund eligibility for GST billing software subscriptions.",
    keywords: "refund policy Nandi Billing, money back guarantee, subscription cancellation, software refund, billing software refund policy",
    canonical: `${SITE_URL}/refund-policy`,
    ogImage: `${SITE_URL}/images/refund-policy-og.jpg`
  };

  // Structured Data for Refund Policy
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Refund Policy - Nandi Billing Software",
    "description": "Refund policy and money-back guarantee for Nandi Billing Software subscriptions",
    "url": `${SITE_URL}/refund-policy`,
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
                "name": "Refund Policy",
                "item": `${SITE_URL}/refund-policy`
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="policy-page">
        <div className="container">
          <header className="policy-header">
            <nav aria-label="Breadcrumb" className="policy-breadcrumb">
              <Link to="/" title="Return to homepage">Home</Link> &gt; <span>Refund Policy</span>
            </nav>
            <h1>Refund Policy</h1>
            <p className="policy-subtitle">Our commitment to your satisfaction</p>
            <p className="last-updated">Last updated: December 1, 2024</p>
          </header>

          <div className="policy-content">
            <section className="policy-section" aria-labelledby="introduction-heading">
              <h2 id="introduction-heading">💰 Introduction</h2>
              <p>
                At Nandi Softech Solutions, we strive to provide exceptional GST billing software 
                that meets your business needs. This Refund Policy outlines the terms and conditions 
                governing refunds for our software subscriptions and services.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="moneyback-guarantee-heading">
              <h2 id="moneyback-guarantee-heading">🛡️ 30-Day Money-Back Guarantee</h2>
              <p>
                We offer a 30-day money-back guarantee on all paid subscription plans. If you are 
                not satisfied with our service within the first 30 days of your subscription, you 
                can request a full refund.
              </p>
              
              <div className="refund-highlight">
                <h3>Key Guarantee Terms:</h3>
                <ul>
                  <li>Applies to first-time subscribers only</li>
                  <li>Valid for 30 days from subscription start date</li>
                  <li>Covers all paid subscription plans</li>
                  <li>Full refund of subscription fees</li>
                  <li>No questions asked policy</li>
                </ul>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="eligibility-heading">
              <h2 id="eligibility-heading">✅ Refund Eligibility</h2>
              <p>You are eligible for a refund under the following circumstances:</p>
              
              <h3>Qualifying Conditions</h3>
              <ul>
                <li>Request made within 30 days of initial subscription</li>
                <li>Technical issues that prevent basic software functionality</li>
                <li>Service downtime exceeding 48 consecutive hours</li>
                <li>Double billing or incorrect charge amounts</li>
                <li>Subscription purchased by mistake</li>
              </ul>

              <h3>Non-Qualifying Conditions</h3>
              <ul>
                <li>Requests made after 30 days of subscription</li>
                <li>Change of business requirements or needs</li>
                <li>Lack of usage or engagement with the software</li>
                <li>Issues related to user's internet connection or device</li>
                <li>GST compliance issues arising from user data input errors</li>
                <li>Renewal subscriptions or subsequent billing cycles</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="cancellation-heading">
              <h2 id="cancellation-heading">🚫 Subscription Cancellation</h2>
              
              <h3>Free Trial Period</h3>
              <p>
                During the 14-day free trial, you can cancel at any time without charge. 
                No payment will be processed if you cancel before the trial ends.
              </p>

              <h3>Paid Subscriptions</h3>
              <p>
                You can cancel your paid subscription at any time. Cancellation will take effect 
                at the end of your current billing cycle. No prorated refunds are provided for 
                partial months of service.
              </p>

              <h3>How to Cancel</h3>
              <ul>
                <li>Through your account dashboard under "Billing Settings"</li>
                <li>By emailing our support team at support@nandisoftechsolutions.in</li>
                <li>By contacting our customer support via phone</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="refund-process-heading">
              <h2 id="refund-process-heading">🔄 Refund Process</h2>
              
              <div className="process-steps">
                <div className="process-step">
                  <h4>Step 1: Refund Request</h4>
                  <p>Submit your refund request through any of the following methods:</p>
                  <ul>
                    <li>Email: refunds@nandisoftechsolutions.in</li>
                    <li>Support ticket through your account</li>
                    <li>Phone call to our customer support</li>
                  </ul>
                </div>

                <div className="process-step">
                  <h4>Step 2: Request Review</h4>
                  <p>
                    Our team will review your request within 2 business days. We may contact you 
                    to understand the reasons and attempt to resolve any issues.
                  </p>
                </div>

                <div className="process-step">
                  <h4>Step 3: Refund Processing</h4>
                  <p>
                    Once approved, refunds are processed within 5-7 business days. The refund 
                    will be credited to your original payment method.
                  </p>
                </div>

                <div className="process-step">
                  <h4>Step 4: Confirmation</h4>
                  <p>
                    You will receive email confirmation once the refund has been processed. 
                    Please allow additional time for the refund to appear in your account 
                    based on your bank or payment processor.
                  </p>
                </div>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="processing-time-heading">
              <h2 id="processing-time-heading">⏱️ Refund Processing Time</h2>
              <p>Refunds are processed according to the following timelines:</p>
              <ul>
                <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
                <li><strong>UPI Payments:</strong> 3-5 business days</li>
                <li><strong>Net Banking:</strong> 5-7 business days</li>
                <li><strong>Digital Wallets:</strong> 2-3 business days</li>
              </ul>
              <p>
                The exact timing depends on your bank or payment processor. International 
                refunds may take additional time due to currency conversion and banking procedures.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="special-circumstances-heading">
              <h2 id="special-circumstances-heading">🔍 Special Circumstances</h2>
              
              <h3>Technical Issues</h3>
              <p>
                If you experience persistent technical issues that prevent you from using core 
                features, we will first attempt to resolve the issues. If resolution is not 
                possible, a full refund will be provided regardless of the 30-day period.
              </p>

              <h3>Service Discontinuation</h3>
              <p>
                If we discontinue a service you are subscribed to, we will provide prorated 
                refunds for the unused portion of your subscription.
              </p>

              <h3>Billing Errors</h3>
              <p>
                In case of billing errors, duplicate charges, or incorrect amounts, we will 
                immediately process refunds for the erroneous charges.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="non-refundable-heading">
              <h2 id="non-refundable-heading">❌ Non-Refundable Items</h2>
              <p>The following are not eligible for refunds:</p>
              <ul>
                <li>Setup fees or one-time implementation charges</li>
                <li>Custom development or integration services</li>
                <li>Training and consultation sessions</li>
                <li>Third-party service costs or payment gateway fees</li>
                <li>Subscriptions beyond the first 30 days</li>
                <li>Renewal payments for ongoing subscriptions</li>
              </ul>
            </section>

            <section className="policy-section" aria-labelledby="data-retention-heading">
              <h2 id="data-retention-heading">📊 Data After Refund</h2>
              <p>
                Upon refund processing, your account will be downgraded to the free plan or 
                deactivated. You can export your data before cancellation. We retain your 
                data for 30 days after cancellation, after which it may be permanently deleted 
                in accordance with our data retention policy.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="contact-support-heading">
              <h2 id="contact-support-heading">📞 Contact & Support</h2>
              <p>For refund requests or questions about this policy, contact us:</p>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Refund Requests:</strong> 
                  <a href="mailto:refunds@nandisoftechsolutions.in" title="Email Refund Team">
                    refunds@nandisoftechsolutions.in
                  </a>
                </div>
                <div className="contact-item">
                  <strong>General Support:</strong> 
                  <a href="mailto:support@nandisoftechsolutions.in" title="Email Support Team">
                    support@nandisoftechsolutions.in
                  </a>
                </div>
                <div className="contact-item">
                  <strong>Phone Support:</strong> 
                  <a href="tel:+918152853260" title="Call Support Team">
                    +91 8152853260
                  </a>
                </div>
                <div className="contact-item">
                  <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 7:00 PM IST
                </div>
                <div className="contact-item">
                  <strong>Response Time:</strong> Within 24 hours for refund inquiries
                </div>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="policy-updates-heading">
              <h2 id="policy-updates-heading">🔄 Policy Updates</h2>
              <div className="policy-note">
                <p>
                  <strong>Note:</strong> We reserve the right to modify this refund policy at any time. 
                  Changes will be effective immediately upon posting to our website. For existing 
                  subscribers, the policy in effect at the time of their subscription purchase will 
                  govern their refund eligibility.
                </p>
              </div>
            </section>

            <section className="policy-section" aria-labelledby="dispute-resolution-heading">
              <h2 id="dispute-resolution-heading">⚖️ Dispute Resolution</h2>
              <p>
                If you have any concerns about refund decisions, please contact our customer 
                support team for resolution. Most issues can be resolved quickly to your 
                satisfaction. For formal disputes, please refer to our Terms of Service for 
                dispute resolution procedures.
              </p>
            </section>

            <section className="policy-section" aria-labelledby="related-policies-heading">
              <h2 id="related-policies-heading">📑 Related Policies</h2>
              <div className="related-links">
                <Link to="/terms-conditions" title="View Terms of Service">Terms of Service</Link>
                <Link to="/privacy-policy" title="Read Privacy Policy">Privacy Policy</Link>
                <Link to="/pricing" title="View Pricing Plans">Pricing Plans</Link>
                <Link to="/contact" title="Contact Support">Contact Support</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default RefundPolicy;