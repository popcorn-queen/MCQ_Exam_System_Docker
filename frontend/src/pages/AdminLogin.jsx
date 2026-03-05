import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: 400 }}>
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
  );
}