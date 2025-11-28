import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import api from "../../utils/api";
import nandiLogo from "../../assets/nandibillinglogo.png";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [expiredInfo, setExpiredInfo] = useState(null);
  const [stoppedInfo, setStoppedInfo] = useState(null);
  const [passwordResetInfo, setPasswordResetInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // SEO metadata
  const pageTitle = "Login to Nandi Billing Software | Secure Business Management";
  const pageDescription = "Sign in to Nandi Billing Software to manage your business invoicing, inventory, and accounting. Secure cloud-based billing solution.";
  const canonicalUrl = "https://nssbillingsoftware.vercel.app/login";
  const siteName = "Nandi Billing Software";

  useEffect(() => {
    if (serverError) setServerError("");
    if (errors.email && form.email) setErrors(prev => ({ ...prev, email: "" }));
    if (errors.password && form.password)
      setErrors(prev => ({ ...prev, password: "" }));
  }, [form.email, form.password]);

  useEffect(() => {
    if ((expiredInfo || stoppedInfo || passwordResetInfo) && !isRedirecting) {
      setIsRedirecting(true);

      const interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);

            if (stoppedInfo)
              sessionStorage.setItem("suspendedInfo", JSON.stringify(stoppedInfo));

            if (expiredInfo)
              sessionStorage.setItem("expiredInfo", JSON.stringify(expiredInfo));

            if (passwordResetInfo)
              sessionStorage.setItem("passwordResetInfo", JSON.stringify(passwordResetInfo));

            sessionStorage.setItem("userEmail", form.email);

            navigate("/renewal", {
              state: {
                from: "login",
                userEmail: form.email,
                ...(expiredInfo && { expiredInfo }),
                ...(stoppedInfo && { stoppedInfo }),
                ...(passwordResetInfo && { passwordResetInfo })
              }
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expiredInfo, stoppedInfo, passwordResetInfo, navigate, isRedirecting, form.email]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email";

    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Minimum 6 characters required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const handleManualRedirect = () => {
    if (stoppedInfo)
      sessionStorage.setItem("suspendedInfo", JSON.stringify(stoppedInfo));

    if (expiredInfo)
      sessionStorage.setItem("expiredInfo", JSON.stringify(expiredInfo));

    if (passwordResetInfo)
      sessionStorage.setItem("passwordResetInfo", JSON.stringify(passwordResetInfo));

    sessionStorage.setItem("userEmail", form.email);

    navigate("/renewal", {
      state: {
        from: "login",
        userEmail: form.email,
        ...(expiredInfo && { expiredInfo }),
        ...(stoppedInfo && { stoppedInfo }),
        ...(passwordResetInfo && { passwordResetInfo })
      }
    });
  };

  const handleTemporaryPasswordLogin = () => {
    setForm(prev => ({ ...prev, password: "temp123" }));
    setPasswordResetInfo(null);
  };

  const handleLogin = async e => {
    e.preventDefault();
    setServerError("");
    setExpiredInfo(null);
    setStoppedInfo(null);
    setPasswordResetInfo(null);
    setIsRedirecting(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("🔐 Attempting login for:", form.email);
      const res = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      console.log("✅ Login response:", res.data);

      if (res.data.success && res.data.token) {
        // ✅ CRITICAL: Store ALL multi-tenant data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("tenantId", res.data.tenantId);
        localStorage.setItem("companyId", res.data.companyId);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("userEmail", res.data.user.email);
        localStorage.setItem("userName", res.data.user.name || res.data.user.email);
        localStorage.setItem("loginTime", new Date().toISOString());

        // ✅ Set default API headers for multi-tenant isolation
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        api.defaults.headers.common["X-Tenant-ID"] = res.data.tenantId;

        console.log("🔐 Multi-tenant login successful!");
        console.log("📦 Stored data:", {
          token: res.data.token ? "YES" : "NO",
          tenantId: res.data.tenantId ? "YES" : "NO",
          companyId: res.data.companyId ? "YES" : "NO",
          userId: res.data.userId ? "YES" : "NO"
        });

        setForm({ email: "", password: "" });
        setServerError("success");

        // ✅ Short delay to ensure localStorage is set before navigation
        setTimeout(() => {
          console.log("🔄 Redirecting to dashboard...");
          navigate("/dashboard", { replace: true });
        }, 500);
      } else {
        setServerError("Login failed. Invalid response from server.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      const data = err.response?.data || {};

      if (err.response?.status === 403) {
        if (data.stoppedByAdmin) {
          setStoppedInfo({
            message: data.message || "Account suspended by admin",
            reason: "suspended"
          });
          setLoading(false);
          return;
        }

        if (data.subscriptionExpired) {
          setExpiredInfo({
            message: data.message || "Subscription expired",
            expiredOn: data.expiredOn,
            planName: data.planName
          });
          setLoading(false);
          return;
        }

        if (data.needsPasswordReset) {
          setPasswordResetInfo({
            message: data.message || "Password reset required",
            temporaryPassword: data.temporaryPassword
          });
          setLoading(false);
          return;
        }
      }

      // Handle server errors
      if (err.response?.status === 500) {
        setServerError(data.message || "Server error. Please try again later.");
      } else {
        setServerError(
          data.message || data.error || "Login failed. Incorrect email or password."
        );
      }

      setForm(prev => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "mainEntity": {
      "@type": "AuthenticationAndRegistration",
      "name": "Login System",
      "description": "Secure login system for Nandi Billing Software",
      "authentication": {
        "@type": "Authentication",
        "authenticationType": "form-based authentication"
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "url": "https://nssbillingsoftware.vercel.app"
    }
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="billing software, login, business management, invoicing, accounting software, Nandi Billing, cloud billing" />
        <meta name="author" content="Nandi Billing Software" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:image" content="https://nssbillingsoftware.vercel.app/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content="https://nssbillingsoftware.vercel.app/twitter-image.jpg" />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#5b8df7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preload critical resources */}
        <link rel="preload" href={nandiLogo} as="image" />
      </Helmet>

      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          padding: "20px",
          background: "linear-gradient(135deg, #5b8df7 0%, #6c47ce 100%)"
        }}
        role="main"
        aria-label="Login page"
      >
        <div
          className="card shadow-lg border-0 rounded-4 p-4 p-md-5"
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)"
          }}
          itemScope
          itemType="https://schema.org/LoginAction"
        >
          {/* LOGO with structured data */}
          <div className="text-center mb-4">
            <img
              src={nandiLogo}
              alt="Nandi Billing Software - Business Management Solution"
              width="120"
              className="shadow-sm rounded-3"
              itemProp="image"
              loading="eager"
            />
            <h1 className="fw-bold text-dark mt-3" style={{ fontSize: "1.8rem" }}>
              Welcome Back
            </h1>
            <p className="text-muted small" itemProp="description">
              Log in to continue managing your business
            </p>
          </div>

          {/* ERROR / EXPIRED / SUSPENDED / PASSWORD RESET HANDLERS */}
          {stoppedInfo && (
            <div 
              className="alert alert-danger rounded-3 text-center"
              role="alert"
              aria-live="polite"
            >
              <h2 className="h5 fw-bold text-danger">Account Suspended</h2>
              <p>{stoppedInfo.message}</p>
              <p className="small">Redirecting in {redirectCountdown} seconds...</p>
              <button 
                className="btn btn-warning btn-sm" 
                onClick={handleManualRedirect}
                aria-label="Go to renewal page to resolve account suspension"
              >
                Go to Renewal Page
              </button>
            </div>
          )}

          {expiredInfo && (
            <div 
              className="alert alert-warning rounded-3 text-center"
              role="alert"
              aria-live="polite"
            >
              <h2 className="h5 fw-bold text-dark">Subscription Expired</h2>
              <p>{expiredInfo.message}</p>
              <p className="small">Redirecting in {redirectCountdown} seconds...</p>
              <button 
                className="btn btn-warning btn-sm" 
                onClick={handleManualRedirect}
                aria-label="Renew your subscription now"
              >
                Renew Now
              </button>
            </div>
          )}

          {passwordResetInfo && (
            <div 
              className="alert alert-info rounded-3 text-center"
              role="alert"
              aria-live="polite"
            >
              <h2 className="h5 fw-bold text-dark">Password Reset Required</h2>
              <p>{passwordResetInfo.message}</p>
              {passwordResetInfo.temporaryPassword && (
                <p className="fw-bold">
                  Temporary Password: <code aria-label="Temporary password">{passwordResetInfo.temporaryPassword}</code>
                </p>
              )}
              <button 
                className="btn btn-info btn-sm me-2" 
                onClick={handleTemporaryPasswordLogin}
                aria-label="Use temporary password to login"
              >
                Use Temporary Password
              </button>
              <button 
                className="btn btn-warning btn-sm" 
                onClick={handleManualRedirect}
                aria-label="Reset your password"
              >
                Reset Password
              </button>
            </div>
          )}

          {serverError === "success" && (
            <div 
              className="alert alert-success text-center rounded-3"
              role="alert"
              aria-live="polite"
            >
              <strong>Login successful!</strong>
              <p>Redirecting to dashboard...</p>
            </div>
          )}

          {serverError && serverError !== "success" && !stoppedInfo && !expiredInfo && !passwordResetInfo && (
            <div 
              className="alert alert-danger text-center rounded-3"
              role="alert"
              aria-live="assertive"
            >
              {serverError}
            </div>
          )}

          {/* LOGIN FORM */}
          {!expiredInfo && !stoppedInfo && !passwordResetInfo && (
            <form 
              onSubmit={handleLogin}
              itemScope
              itemType="https://schema.org/LoginAction"
              noValidate
            >
              <meta itemProp="target" content={canonicalUrl} />
              
              {/* Email Field */}
              <div className="mb-3">
                <label htmlFor="login-email" className="form-label fw-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  className={`form-control form-control-lg ${
                    errors.email ? "is-invalid" : ""
                  }`}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  disabled={loading}
                  autoComplete="email"
                  aria-describedby={errors.email ? "email-error" : "email-help"}
                  aria-required="true"
                  itemProp="identifier"
                />
                {errors.email && (
                  <div id="email-error" className="invalid-feedback" role="alert">
                    {errors.email}
                  </div>
                )}
                <div id="email-help" className="form-text visually-hidden">
                  Enter your registered email address
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label htmlFor="login-password" className="form-label fw-semibold">
                  Password
                </label>
                <div className="input-group input-group-lg">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    className={`form-control ${
                      errors.password ? "is-invalid" : ""
                    }`}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    aria-describedby={errors.password ? "password-error" : "password-help"}
                    aria-required="true"
                    itemProp="password"
                  />
                  <button
                    type="button"
                    className="input-group-text"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-controls="login-password"
                  >
                    <i 
                      className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                      aria-hidden="true"
                    ></i>
                  </button>
                </div>
                {errors.password && (
                  <div id="password-error" className="invalid-feedback d-block" role="alert">
                    {errors.password}
                  </div>
                )}
                <div id="password-help" className="form-text visually-hidden">
                  Enter your account password
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 fw-bold py-3"
                aria-label={loading ? "Signing in to your account" : "Sign in to your account"}
                itemProp="handler"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span aria-live="polite">Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Registration Link */}
              <div className="text-center mt-3">
                <p className="text-muted">
                  Don't have an account?{" "}
                  <Link 
                    to="/register" 
                    className="text-primary fw-bold"
                    aria-label="Create a new Nandi Billing Software account"
                    itemProp="potentialAction"
                  >
                    Register Now
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default Login;