import React from "react";
import { useNavigate } from "react-router-dom";

export default function Result() {
  const navigate = useNavigate();
  const result = JSON.parse(sessionStorage.getItem("result"));

  if (!result) return <div>No result available</div>;

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Exam Completed</h1>
      <p className="mb-2">Score: {result.score} / {result.max_score}</p>
      <p className="mb-4">Percentage: {result.percentage.toFixed(2)}%</p>
      <button className="bg-blue-600 text-white px-4 py-2" onClick={() => navigate("/")}>
        Logout
      </button>
    </div>
  );
}