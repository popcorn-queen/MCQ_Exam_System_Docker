import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [roll, setRoll] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!roll || !cls || !section) return alert("Fill all fields");

    // Check exam active
    const resp = await fetch("/api/exam/status");
    const data = await resp.json();
    if (!data.active) return alert("Exam not started yet");

    // Save student info in sessionStorage
    sessionStorage.setItem("student", JSON.stringify({ roll, cls, section }));
    sessionStorage.setItem("examConfig", JSON.stringify(data.config));

    navigate("/exam");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Student Login</h1>
      <input placeholder="Roll Number" className="border p-2 mb-2" value={roll} onChange={e=>setRoll(e.target.value)} />
      <input placeholder="Class" className="border p-2 mb-2" value={cls} onChange={e=>setCls(e.target.value)} />
      <input placeholder="Section" className="border p-2 mb-4" value={section} onChange={e=>setSection(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2" onClick={handleSubmit}>Login</button>
    </div>
  );
}

export default Login;