// ✅ Frontend API Helper — Nandi Softech Solutions
// Works for both Local + Mobile + Render Backend

import axios from "axios";

// ------------------------------------------------------------
// 🌍 BACKEND URL DETECTION
// ------------------------------------------------------------
const LOCAL_BACKEND = "http://localhost:6060/api";

const LIVE_BACKEND =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nandi-billing-backend.onrender.com/api";

function getBackendURL() {
  const host = window.location.hostname;

  if (
    host === "localhost" ||
    host.startsWith("192.") ||
    host.startsWith("10.") ||
    host.startsWith("172.")
  ) {
    console.log("🔗 Using LOCAL backend:", LOCAL_BACKEND);
    return LOCAL_BACKEND;
  }

  console.log("🔗 Using LIVE backend:", LIVE_BACKEND);
  return LIVE_BACKEND;
}

const BASE_URL = getBackendURL();
console.log("🚀 Final API Base URL:", BASE_URL);

// ------------------------------------------------------------
// 🚀 AXIOS INSTANCE
// ------------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ------------------------------------------------------------
// 🛑 PUBLIC ROUTES (NO TOKEN REQUIRED)
// ------------------------------------------------------------
const PUBLIC_ROUTES = [
  "/renewal/create-order",
  "/renewal/verify",
  "/admin/plans",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/health",
];

// ------------------------------------------------------------
// 🔐 REQUEST INTERCEPTOR
// ------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ROUTES.some((route) =>
      config.url?.startsWith(route)
    );

    if (isPublic) {
      console.log("🌍 PUBLIC API → No auth applied:", config.url);
      return config; // Skip token + tenantId
    }

    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.tenantId && payload.tenantId !== "undefined") {
          config.headers["x-tenant-id"] = payload.tenantId;
          console.log("🏢 Tenant ID:", payload.tenantId);
        } else {
          console.warn("⚠️ Invalid tenantId inside token");
        }
      } catch (err) {
        console.error("❌ Token parsing failed:", err);
      }
    } else {
      console.log("ℹ️ No auth token (public or logged out)");
    }

    console.log(`📡 API Request → ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------
// ⚠️ RESPONSE INTERCEPTOR
// ------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success → ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("❌ API Error Details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });

    if (!error.response) {
      showAlert("🔌 Cannot reach server (Offline / CORS / Network).");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response.data?.message;

    // ❗ TenantId Cast Error
    if (status === 500 && message?.includes("tenantId")) {
      showAlert("🔐 Authentication error. Please login again.");
      clearAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    // Handle common status codes
    switch (status) {
      case 400:
        showAlert(`❌ ${message}`);
        break;
      case 401:
        showAlert("🔐 Session expired. Please login again.");
        clearAuth();
        redirectToLogin();
        break;
      case 403:
        showAlert("🚫 Access denied.");
        break;
      case 404:
        showAlert("🔍 API not found.");
        break;
      case 429:
        showAlert("⏳ Too many requests. Try later.");
        break;
      case 500:
        showAlert("🛠 Server error. Try again later.");
        break;
      default:
        showAlert(`❌ ${message}`);
    }

    return Promise.reject(error);
  }
);

// ------------------------------------------------------------
// 🛠 Utility Functions
// ------------------------------------------------------------
const showAlert = (msg) => {
  alert(msg);
  console.log("ALERT:", msg);
};

const clearAuth = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  localStorage.removeItem("tenantId");
  console.log("🧹 Auth cleared");
};

const redirectToLogin = () => {
  window.location.href = "/login";
};

// ------------------------------------------------------------
// 🔍 Health Check
// ------------------------------------------------------------
export const checkServerHealth = async () => {
  try {
    const res = await api.get("/health");
    return { status: "healthy", data: res.data };
  } catch {
    return { status: "unhealthy" };
  }
};

// ------------------------------------------------------------
// Export API
// ------------------------------------------------------------
export default api;

