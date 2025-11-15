// src/pages/HomePage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">AI 约会助手 💘</h1>
        <p className="welcome-subtitle">
          智能规划 · 自动安排 · 冲突检测 · 多对象协调  
        </p>

        <div className="welcome-buttons">
          <button
            className="welcome-btn primary"
            onClick={() => navigate("/login")}
          >
            登录已有账号
          </button>

          <button
            className="welcome-btn secondary"
            onClick={() => navigate("/register")}
            disabled
          >
            注册新用户（暂未开放）
          </button>
        </div>

        <div className="welcome-footer">
          <p>当前支持的用户：yining · lijun · yizhuo</p>
        </div>
      </div>
    </div>
  );
};
