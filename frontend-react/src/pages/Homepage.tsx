// src/pages/HomePage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">AI Dating Assistant 💘</h1>
        <p className="welcome-subtitle">
          Smart Planning · Auto Scheduling · Conflict Detection
        </p>

        <div className="welcome-buttons">
          <button
            className="welcome-btn primary"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="welcome-btn secondary"
            onClick={() => navigate("/register")}
            disabled
          >
            Register (Coming Soon)
          </button>
        </div>

        <div className="welcome-footer">
          <p>Supported Users: yining · lijun · yizhuo</p>
        </div>
      </div>
    </div>
  );
};