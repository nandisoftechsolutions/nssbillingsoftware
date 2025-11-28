import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Detect screen size and device type
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile, auto-expand on desktop
      if (mobile) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setShowMobileMenu(!showMobileMenu);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const links = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/admin/tenants", label: "Tenants", icon: "👥" },
    { path: "/admin/plans", label: "Plans", icon: "💳" },
    { path: "/admin/revenue", label: "Revenue", icon: "📈" },
    { path: "/admin/blogs", label: "Blogs", icon: "📈" },
    { path: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  // Mobile hamburger menu component
  const MobileMenuButton = () => (
    <button
      className="nandi-mobile-menu-btn"
      onClick={toggleSidebar}
      aria-label="Toggle menu"
    >
      <span className={`nandi-hamburger ${showMobileMenu ? "active" : ""}`}>
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      {isMobile && (
        <div className="nandi-mobile-header">
          <div className="nandi-mobile-header-content">
            <MobileMenuButton />
            <h5 className="nandi-mobile-title">🧠 Nandi Admin</h5>
            <div className="nandi-mobile-actions">
              <button
                className="nandi-mobile-logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`nandi-admin-sidebar ${
          collapsed ? "collapsed" : ""
        } ${isMobile ? "mobile" : ""} ${
          isMobile && showMobileMenu ? "mobile-open" : ""
        }`}
      >
        {/* Header */}
        <div className="nandi-admin-sidebar-header">
          {!isMobile && (
            <button
              className="nandi-toggle-btn"
              onClick={toggleSidebar}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? "»" : "«"}
            </button>
          )}
          
          {(!collapsed || isMobile) && (
            <div className="nandi-admin-sidebar-header-content">
              <h5 className="nandi-admin-title">🧠 Nandi Admin</h5>
              <small className="nandi-admin-subtitle">Control Panel</small>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="nandi-admin-nav">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nandi-admin-nav-link ${
                pathname === link.path ? "active" : ""
              }`}
              onClick={isMobile ? closeMobileMenu : undefined}
            >
              <span className="nandi-admin-nav-icon">{link.icon}</span>
              {(!collapsed || isMobile) && (
                <span className="nandi-admin-nav-label">{link.label}</span>
              )}
              {collapsed && !isMobile && (
                <div className="nandi-tooltip">{link.label}</div>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer - Only show on desktop */}
        {!isMobile && (
          <div className="nandi-admin-sidebar-footer">
            <button
              className="nandi-logout-btn"
              onClick={handleLogout}
            >
              <span className="nandi-logout-icon">🚪</span>
              {!collapsed && <span>Logout</span>}
            </button>
            {!collapsed && (
              <p className="nandi-copyright">
                © {new Date().getFullYear()} Nandi Softech
              </p>
            )}
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && showMobileMenu && (
          <div 
            className="nandi-mobile-overlay"
            onClick={closeMobileMenu}
          />
        )}
      </aside>

      {/* Content spacer for mobile header */}
      {isMobile && <div className="nandi-mobile-spacer"></div>}
    </>
  );
}

export default AdminSidebar;