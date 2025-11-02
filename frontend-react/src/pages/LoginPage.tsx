import React from 'react';
import {Login} from '../components/Login';

/**
 * 登录页面
 * (这个页面只是简单地包装了 Login 组件)
 */
export const LoginPage: React.FC = () => {
  return (
    <div>
      {/* TODO: 可以添加注册 (Register) 组件的切换 */}
      <Login />
    </div>
  );
};
