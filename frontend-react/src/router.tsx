import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import React from 'react';

/**
 * 模拟的私有路由组件
 */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: 真实实现 - 检查 localStorage 中是否有 token
  const isAuthenticated = !!localStorage.getItem('authToken'); // 模拟检查

  if (isAuthenticated) {
    console.log('[Router] 鉴权通过, 访问私有路由');
    return <>{children}</>;
  } else {
    console.log('[Router] 鉴权失败, 重定向到 /login');
    // 如果未认证，重定向到登录页
    return <Navigate to="/login" replace />;
  }
};

/**
 * 定义应用路由
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // 使用 App 作为根布局
    children: [
      {
        path: '/', // 首页
        element: <HomePage />,
      },
      {
        path: '/login', // 登录页
        element: <LoginPage />,
      },
      {
        path: '/dashboard', // 仪表盘 (受保护)
        element: (
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        ),
      },
    ],
  },
]);
