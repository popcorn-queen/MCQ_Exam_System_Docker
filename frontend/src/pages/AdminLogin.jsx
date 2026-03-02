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
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Admin Login</h1>
      <input placeholder="Username" className="border p-2 mb-2" value={user} onChange={e=>setUser(e.target.value)} />
      <input type="password" placeholder="Password" className="border p-2 mb-4" value={pass} onChange={e=>setPass(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2" onClick={login}>Login</button>
    </div>
  );
}