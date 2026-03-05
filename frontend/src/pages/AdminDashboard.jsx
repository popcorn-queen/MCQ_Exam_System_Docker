import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [configs, setConfigs] = useState([]);
  const [results, setResults] = useState([]);
  const [newConfig, setNewConfig] = useState({ schoolName: "", subject: "", examTitle: "", durationMinutes: 30 });
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchConfigs = async () => {
    try { const r = await axios.get("/api/admin/configs", { headers }); setConfigs(r.data); }
    catch { alert("Failed to load configs"); }
  };
  const fetchResults = async () => {
    try { const r = await axios.get("/api/admin/results", { headers }); setResults(r.data); }
    catch { alert("Failed to load results"); }
  };

  useEffect(() => { fetchConfigs(); fetchResults(); }, []);

  const activateExam = async (id) => {
    await axios.post("/api/admin/activate", { examId: id }, { headers });
    alert("Exam activated!"); fetchConfigs();
  };
  const createConfig = async () => {
    if (!newConfig.schoolName || !newConfig.subject || !newConfig.examTitle) return alert("Fill all fields.");
    await axios.post("/api/admin/config", { config: newConfig }, { headers });
    alert("Config created!"); setNewConfig({ schoolName: "", subject: "", examTitle: "", durationMinutes: 30 }); fetchConfigs();
  };
  const exportCSV = () => window.open("/api/admin/export", "_blank");

  return (
    <div className="container py-4">
      <h1 className="mb-4">Teacher Dashboard</h1>

      {/* Create Config */}
      <div className="card mb-4">
        <div className="card-header fw-semibold">Create New Exam Config</div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-3"><input className="form-control" placeholder="School Name" value={newConfig.schoolName} onChange={e => setNewConfig(p => ({ ...p, schoolName: e.target.value }))} /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Subject" value={newConfig.subject} onChange={e => setNewConfig(p => ({ ...p, subject: e.target.value }))} /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Exam Title" value={newConfig.examTitle} onChange={e => setNewConfig(p => ({ ...p, examTitle: e.target.value }))} /></div>
            <div className="col-md-3"><input className="form-control" type="number" placeholder="Duration (min)" value={newConfig.durationMinutes} onChange={e => setNewConfig(p => ({ ...p, durationMinutes: Number(e.target.value) }))} /></div>
          </div>
          <button className="btn btn-primary" onClick={createConfig}>Save Config</button>
        </div>
      </div>

      {/* Exam Configs */}
      <div className="card mb-4">
        <div className="card-header fw-semibold">Exam Configs</div>
        <ul className="list-group list-group-flush">
          {configs.length === 0 && <li className="list-group-item text-muted">No configs yet.</li>}
          {configs.map(c => (
            <li key={c.id} className="list-group-item d-flex align-items-center gap-3">
              <span className="fw-medium">Exam #{c.id}</span>
              <span className="text-muted small">{c.config_json?.schoolName} — {c.config_json?.subject} — {c.config_json?.examTitle} ({c.config_json?.durationMinutes} min)</span>
              <span className="ms-auto badge" style={{ background: c.is_active ? "#198754" : "#dc3545" }}>{c.is_active ? "Active" : "Inactive"}</span>
              {!c.is_active && <button className="btn btn-success btn-sm" onClick={() => activateExam(c.id)}>Activate</button>}
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-secondary mb-4" onClick={exportCSV}>Export Results CSV</button>

      {/* Results */}
      <div className="card">
        <div className="card-header fw-semibold">Student Results</div>
        <div className="card-body p-0">
          {results.length === 0
            ? <p className="text-muted p-3 mb-0">No results yet.</p>
            : <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr><th>Roll</th><th>Class</th><th>Section</th><th>Score</th><th>Percentage</th><th>Submitted At</th></tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td>{r.roll_number}</td><td>{r.class}</td><td>{r.section}</td>
                      <td>{r.score}/{r.max_score}</td><td>{r.percentage?.toFixed(2)}%</td>
                      <td>{new Date(r.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>
    </div>
  );
}