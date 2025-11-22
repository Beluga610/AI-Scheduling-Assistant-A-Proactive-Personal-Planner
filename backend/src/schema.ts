import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    tasks: [Task]           # Tasks associated with the user
    calendarEvents: [CalendarEvent] # Calendar events associated with the user
    preferences: [String]!
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
    "Health check endpoint"
    ping: String
    
    "Get currently logged in user info"
    me: User
    
    "Get all tasks for a specific user"
    userTasks(userId: ID!): [Task]
    
    "Retrieve all calendar events of a specific user"
    userCalendarEvents(userId: ID!): [CalendarEvent]

    "Obtain the list of users"
    users: [User]

    "Obtain the list of tasks"
    tasks(ownerId: ID): [Task]

    "Obtain the list of calendar events"
    events(ownerId: ID): [CalendarEvent]
  }

  type Mutation {
    "User Registration"
    register(input: RegisterInput!): AuthPayload
    
    "User Login"
    login(input: LoginInput!): AuthPayload

    "Core Feature: Use LLM to break down complex tasks"
    splitTask(prompt: String!): [Task]!

    "Manually create a task"
    createTask(input: CreateTaskInput!): Task

    "Synchronize a task to the calendar"
    syncTaskToCalendar(taskId: ID!): CalendarEvent

    updatePreferences(preferences: [String]!): User

    "Create calendar event"
    createEvent(
      title: String!
      start: String!
      end: String!
      allDay: Boolean
      contactName: String
      location: String
      vibe: String
    ): CalendarEvent

    "Update calendar events"
    updateEvent(
      id: ID!
      title: String
      start: String
      end: String
      allDay: Boolean
    ): CalendarEvent

    "Delete calendar events"
    deleteEvent(id: ID!): Boolean

    "AI Chat Window (UPDATED: Now accepts history)"
    chatWithAI(prompt: String!, history: [ChatMessageInput]): AIResponse
  }
    
  type AIResponse {
    message: String!                  # Natural language response from AI
    latestEvents: [CalendarEvent]     # Updated event list for real-time frontend refresh
  }
`;