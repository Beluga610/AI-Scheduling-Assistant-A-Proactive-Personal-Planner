// src/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    tasks: [Task]
    calendarEvents: [CalendarEvent]
  }

  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: String
    status: TaskStatus!
    owner: User!
  }

  type CalendarEvent {
    id: ID!
    title: String!
    start: String!
    end: String!
    allDay: Boolean
    sourceTask: Task
    contactName: String
    location: String
    vibe: String
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String
  }

  input LoginInput {
    email: String!
    name: String
  }
   
  input CreateTaskInput {
    title: String!
    description: String
    dueDate: String
  }

  input ChatMessageInput {
    role: String!    # 'user' or 'assistant'
    content: String! # The message text
  }


  type Query {
    "健康检查端点"
    ping: String
    
    "获取当前登录的用户信息"
    me: User
    
    "获取特定用户的所有任务"
    userTasks(userId: ID!): [Task]
    
    "获取特定用户的所有日历事件"
    userCalendarEvents(userId: ID!): [CalendarEvent]

    "获取用户列表"
    users: [User]

    "获取任务列表"
    tasks(ownerId: ID): [Task]

    "获取日历事件列表"
    events(ownerId: ID): [CalendarEvent]
  }

  type Mutation {
    "用户注册"
    register(input: RegisterInput!): AuthPayload
    
    "用户登录"
    login(input: LoginInput!): AuthPayload

    "核心功能：使用 LLM 拆分一个复杂的任务"
    splitTask(prompt: String!): [Task]!

    "（可选）手动创建一个任务"
    createTask(input: CreateTaskInput!): Task

    "（可选）将一个任务同步到日历"
    syncTaskToCalendar(taskId: ID!): CalendarEvent

    "创建日历事件"
    createEvent(
      title: String!
      start: String!
      end: String!
      allDay: Boolean
      contactName: String
      location: String
      vibe: String
    ): CalendarEvent

    "更新日历事件"
    updateEvent(
      id: ID!
      title: String
      start: String
      end: String
      allDay: Boolean
    ): CalendarEvent

    "删除日历事件"
    deleteEvent(id: ID!): Boolean

    "AI 聊天窗口 (UPDATED: Now accepts history)"
    chatWithAI(prompt: String!, history: [ChatMessageInput]): AIResponse
  }
    
  type AIResponse {
    message: String!                  # AI 给用户的自然语言回复
    latestEvents: [CalendarEvent]     # 返回最新的事件列表，用于前端自动刷新日历
  }
`;