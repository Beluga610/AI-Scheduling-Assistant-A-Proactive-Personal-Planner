import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

// --- Wrapper: 用来处理 token 自动跳转 ---
function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 如果当前在 "/" 或 "/login"，并且已经登录 → 自动跳 dashboard
    if (token && (window.location.pathname === "/" || window.location.pathname === "/login")) {
      navigate("/dashboard");
    }

    // 如果没有 token，且当前是 dashboard → 强制跳回登录页
    if (!token && window.location.pathname === "/dashboard") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
