import React from "react";
import { useNavigate } from "react-router-dom";

export default function Result() {
  const navigate = useNavigate();
  const result = JSON.parse(sessionStorage.getItem("result"));
  if (!result) return <div className="container mt-5">No result available.</div>;
  const pct = result.percentage?.toFixed(2);
  const color = pct >= 60 ? "success" : "danger";
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow text-center p-5" style={{ maxWidth: 400, width: "100%" }}>
        <h2 className="mb-4">Exam Completed 🎉</h2>
        <p className="fs-5">Score: <strong>{result.score} / {result.max_score}</strong></p>
        <p className={`fs-4 text-${color} fw-bold`}>{pct}%</p>
        <p className="text-muted">{pct >= 60 ? "Well done!" : "Better luck next time!"}</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>Logout</button>
      </div>
    </div>
  );
}