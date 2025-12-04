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
  const pageTitle =
    "Login to Nandi Billing Software | Secure Business Management";
  const pageDescription =
    "Sign in to Nandi Billing Software to manage your business invoicing, inventory, and accounting. Secure cloud-based billing solution.";
  const canonicalUrl = "https://nssbillingsoftware.vercel.app/login";
  const siteName = "Nandi Billing Software";

  // Clear field-level + server errors on change
  useEffect(() => {
    if (serverError) setServerError("");
    if (errors.email && form.email)
      setErrors((prev) => ({ ...prev, email: "" }));
    if (errors.password && form.password)
      setErrors((prev) => ({ ...prev, password: "" }));
  }, [form.email, form.password]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect for expired / suspended / password reset
  useEffect(() => {
    if ((expiredInfo || stoppedInfo || passwordResetInfo) && !isRedirecting) {
      setIsRedirecting(true);

      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);

            if (stoppedInfo)
              sessionStorage.setItem(
                "suspendedInfo",
                JSON.stringify(stoppedInfo)
              );

            if (expiredInfo)
              sessionStorage.setItem(
                "expiredInfo",
                JSON.stringify(expiredInfo)
              );

            if (passwordResetInfo)
              sessionStorage.setItem(
                "passwordResetInfo",
                JSON.stringify(passwordResetInfo)
              );

            sessionStorage.setItem("userEmail", form.email);

            navigate("/renewal", {
              state: {
                from: "login",
                userEmail: form.email,
                ...(expiredInfo && { expiredInfo }),
                ...(stoppedInfo && { stoppedInfo }),
                ...(passwordResetInfo && { passwordResetInfo }),
              },
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [
    expiredInfo,
    stoppedInfo,
    passwordResetInfo,
    navigate,
    isRedirecting,
    form.email,
  ]);

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

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const togglePasswordVisibility = () =>
    setShowPassword((prev) => !prev);

  const handleManualRedirect = () => {
    if (stoppedInfo)
      sessionStorage.setItem("suspendedInfo", JSON.stringify(stoppedInfo));

    if (expiredInfo)
      sessionStorage.setItem("expiredInfo", JSON.stringify(expiredInfo));

    if (passwordResetInfo)
      sessionStorage.setItem(
        "passwordResetInfo",
        JSON.stringify(passwordResetInfo)
      );

    sessionStorage.setItem("userEmail", form.email);

    navigate("/renewal", {
      state: {
        from: "login",
        userEmail: form.email,
        ...(expiredInfo && { expiredInfo }),
        ...(stoppedInfo && { stoppedInfo }),
        ...(passwordResetInfo && { passwordResetInfo }),
      },
    });
  };

  const handleTemporaryPasswordLogin = () => {
    setForm((prev) => ({ ...prev, password: "temp123" }));
    setPasswordResetInfo(null);
  };

  const handleLogin = async (e) => {
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
        password: form.password,
      });

      console.log("✅ Login response:", res.data);

      if (res.data.success && res.data.token) {
        // ✅ Store multi-tenant data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("tenantId", res.data.tenantId);
        localStorage.setItem("companyId", res.data.companyId);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("userEmail", res.data.user.email);
        localStorage.setItem(
          "userName",
          res.data.user.name || res.data.user.email
        );
        localStorage.setItem("loginTime", new Date().toISOString());

        api.defaults.headers.common["Authorization"] =
          `Bearer ${res.data.token}`;
        api.defaults.headers.common["X-Tenant-ID"] = res.data.tenantId;

        console.log("🔐 Multi-tenant login successful!");

        setForm({ email: "", password: "" });
        setServerError("success");

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
            reason: "suspended",
          });
          setLoading(false);
          return;
        }

        if (data.subscriptionExpired) {
          setExpiredInfo({
            message: data.message || "Subscription expired",
            expiredOn: data.expiredOn,
            planName: data.planName,
          });
          setLoading(false);
          return;
        }

        if (data.needsPasswordReset) {
          setPasswordResetInfo({
            message: data.message || "Password reset required",
            temporaryPassword: data.temporaryPassword,
          });
          setLoading(false);
          return;
        }
      }

      if (err.response?.status === 500) {
        setServerError(
          data.message || "Server error. Please try again later."
        );
      } else {
        setServerError(
          data.message ||
            data.error ||
            "Login failed. Incorrect email or password."
        );
      }

      setForm((prev) => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "AuthenticationAndRegistration",
      name: "Login System",
      description: "Secure login system for Nandi Billing Software",
      authentication: {
        "@type": "Authentication",
        authenticationType: "form-based authentication",
      },
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: "https://nssbillingsoftware.vercel.app",
    },
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="billing software, login, business management, invoicing, accounting software, Nandi Billing, cloud billing"
        />
        <meta name="author" content="Nandi Billing Software" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={siteName} />
        <meta
          property="og:image"
          content="https://nssbillingsoftware.vercel.app/og-image.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta
          property="twitter:image"
          content="https://nssbillingsoftware.vercel.app/twitter-image.jpg"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        {/* Additional SEO Meta Tags */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="theme-color" content="#5b8df7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />

        {/* Preload logo */}
        <link rel="preload" href={nandiLogo} as="image" />
      </Helmet>

      {/* Full Page Layout */}
      <div
        className="min-vh-100 d-flex align-items-center"
        style={{
          background:
            "radial-gradient(circle at top left, #5b8df7 0, #6c47ce 40%, #1b1b3a 100%)",
          padding: "24px",
        }}
        role="main"
        aria-label="Login page"
      >
        <div className="container">
          <div className="row justify-content-center g-4">
            {/* Left Side - Marketing / Brand Panel */}
            <div className="col-lg-6 d-none d-lg-flex align-items-center">
              <div
                className="text-light"
                style={{
                  paddingRight: "2rem",
                }}
              >
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={nandiLogo}
                    alt="Nandi Billing Software Logo"
                    width="56"
                    height="56"
                    className="rounded-3 bg-white p-1 me-3 shadow-sm"
                  />
                  <div>
                    <h2 className="h4 mb-0">Nandi Billing Software</h2>
                    <small className="text-opacity-75">
                      Smart GST Billing & Inventory
                    </small>
                  </div>
                </div>

                <h1 className="display-6 fw-semibold mb-3">
                  Manage your{" "}
                  <span className="text-warning">billing & stock</span> in
                  one place.
                </h1>

                <p className="lead text-light text-opacity-75 mb-4">
                  Cloud-based GST invoicing, inventory tracking, and
                  business insights designed for{" "}
                  <span className="fw-semibold">Indian retailers, SMEs,</span>{" "}
                  and service providers.
                </p>

                <ul className="list-unstyled small mb-4">
                  <li className="mb-2 d-flex align-items-center">
                    <span className="badge bg-success rounded-pill me-2">
                      ✓
                    </span>{" "}
                    Create GST invoices in seconds
                  </li>
                  <li className="mb-2 d-flex align-items-center">
                    <span className="badge bg-success rounded-pill me-2">
                      ✓
                    </span>{" "}
                    Real-time stock & purchase tracking
                  </li>
                  <li className="mb-2 d-flex align-items-center">
                    <span className="badge bg-success rounded-pill me-2">
                      ✓
                    </span>{" "}
                    Works on laptop, tablet & mobile
                  </li>
                </ul>

                <p className="text-light text-opacity-50 mb-0">
                  Need a new account?{" "}
                  <Link
                    to="/register"
                    className="text-warning text-decoration-none fw-semibold"
                  >
                    Register in 2 minutes →
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="col-12 col-lg-5">
              <div
                className="card border-0 shadow-lg rounded-4"
                style={{
                  background: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(10px)",
                }}
                itemScope
                itemType="https://schema.org/LoginAction"
              >
                <div className="card-body p-4 p-md-5">
                  {/* Small badge */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-2 rounded-pill">
                      Secure Login
                    </span>
                    <small className="text-muted">
                      v1.0 • Multi-tenant
                    </small>
                  </div>

                  {/* Logo + Heading for mobile */}
                  <div className="d-flex d-lg-none align-items-center mb-3">
                    <img
                      src={nandiLogo}
                      alt="Nandi Billing Logo"
                      width="48"
                      height="48"
                      className="rounded-3 bg-white p-1 me-3 shadow-sm"
                    />
                    <div>
                      <h2 className="h5 mb-0">Nandi Billing Software</h2>
                      <small className="text-muted">
                        Sign in to continue
                      </small>
                    </div>
                  </div>

                  {/* Main Heading */}
                  <h1
                    className="fw-bold text-dark mb-1"
                    style={{ fontSize: "1.7rem" }}
                  >
                    Welcome back 👋
                  </h1>
                  <p className="text-muted mb-4">
                    Sign in to access your invoices, stock, and customer
                    data.
                  </p>

                  {/* STATUS / INFO BLOCKS */}
                  {stoppedInfo && (
                    <div
                      className="alert alert-danger rounded-3 text-center mb-3"
                      role="alert"
                      aria-live="polite"
                    >
                      <h2 className="h6 fw-bold text-danger mb-1">
                        Account Suspended
                      </h2>
                      <p className="mb-1">{stoppedInfo.message}</p>
                      <p className="small mb-2">
                        Redirecting in {redirectCountdown} seconds...
                      </p>
                      <button
                        className="btn btn-sm btn-warning px-3"
                        onClick={handleManualRedirect}
                      >
                        Go to Renewal Page
                      </button>
                    </div>
                  )}

                  {expiredInfo && (
                    <div
                      className="alert alert-warning rounded-3 text-center mb-3"
                      role="alert"
                      aria-live="polite"
                    >
                      <h2 className="h6 fw-bold text-dark mb-1">
                        Subscription Expired
                      </h2>
                      <p className="mb-1">{expiredInfo.message}</p>
                      <p className="small mb-2">
                        Redirecting in {redirectCountdown} seconds...
                      </p>
                      <button
                        className="btn btn-sm btn-warning px-3"
                        onClick={handleManualRedirect}
                      >
                        Renew Now
                      </button>
                    </div>
                  )}

                  {passwordResetInfo && (
                    <div
                      className="alert alert-info rounded-3 text-center mb-3"
                      role="alert"
                      aria-live="polite"
                    >
                      <h2 className="h6 fw-bold text-dark mb-1">
                        Password Reset Required
                      </h2>
                      <p className="mb-2">{passwordResetInfo.message}</p>
                      {passwordResetInfo.temporaryPassword && (
                        <p className="fw-semibold mb-2">
                          Temporary Password:{" "}
                          <code>
                            {passwordResetInfo.temporaryPassword}
                          </code>
                        </p>
                      )}
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={handleTemporaryPasswordLogin}
                        >
                          Use Temporary Password
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={handleManualRedirect}
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  )}

                  {serverError === "success" && (
                    <div
                      className="alert alert-success text-center rounded-3 mb-3"
                      role="alert"
                      aria-live="polite"
                    >
                      <strong>Login successful!</strong>
                      <p className="mb-0">Redirecting to dashboard...</p>
                    </div>
                  )}

                  {serverError &&
                    serverError !== "success" &&
                    !stoppedInfo &&
                    !expiredInfo &&
                    !passwordResetInfo && (
                      <div
                        className="alert alert-danger text-center rounded-3 mb-3"
                        role="alert"
                        aria-live="assertive"
                      >
                        {serverError}
                      </div>
                    )}

                  {/* LOGIN FORM */}
                  {!expiredInfo &&
                    !stoppedInfo &&
                    !passwordResetInfo && (
                      <form
                        onSubmit={handleLogin}
                        itemScope
                        itemType="https://schema.org/LoginAction"
                        noValidate
                      >
                        <meta itemProp="target" content={canonicalUrl} />

                        {/* Email */}
                        <div className="mb-3">
                          <label
                            htmlFor="login-email"
                            className="form-label fw-semibold"
                          >
                            Email address
                          </label>
                          <input
                            type="email"
                            id="login-email"
                            name="email"
                            className={`form-control form-control-lg rounded-3 ${
                              errors.email ? "is-invalid" : ""
                            }`}
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            disabled={loading}
                            autoComplete="email"
                            aria-required="true"
                            itemProp="identifier"
                          />
                          {errors.email && (
                            <div
                              className="invalid-feedback"
                              role="alert"
                            >
                              {errors.email}
                            </div>
                          )}
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                          <label
                            htmlFor="login-password"
                            className="form-label fw-semibold"
                          >
                            Password
                          </label>
                          <div className="input-group input-group-lg">
                            <input
                              type={showPassword ? "text" : "password"}
                              id="login-password"
                              name="password"
                              className={`form-control rounded-start-3 ${
                                errors.password ? "is-invalid" : ""
                              }`}
                              value={form.password}
                              onChange={handleChange}
                              placeholder="Enter your password"
                              disabled={loading}
                              autoComplete="current-password"
                              aria-required="true"
                              itemProp="password"
                            />
                            <button
                              type="button"
                              className="input-group-text bg-white border-start-0 rounded-end-3"
                              onClick={togglePasswordVisibility}
                              disabled={loading}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              <i
                                className={`bi ${
                                  showPassword ? "bi-eye-slash" : "bi-eye"
                                }`}
                                aria-hidden="true"
                              ></i>
                            </button>
                          </div>
                          {errors.password && (
                            <div
                              className="invalid-feedback d-block"
                              role="alert"
                            >
                              {errors.password}
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn btn-primary w-100 fw-semibold py-3 rounded-3 mb-2"
                        >
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </button>

                        {/* Forgot / Register */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <small className="text-muted">
                            Need help? Contact{" "}
                            <a
                              href="mailto:support@nandisoftech.com"
                              className="text-decoration-none"
                            >
                              support
                            </a>
                          </small>
                          <small className="text-muted">
                            New here?{" "}
                            <Link
                              to="/register"
                              className="text-primary fw-semibold text-decoration-none"
                            >
                              Register
                            </Link>
                          </small>
                        </div>
                      </form>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <div className="text-center text-light text-opacity-50 small mt-3">
            © {new Date().getFullYear()} Nandi Softech Solutions. All
            rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
