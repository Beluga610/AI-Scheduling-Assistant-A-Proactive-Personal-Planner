// backend/src/resolvers.ts
import type { GameOrchestrator } from './agents/GameOrchestrator.js';

interface Context {
  gameOrchestrator: GameOrchestrator;
}

export const resolvers = {
  Query: {
    // 获取单个游戏
    game: async (_: any, { id }: { id: string }, { gameOrchestrator }: Context) => {
      return gameOrchestrator.getGame(id);
    },

    // 获取所有游戏
    games: async (_: any, __: any, { gameOrchestrator }: Context) => {
      return gameOrchestrator.getAllGames();
    },
  },

  Mutation: {
    // 创建游戏
    createGame: async (
      _: any,
      { playerName }: { playerName: string },
      { gameOrchestrator }: Context
    ) => {
      return gameOrchestrator.createGame(playerName);
    },

    // 开始游戏
    startGame: async (
      _: any,
      { gameId }: { gameId: string },
      { gameOrchestrator }: Context
    ) => {
      return gameOrchestrator.startGame(gameId);
    },

    // 发送消息
    sendMessage: async (
      _: any,
      { gameId, playerId, text }: { gameId: string; playerId: string; text: string },
      { gameOrchestrator }: Context
    ) => {
      return gameOrchestrator.sendMessage(gameId, playerId, text);
    },

    // 提交投票
    submitVote: async (
      _: any,
      { gameId, voterId, targetId }: { gameId: string; voterId: string; targetId: string },
      { gameOrchestrator }: Context
    ) => {
      return gameOrchestrator.submitVote(gameId, voterId, targetId);
    },

    // 下一阶段
    nextPhase: async (
      _: any,
      { gameId }: { gameId: string },
      { gameOrchestrator }: Context
    ) => {
      return gameOrchestrator.nextPhase(gameId);
    },
  },
};