import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/Navbar"; // ✅ Added Navbar import

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        alert("✅ Admin Login Successful!");
        navigate("/admin/dashboard");
      } else {
        alert("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Top Navigation Bar */}
      <Navbar />

      {/* ✅ Spacer below fixed navbar */}
      <div style={{ marginTop: "90px" }}>
        <div
          className="container mt-4 d-flex flex-column align-items-center"
          style={{ maxWidth: "420px" }}
        >
          <h2 className="text-center text-primary fw-bold mb-4">
            🧑‍💼 Admin Login
          </h2>

          <form
            onSubmit={submit}
            className="card shadow-sm p-4 border-0 w-100"
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@nandisoftechsolution.in"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default AdminLogin;
