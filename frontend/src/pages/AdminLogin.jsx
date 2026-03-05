import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useBranding from "../hooks/useBranding";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  const { logoFile, bgColor } = useBranding();

  const login = async () => {
    try {
      const resp = await axios.post("/api/admin/login", { username: user, password: pass });
      localStorage.setItem("adminToken", resp.data.token);
      navigate("/admin/dashboard");
    } catch (e) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: bgColor }}>
      <div className="text-center" style={{ width: "100%", maxWidth: 400 }}>
        {logoFile && (
          <img src={`/${logoFile}`} alt="School Logo" className="mb-3" style={{ maxHeight: 100, maxWidth: 200, objectFit: "contain" }} />
        )}
        <div className="card shadow p-4">
          <h2 className="card-title text-center mb-4">Admin Login</h2>
          <div className="mb-3">
            <input className="form-control" placeholder="Username" value={user} onChange={e => setUser(e.target.value)} />
          </div>
          <div className="mb-3">
            <input className="form-control" type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
          </div>
          <button className="btn btn-dark w-100" onClick={login}>Login</button>
        </div>
      </div>
    </div>
  );
}