import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy } from "@phosphor-icons/react";
import useBranding from "../hooks/useBranding";

export default function Result() {
  const navigate = useNavigate();
  const { logoFile, schoolName, theme } = useBranding();
  const [result] = useState(() => {
    const r = sessionStorage.getItem("result");
    return r ? JSON.parse(r) : null;
  });

  useEffect(() => {
    sessionStorage.removeItem("result");
  }, []);

  if (!result) return null;

  const pct = result.percentage?.toFixed(2);
  const passed = pct >= 60;

  const logout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column">

      {/* Header */}
      <div className="px-4 py-2 d-flex align-items-center"
        style={{ minHeight: 60, backgroundColor: theme?.background || "#fefee3", borderBottom: `2px solid ${theme?.border || "#353535"}` }}>
        <div className="d-flex align-items-center gap-3">
          {logoFile && (
            <img src={`/${logoFile}`} alt="School Logo" style={{ height: 50, width: 50, objectFit: "contain", borderRadius: 6, background: "white", padding: 3 }} />
          )}
          <div>
            <div className="fw-bold fs-5">{schoolName}</div>
            <div className="small theme-header-subtitle">Exam Result</div>
          </div>
        </div>
      </div>

      {/* Result card */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: "var(--theme-bg)" }}>
        <div className="card shadow text-center p-5" style={{ maxWidth: 400, width: "100%", backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-secondary)" }}>
          <div className="mb-3" style={{ color: passed ? "#198754" : "#dc3545" }}>
            <Trophy size={52} weight="duotone" />
          </div>
          <h2 className="mb-4" style={{ color: "var(--theme-text-dark)" }}>Exam Completed</h2>

          <p className="fs-1 fw-bold" style={{ color: passed ? "#198754" : "#dc3545" }}>{pct}%</p>

          <p style={{ color: "var(--theme-text-muted)" }}>
            {result.score} / {result.max_score} marks &nbsp;·&nbsp; {passed ? "Well done!" : "Better luck next time!"}
          </p>

          <div className="my-3 mx-auto" style={{ width: "100%", height: 10, borderRadius: 99, backgroundColor: "var(--theme-secondary)", opacity: 0.3 }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: passed ? "#198754" : "#dc3545",
              opacity: 1,
              transition: "width 0.8s ease"
            }} />
          </div>

          <button className="btn theme-btn-primary mt-4 w-100" onClick={logout}>Back to Login</button>
        </div>
      </div>

      {/* Footer */}
      <div className="theme-footer py-2 text-center small">
        MCQ Exam Platform
      </div>

    </div>
  );
}