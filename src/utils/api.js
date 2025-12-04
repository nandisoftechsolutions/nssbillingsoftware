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
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// ------------------------------------------------------------
// 🛑 PUBLIC ROUTES (NO TOKEN REQUIRED)
// ------------------------------------------------------------
const PUBLIC_ROUTES = [
  "/renewal/create-order",
  "/renewal/verify",
  "/admin/plans/public",
  "/admin/plans/public/popular",
  "/admin/plans/public/trial",
  "/admin/plans/public/badge/",
  "/admin/plans/public/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/health",

  // ✅ Public marketing endpoints
  "/ratings/public",
  "/platform/overview",
  
  // ✅ ADDED: Blog public endpoints - UPDATED
  "/blogs/public",
  "/blogs/public/", // With trailing slash for sub-routes
  
  // ✅ CRITICAL: Add admin blog public routes
  "/admin/blogs/public",
  "/admin/blogs/public/",
  
  // Optional: Add general blogs route if it's also public
  "/blogs/", 
];

// ------------------------------------------------------------
// 🔐 ADMIN ROUTES (REQUIRE ADMIN TOKEN)
// ------------------------------------------------------------
const ADMIN_ROUTES = [
  "/admin/plans",
  "/admin/plans/calculate-upgrade",
  "/admin/plans/validate",
  "/admin/",
  "/blogs", // If accessing all blogs requires admin (non-public routes)
  "/blogs/", // Admin routes for blog management
];

// ------------------------------------------------------------
// 🛠 Utility Functions
// ------------------------------------------------------------
const showAlert = (msg) => {
  // Use browser alert as fallback, but prefer custom alert if available
  if (typeof window.showCustomAlert === "function") {
    window.showCustomAlert(msg);
  } else if (typeof window.alert === "function") {
    alert(msg);
  }
  console.log("ALERT:", msg);
};

const clearAuth = () => {
  const itemsToRemove = [
    "adminToken",
    "token",
    "authToken",
    "userData",
    "tenantId",
    "user",
    "adminUser",
  ];

  itemsToRemove.forEach((item) => {
    localStorage.removeItem(item);
    sessionStorage.removeItem(item);
  });

  console.log("🧹 Auth data cleared from storage");
};

const redirectToLogin = () => {
  // Preserve current path for redirect after login
  const currentPath = window.location.pathname + window.location.search;
  const loginPath = "/login";

  // Avoid redirect loops
  if (currentPath !== loginPath && !currentPath.includes("/auth/")) {
    localStorage.setItem("redirectAfterLogin", currentPath);
  }

  // Use replace to avoid adding to history
  window.location.replace(loginPath);
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = () => {
  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

/**
 * Check if user has admin role
 */
const isAdmin = () => {
  try {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken");

    if (!token) return false;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "admin" || payload.role === "superadmin";
  } catch {
    return false;
  }
};

/**
 * Get current user info from token
 */
const getCurrentUser = () => {
  try {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken");

    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
};

/**
 * Safe API call with error handling
 */
const safeApiCall = async (apiCall, fallbackValue = null) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error("🔒 Safe API call failed:", error);
    return fallbackValue;
  }
};

/**
 * Admin-only API call with permission check
 */
const adminApiCall = async (apiCall) => {
  if (!isAdmin()) {
    throw new Error("Admin privileges required");
  }

  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error("👑 Admin API call failed:", error);
    throw error;
  }
};

