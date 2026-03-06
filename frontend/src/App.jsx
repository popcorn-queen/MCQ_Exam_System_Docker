import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ExamRoute, ResultRoute } from "./components/StudentRoute";
import useBranding from "./hooks/useBranding";

function App() {
  // Called once here so CSS variables are injected globally on every page.
  // Individual pages can still call useBranding() if they need schoolName/logoFile.
  useBranding();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/exam" element={<ExamRoute><Exam /></ExamRoute>} />
        <Route path="/result" element={<ResultRoute><Result /></ResultRoute>} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;