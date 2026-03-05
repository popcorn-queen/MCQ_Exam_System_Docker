import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBranding from "../hooks/useBranding";

function Login() {
  const [roll, setRoll] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const navigate = useNavigate();
  const { logoFile, bgColor } = useBranding();

  const handleSubmit = async () => {
    if (!roll || !cls || !section) return alert("Fill all fields");
    const resp = await fetch("/api/exam/status");
    const data = await resp.json();
    if (!data.active) return alert("Exam not started yet");
    sessionStorage.setItem("student", JSON.stringify({ roll, cls, section }));
    sessionStorage.setItem("examConfig", JSON.stringify(data.config));
    navigate("/exam");
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: bgColor }}>
      <div className="text-center" style={{ width: "100%", maxWidth: 400 }}>
        {logoFile && (
          <img src={`/${logoFile}`} alt="School Logo" className="mb-3" style={{ maxHeight: 100, maxWidth: 200, objectFit: "contain" }} />
        )}
        <div className="card shadow p-4">
          <h2 className="card-title text-center mb-4">Student Login</h2>
          <div className="mb-3">
            <input className="form-control" placeholder="Roll Number" value={roll} onChange={e => setRoll(e.target.value)} />
          </div>
          <div className="mb-3">
            <input className="form-control" placeholder="Class" value={cls} onChange={e => setCls(e.target.value)} />
          </div>
          <div className="mb-3">
            <input className="form-control" placeholder="Section" value={section} onChange={e => setSection(e.target.value)} />
          </div>
          <button className="btn btn-primary w-100" onClick={handleSubmit}>Login</button>
        </div>
      </div>
    </div>
  );
}

export default Login;