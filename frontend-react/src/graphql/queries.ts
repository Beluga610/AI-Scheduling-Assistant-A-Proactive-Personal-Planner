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
      _id
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
      }
    }
  }
`;