// src/pages/LoginPage.tsx

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_MUTATION } from "../graphql/queries";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const { data } = await login({
        variables: {
          input: { email, name },
        },
      });

      const token = data.login.token;

      // 1. Save token
      localStorage.setItem("token", token);
      
      // 2. Clear old chat history for a fresh start
      localStorage.removeItem("chat_history");

      navigate("/dashboard");
    } catch (err) {
      setErrorMessage("Login failed. Please check if your username and email match.");
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h2 className="login-title">Personal Planner Login</h2>
        <p className="login-subtitle">Select your identity to continue</p>

        <form onSubmit={handleLogin} className="login-form">
          <input
            className="login-input"
            placeholder="Username (e.g., yining)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="login-input"
            placeholder="Email (e.g., yining@admin.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-hint">
          <p>Available Users:</p>
          <ul>
            <li>yining · yining@admin.com</li>
            <li>lijun · lijun@admin.com</li>
            <li>yizhuo · yizhuo@admin.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
};