// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  
  // TODO: Real implementation - check token presence
  const isAuthenticated = !!localStorage.getItem('token'); 

  const handleLogout = () => {
    console.log('Navbar: Logging out');
    localStorage.removeItem('token');
    
    // ✅ New: Clear chat history on logout
    localStorage.removeItem('chat_history');
    
    window.location.href = '/login'; 
  };

  return (
    <nav>
      <Link to="/"><strong>LLM Assistant</strong></Link>
      <div style={{ flex: 1 }}></div> {/* Spacer */}
      
      <Link to="/">Home</Link>
      
      {isAuthenticated ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <a href="#" onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</a>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
};

export default Navbar;