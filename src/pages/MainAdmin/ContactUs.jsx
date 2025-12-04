// src/pages/ContactUs.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./ContactUs.css";
import api from "../../utils/api";

// ⭐ Correct working import (Vite + Vercel)
import nandiLogo from "../../assets/nandibillinglogo.png";

function ContactUs() {
  const SITE_URL = "https://nssbillingsoftware.vercel.app/";

  // SEO Configuration for Contact Page
  const seoConfig = {
    title: "Contact Nandi Billing - Get GST Billing Software Demo & Support",
    description:
      "Get in touch with Nandi Billing team for software demo, GST billing support, pricing queries. Call +91 8152853260, WhatsApp or email for quick assistance.",
    keywords:
      "contact Nandi Billing, GST software support, billing software demo, Nandi contact, software pricing inquiry, customer support",
    canonical: `${SITE_URL}/contact`,
    ogImage: `${SITE_URL}/images/contact-og-image.jpg`,
  };

  // Structured Data for Contact Page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Nandi Billing Software",
    description:
      "Contact page for Nandi Billing Software - GST billing and inventory management solution",
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "Nandi Softech Solutions",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-8152853260",
        email: "arjun@nandisoftechsolutions.in",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi", "Kannada"],
      },
    },
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // FULL API Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post("/contact/submit", formData);

      if (res.data.success) {
        alert("Thank you! Your message was submitted successfully.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          subject: "",
          message: "",
        });
      } else {
        alert(res.data.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Contact Submit Error:", err);
      alert("Server error! Please try again later.");
    }

    setIsSubmitting(false);
  };

  // Handle text input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Contact action cards
  const contactMethods = [
    {
      icon: "📧",
      title: "Email Us",
      details: "arjun@nandisoftechsolutions.in",
      description: "Send us an email anytime",
      link: "mailto:arjun@nandisoftechsolutions.in",
    },
    {
      icon: "📞",
      title: "Call Us",
      details: "+91 8152853260",
      description: "Mon to Sat, 9AM to 7PM",
      link: "tel:+918152853260",
    },
    {
      icon: "💬",
      title: "WhatsApp",
      details: "+91 8152853260",
      description: "Quick chat support on WhatsApp",
      link: "https://wa.me/918152853260",
    },
    {
      icon: "🏢",
      title: "Visit Office",
      details: "Bangalore, Karnataka",
      description: "Schedule a meeting with us",
      link: "https://maps.google.com",
    },
  ];

  // FAQs
  const faqs = [
    {
      question: "Do you offer a free trial?",
      answer:
        "Yes, we offer a free trial with full access to core features. No credit card required.",
    },
    {
      question: "Is Nandi Billing Software GST compliant?",
      answer:
        "Absolutely! GST automatic calculation, HSN codes, and e-invoicing supported.",
    },
    {
      question: "Can I access it from mobile?",
      answer: "Yes, securely from desktop, laptop, tablet, and mobile.",
    },
    {
      question: "Do you provide onboarding?",
      answer:
        "Yes, full onboarding, screen-share support, and video guides.",
    },
  ];

  return (
    <>
      {/* ❇ SEO Helmet */}
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
        <meta property="og:site_name" content="Nandi Billing Software" />
        <meta property="og:locale" content="en_IN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        <meta name="twitter:image" content={seoConfig.ogImage} />
        <meta name="twitter:site" content="@nandibilling" />

        <meta name="language" content="English" />
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Bangalore, Karnataka" />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Nandi Softech Solutions",
            url: SITE_URL,
            logo: `${SITE_URL}/images/logo.png`,
            description:
              "Provider of India's best GST billing and inventory management software",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Bangalore",
              addressRegion: "Karnataka",
              addressCountry: "IN",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+91-8152853260",
              email: "arjun@nandisoftechsolutions.in",
              contactType: "customer service",
              areaServed: "IN",
              availableLanguage: ["English", "Hindi", "Kannada"],
            },
            sameAs: ["https://www.youtube.com/@NandiSoftechSolutions"],
          })}
        </script>
      </Helmet>

      {/* CONTENT */}
      <div className="nandiContact-page">
        {/* HERO */}
        <section className="nandiContact-hero">
          <div className="container">
            <div className="row align-items-center gy-4">
              <div className="col-lg-6">
                <div className="nandiContact-brandRow">
                  <img
                    src={nandiLogo}
                    alt="Nandi Billing Software - GST Ready Billing Solution"
                    width="120"
                    className="shadow-sm rounded-3"
                    loading="eager"
                  />
                  <div>
                    <p className="nandiContact-brandName">
                      Nandi Billing Software
                    </p>
                    <p className="nandiContact-brandTagline">
                      GST Ready Billing & Inventory Solution
                    </p>
                  </div>
                </div>

                <h1 className="nandiContact-heroTitle">
                  Get in{" "}
                  <span className="nandiContact-gradientText">Touch</span> with
                  Us
                </h1>

                <p className="nandiContact-heroSubtitle">
                  We're here to help you grow your business with our GST billing
                  software solutions.
                </p>

                <div className="nandiContact-heroStats">
                  <div className="nandiContact-statItem">
                    <div className="nandiContact-statNumber">24/7</div>
                    <div className="nandiContact-statLabel">Support</div>
                  </div>
                  <div className="nandiContact-statItem">
                    <div className="nandiContact-statNumber">2h</div>
                    <div className="nandiContact-statLabel">Response Time</div>
                  </div>
                  <div className="nandiContact-statItem">
                    <div className="nandiContact-statNumber">98%</div>
                    <div className="nandiContact-statLabel">Happy Users</div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="nandiContact-heroVisual">
                  <div className="nandiContact-floatingTag nandiContact-tag1">
                    <div className="nandiContact-tagIcon">💬</div>
                    <span>Quick Support</span>
                  </div>

                  <div className="nandiContact-floatingTag nandiContact-tag2">
                    <div className="nandiContact-tagIcon">⚡</div>
                    <span>Fast Response</span>
                  </div>

                  <div className="nandiContact-floatingTag nandiContact-tag3">
                    <div className="nandiContact-tagIcon">🤝</div>
                    <span>Personal Help</span>
                  </div>

                  <div className="nandiContact-heroCard">
                    <div className="nandiContact-heroCardHeader">
                      <span className="nandiContact-heroBadge">
                        Support Center
                      </span>
                    </div>

                    <div className="nandiContact-heroCardBody">
                      <div className="nandiContact-heroIcon">📞</div>
                      <h4>We're Here to Help</h4>
                      <p>Your success is our priority.</p>

                      <div className="nandiContact-heroHighlights">
                        <span>Demo</span>
                        <span>Setup</span>
                        <span>Billing Help</span>
                      </div>
                    </div>

                    <div className="nandiContact-heroFooter">
                      <span className="nandiContact-onlineDot"></span> Live
                      Support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT METHODS */}
        <section className="nandiContact-methodSection">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="nandiContact-sectionTitle">
                Multiple Ways to Connect
              </h2>
              <p className="nandiContact-sectionSubtitle">
                Choose the best way to contact us for GST billing software
                support and inquiries.
              </p>
            </div>

            <div className="row g-4">
              {contactMethods.map((method, index) => (
                <div key={index} className="col-lg-3 col-md-6">
                  <a
                    href={method.link}
                    className="nandiContact-methodCard"
                    target={
                      method.link.startsWith("http") ? "_blank" : "_self"
                    }
                    rel={
                      method.link.startsWith("http")
                        ? "noopener noreferrer"
                        : ""
                    }
                    title={`Contact Nandi Billing via ${method.title}`}
                    aria-label={`Contact Nandi Billing via ${method.title}: ${method.details}`}
                  >
                    <div className="nandiContact-methodIcon">
                      {method.icon}
                    </div>
                    <h3 className="nandiContact-methodTitle">
                      {method.title}
                    </h3>
                    <p className="nandiContact-methodDetails">
                      {method.details}
                    </p>
                    <p className="nandiContact-methodDescription">
                      {method.description}
                    </p>
                    <div className="nandiContact-methodArrow">→</div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT FORM */}
        <section className="nandiContact-formSection" id="contact-form">
          <div className="container">
            <div className="row gy-4">
              <div className="col-lg-8">
                <div className="nandiContact-formCard">
                  <h3 className="nandiContact-formTitle">Send Us a Message</h3>
                  <p className="nandiContact-formSubtitle">
                    Fill out the form below and our team will get back to you
                    within 2 hours.
                  </p>

                  <form onSubmit={handleSubmit}>
                    {/* ----------------  FORM INPUTS  ---------------- */}

                    <div className="row">
                      <div className="col-md-6">
                        <div className="nandiContact-formGroup">
                          <label htmlFor="name">Full Name *</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Your name"
                            aria-required="true"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="nandiContact-formGroup">
                          <label htmlFor="email">Email *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Your email"
                            aria-required="true"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="nandiContact-formGroup">
                          <label htmlFor="phone">Phone</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Your phone number"
                            aria-label="Phone number (optional)"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="nandiContact-formGroup">
                          <label htmlFor="company">Company</label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="Company name"
                            aria-label="Company name (optional)"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="nandiContact-formGroup">
                      <label htmlFor="subject">Subject *</label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        aria-required="true"
                      >
                        <option value="">Select Subject</option>
                        <option value="sales">Sales Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="demo">Request Demo</option>
                        <option value="billing">Billing Queries</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="nandiContact-formGroup">
                      <label htmlFor="message">Message *</label>
                      <textarea
                        id="message"
                        name="message"
                        rows="6"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="How can we help you with GST billing software?"
                        aria-required="true"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="nandiContact-submitBtn"
                      disabled={isSubmitting}
                      aria-label={
                        isSubmitting
                          ? "Sending your message"
                          : "Send message to Nandi Billing"
                      }
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div>
              </div>

              {/* INFO CARD */}
              <div className="col-lg-4">
                <div className="nandiContact-infoCard">
                  <h4 className="nandiContact-infoTitle">Contact Information</h4>

                  <div className="nandiContact-infoItem">
                    <div className="nandiContact-infoIcon">📧</div>
                    <div className="nandiContact-infoContent">
                      <h5>Email</h5>
                      <a href="mailto:arjun@nandisoftechsolutions.in">
                        arjun@nandisoftechsolutions.in
                      </a>
                      <a href="mailto:support@nandisoftechsolutions.in">
                        support@nandisoftechsolutions.in
                      </a>
                    </div>
                  </div>

                  <div className="nandiContact-infoItem">
                    <div className="nandiContact-infoIcon">📞</div>
                    <div className="nandiContact-infoContent">
                      <h5>Phone</h5>
                      <a href="tel:+918152853260">+91 8152853260</a>
                    </div>
                  </div>

                  <div className="nandiContact-infoItem">
                    <div className="nandiContact-infoIcon">🏢</div>
                    <div className="nandiContact-infoContent">
                      <h5>Office</h5>
                      <p>Bangalore, Karnataka, India</p>
                    </div>
                  </div>

                  <div className="nandiContact-infoItem">
                    <div className="nandiContact-infoIcon">🕒</div>
                    <div className="nandiContact-infoContent">
                      <h5>Business Hours</h5>
                      <p>Monday - Saturday: 9:00 AM - 7:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>

                  <p className="mt-3 small">
                    For urgent GST billing software issues, call or WhatsApp us
                    directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="nandiContact-faqSection">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="nandiContact-sectionTitle">
                Frequently Asked Questions
              </h2>
              <p className="nandiContact-sectionSubtitle">
                Common questions about Nandi Billing Software answered
              </p>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="nandiContact-faqList">
                  {faqs.map((faq, index) => (
                    <div key={index} className="nandiContact-faqItem">
                      <h3 className="nandiContact-faqQuestion">
                        {faq.question}
                      </h3>
                      <p className="nandiContact-faqAnswer">{faq.answer}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-4">
                  <p className="nandiContact-moreHelp">
                    Still need help?{" "}
                    <a href="#contact-form">Send us a message</a> or{" "}
                    <Link to="/pricing">check pricing</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="nandiContact-ctaSection">
          <div className="container">
            <div className="nandiContact-ctaCard">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h2 className="nandiContact-ctaTitle">
                    Ready to Start with Nandi Billing Software?
                  </h2>
                  <p className="nandiContact-ctaSubtitle">
                    Join thousands of smart businesses using Nandi Softech
                    Solutions for GST billing and inventory management.
                  </p>
                </div>

                <div className="col-lg-4 text-lg-end">
                  <Link
                    to="/register"
                    className="btn btn-light btn-lg me-2"
                    title="Start Free Trial - Nandi Billing"
                  >
                    Start Free Trial
                  </Link>

                  <Link
                    to="/pricing"
                    className="btn btn-outline-light btn-lg mt-2 mt-lg-0"
                    title="View Pricing Plans - Nandi Billing"
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

export default ContactUs;
