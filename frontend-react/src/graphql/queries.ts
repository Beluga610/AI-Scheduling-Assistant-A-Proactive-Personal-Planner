import { gql } from '@apollo/client';

// -----------------
// 变更 (MUTATIONS)
// -----------------

/**
 * 用户登录
 */
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

/**
 * LLM 拆分任务
 */
export const SPLIT_TASK_MUTATION = gql`
  mutation SplitTask($prompt: String!) {
    splitTask(prompt: $prompt) {
      id
      title
      description
      dueDate
      status
    }
  }
`;

// -----------------
// 查询 (QUERIES)
// -----------------

/**
 * 获取当前用户信息 (包含任务和日历)
 */
export const GET_ME_QUERY = gql`
  query GetMe {
    me {
      id
      email
      name
      tasks {
        id
        title
        description
        dueDate
        status
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
