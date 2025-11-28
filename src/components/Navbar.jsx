import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";  // <== IMPORTED LOGO
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="nandi-navbar navbar navbar-expand-lg px-4">
      
      {/* Brand Logo */}
      <Link className="navbar-brand nandi-brand" to="/">
        <div className="nandi-logo-container">

          <img
            src={logo}
            alt="Nandi Billing Software"
            className="nandi-logo-img"
          />

          <div className="nandi-logo-text">
            <div className="nandi-logo-main">NANDI</div>
            <div className="nandi-logo-sub">Billing Software</div>
          </div>

        </div>
      </Link>

      <button
        className="navbar-toggler nandi-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto align-items-center nandi-nav-links">

          <li className="nav-item">
            <Link className="nav-link nandi-link" to="/features">⚡ Features</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link nandi-link" to="/pricing">💳 Pricing</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link nandi-link" to="/about">👥 About</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link nandi-link" to="/blog"> Blogs</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link nandi-link" to="/contact">📞 Contact</Link>
          </li>

          <li className="nav-item">
            <Link className="nandi-btn-outline ms-2" to="/register">Register</Link>
          </li>

          <li className="nav-item">
            <Link className="nandi-btn-primary ms-2" to="/login">Login</Link>
          </li>

        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
