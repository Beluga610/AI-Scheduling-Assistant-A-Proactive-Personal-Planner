import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';

/**
 * 顶级组件 (布局)
 */
export function App() {
  return (
    <div className="app-container">
      {/* 1. 导航栏 */}
      <Navbar />

      {/* 2. 页面内容出口 (由 router.tsx 决定渲染哪个页面) */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
