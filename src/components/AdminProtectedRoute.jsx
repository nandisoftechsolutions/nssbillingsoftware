import React from "react";
import { Navigate } from "react-router-dom";

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" />;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;

    if (payload.exp < now) {
      localStorage.removeItem("adminToken");
      return <Navigate to="/admin/login" />;
    }

    if (payload.role !== "admin" && payload.role !== "superadmin") {
      alert("You do not have admin access!");
      return <Navigate to="/" />;
    }
  } catch (err) {
    console.error("Invalid admin token:", err);
    localStorage.removeItem("adminToken");
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default AdminProtectedRoute;
