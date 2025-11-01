// backend/src/types/game.ts

export enum PlayerKind {
  HUMAN = 'HUMAN',
  AI = 'AI',
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  REVEAL = 'REVEAL',
  GAME_OVER = 'GAME_OVER',
}

export interface Player {
  id: string;
  name: string;
  kind: PlayerKind;
  isEliminated: boolean;
  avatar?: string;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: string;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  round: number;
  players: Player[];
  messages: Message[];
  votes: Vote[];
  winner?: string;
}