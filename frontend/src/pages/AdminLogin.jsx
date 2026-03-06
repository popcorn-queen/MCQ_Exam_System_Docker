import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useBranding from "../hooks/useBranding";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logoFile } = useBranding();

  const login = async () => {
    setError("");
    if (!user || !pass) return setError("Please enter your username and password.");
    setLoading(true);
    try {
      const resp = await axios.post("/api/admin/login", { username: user, password: pass });
      localStorage.setItem("adminToken", resp.data.token);
      navigate("/admin/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") login(); };

  const reqStar = <span style={{ color: "#dc3545" }}>*</span>;
  const labelStyle = { color: "var(--theme-text-muted)" };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center" style={{ width: "100%", maxWidth: 400 }}>
        {logoFile && (
          <img src={`/${logoFile}`} alt="School Logo" className="mb-3"
            style={{ maxHeight: 120, maxWidth: 240, objectFit: "contain" }} />
        )}
        <div className="card shadow p-4" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
          <h2 className="card-title text-center mb-1" style={{ color: "var(--theme-text-dark)" }}>Admin Login</h2>
          <p style={{ color: "#dc3545", fontSize: "0.75rem", fontStyle: "italic", textAlign: "right", marginBottom: "1rem" }}>
            * required fields
          </p>

          <div className="mb-3 text-start">
            <label className="form-label small" style={labelStyle}>Username {reqStar}</label>
            <input
              className="form-control"
              placeholder="Enter username"
              value={user}
              onChange={e => setUser(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label small" style={labelStyle}>Password {reqStar}</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          {error && (
            <div className="alert alert-danger py-2 text-start small mb-3" role="alert">
              {error}
            </div>
          )}

          <button className="btn theme-btn-primary w-100" onClick={login} disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}