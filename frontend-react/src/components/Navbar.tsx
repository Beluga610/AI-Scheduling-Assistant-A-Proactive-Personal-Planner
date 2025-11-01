import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  // TODO: 真实实现 - 检查 token
  const isAuthenticated = !!localStorage.getItem('authToken'); // 模拟

  const handleLogout = () => {
    // TODO: 真实实现 - 登出逻辑
    console.log('Navbar: 登出');
    localStorage.removeItem('authToken');
    // 强制刷新以重置 Apollo Client
    window.location.href = '/login'; 
    // navigate('/login');
  };

  return (
    <nav>
      <Link to="/"><strong>LLM 助手</strong></Link>
      <div style={{ flex: 1 }}></div> {/* 占位符 */}
      
      <Link to="/">首页</Link>
      
      {isAuthenticated ? (
        <>
          <Link to="/dashboard">仪表盘</Link>
          <a href="#" onClick={handleLogout} style={{ cursor: 'pointer' }}>登出</a>
        </>
      ) : (
        <Link to="/login">登录</Link>
      )}
    </nav>
  );
};
