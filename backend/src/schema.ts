// backend/src/schema.ts
export const typeDefs = `#graphql
  # 玩家类型
  enum PlayerKind {
    HUMAN
    AI
  }

  # 游戏阶段
  enum GamePhase {
    LOBBY
    DISCUSSION
    VOTING
    REVEAL
    GAME_OVER
  }

  # 玩家
  type Player {
    id: ID!
    name: String!
    kind: PlayerKind!
    isEliminated: Boolean!
    avatar: String
  }

  # 消息
  type Message {
    id: ID!
    playerId: ID!
    playerName: String!
    text: String!
    timestamp: String!
  }

  # 投票
  type Vote {
    voterId: ID!
    targetId: ID!
  }

  # 游戏状态
  type GameState {
    id: ID!
    phase: GamePhase!
    round: Int!
    players: [Player!]!
    messages: [Message!]!
    winner: String
  }

  # 查询
  type Query {
    # 获取游戏状态
    game(id: ID!): GameState
    
    # 获取所有游戏
    games: [GameState!]!
  }

  # 变更
  type Mutation {
    # 创建游戏
    createGame(playerName: String!): GameState!
    
    # 开始游戏
    startGame(gameId: ID!): GameState!
    
    # 发送消息
    sendMessage(gameId: ID!, playerId: ID!, text: String!): GameState!
    
    # 提交投票
    submitVote(gameId: ID!, voterId: ID!, targetId: ID!): GameState!
    
    # 下一阶段
    nextPhase(gameId: ID!): GameState!
  }

  # 订阅 (可选)
  type Subscription {
    # 游戏更新
    gameUpdated(gameId: ID!): GameState!
  }
`;