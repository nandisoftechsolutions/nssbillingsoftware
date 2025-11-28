// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import Navbar from "./components/Navbar";
import AdminFooter from "./components/AdminFooter";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/MainAdmin/Landing"));
const Login = lazy(() => import("./pages/MainAdmin/Login"));
const Register = lazy(() => import("./pages/MainAdmin/Register"));
const RenewPlan = lazy(() => import("./pages/MainAdmin/RenewPlan"));
const Dashboard = lazy(() => import("./pages/Tenants/Dashboard"));

const InvoiceCreate = lazy(() => import("./pages/Tenants/InvoiceCreate"));
const InvoicePreview = lazy(() => import("./pages/Tenants/InvoicePreview"));
const ManageInvoices = lazy(() => import("./pages/Tenants/ManageInvoices"));
const Customers = lazy(() => import("./pages/Tenants/Customers"));
const Inventory = lazy(() => import("./pages/Tenants/Inventory"));
const Reports = lazy(() => import("./pages/Tenants/Reports"));
const Settings = lazy(() => import("./pages/Tenants/Settings"));
const Subscription = lazy(() => import("./pages/Tenants/Upgrade"));
const Pricing = lazy(() => import("./pages/MainAdmin/Pricing"));
const AddProduct = lazy(() => import("./pages/Tenants/AddProduct"));

const PurchaseInvoiceList = lazy(() =>
  import("./pages/Tenants/PurchaseInvoiceList")
);
const PurchaseInvoiceCreate = lazy(() =>
  import("./pages/Tenants/PurchaseInvoiceCreate")
);
const Suppliers = lazy(() => import("./pages/Tenants/Suppliers"));

const CAReport = lazy(() => import("./pages/Tenants/CAReport"));

const AdminDashboard = lazy(() =>
  import("./pages/MainAdmin/AdminDashboard")
);
const AdminTenants = lazy(() => import("./pages/MainAdmin/AdminTenants"));
const AdminPlans = lazy(() => import("./pages/MainAdmin/AdminPlans"));
const AdminRevenue = lazy(() => import("./pages/MainAdmin/AdminRevenue"));
const AdminSettings = lazy(() => import("./pages/MainAdmin/AdminSettings"));
const AdminLogin = lazy(() => import("./pages/MainAdmin/AdminLogin"));

const AboutUs = lazy(() => import("./pages/MainAdmin/AboutUs"));
const ContactUs = lazy(() => import("./pages/MainAdmin/ContactUs"));
const Features = lazy(() => import("./pages/MainAdmin/Features"));
const RefundPolicy = lazy(() => import("./pages/MainAdmin/RefundPolicy"));
const TermsConditions = lazy(() =>
  import("./pages/MainAdmin/TermsConditions")
);
const PrivacyPolicy = lazy(() =>
  import("./pages/MainAdmin/PrivacyPolicy")
);

// BLOG
const BlogPage = lazy(() => import("./pages/MainAdmin/BlogPage"));
const AdminBlogs = lazy(() => import("./pages/MainAdmin/AdminBlogs"));
const BlogSingle = lazy(() => import("./pages/MainAdmin/BlogSingle"));

// Scroll-to-top
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Loader
function Loader() {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "60vh" }}
    >
      <div className="spinner-border text-primary mb-3" role="status" />
      <p className="text-secondary mb-0">Loading...</p>
    </div>
  );
}

function App() {
  const { pathname } = useLocation();

  // Admin pages (no navbar/footer)
  const isAdminRoute = pathname.startsWith("/admin");

  // Tenant routes hide navbar/footer
  const tenantRoutes = [
    "/dashboard",
    "/invoices",
    "/create-invoice",
    "/invoice-preview",
    "/customers",
    "/inventory",
    "/reports",
    "/ca-report",
    "/settings",
    "/subscription",
    "/add-product",
    "/edit-product",
    "/purchase-invoices",
    "/create-purchase-invoice",
    "/suppliers",
  ];

  const isTenantRoute = tenantRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Public pages show header/footer
  const showHeaderFooter = !isAdminRoute && !isTenantRoute;

  return (
    <div
      className="app-wrapper"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f5f7fa",
      }}
    >
      {/* Default SEO for all pages */}
      <Helmet>
        <title>Nandi Billing Software – GST Invoicing, Inventory & Business Tools</title>
        <meta
          name="description"
          content="Nandi Billing Software with GST billing, inventory management, and business automation for Indian SMEs."
        />
        <meta
          name="keywords"
          content="gst billing, billing software, invoicing, inventory management, business software, india"
        />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="Nandi Softech Solutions" />
      </Helmet>

      {/* Navbar only for public pages */}
      {showHeaderFooter && <Navbar />}

      <ScrollToTop />

      <main className={showHeaderFooter ? "flex-grow-1" : ""}>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/features" element={<Features />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* BLOG ROUTES */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogSingle />} />

            {/* Tenant */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<ManageInvoices />} />
            <Route path="/invoices/:id" element={<InvoicePreview />} />
            <Route path="/create-invoice" element={<InvoiceCreate />} />
            <Route
              path="/invoice-preview/:id"
              element={<InvoicePreview />}
            />
            <Route path="/customers" element={<Customers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ca-report" element={<CAReport />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product/:id" element={<AddProduct />} />

            {/* Purchase */}
            <Route
              path="/purchase-invoices"
              element={<PurchaseInvoiceList />}
            />
            <Route
              path="/create-purchase-invoice"
              element={<PurchaseInvoiceCreate />}
            />
            <Route path="/suppliers" element={<Suppliers />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tenants" element={<AdminTenants />} />
            <Route path="/admin/plans" element={<AdminPlans />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/renewal" element={<RenewPlan />} />
            <Route path="/admin/blogs" element={<AdminBlogs />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="text-center mt-5">
                  <h3 className="text-danger fw-bold">
                    404 - Page Not Found
                  </h3>
                  <p className="text-secondary">
                    The page you're looking for doesn't exist.
                  </p>
                  <a href="/" className="btn btn-primary mt-3">
                    Go Home
                  </a>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* Footer only on public pages */}
      {showHeaderFooter && (
        <footer className="mt-auto">
          <AdminFooter />
        </footer>
      )}

      {/* HIDDEN PRELOAD IMAGE to remove Chrome warnings */}
      <img
        src="/banner.png"
        alt="preload"
        style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
      />
    </div>
  );
}

export default App;
