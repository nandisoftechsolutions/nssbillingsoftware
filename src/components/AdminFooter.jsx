// src/components/AdminFooter.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import "./AdminFooter.css";

// ⭐ FIXED: Import Vite-compatible logo
import nandiLogo from "../assets/nandibillinglogo.png";

function AdminFooter() {
  return (
    <footer className="admin-footer">
      <div className="admin-footer-container">

        {/* ADMIN PANEL BUTTON */}
        <div className="admin-footer-admin-btn-wrapper">
          <Link to="/admin/login" className="admin-footer-admin-btn">
            🔧 Admin Panel
          </Link>
        </div>

        <div className="admin-footer-separator" />

        <div className="admin-footer-grid">
          {/* COLUMN 1 */}
          <div className="footer-section">
            <h5>Get in Touch</h5>

            <div className="footer-logo-wrap">
              <img src={nandiLogo} alt="Nandi Billing" className="footer-logo" />
              <div className="footer-brand">
                <strong>Nandi Softech Solutions</strong>
                <span>GST Ready Billing Solution</span>
              </div>
            </div>

            <div className="footer-contact-info">
              <div className="footer-item">
                <strong>Email:</strong>
                <a href="mailto:arjun@nandisoftechsolutions.in">
                  arjun@nandisoftechsolutions.in
                </a>
              </div>

              <div className="footer-item">
                <strong>Phone:</strong>
                <a href="tel:+918152853260">+91 8152853260</a>
              </div>
            </div>

            <h6 className="footer-follow-title">Follow Us</h6>
            <div className="footer-social">
              <a href="https://facebook.com/nandisoftechsolutions" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="https://instagram.com/nandisoftechsolutions" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://youtube.com/nandisoftechsolutions" aria-label="YouTube">
                <FaYoutube />
              </a>
              <a href="https://twitter.com/nandisoftech" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com/company/nandisoftechsolutions" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="footer-section">
            <h5>Information</h5>
            <ul className="footer-links">
              <li><Link to="/pricing">💳 Pricing Plans</Link></li>
              <li><Link to="/refund-policy">🔄 Refund Policy</Link></li>
              <li><Link to="/privacy">🔒 Privacy Policy</Link></li>
              <li><Link to="/terms">📄 Terms & Conditions</Link></li>
              <li><Link to="/blog">📝 Blog</Link></li>
              <li><Link to="/contact">📞 Contact</Link></li>
            </ul>

            <h5 className="footer-subtitle">Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/login">🔑 User Login</Link></li>
              <li><Link to="/register">📝 Register</Link></li>
              <li><Link to="/contact">🆘 Support</Link></li>
              <li><Link to="/about">ℹ️ About Us</Link></li>
            </ul>
          </div>

          {/* COLUMN 3 */}
          <div className="footer-section">
            <h5>Our Services</h5>
            <ul className="footer-links">
              <li><Link to="/register">🧾 Billing Software</Link></li>
              <li><Link to="/register">📊 GST Software</Link></li>
              <li><Link to="/register">📦 Inventory Software</Link></li>
              <li><Link to="/register">💳 POS Software</Link></li>
            </ul>

            <h5 className="footer-subtitle">GST Services</h5>
            <ul className="footer-links">
              <li><Link to="/gst">📝 GST Registration</Link></li>
              <li><Link to="/gst">📄 GST Filing</Link></li>
              <li><Link to="/gst">📋 GST Return</Link></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="admin-footer-bottom">
          <p>💼 GST Ready Billing Software | 🚀 Made in India</p>
          <p>
            © {new Date().getFullYear()}{" "}
            <a
              href="https://nandisoftechsolutions.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nandi Softech Solutions
            </a>{" "}
            — All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default AdminFooter;