// ------------------------------------------------------------
// 🔐 REQUEST INTERCEPTOR - UPDATED
// ------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ROUTES.some((route) => {
      // Handle route patterns with parameters
      if (route.endsWith("/")) {
        return config.url?.startsWith(route);
      }
      return config.url === route || config.url?.startsWith(route + "/");
    });

    const isAdminRoute = ADMIN_ROUTES.some((route) => {
      if (route.endsWith("/")) {
        return config.url?.startsWith(route);
      }
      return config.url === route || config.url?.startsWith(route + "/");
    });

    // Add timestamp to avoid caching issues
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    if (isPublic) {
      console.log("🌍 PUBLIC API → No auth applied:", config.url);
      return config; // Skip token + tenantId
    }

    // Try multiple token sources - prioritize admin token for admin routes
    let token;
    if (isAdminRoute) {
      token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");
      console.log("👑 ADMIN ROUTE DETECTED:", config.url);
    } else {
      token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("adminToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 Token added to request");

      try {
        // Decode token to check expiration and get tenantId
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;

        // Check token expiration
        if (payload.exp && payload.exp < currentTime) {
          console.warn("⚠️ Token expired");
          showAlert("Session expired. Please login again.");
          clearAuth();
          redirectToLogin();
          return Promise.reject(new Error("Token expired"));
        }

        // Add tenantId if available and not admin route
        if (
          payload.tenantId &&
          payload.tenantId !== "undefined" &&
          !isAdminRoute
        ) {
          config.headers["x-tenant-id"] = payload.tenantId;
          console.log("🏢 Tenant ID:", payload.tenantId);
        }

        // Log user info for debugging
        if (payload.role) {
          console.log("👤 User Role:", payload.role, "| Admin Route:", isAdminRoute);

          // Warn if non-admin accessing admin routes
          if (
            isAdminRoute &&
            payload.role !== "admin" &&
            payload.role !== "superadmin"
          ) {
            console.warn("🚫 Non-admin user attempting to access admin route");
          }
        }
      } catch (err) {
        console.error("❌ Token parsing failed:", err);
        // Don't block the request if token parsing fails
      }
    } else {
      console.warn("⚠️ No auth token found for protected route:", config.url);

      // Special handling for admin routes without token
      if (isAdminRoute) {
        console.error(
          "🚫 Admin route accessed without token - redirecting to login"
        );
        showAlert("Admin access required. Please login.");
        redirectToLogin();
        return Promise.reject(new Error("Admin authentication required"));
      }
    }

    console.log(`📡 API Request → ${config.method?.toUpperCase()} ${config.url}`, {
      isPublic,
      isAdminRoute,
      hasToken: !!token,
    });

    return config;
  },
  (error) => {
    console.error("❌ Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------
// ⚠️ RESPONSE INTERCEPTOR
// ------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success → ${response.status} ${response.config.url}`, {
      data: response.data,
      success: response.data?.success,
    });
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Enhanced error logging
    console.error("❌ API Error Details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: originalRequest?.url,
      method: originalRequest?.method,
      baseURL: originalRequest?.baseURL,
      responseData: error.response?.data,
      isAdminRoute: ADMIN_ROUTES.some((route) =>
        originalRequest?.url?.includes(route)
      ),
    });

    // Network errors (no response)
    if (!error.response) {
      const networkError = {
        message: "Cannot reach server",
        details: "Please check your internet connection and try again.",
        type: "NETWORK_ERROR",
        timestamp: new Date().toISOString(),
      };

      console.error("🔌 Network Error:", networkError);
      showAlert("🔌 Cannot reach server. Please check your internet connection.");
      return Promise.reject(networkError);
    }

    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || error.message;
    const isAdminRoute = ADMIN_ROUTES.some((route) =>
      originalRequest?.url?.includes(route)
    );

    // Enhanced error handling with specific cases
    switch (status) {
      case 400:
        console.warn("❌ Bad Request:", data);
        if (data?.errors) {
          const errorMessages = data.errors
            .map((err) => `${err.field || ""}: ${err.message}`)
            .join("\n");
          showAlert(`❌ Validation Error:\n${errorMessages}`);
        } else {
          showAlert(`❌ ${message || "Bad request"}`);
        }
        break;

      case 401:
        console.warn("🔐 Unauthorized - Token invalid/expired");
        showAlert("🔐 Session expired. Please login again.");
        clearAuth();

        // Don't redirect if already on login page
        if (!window.location.pathname.includes("/login")) {
          setTimeout(() => redirectToLogin(), 1000);
        }
        break;

      case 403:
        console.warn("🚫 Access Denied - Insufficient permissions");
        if (isAdminRoute) {
          const user = getCurrentUser();
          if (user && user.role !== "admin" && user.role !== "superadmin") {
            showAlert(
              "🚫 Admin access required. You don't have administrator privileges."
            );
            // Redirect non-admin users to dashboard
            setTimeout(() => {
              if (!window.location.pathname.includes("/dashboard")) {
                window.location.href = "/dashboard";
              }
            }, 2000);
          } else {
            showAlert("🚫 Access denied. Please contact administrator.");
          }
        } else {
          showAlert(
            "🚫 Access denied. You don't have permission to perform this action."
          );
        }
        break;

      case 404:
        console.warn("🔍 Not Found:", originalRequest.url);
        // Don't show alert for 404 in public routes, let components handle it
        if (!isAdminRoute && !PUBLIC_ROUTES.some(route => originalRequest.url?.includes(route))) {
          showAlert("🔍 Requested resource not found.");
        }
        break;

      case 409:
        console.warn("⚡ Conflict:", data);
        showAlert(`⚡ ${message || "Resource conflict detected"}`);
        break;

      case 422:
        console.warn("📝 Validation Error:", data);
        if (data?.errors) {
          const validationErrors = data.errors
            .map((err) => `• ${err.message}`)
            .join("\n");
          showAlert(`📝 Validation Failed:\n${validationErrors}`);
        } else {
          showAlert(`📝 ${message || "Validation error"}`);
        }
        break;

      case 429:
        console.warn("⏳ Rate Limited");
        showAlert(
          "⏳ Too many requests. Please wait a moment and try again."
        );
        break;

      case 500:
        console.error("🛠 Server Error:", data);
        // Don't show technical errors to users in production
        if (process.env.NODE_ENV === "development") {
          showAlert(`🛠 Server Error: ${message || "Internal server error"}`);
        } else {
          showAlert("🛠 Something went wrong. Please try again later.");
        }
        break;

      case 502:
      case 503:
      case 504:
        console.error("🌐 Server Unavailable");
        showAlert(
          "🌐 Service temporarily unavailable. Please try again in a few moments."
        );
        break;

      default:
        console.warn(`❌ HTTP ${status}:`, data);
        showAlert(`❌ ${message || "An unexpected error occurred"}`);
    }

    // Special handling for tenantId cast errors
    if (status === 500 && message?.includes("tenantId")) {
      console.error("🔐 Tenant ID Error - Clearing auth");
      showAlert("🔐 Authentication error. Please login again.");
      clearAuth();
      redirectToLogin();
    }

    // Create an enhanced error object
    const enhancedError = {
      ...error,
      userMessage: message,
      statusCode: status,
      isAdminRoute,
      timestamp: new Date().toISOString(),
      requestInfo: {
        url: originalRequest?.url,
        method: originalRequest?.method,
        data: originalRequest?.data,
      },
    };

    return Promise.reject(enhancedError);
  }
);

