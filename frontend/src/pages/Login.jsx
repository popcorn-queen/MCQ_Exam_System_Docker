import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBranding from "../hooks/useBranding";

function Login() {
  const [roll, setRoll] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { logoFile } = useBranding();

  const handleSection = (val) => {
    const upper = val.toUpperCase();
    if (/^[A-C]?$/.test(upper)) setSection(upper);
  };

  const handleSubmit = async () => {
    setError("");
    if (!roll || !cls || !section) return setError("Please fill in all fields.");
    if (!/^\d{3}$/.test(roll)) return setError("Roll number must be exactly 3 digits.");
    const clsNum = Number(cls);
    if (clsNum < 5 || clsNum > 10) return setError("Class must be between 5 and 10.");
    if (!/^[A-C]$/.test(section)) return setError("Section must be A, B or C.");

    setLoading(true);
    try {
      const statusResp = await fetch("/api/exam/status");
      const statusData = await statusResp.json();
      if (!statusData.active) return setError("The exam has not started yet. Please wait for your teacher.");

      const checkResp = await fetch(`/api/exam/check?roll=${roll}&cls=${cls}&section=${section}`);
      const checkData = await checkResp.json();
      if (checkData.submitted) return setError("You have already submitted this exam. Re-entry is not allowed.");

      sessionStorage.setItem("student", JSON.stringify({ roll, cls, section }));
      sessionStorage.setItem("examConfig", JSON.stringify(statusData.config));
      navigate("/exam");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const reqStar = <span style={{ color: "#dc3545" }}>*</span>;
  const labelStyle = { color: "var(--theme-text-muted)" };
  const reqNote = (
    <p style={{ color: "#dc3545", fontSize: "0.75rem", fontStyle: "italic", textAlign: "right", marginBottom: "1rem" }}>
      * required fields
    </p>
  );

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center" style={{ width: "100%", maxWidth: 400 }}>
        {logoFile && (
          <img src={`/${logoFile}`} alt="School Logo" className="mb-3"
            style={{ maxHeight: 120, maxWidth: 240, objectFit: "contain" }} />
        )}
        <div className="card shadow p-4" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
          <h2 className="card-title text-center mb-1" style={{ color: "var(--theme-text-dark)" }}>Student Login</h2>
          {reqNote}

          <div className="mb-3 text-start">
            <label className="form-label small" style={labelStyle}>Roll Number (3 digits) {reqStar}</label>
            <input
              className="form-control"
              placeholder="e.g. 042"
              value={roll}
              inputMode="numeric"
              maxLength={3}
              onKeyDown={handleKey}
              onChange={e => { if (/^\d{0,3}$/.test(e.target.value)) setRoll(e.target.value); }}
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label small" style={labelStyle}>Class (5–10) {reqStar}</label>
            <input
              className="form-control"
              placeholder="e.g. 7"
              value={cls}
              inputMode="numeric"
              onKeyDown={handleKey}
              onChange={e => {
                const val = e.target.value;
                if (val === "") { setCls(""); return; }
                if (!/^\d+$/.test(val)) return;
                if (Number(val) <= 10) setCls(val);
              }}
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label small" style={labelStyle}>Section (A–C) {reqStar}</label>
            <input
              className="form-control"
              placeholder="e.g. A"
              value={section}
              maxLength={1}
              onKeyDown={handleKey}
              onChange={e => handleSection(e.target.value)}
            />
          </div>

          {error && (
            <div className="alert alert-danger py-2 text-start small mb-3" role="alert">
              {error}
            </div>
          )}

          <button className="btn theme-btn-primary w-100" onClick={handleSubmit} disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            {loading ? "Checking..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;