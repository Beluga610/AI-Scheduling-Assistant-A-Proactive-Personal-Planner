// src/pages/DashboardPage.tsx

import React from "react";
import { useQuery } from "@apollo/client";
import { GET_ME_QUERY } from "../graphql/queries";
import Navbar from "../components/Navbar";
import TaskInput from "../components/TaskInput";
import CalendarView from "../components/CalendarView";

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
 * 右侧：AI 助手聊天面板
 * 目前是静态 UI 骨架，后面再接 MCP / 多 Agent。
 */
const AssistantPanel: React.FC = () => {
  // TODO: 后面接入真正的聊天历史 + MCP 调用
  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <h2>AI 助手</h2>
        <p className="assistant-subtitle">用自然语言安排你的约会计划</p>
      </div>

      <div className="assistant-chat-history">
        {/* 示例对话占位 */}
        <div className="assistant-message bot">
          您好，准备安排新的约会了吗？可以直接说：“明天下午和 Leo 喝下午茶”～
        </div>
        <div className="assistant-message user">
          明天下午和 Leo 喝下午茶。
        </div>
        <div className="assistant-message bot">
          好的，已为你在明天下午添加与 Leo 的约会。若与其他对象有冲突，我会提醒你～
        </div>
      </div>

      <form
        className="assistant-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: 调用 MCP agent → calendar 工具
        }}
      >
        <input
          className="assistant-input"
          placeholder="例如：周五晚上和 Jack 看电影，再帮我找一个周末和 Alex 见面的空档…"
        />
        <button type="submit" className="assistant-send-btn">
          发送
        </button>
      </form>
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

  // 先用后端返回的 calendarEvents，如果没有，就用 tasks 临时生成一些事件占位
  const events: CalendarEvent[] =
    me.calendarEvents && me.calendarEvents.length > 0
      ? me.calendarEvents
      : tasks.map((task) => ({
          id: `evt-from-${task.id}`,
          title: task.title,
          start: task.dueDate || new Date().toISOString(),
          end: task.dueDate || new Date().toISOString(),
          allDay: true,
        }));

  return (
    <div className="app-shell">
      {/* 顶部导航栏（可以改成暗色横条） */}
      <Navbar />

      {/* 下方主体区域：三栏布局 */}
      <div className="app-layout">
        {/* 左侧栏 */}
        <aside className="layout-sidebar">
          <Sidebar />
        </aside>

        {/* 中间：周视图 + 任务入口 */}
        <main className="layout-main">
          <WeekOverview events={events} />
        </main>

        {/* 右侧：AI 助手聊天 */}
        <section className="layout-assistant">
          <AssistantPanel />
        </section>
      </div>
    </div>
  );
};