// ------------------------------------------------------------
// 🔍 Enhanced Health Check
// ------------------------------------------------------------
const checkServerHealth = async () => {
  try {
    const startTime = Date.now();
    const response = await api.get("/health");
    const responseTime = Date.now() - startTime;

    console.log(
      `🏥 Server Health Check: ${response.status} (${responseTime}ms)`
    );

    return {
      status: "healthy",
      data: response.data,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("🏥 Server Health Check Failed:", error);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// ------------------------------------------------------------
// 📚 Blog API Functions (UPDATED)
// ------------------------------------------------------------

/**
 * Fetch public blogs with pagination - IMPROVED VERSION
 */
const fetchPublicBlogs = async (page = 1, limit = 6) => {
  console.log(`📚 Fetching public blogs page ${page}, limit ${limit}`);
  
  try {
    // Try admin/blogs/public first (most likely your actual endpoint)
    const response = await api.get(`/admin/blogs/public`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch public blogs from admin endpoint:", error);
    
    // If admin/blogs/public fails, try /blogs/public as fallback
    if (error.statusCode === 404) {
      console.log("🔄 Trying /blogs/public endpoint...");
      try {
        const fallbackResponse = await api.get(`/blogs/public`, {
          params: { page, limit }
        });
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

/**
 * Fetch single blog post by slug or ID - IMPROVED
 */
const fetchBlogPost = async (identifier) => {
  console.log(`📄 Fetching blog post: ${identifier}`);
  
  try {
    // Try admin/blogs/public/:slug first
    const response = await api.get(`/admin/blogs/public/${identifier}`);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch blog post from admin endpoint:", error);
    
    // Fallback to /blogs/public/:slug
    if (error.statusCode === 404) {
      try {
        console.log("🔄 Trying /blogs/public endpoint...");
        const fallbackResponse = await api.get(`/blogs/public/${identifier}`);
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error("❌ Both endpoints failed:", fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

/**
 * Create blog post (admin only)
 */
const createBlogPost = async (blogData) => {
  console.log("🆕 Creating blog post:", blogData);
  return adminApiCall(() => api.post("/blogs", blogData));
};

/**
 * Update blog post (admin only)
 */
const updateBlogPost = async (blogId, blogData) => {
  console.log("✏️ Updating blog post:", blogId, blogData);
  return adminApiCall(() => api.put(`/blogs/${blogId}`, blogData));
};

/**
 * Delete blog post (admin only)
 */
const deleteBlogPost = async (blogId) => {
  console.log("🗑️ Deleting blog post:", blogId);
  return adminApiCall(() => api.delete(`/blogs/${blogId}`));
};

// ------------------------------------------------------------
// 🔧 API Helper Functions
// ------------------------------------------------------------

/**
 * Retry failed requests (useful for spotty connections)
 */
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry on 4xx errors (except 429)
      if (
        error.response?.status >= 400 &&
        error.response?.status < 500 &&
        error.response?.status !== 429
      ) {
        throw error;
      }

      if (i === maxRetries - 1) throw error;

      console.log(`🔄 Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

/**
 * Upload file with progress tracking
 */
const uploadFile = async (url, file, onProgress = null) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

/**
 * Download file as blob
 */
const downloadFile = async (url, filename) => {
  const response = await api.get(url, {
    responseType: "blob",
  });

  // Create download link
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * Fetch plans with proper endpoint based on context
 */
const fetchPlans = async (isAdminView = false) => {
  const endpoint = isAdminView ? "/admin/plans" : "/admin/plans/public";
  console.log(`📋 Fetching plans from: ${endpoint}`);

  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch plans from ${endpoint}:`, error);

    // If admin endpoint fails with 403, user might not be admin
    if (error.statusCode === 403 && isAdminView) {
      console.warn(
        "User doesn't have admin access, falling back to public endpoint"
      );
      // Optionally fall back to public endpoint or throw error
      throw new Error("Admin access required to view all plans");
    }

    throw error;
  }
};

/**
 * Create plan (admin only)
 */
const createPlan = async (planData) => {
  console.log("🆕 Creating new plan:", planData);
  return adminApiCall(() => api.post("/admin/plans", planData));
};

/**
 * Update plan (admin only)
 */
const updatePlan = async (planId, planData) => {
  console.log("✏️ Updating plan:", planId, planData);
  return adminApiCall(() => api.put(`/admin/plans/${planId}`, planData));
};

/**
 * Delete plan (admin only)
 */
const deletePlan = async (planId) => {
  console.log("🗑️ Deleting plan:", planId);
  return adminApiCall(() => api.delete(`/admin/plans/${planId}`));
};

// ------------------------------------------------------------
// 🚀 Export API and Helpers
// ------------------------------------------------------------
export default api;

// Export all helpers - ONLY ONCE at the bottom
export {
  checkServerHealth,
  retryRequest,
  isAuthenticated,
  isAdmin,
  getCurrentUser,
  safeApiCall,
  adminApiCall,
  uploadFile,
  downloadFile,
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  // Blog functions
  fetchPublicBlogs,
  fetchBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
};

// Attach helpers to window for debugging (dev only)
if (process.env.NODE_ENV === "development") {
  window.apiHelpers = {
    checkServerHealth,
    isAuthenticated,
    isAdmin,
    getCurrentUser,
    safeApiCall,
    adminApiCall,
    retryRequest,
    uploadFile,
    downloadFile,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    // Blog functions
    fetchPublicBlogs,
    fetchBlogPost,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    PUBLIC_ROUTES,
    ADMIN_ROUTES,
    BASE_URL,
  };

  console.log("🔧 API Helpers attached to window.apiHelpers");
}