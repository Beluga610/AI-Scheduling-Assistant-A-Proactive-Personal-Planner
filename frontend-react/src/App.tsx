import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/Homepage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";


/**
 * Route Guard Component:
 * Implements client-side security by checking for a valid authentication token.
 * Redirects unauthenticated users to Login and authenticated users to Dashboard.
 */
function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Redirect logic to prevent unauthorized access to protected routes
    if (token && (window.location.pathname === "/" || window.location.pathname === "/login")) {
      navigate("/dashboard");
    }

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
