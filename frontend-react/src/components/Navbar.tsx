// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {  // 移除 const 命名
  const navigate = useNavigate();
  // TODO: 真实实现 - 检查 token
  const isAuthenticated = !!localStorage.getItem('token'); // 模拟

const handleLogout = () => {
    console.log('Navbar: 登出');
    localStorage.removeItem('token');
    
    // ✅ 新增：登出时也清理聊天记录
    localStorage.removeItem('chat_history');
    
    window.location.href = '/login'; 
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

export default Navbar; 