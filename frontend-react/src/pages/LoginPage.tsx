// src/pages/LoginPage.tsx

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_MUTATION } from "../graphql/queries";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // 输入字段
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // 错误提示
  const [errorMessage, setErrorMessage] = useState("");

  // 调用 GraphQL 登录
  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const { data } = await login({
        variables: {
          input: {
            email,
            name,
          },
        },
      });

      const token = data.login.token;

      // 1. 保存新的 token
      localStorage.setItem("token", token);
      
      // ✅ 2. [新增逻辑] 登录成功那一刻，清除旧的聊天记录
      // 这样用户进入 Dashboard 时看到的就是全新的欢迎语
      localStorage.removeItem("chat_history");

      navigate("/dashboard");
    } catch (err) {
      setErrorMessage("登录失败，请检查用户名和邮箱是否匹配。");
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h2 className="login-title">AI 约会助手</h2>
        <p className="login-subtitle">请选择你的身份登录</p>

        <form onSubmit={handleLogin} className="login-form">
          <input
            className="login-input"
            placeholder="用户名（如 yining）"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="login-input"
            placeholder="邮箱（如 yining@admin.com）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="login-hint">
          <p>当前可用用户：</p>
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