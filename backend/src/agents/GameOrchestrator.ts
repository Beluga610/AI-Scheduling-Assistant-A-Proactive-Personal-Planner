// backend/src/agents/GameOrchestrator.ts
import { AIAgent } from '../agents/AIAgents.js';
import { GameState, GamePhase, PlayerKind, Player, Message, Vote } from '../types/game.js';

export class GameOrchestrator {
  private games: Map<string, GameState> = new Map();
  private aiAgents: Map<string, AIAgent> = new Map();

  constructor() {
    this.initializeAIAgents();
  }

  /**
   * 初始化 AI 代理
   */
  private initializeAIAgents() {
    const agents = [
      {
        id: 'ai1',
        name: 'Alex',
        personality: '你是一个逻辑思维很强的人，说话简洁明了。',
      },
      {
        id: 'ai2',
        name: 'Sam',
        personality: '你很随和友好，喜欢用口语化的表达，偶尔打错字。',
      },
      {
        id: 'ai3',
        name: 'Jordan',
        personality: '你比较怀疑，喜欢质疑和提问。',
      },
    ];

    agents.forEach((config) => {
      this.aiAgents.set(config.id, new AIAgent(config));
    });
  }

  /**
   * 创建新游戏
   */
  createGame(playerName: string): GameState {
    const gameId = `game_${Date.now()}`;
    const humanPlayer: Player = {
      id: 'human1',
      name: playerName,
      kind: PlayerKind.HUMAN,
      isEliminated: false,
    };

    const aiPlayers: Player[] = Array.from(this.aiAgents.values()).map((agent) => ({
      id: agent.getId(),
      name: agent.getName(),
      kind: PlayerKind.AI,
      isEliminated: false,
    }));

    const game: GameState = {
      id: gameId,
      phase: GamePhase.LOBBY,
      round: 0,
      players: [humanPlayer, ...aiPlayers],
      messages: [],
      votes: [],
    };

    this.games.set(gameId, game);
    console.log(`✨ 创建游戏: ${gameId}`);
    return game;
  }

  /**
   * 开始游戏
   */
  async startGame(gameId: string): Promise<GameState> {
    const game = this.getGame(gameId);
    if (!game) throw new Error('游戏不存在');

    game.phase = GamePhase.DISCUSSION;
    game.round = 1;

    // 主持人欢迎消息
    this.addMessage(game, 'system', 'System', '欢迎来到"谁是人类"游戏！找出谁是真人，谁是 AI！');

    console.log(`🎮 游戏开始: ${gameId}`);
    return game;
  }

  /**
   * 发送消息
   */
  async sendMessage(gameId: string, playerId: string, text: string): Promise<GameState> {
    const game = this.getGame(gameId);
    if (!game) throw new Error('游戏不存在');

    const player = game.players.find((p) => p.id === playerId);
    if (!player) throw new Error('玩家不存在');

    // 添加人类消息
    this.addMessage(game, playerId, player.name, text);

    // 触发 AI 回复（异步，带延迟）
    if (player.kind === PlayerKind.HUMAN) {
      this.triggerAIResponses(game);
    }

    return game;
  }

  /**
   * 触发 AI 代理回复
   */
  private async triggerAIResponses(game: GameState) {
    const context = this.buildContext(game);

    for (const [agentId, agent] of this.aiAgents.entries()) {
      // 跳过已淘汰的 AI
      const player = game.players.find((p) => p.id === agentId);
      if (!player || player.isEliminated) continue;

      // 随机延迟 1-3 秒
      const delay = 1000 + Math.random() * 2000;

      setTimeout(async () => {
        try {
          const response = await agent.speak(context);
          this.addMessage(game, agentId, agent.getName(), response);
          console.log(`🤖 ${agent.getName()} 回复: ${response}`);
        } catch (error) {
          console.error(`AI ${agent.getName()} 回复失败:`, error);
        }
      }, delay);
    }
  }

  /**
   * 提交投票
   */
  async submitVote(gameId: string, voterId: string, targetId: string): Promise<GameState> {
    const game = this.getGame(gameId);
    if (!game) throw new Error('游戏不存在');

    game.votes.push({ voterId, targetId });

    // 如果所有玩家都投票了，进入揭示阶段
    const activePlayers = game.players.filter((p) => !p.isEliminated);
    if (game.votes.length >= activePlayers.length) {
      return this.revealVotes(gameId);
    }

    return game;
  }

  /**
   * 揭示投票结果
   */
  private revealVotes(gameId: string): GameState {
    const game = this.getGame(gameId);
    if (!game) throw new Error('游戏不存在');

    // 统计票数
    const voteCounts = new Map<string, number>();
    game.votes.forEach((vote) => {
      voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) || 0) + 1);
    });

    // 找出得票最多的玩家
    let maxVotes = 0;
    let eliminatedId = '';
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = playerId;
      }
    });

    // 淘汰玩家
    const eliminated = game.players.find((p) => p.id === eliminatedId);
    if (eliminated) {
      eliminated.isEliminated = true;
      this.addMessage(
        game,
        'system',
        'System',
        `${eliminated.name} 被淘汰了！Ta 是 ${eliminated.kind === PlayerKind.AI ? 'AI' : '人类'}！`
      );
    }

    // 清空投票
    game.votes = [];
    game.phase = GamePhase.REVEAL;

    // 检查游戏是否结束
    this.checkGameOver(game);

    return game;
  }

  /**
   * 检查游戏是否结束
   */
  private checkGameOver(game: GameState) {
    const activePlayers = game.players.filter((p) => !p.isEliminated);
    const activeHumans = activePlayers.filter((p) => p.kind === PlayerKind.HUMAN).length;
    const activeAI = activePlayers.filter((p) => p.kind === PlayerKind.AI).length;

    if (activeHumans === 0) {
      game.phase = GamePhase.GAME_OVER;
      game.winner = 'AI';
      this.addMessage(game, 'system', 'System', '🤖 AI 获胜！');
    } else if (activeAI === 0) {
      game.phase = GamePhase.GAME_OVER;
      game.winner = 'HUMAN';
      this.addMessage(game, 'system', 'System', '👤 人类获胜！');
    }
  }

  /**
   * 下一阶段
   */
  nextPhase(gameId: string): GameState {
    const game = this.getGame(gameId);
    if (!game) throw new Error('游戏不存在');

    if (game.phase === GamePhase.REVEAL) {
      game.phase = GamePhase.DISCUSSION;
      game.round++;
    } else if (game.phase === GamePhase.DISCUSSION) {
      game.phase = GamePhase.VOTING;
    }

    return game;
  }

  /**
   * 获取游戏
   */
  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * 获取所有游戏
   */
  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }

  /**
   * 添加消息
   */
  private addMessage(game: GameState, playerId: string, playerName: string, text: string) {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      playerId,
      playerName,
      text,
      timestamp: new Date().toISOString(),
    };
    game.messages.push(message);
  }

  /**
   * 构建对话上下文
   */
  private buildContext(game: GameState): string {
    const recentMessages = game.messages.slice(-10);
    return recentMessages.map((m) => `${m.playerName}: ${m.text}`).join('\n');
  }
}
