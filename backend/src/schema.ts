// src/schema.ts
import { gql } from 'graphql-tag';

// 定义 GraphQL Schema
export const typeDefs = gql`
  # -----------------
  # 对象类型
  # -----------------
  
  type User {
    id: ID!
    email: String!
    name: String
    tasks: [Task] # 用户关联的任务
    calendarEvents: [CalendarEvent] # 用户关联的日历事件
  }

  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: String # ISO 8601 日期字符串
    status: TaskStatus! # 任务状态
    owner: User!
  }

  type CalendarEvent {
    id: ID!
    title: String!
    start: String! # ISO 8601 日期字符串
    end: String! # ISO 8601 日期字符串
    allDay: Boolean
    sourceTask: Task # 关联的原始任务
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
  }

  # 认证载荷，用于登录和注册后返回
  type AuthPayload {
    token: String!
    user: User!
  }

  # -----------------
  # 输入类型
  # -----------------

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

  # -----------------
  # 查询 (Queries)
  # -----------------

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

  # -----------------
  # 变更 (Mutations)
  # -----------------

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
  }
`;