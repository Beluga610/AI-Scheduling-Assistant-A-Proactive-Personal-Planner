import { gql } from "@apollo/client";

export const PING = gql`
  query Ping {
    ping
  }
`;

export const GET_TASKS = gql`
  query GetTasks {
    tasks {
      id
      title
      description
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      start
      end
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id     # Changed _id to id to match your Schema and DTO
      name
      email
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const GET_ME_QUERY = gql`
  query GetMe {
    me {
      id
      name
      email
      tasks {
        id
        title
        status
        dueDate
      }
      calendarEvents {
        id
        title
        start
        end
        allDay
      }
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($title: String!, $start: String!, $end: String!) {
    createEvent(title: $title, start: $start, end: $end) {
      id
      title
      start
      end
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $title: String, $start: String, $end: String) {
    updateEvent(id: $id, title: $title, start: $start, end: $end) {
      id
      title
      start
      end
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

export const CHAT_WITH_AI = gql`
  mutation ChatWithAI($prompt: String!, $history: [ChatMessageInput]) {
    chatWithAI(prompt: $prompt, history: $history) {
      message
      latestEvents {
        id
        title
        start
        end
        allDay
      }
    }
  }
`;