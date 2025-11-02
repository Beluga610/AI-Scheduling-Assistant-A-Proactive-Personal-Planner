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

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
    }
  }
`;
