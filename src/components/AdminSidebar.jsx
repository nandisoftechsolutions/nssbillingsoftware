import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import "./AdminSidebar.css";

function AdminSidebar({ mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setCollapsed(mobile ? true : false);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const toggleSidebar = () => {
    if (isMobile) onClose();
    else setCollapsed(!collapsed);
  };

  const handleLinkClick = () => {
    if (isMobile) onClose();
  };

  const links = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/tenants", label: "Tenants", icon: "🏢" },
    { path: "/admin/plans", label: "Plans", icon: "💳" },
    { path: "/admin/revenue", label: "Revenue", icon: "💰" },
    { path: "/admin/blogs", label: "Blogs", icon: "📝" },
    { path: "/manageadmin", label: "Manage Admins", icon: "👥" },
    { path: "/admin/mrating", label: "Customers Manage Ratings", icon: "👥" },
    { path: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <>
      <aside
        className={`nandi-admin-sidebar ${
          collapsed ? "collapsed" : ""
        } ${isMobile ? "mobile" : ""} ${
          isMobile && mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="nandi-admin-sidebar-header">
          {!isMobile && (
            <button
              className="nandi-toggle-btn"
              onClick={toggleSidebar}
            >
              {collapsed ? "→" : "←"}
            </button>
          )}

          {(!collapsed || isMobile) && (
            <div className="nandi-admin-sidebar-header-content">
              <div className="nandi-admin-logo">
                <span className="nandi-logo-icon">🧠</span>
                <div className="nandi-logo-text">
                  <h5 className="nandi-admin-title">Nandi Admin</h5>
                  <small className="nandi-admin-subtitle">
                    Control Panel
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="nandi-admin-nav">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nandi-admin-nav-link ${
                pathname === link.path ? "active" : ""
              }`}
              onClick={handleLinkClick}
            >
              <span className="nandi-admin-nav-icon">{link.icon}</span>

              {(!collapsed || isMobile) && (
                <span className="nandi-admin-nav-label">
                  {link.label}
                </span>
              )}

              {collapsed && !isMobile && (
                <div className="nandi-tooltip">{link.label}</div>
              )}
            </Link>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="nandi-admin-sidebar-footer">
          <button className="nandi-logout-btn" onClick={handleLogout}>
            <span className="nandi-logout-icon">🚪</span>
            {(!collapsed || isMobile) && <span>Logout</span>}
          </button>
          {(!collapsed || isMobile) && (
            <p className="nandi-copyright">
              © {new Date().getFullYear()} Nandi Softech
            </p>
          )}
        </div>
      </aside>

      {/* FIXED — MOBILE OVERLAY IN BODY (NOT INSIDE SIDEBAR) */}
      {isMobile && mobileOpen &&
        createPortal(
          <div className="nandi-mobile-overlay" onClick={onClose}></div>,
          document.body
        )}
    </>
  );
}

export default AdminSidebar;
