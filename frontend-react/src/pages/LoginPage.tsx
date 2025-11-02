import React from 'react';
import Login from '../components/Login';

export const LoginPage: React.FC = () => {
  return (
    <div>
      {/* TODO: 可以添加注册 (Register) 组件的切换 */}
      <Login />
    </div>
  );
};
