import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Result() {
  const navigate = useNavigate();
  const [result] = useState(() => {
    const r = sessionStorage.getItem("result");
    return r ? JSON.parse(r) : null;
  });

  // Clear result from session on mount — prevents back button re-access
  useEffect(() => {
    sessionStorage.removeItem("result");
  }, []);

  if (!result) return null;

  const pct = result.percentage?.toFixed(2);
  const color = pct >= 60 ? "success" : "danger";

  const logout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow text-center p-5" style={{ maxWidth: 400, width: "100%" }}>
        <h2 className="mb-4">Exam Completed 🎉</h2>
        <p className={`fs-1 fw-bold text-${color}`}>{pct}%</p>
        <p className="text-muted">{pct >= 60 ? "Well done!" : "Better luck next time!"}</p>
        <button className="btn btn-primary mt-3" onClick={logout}>Back to Login</button>
      </div>
    </div>
  );
}