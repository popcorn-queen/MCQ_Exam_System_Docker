import { Navigate } from "react-router-dom";

// Protects /exam — requires active student session
export function ExamRoute({ children }) {
  const student = sessionStorage.getItem("student");
  const examConfig = sessionStorage.getItem("examConfig");
  if (!student || !examConfig) return <Navigate to="/" replace />;
  return children;
}

// Protects /result — requires result data in session
export function ResultRoute({ children }) {
  const result = sessionStorage.getItem("result");
  if (!result) return <Navigate to="/" replace />;
  return children;
}