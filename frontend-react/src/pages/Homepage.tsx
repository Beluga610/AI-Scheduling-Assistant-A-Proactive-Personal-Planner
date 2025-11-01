import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div>
      <h1>欢迎使用 LLM 任务日历助手</h1>
      <p>这是一个 MERN + GraphQL 项目，用于演示如何使用 AI 拆分复杂任务并将其同步到您的日历。</p>
      <Link to="/dashboard">
        <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          前往仪表盘
        </button>
      </Link>
    </div>
  );
};
