// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  
  // TODO: Get real user info from Context/Apollo
  const isAuthenticated = !!localStorage.getItem('token'); 
  const userName = "Queen"; // Mock user name

  const handleLogout = () => {
    console.log('Navbar: Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('chat_history');
    window.location.href = '/login'; 
  };

  return (
    <nav>
      {/* Left: Logo Area */}
      <Link to="/" className="nav-left">
        <span role="img" aria-label="logo">💘</span>
        <span>AI Dating Assistant</span>
      </Link>
      
      {/* Right: User Actions */}
      <div className="nav-right">
        {isAuthenticated ? (
          <>
            {/* Static Avatar */}
            <div className="nav-avatar" title={`Logged in as ${userName}`}>
              {userName.charAt(0)}
            </div>
            
            {/* Logout Button */}
            <div onClick={handleLogout} className="nav-logout">
              Logout
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-logout">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;