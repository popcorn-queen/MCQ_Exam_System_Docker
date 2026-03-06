import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import useBranding from "../hooks/useBranding";
import { Trash, Shuffle, Circle, FileCsv, FileXls } from "@phosphor-icons/react";

const WS_URL = `ws://${window.location.hostname}:5000`;

export default function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: "success"|"error"|"warning", message: "" }
  const [activeConfig, setActiveConfig] = useState(null);
  const [config, setConfig] = useState({ subject: "", durationMinutes: 30, questionsToShow: 10, randomise: false });
  const [sortField, setSortField] = useState("submitted_at");
  const [sortDir, setSortDir] = useState("desc");
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };
  const { schoolName, logoFile, theme } = useBranding();

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "NEW_RESULT") setResults(prev => [msg.result, ...prev]);
    };
    ws.onerror = () => console.warn("WebSocket connection failed");
    return () => ws.close();
  }, []);

  const fetchAll = async () => {
    try {
      const [cfgResp, resResp, qResp] = await Promise.all([
        axios.get("/api/admin/configs", { headers }),
        axios.get("/api/admin/results", { headers }),
        axios.get("/api/admin/questions", { headers }),
      ]);
      setResults(resResp.data);
      setQuestions(qResp.data);
      const active = cfgResp.data.find(c => c.is_active);
      setActiveConfig(active || null);
    } catch { setError("Failed to load data. Please refresh."); }
  };

  useEffect(() => { fetchAll(); }, []);

  const uploadQuestions = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return setUploadStatus({ type: "warning", message: "Please select a JSON file first." });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const qs = parsed.questions ?? parsed;
      if (!Array.isArray(qs)) return setUploadStatus({ type: "error", message: "JSON must contain an array of questions." });
      await axios.post("/api/admin/upload-questions", { questions: qs }, { headers });
      setUploadStatus({ type: "success", message: `${qs.length} questions uploaded successfully.` });
      fetchAll();
    } catch { setUploadStatus({ type: "error", message: "Upload failed — check your JSON format." }); }
  };

  const clearQuestions = async () => {
    if (!window.confirm("Are you sure you want to clear all uploaded questions? This cannot be undone.")) return;
    await axios.delete("/api/admin/clear-questions", { headers });
    setUploadStatus(null); setQuestions([]); fetchAll();
  };

  const clearResults = async () => {
    if (!window.confirm("Are you sure you want to clear all student results? This cannot be undone.")) return;
    await axios.delete("/api/admin/clear-results", { headers });
    setResults([]);
  };

  const configValid = config.subject && config.durationMinutes > 0 && config.questionsToShow > 0;

  const activateExam = async () => {
    if (!configValid) return;
    await axios.post("/api/admin/config", { config }, { headers });
    const cfgResp = await axios.get("/api/admin/configs", { headers });
    const latest = cfgResp.data[cfgResp.data.length - 1];
    await axios.post("/api/admin/activate", { examId: latest.id }, { headers });
    fetchAll();
  };

  const deactivateExam = async () => {
    if (!activeConfig) return;
    await axios.post("/api/admin/deactivate", {}, { headers });
    setActiveConfig(null);
    fetchAll();
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const sorted = [...results].sort((a, b) => {
    let va = a[sortField], vb = b[sortField];
    if (typeof va === "string") va = va.toLowerCase(), vb = vb.toLowerCase();
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="theme-text-muted ms-1">↕</span>;
    return <span className="ms-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const exportCSV = () => window.open(`/api/admin/export/csv?token=${token}`, "_blank");
  const exportExcel = () => window.open(`/api/admin/export/excel?token=${token}`, "_blank");

  const uploadAlertClass = uploadStatus?.type === "success" ? "alert-success" : uploadStatus?.type === "error" ? "alert-danger" : "alert-warning";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div className="px-4 py-2 d-flex justify-content-between align-items-center"
        style={{ minHeight: 60, flexShrink: 0, backgroundColor: theme?.background || "#fefee3", borderBottom: `2px solid ${theme?.border || "#353535"}` }}>
        <div className="d-flex align-items-center gap-3">
          {logoFile && (
            <img src={`/${logoFile}`} alt="School Logo" style={{ height: 50, width: 50, objectFit: "contain", borderRadius: 6, background: "white", padding: 3 }} />
          )}
          <div>
            <div className="fw-bold fs-5">{schoolName}</div>
            <div className="small theme-header-subtitle">Teacher Dashboard</div>
          </div>
        </div>
        <button className="btn theme-btn-ghost btn-sm" onClick={() => { localStorage.removeItem("adminToken"); window.location.href = "/admin"; }}>
          Logout
        </button>
      </div>

      {/* ── Page Content ── */}
      <div className="container py-4 flex-grow-1">

        {error && (
          <div className="alert alert-danger py-2 small mb-4" role="alert">{error}</div>
        )}

        {/* Upload Questions */}
        <div className="card mb-4" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-secondary)" }}>
          <div className="card-header fw-semibold d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "var(--theme-secondary)", color: "var(--theme-primary-text)", borderColor: "var(--theme-secondary)" }}>
            Upload Question Paper (JSON)
            {questions.length > 0 && (
              <button className="btn theme-btn-cancel btn-sm d-flex align-items-center gap-1" onClick={clearQuestions}>
                <Trash size={15} weight="bold" /> Clear Questions
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="mb-2 small" style={{ color: "var(--theme-text-muted)" }}>
              Format: <code>{"{ \"questions\": [{ \"question\": \"...\", \"type\": \"single|multiple\", \"options\": [...], \"correctAnswer\": \"...\", \"weight\": 1 }] }"}</code>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input type="file" accept=".json" ref={fileRef} className="form-control" style={{ maxWidth: 300 }} />
              <button className="btn theme-btn-confirm" onClick={uploadQuestions}>Upload</button>
            </div>
            {uploadStatus && (
              <div className={`mt-2 small alert py-1 ${uploadAlertClass}`}>
                {uploadStatus.message}
              </div>
            )}
            {questions.length > 0 && (
              <div className="mt-3">
                <div className="small mb-1" style={{ color: "var(--theme-text-muted)" }}>{questions.length} questions currently loaded:</div>
                <ul className="list-group list-group-flush" style={{ maxHeight: 385, overflowY: "auto" }}>
                  {questions.map((q, i) => (
                    <li key={i} className="list-group-item py-1 small" style={{ backgroundColor: "var(--theme-card-bg)", color: "var(--theme-text-dark)" }}>
                      <span className="badge me-2" style={{ backgroundColor: "var(--theme-secondary)", color: "var(--theme-primary-text)" }}>{q.type}</span>
                      {q.question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Exam Settings */}
        <div className="card mb-4" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-secondary)" }}>
          <div className="card-header fw-semibold"
            style={{ backgroundColor: "var(--theme-secondary)", color: "var(--theme-primary-text)", borderColor: "var(--theme-secondary)" }}>
            Exam Settings
          </div>
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-md-3">
                <label className="form-label small" style={{ color: "var(--theme-text-muted)" }}>Subject</label>
                <input className="form-control" placeholder="e.g. Mathematics" value={config.subject} onChange={e => setConfig(p => ({ ...p, subject: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="form-label small" style={{ color: "var(--theme-text-muted)" }}>
                  Duration (minutes) <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input className="form-control" type="number" value={config.durationMinutes} onChange={e => setConfig(p => ({ ...p, durationMinutes: Number(e.target.value) }))} />
              </div>
              <div className="col-md-3">
                <label className="form-label small" style={{ color: "var(--theme-text-muted)" }}>
                  Questions to show per student <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input className="form-control" type="number" value={config.questionsToShow} onChange={e => setConfig(p => ({ ...p, questionsToShow: Number(e.target.value) }))} />
              </div>
              <div className="col-md-3 d-flex align-items-end pb-2">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="randomise" checked={config.randomise} onChange={e => setConfig(p => ({ ...p, randomise: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="randomise" style={{ color: "var(--theme-text-dark)" }}>Randomise questions</label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn theme-btn-confirm"
                style={{ cursor: configValid && !activeConfig ? "pointer" : "not-allowed", opacity: configValid && !activeConfig ? 1 : 0.5 }}
                onClick={activateExam}
                disabled={!configValid || !!activeConfig}
              >
                Activate Exam
              </button>
              <button
                className="btn theme-btn-destructive"
                style={{ cursor: activeConfig ? "pointer" : "not-allowed", opacity: activeConfig ? 1 : 0.5 }}
                onClick={deactivateExam}
                disabled={!activeConfig}
              >
                Deactivate Exam
              </button>
            </div>

            {activeConfig && (
              <div className="mt-3 p-3 border rounded d-flex align-items-center gap-2 flex-wrap"
                style={{ backgroundColor: "var(--theme-bg)", borderColor: "var(--theme-secondary)" }}>
                <span className="badge bg-success">ACTIVE</span>
                <strong style={{ color: "var(--theme-text-dark)" }}>{activeConfig.config_json?.subject}</strong>
                <span style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>
                  {activeConfig.config_json?.durationMinutes} min &nbsp;·&nbsp;
                  {activeConfig.config_json?.questionsToShow} questions &nbsp;·&nbsp;
                  {activeConfig.config_json?.randomise
                    ? <><Shuffle size={14} className="me-1" />Randomised</>
                    : "Fixed order"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Student Results */}
        <div className="card" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-secondary)" }}>
          <div className="card-header fw-semibold d-flex align-items-center"
            style={{ backgroundColor: "var(--theme-secondary)", color: "var(--theme-primary-text)", borderColor: "var(--theme-secondary)" }}>
            Student Results
            {results.length > 0 && (
              <span className="badge ms-2" style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-text)" }}>
                {results.length}
              </span>
            )}
            <span className="ms-2 small d-flex align-items-center gap-1" style={{ color: "#90ee90" }}>
              <Circle size={10} weight="fill" /> Live
            </span>
            {results.length > 0 && (
              <button className="btn theme-btn-cancel btn-sm ms-auto d-flex align-items-center gap-1" onClick={clearResults}>
                <Trash size={15} weight="bold" /> Clear Results
              </button>
            )}
          </div>
          <div className="card-body p-0">
            {sorted.length === 0
              ? <p className="p-3 mb-0" style={{ color: "var(--theme-text-muted)" }}>No results yet.</p>
              : <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-text)" }}>
                    <tr>
                      {[["roll_number","Roll"],["class","Class"],["section","Section"],["percentage","Grade %"],["tab_switches","Tab Switches"],["submitted_at","Submitted At"]].map(([field, label]) => (
                        <th key={field} onClick={() => handleSort(field)} style={{ cursor: "pointer", userSelect: "none", backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-text)" }}>
                          {label}<SortIcon field={field} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(r => (
                      <tr key={r.id} style={{ color: "var(--theme-text-dark)" }}>
                        <td>{r.roll_number}</td><td>{r.class}</td><td>{r.section}</td>
                        <td>{r.percentage?.toFixed(2)}%</td>
                        <td style={{ color: r.tab_switches > 0 ? "#f94144" : "var(--theme-text-dark)", fontWeight: r.tab_switches > 0 ? 700 : 400 }}>
                          {r.tab_switches ?? 0}
                        </td>
                        <td>{new Date(r.submitted_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
          <div className="card-footer d-flex justify-content-end" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-secondary)" }}>
            <div className="dropdown">
              <button className="btn theme-btn-neutral dropdown-toggle" onClick={() => setShowExport(v => !v)}>
                Export Results
              </button>
              {showExport && (
                <ul className="dropdown-menu show">
                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => { exportCSV(); setShowExport(false); }}>
                      <FileCsv size={18} weight="duotone" /> Export as CSV
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => { exportExcel(); setShowExport(false); }}>
                      <FileXls size={18} weight="duotone" /> Export as Excel
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="theme-footer py-2 text-center small">
        MCQ Exam Platform
      </div>

    </div>
  );
}