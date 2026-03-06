import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const WS_URL = `ws://${window.location.hostname}:5000`;

export default function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [activeConfig, setActiveConfig] = useState(null);
  const [config, setConfig] = useState({ subject: "", durationMinutes: 30, questionsToShow: 10, randomise: false });
  const [sortField, setSortField] = useState("submitted_at");
  const [sortDir, setSortDir] = useState("desc");
  const [showExport, setShowExport] = useState(false);
  const fileRef = useRef();
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  // WebSocket for live results
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "NEW_RESULT") {
        setResults(prev => [msg.result, ...prev]);
      }
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
      // Find active config if any
      const active = cfgResp.data.find(c => c.is_active);
      setActiveConfig(active || null);
    } catch { alert("Failed to load data"); }
  };

  useEffect(() => { fetchAll(); }, []);

  const uploadQuestions = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return alert("Select a JSON file first.");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const qs = parsed.questions ?? parsed;
      if (!Array.isArray(qs)) return alert("JSON must contain an array of questions.");
      await axios.post("/api/admin/upload-questions", { questions: qs }, { headers });
      setUploadStatus(`✅ ${qs.length} questions uploaded successfully`);
      fetchAll();
    } catch { setUploadStatus("❌ Upload failed — check your JSON format."); }
  };

  const clearQuestions = async () => {
    if (!window.confirm("Are you sure you want to clear all uploaded questions? This cannot be undone.")) return;
    await axios.delete("/api/admin/clear-questions", { headers });
    setUploadStatus(""); setQuestions([]); fetchAll();
  };

  const clearResults = async () => {
    if (!window.confirm("Are you sure you want to clear all student results? This cannot be undone.")) return;
    await axios.delete("/api/admin/clear-results", { headers });
    setResults([]);
  };

  const configValid = config.subject && config.durationMinutes > 0 && config.questionsToShow > 0;

  const activateExam = async () => {
    if (!configValid) return;
    const resp = await axios.post("/api/admin/config", { config }, { headers });
    // Get the newly created config id and activate it
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

  // Sorting
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
    if (sortField !== field) return <span className="text-muted ms-1">↕</span>;
    return <span className="ms-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const exportCSV = () => window.open(`/api/admin/export/csv?token=${token}`, "_blank");
  const exportExcel = () => window.open(`/api/admin/export/excel?token=${token}`, "_blank");

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Teacher Dashboard</h1>
        <button className="btn btn-outline-danger" onClick={() => { localStorage.removeItem("adminToken"); window.location.href = "/admin"; }}>Logout</button>
      </div>

      {/* Upload Questions */}
      <div className="card mb-4">
        <div className="card-header fw-semibold d-flex justify-content-between align-items-center">
          Upload Question Paper (JSON)
          {questions.length > 0 && (
            <button className="btn btn-outline-danger btn-sm" onClick={clearQuestions}>🗑 Clear Questions</button>
          )}
        </div>

        <div className="card-body">
          <div className="mb-2 text-muted small">
            Format: <code>{"{ \"questions\": [{ \"question\": \"...\", \"type\": \"single|multiple\", \"options\": [...], \"correctAnswer\": \"...\", \"weight\": 1 }] }"}</code>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <input type="file" accept=".json" ref={fileRef} className="form-control" style={{ maxWidth: 300 }} />
            <button className="btn btn-primary" onClick={uploadQuestions}>Upload</button>
          </div>
          {uploadStatus && <div className="mt-2 small">{uploadStatus}</div>}
          {questions.length > 0 && (
            <div className="mt-3">
              <div className="text-muted small mb-1">{questions.length} questions currently loaded:</div>
              <ul className="list-group list-group-flush" style={{ maxHeight: 385, overflowY: "auto" }}>
                {questions.map((q, i) => (
                  <li key={i} className="list-group-item py-1 small">
                    <span className="badge bg-secondary me-2">{q.type}</span>{q.question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Exam Settings */}
      <div className="card mb-4">
        <div className="card-header fw-semibold">Exam Settings</div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-3">
              <label className="form-label small">Subject</label>
              <input className="form-control" placeholder="e.g. Mathematics" value={config.subject} onChange={e => setConfig(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Duration (minutes)</label>
              <input className="form-control" type="number" value={config.durationMinutes} onChange={e => setConfig(p => ({ ...p, durationMinutes: Number(e.target.value) }))} />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Questions to show per student</label>
              <input className="form-control" type="number" value={config.questionsToShow} onChange={e => setConfig(p => ({ ...p, questionsToShow: Number(e.target.value) }))} />
            </div>
            <div className="col-md-3 d-flex align-items-end pb-2">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="randomise" checked={config.randomise} onChange={e => setConfig(p => ({ ...p, randomise: e.target.checked }))} />
                <label className="form-check-label" htmlFor="randomise">Randomise questions</label>
              </div>
            </div>
          </div>

          {/* Activate / Deactivate buttons */}
          <div className="d-flex gap-2">
            <button
              className="btn"
              style={{ backgroundColor: configValid && !activeConfig ? "#198754" : "#6c757d", color: "white", cursor: configValid && !activeConfig ? "pointer" : "not-allowed" }}
              onClick={activateExam}
              disabled={!configValid || !!activeConfig}
            >
              Activate Exam
            </button>
            <button
              className="btn"
              style={{ backgroundColor: activeConfig ? "#dc3545" : "#6c757d", color: "white", cursor: activeConfig ? "pointer" : "not-allowed" }}
              onClick={deactivateExam}
              disabled={!activeConfig}
            >
              Deactivate Exam
            </button>
          </div>

          {/* Active exam info */}
          {activeConfig && (
            <div className="mt-3 p-3 border rounded bg-light">
              <span className="badge bg-success me-2">ACTIVE</span>
              <strong className="text-dark">{activeConfig.config_json?.subject}</strong>
              <span className="text-muted ms-2" style={{ fontSize: "0.9rem" }}>
                {activeConfig.config_json?.durationMinutes} min &nbsp;·&nbsp;
                {activeConfig.config_json?.questionsToShow} questions &nbsp;·&nbsp;
                {activeConfig.config_json?.randomise ? "🔀 Randomised" : "Fixed order"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Student Results */}
      <div className="card">
        <div className="card-header fw-semibold d-flex align-items-center">
          Student Results
          {results.length > 0 && <span className="badge bg-primary ms-2">{results.length}</span>}
          <span className="ms-2 text-success small">● Live</span>
          {results.length > 0 && (
            <button className="btn btn-outline-danger btn-sm ms-auto" onClick={clearResults}>🗑 Clear Results</button>
          )}
        </div>
        <div className="card-body p-0">
          {sorted.length === 0
            ? <p className="text-muted p-3 mb-0">No results yet.</p>
            : <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    {[["roll_number","Roll"],["class","Class"],["section","Section"],["percentage","Grade %"],["submitted_at","Submitted At"]].map(([field, label]) => (
                      <th key={field} onClick={() => handleSort(field)} style={{ cursor: "pointer", userSelect: "none" }}>
                        {label}<SortIcon field={field} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => (
                    <tr key={r.id}>
                      <td>{r.roll_number}</td><td>{r.class}</td><td>{r.section}</td>
                      <td>{r.percentage?.toFixed(2)}%</td>
                      <td>{new Date(r.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* Export dropdown */}
        <div className="card-footer d-flex justify-content-end">
          <div className="dropdown">
            <button className="btn btn-secondary dropdown-toggle" onClick={() => setShowExport(v => !v)}>
              Export Results
            </button>
            {showExport && (
              <ul className="dropdown-menu show">
                <li><button className="dropdown-item" onClick={() => { exportCSV(); setShowExport(false); }}>📄 Export as CSV</button></li>
                <li><button className="dropdown-item" onClick={() => { exportExcel(); setShowExport(false); }}>📊 Export as Excel</button></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}