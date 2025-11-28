import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Sidebar.css";

function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState({
    companyName: "Your Company",
    email: "user@example.com",
    tenantName: "My Business",
    plan: "Trial",
    status: "active",
    expiresAt: null,
    isTrial: true,
    daysRemaining: 7
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate days remaining
  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 7;
    
    try {
      const now = new Date();
      const expiryDate = new Date(expiresAt);
      
      if (isNaN(expiryDate.getTime())) {
        console.warn('Invalid expiry date:', expiresAt);
        return 7;
      }
      
      const diffTime = expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 7;
    }
  };

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchTenantInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("🔄 Fetching tenant info...");
      const response = await api.get("/auth/me");
      console.log("🔍 FULL AUTH/ME RESPONSE:", response.data);
      
      // 🚨 CRITICAL FIX: Handle multiple response structures
      let user, company, tenantData;
      
      if (response.data?.success) {
        // Structure 1: response.data.data.user, response.data.data.company, response.data.data.tenant
        if (response.data.data) {
          user = response.data.data.user;
          company = response.data.data.company;
          tenantData = response.data.data.tenant;
          console.log("✅ Using Structure 1: response.data.data");
        } 
        // Structure 2: response.data.user, response.data.company, response.data.tenant
        else {
          user = response.data.user;
          company = response.data.company;
          tenantData = response.data.tenant;
          console.log("✅ Using Structure 2: response.data");
        }
      } else {
        // Direct structure without success wrapper
        user = response.data?.user;
        company = response.data?.company;
        tenantData = response.data?.tenant;
        console.log("✅ Using Direct Structure: response.data");
      }
      
      console.log("📊 Extracted data:", {
        user: user,
        company: company,
        tenant: tenantData
      });
      
      const daysRemaining = calculateDaysRemaining(tenantData?.expiresAt);
      
      // 🎯 SET THE ACTUAL DATA
      setTenant({
        companyName: company?.name || "Your Company",
        email: user?.email || "user@example.com",
        tenantName: tenantData?.companyName || tenantData?.name || company?.name || "My Business",
        plan: tenantData?.planName || tenantData?.plan || "Trial",
        status: tenantData?.status || "active",
        expiresAt: tenantData?.expiresAt,
        isTrial: tenantData?.isTrial !== undefined ? tenantData.isTrial : true,
        daysRemaining: daysRemaining
      });

      console.log("✅ Final tenant state:", {
        companyName: company?.name,
        email: user?.email,
        tenantName: tenantData?.companyName,
        plan: tenantData?.planName,
        daysRemaining: daysRemaining
      });

      // Store in localStorage for fallback
      if (tenantData?.id || tenantData?._id) {
        const tenantId = tenantData.id || tenantData._id;
        localStorage.setItem("tenantId", tenantId);
        console.log("💾 Stored tenantId:", tenantId);
      }
      if (company?.id || company?._id) {
        const companyId = company.id || company._id;
        localStorage.setItem("companyId", companyId);
      }
      if (user?.id || user?._id) {
        const userId = user.id || user._id;
        localStorage.setItem("userId", userId);
      }
      if (user?.email) {
        localStorage.setItem("userEmail", user.email);
        console.log("💾 Stored userEmail:", user.email);
      }
      if (company?.name) {
        localStorage.setItem("companyName", company.name);
        console.log("💾 Stored companyName:", company.name);
      }
      if (tenantData?.planName || tenantData?.plan) {
        const planName = tenantData.planName || tenantData.plan;
        localStorage.setItem("planName", planName);
        console.log("💾 Stored planName:", planName);
      }
      if (tenantData?.expiresAt) {
        localStorage.setItem("expiresAt", tenantData.expiresAt);
        console.log("💾 Stored expiresAt:", tenantData.expiresAt);
      }
      if (tenantData?.isTrial !== undefined) {
        localStorage.setItem("isTrial", tenantData.isTrial.toString());
        console.log("💾 Stored isTrial:", tenantData.isTrial);
      }

    } catch (err) {
      console.error("❌ Failed to load tenant info:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      
      if (err.response?.status === 401) {
        console.log("🔐 Authentication failed, redirecting to login");
        handleLogout();
        return;
      }
      
      // Fallback to localStorage data
      const userEmail = localStorage.getItem("userEmail");
      const companyName = localStorage.getItem("companyName");
      const planName = localStorage.getItem("planName");
      const expiresAt = localStorage.getItem("expiresAt");
      const isTrial = localStorage.getItem("isTrial") !== 'false';
      
      const daysRemaining = calculateDaysRemaining(expiresAt);
      
      console.log("🔄 Using localStorage fallback:", {
        companyName,
        userEmail,
        planName,
        expiresAt,
        isTrial,
        daysRemaining
      });
      
      setTenant({
        companyName: companyName || "Your Company",
        email: userEmail || "user@example.com",
        tenantName: companyName || "My Business",
        plan: planName || "Trial",
        status: "active",
        expiresAt: expiresAt,
        isTrial: isTrial,
        daysRemaining: daysRemaining
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("companyId");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("companyName");
    localStorage.removeItem("planName");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("isTrial");
    localStorage.removeItem("loginTime");
    
    delete api.defaults.headers.common["Authorization"];
    delete api.defaults.headers.common["X-Tenant-ID"];
    
    navigate("/login");
  };

  // Get plan badge color
  const getPlanBadgeClass = () => {
    if (tenant.plan?.toLowerCase().includes("premium")) return "plan-badge premium";
    if (tenant.plan?.toLowerCase().includes("pro")) return "plan-badge pro";
    if (tenant.isTrial) {
      if (tenant.daysRemaining <= 3 && tenant.daysRemaining > 0) return "plan-badge trial-expiring";
      if (tenant.daysRemaining <= 0) return "plan-badge trial-expired";
      return "plan-badge trial";
    }
    return "plan-badge free";
  };

  // Get plan display text
  const getPlanDisplayText = () => {
    if (tenant.isTrial) {
      if (tenant.daysRemaining > 0) {
        return `Trial - ${tenant.daysRemaining} day${tenant.daysRemaining !== 1 ? 's' : ''} left`;
      } else {
        return "Trial Expired";
      }
    }
    return tenant.plan;
  };

  const links = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/inventory", label: "Inventory", icon: "📦" },
    { path: "/invoices", label: "Sales Invoices", icon: "🧾" },
    { path: "/create-invoice", label: "Create Invoice", icon: "➕" },
    { path: "/purchase-invoices", label: "Purchase Invoices", icon: "📥" },
    { path: "/create-purchase-invoice", label: "Create Purchase", icon: "📋" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/suppliers", label: "Suppliers", icon: "🏢" },
    { path: "/reports", label: "Reports", icon: "📈" },
    { path: "/ca-report", label: "CA Report", icon: "👨‍💼" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
    { path: "/subscription", label: "Subscription", icon: "💳" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleNandiSolutionsClick = () => {
    window.open("https://nandisolutions.com", "_blank");
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        className={`sidebar-toggle-btn ${isSidebarOpen ? "open" : ""}`}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <span className="sidebar-toggle-icon">
          {isSidebarOpen ? "✕" : "☰"}
        </span>
      </button>

      {/* Backdrop for mobile */}
      {isSidebarOpen && isMobile && (
        <div className="sidebar-backdrop" onClick={toggleSidebar} />
      )}

      {/* SIDEBAR */}
      <aside className={`nandi-sidebar ${isSidebarOpen ? "open" : "closed"} ${isMobile ? "mobile" : "desktop"}`}>
        {/* HEADER SECTION */}
        <div className="nandi-sidebar-header">
          {/* Tenant Brand */}
          <div className="tenant-brand">
            <div className="tenant-icon">🏢</div>
            <div className="tenant-brand-text">
              {loading ? (
                <>
                  <div className="loading-skeleton"></div>
                  <div className="loading-skeleton" style={{width: '80px', height: '12px'}}></div>
                </>
              ) : (
                <>
                  <h4>{tenant.companyName}</h4>
                  <div className={getPlanBadgeClass()}>
                    {getPlanDisplayText()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tenant Info Box */}
          <div className="tenant-box">
            <div className="tenant-title">Logged in as</div>
            {loading ? (
              <div className="loading-skeleton" style={{width: '100%', height: '14px'}}></div>
            ) : (
              <>
                <div className="tenant-email">{tenant.email}</div>
                <div className="tenant-name">{tenant.tenantName}</div>
                {tenant.isTrial && tenant.daysRemaining > 0 && (
                  <div className="trial-info">
                    ⏳ Trial ends in {tenant.daysRemaining} day{tenant.daysRemaining !== 1 ? 's' : ''}
                  </div>
                )}
                {tenant.isTrial && tenant.daysRemaining <= 0 && (
                  <div className="trial-expired">
                    ❌ Trial expired - <Link to="/subscription" style={{color: '#ff6b6b', textDecoration: 'underline'}}>Upgrade</Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="nandi-sidebar-links">
          <nav>
            {links.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nandi-link ${pathname === link.path ? "active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                style={{animationDelay: `${index * 0.05 + 0.05}s`}}
              >
                <span className="link-icon">{link.icon}</span>
                <span className="link-label">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="nandi-sidebar-bottom">
          {/* Logout Button */}
          <button 
            className="logout-btn"
            onClick={handleLogout}
            disabled={loading}
          >
            <span className="logout-icon">🚪</span>
            {loading ? "Loading..." : "Logout"}
          </button>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="copyright-text">
              © {new Date().getFullYear()} All rights reserved
            </div>
            <div 
              className="nandi-solutions-link"
              onClick={handleNandiSolutionsClick}
              title="Visit Nandi Solutions"
            >
              <span className="nandi-icon">🚀</span>
              Nandi Solutions
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;