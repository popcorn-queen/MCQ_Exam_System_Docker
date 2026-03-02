import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [config, setConfig] = useState({});
  const [results, setResults] = useState([]);

  const fetchResults = async () => {
    const resp = await axios.get("/api/admin/results");
    setResults(resp.data);
  };

  useEffect(() => { fetchResults(); }, []);

  const exportCSV = () => window.open("/api/admin/export", "_blank");

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Teacher Dashboard</h1>

      <div className="mb-4">
        <button className="bg-green-600 text-white px-3 py-1 mr-2">Activate Exam</button>
        <button className="bg-gray-600 text-white px-3 py-1" onClick={exportCSV}>Export Results</button>
      </div>

      <table className="table-auto border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border px-2">Roll</th>
            <th className="border px-2">Class</th>
            <th className="border px-2">Section</th>
            <th className="border px-2">Score</th>
            <th className="border px-2">Percentage</th>
            <th className="border px-2">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id}>
              <td className="border px-2">{r.roll_number}</td>
              <td className="border px-2">{r.class}</td>
              <td className="border px-2">{r.section}</td>
              <td className="border px-2">{r.score}</td>
              <td className="border px-2">{r.percentage.toFixed(2)}</td>
              <td className="border px-2">{new Date(r.submitted_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}