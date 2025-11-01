import React from 'react';
import { TaskInput } from '../components/TaskInput';
import { CalendarView } from '../components/CalendarView';
import { useQuery } from '@apollo/client';
import { GET_ME_QUERY } from '../graphql/queries';

/**
 * 仪表盘页面 (应用核心)
 */
export const DashboardPage: React.FC = () => {

  // 1. 获取当前用户数据 (包含 tasks 和 calendarEvents)
  const { data, loading, error } = useQuery(GET_ME_QUERY, {
    fetchPolicy: 'cache-and-network', // 确保数据最新
  });

  // TODO: 真实实现 - 处理加载和错误状态
  if (loading) return <p>正在加载用户数据...</p>;
  if (error) return <p>错误: {error.message} (请检查后端是否运行，或尝试重新登录)</p>;
  if (!data || !data.me) return <p>无法获取用户信息，请尝试重新登录。</p>

  const { me } = data;
  
  // 模拟从 user.tasks 和 user.calendarEvents 提取数据
  const tasks = me.tasks || []; 
  const events = me.calendarEvents || [
    // 模拟一个来自 tasks 的事件
    ...tasks.map((task: any) => ({
      id: `evt-from-${task.id}`,
      title: task.title,
      start: task.dueDate || new Date().toISOString(),
      end: task.dueDate || new Date().toISOString(),
      allDay: true
    }))
  ];

  console.log('Dashboard: 渲染用户', me.email);
  console.log('Dashboard: 渲染任务', tasks);
  console.log('Dashboard: 渲染日历事件', events);

  return (
    <div>
      <h2>欢迎, {me.name || me.email}!</h2>
      
      {/* 1. 任务输入 */}
      <TaskInput />

      {/* 2. TODO: 任务列表 (显示 LLM 生成的任务) */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3>我的任务列表 (模拟)</h3>
        {tasks.length === 0 ? (
          <p>暂无任务，快去拆分一个吧！</p>
        ) : (
          <ul style={{ background: '#2f2f2f', padding: '1rem', borderRadius: '8px' }}>
            {tasks.map((task: any)T => (
              <li key={task.id}>{task.title} ({task.status})</li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. 日历视图 */}
      <CalendarView events={events} />

    </div>
  );
};
