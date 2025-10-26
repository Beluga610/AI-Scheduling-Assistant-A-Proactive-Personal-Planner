// src/graphql/queries.ts
import { gql } from '@apollo/client';

// 创建游戏
export const CREATE_GAME = gql`
  mutation CreateGame($playerName: String!) {
    createGame(playerName: $playerName) {
      id
      phase
      round
      players {
        id
        name
        kind
        isEliminated
      }
      messages {
        id
        playerName
        text
        timestamp
      }
    }
  }
`;

// 开始游戏
export const START_GAME = gql`
  mutation StartGame($gameId: ID!) {
    startGame(gameId: $gameId) {
      id
      phase
      round
      messages {
        id
        playerName
        text
        timestamp
      }
    }
  }
`;

// 发送消息
export const SEND_MESSAGE = gql`
  mutation SendMessage($gameId: ID!, $playerId: ID!, $text: String!) {
    sendMessage(gameId: $gameId, playerId: $playerId, text: $text) {
      id
      phase
      messages {
        id
        playerName
        text
        timestamp
      }
    }
  }
`;

// 查询游戏状态
export const GET_GAME = gql`
  query GetGame($id: ID!) {
    game(id: $id) {
      id
      phase
      round
      winner
      players {
        id
        name
        kind
        isEliminated
      }
      messages {
        id
        playerName
        text
        timestamp
      }
    }
  }
`;

// 进入下一阶段
export const NEXT_PHASE = gql`
  mutation NextPhase($gameId: ID!) {
    nextPhase(gameId: $gameId) {
      id
      phase
      round
    }
  }
`;

// 提交投票
export const SUBMIT_VOTE = gql`
  mutation SubmitVote($gameId: ID!, $voterId: ID!, $targetId: ID!) {
    submitVote(gameId: $gameId, voterId: $voterId, targetId: $targetId) {
      id
      phase
      winner
      players {
        id
        name
        isEliminated
      }
      messages {
        id
        playerName
        text
      }
    }
  }
`;