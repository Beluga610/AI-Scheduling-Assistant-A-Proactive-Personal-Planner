import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../graphql/queries';
import { useNavigate } from 'react-router-dom';

/**
 * 登录表单组件
 */
export const Login: React.FC = () => {
  const [email, setEmail] = useState('user@example.com'); // 模拟默认值
  const [password, setPassword] = useState('123456'); // 模拟默认值
  const navigate = useNavigate();

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      // 2. TODO: 真实实现 - 登录成功
      console.log('Login: 登录成功', data.login.user.email);
      // 2a. 存储 token
      localStorage.setItem('authToken', data.login.token);
      // 2b. 重定向到仪表盘
      // 强制刷新页面以确保 Apollo Client (client.ts) 重置 authLink
      window.location.href = '/dashboard'; 
      // navigate('/dashboard'); // 使用 navigate 可能不会立即更新 Apollo 的 Header
    },
    onError: (err) => {
      console.error('Login: 登录失败', err);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    console.log('Login: 提交登录', email);
    
    // 1. TODO: 真实实现 - 调用登录 Mutation
    login({ variables: { email, password } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>登录</h2>
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
      {error && <p className="error-message">登录失败: {error.message}</p>}
    </form>
  );
};
