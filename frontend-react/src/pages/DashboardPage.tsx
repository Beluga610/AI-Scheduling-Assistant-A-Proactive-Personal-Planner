// src/pages/DashboardPage.tsx

import React from "react";
import { useQuery } from "@apollo/client";
import { GET_ME_QUERY } from "../graphql/queries";
import Navbar from "../components/Navbar";
import TaskInput from "../components/TaskInput";
import CalendarView from "../components/CalendarView";
import AssistantPanel from "../components/AssistantPanel";

interface Task {
  id: string;
  title: string;
  status?: string;
  dueDate?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
}

interface MeData {
  id: string;
  name: string;
  email: string;
  // 后续可以在这里加 contacts / preferences 等
  tasks: Task[];
  calendarEvents: CalendarEvent[];
}

interface MeQueryResult {
  me: MeData;
}

/**
 * 左侧栏：联系人 / 本周目标 / 添加联系人
 * 目前是静态假数据，后面可以接 GraphQL
 */
const Sidebar: React.FC = () => {
  // TODO: 未来从后端获取联系人列表
  const contacts = [
    { id: "1", name: "Leo", color: "#FF7BAC" },
    { id: "2", name: "Jack", color: "#7BB1FF" },
    { id: "3", name: "Alex", color: "#FFC36A" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">AI 约会助手</div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">约会对象 · 常联系</div>
        <ul className="sidebar-contact-list">
          {contacts.map((c) => (
            <li key={c.id} className="sidebar-contact-item">
              <div
                className="sidebar-contact-avatar"
                style={{ backgroundColor: c.color }}
              >
                {c.name.charAt(0)}
              </div>
              <span className="sidebar-contact-name">{c.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">本周目标</div>
        <div className="sidebar-goal-card">
          {/* TODO: 从后端配置真正的目标数据 */}
          <p>本周至少安排 3 次线下约会 ✨</p>
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-add-contact-btn">＋ 添加联系人</button>
      </div>
    </div>
  );
};

/**
 * 中间区域：本周日历概览
 * 暂时还是用你现有的 CalendarView 作为占位，后续会把它重写成周视图。
 */
const WeekOverview: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  return (
    <div className="week-overview">
      <div className="week-overview-header">
        <h2>本周概览</h2>
        {/* TODO: 这里以后可以加 “本周范围/日期切换控件” */}
      </div>

      <div className="week-overview-calendar">
        {/* 目前先复用老的 CalendarView，后面我们会把它改成真正的周视图 */}
        <CalendarView events={events} />
      </div>

      <div className="week-overview-tasks">
        <h3>拆分任务 / 约会生成入口</h3>
        <TaskInput />
      </div>
    </div>
  );
};

/**
 * 仪表盘页面（核心页面）：
 * 顶部 Navbar + 下方三栏布局（Sidebar / WeekOverview / AssistantPanel）
 */
export const DashboardPage: React.FC = () => {
  const { data, loading, error } = useQuery<MeQueryResult>(GET_ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  if (loading) return <p>正在加载用户数据...</p>;
  if (error) return <p>错误: {error.message}</p>;
  if (!data || !data.me) return <p>无法获取用户信息，请尝试重新登录。</p>;

  const { me } = data;
  const tasks = me.tasks || [];

  // 处理 events 数据，确保日期格式正确
const events = (me.calendarEvents || []).map((evt: any) => {
    // 打印一下，看看 start 是不是正常的 ISO 字符串
    console.log("前端收到的事件:", evt); 
    return {
      ...evt,
      start: evt.start, 
      end: evt.end
    };
  });

  return (
    <div className="app-shell">
      <Navbar />

      <div className="app-layout">
        {/* 左侧栏 */}
        <aside className="layout-sidebar">
          <Sidebar />
        </aside>

        {/* 中间：周视图 */}
        <main className="layout-main">
          <WeekOverview events={events} />
        </main>

        {/* 右侧：AI 助手聊天 */}
        <section className="layout-assistant">
          {/* ✅ 使用引入的真实组件 */}
          <AssistantPanel />
        </section>
      </div>
    </div>
  );
};
