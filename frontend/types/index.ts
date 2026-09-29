export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawer: boolean;
  hasGuessed?: boolean;
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName?: string;
  text: string;
  type: 'chat' | 'system' | 'correct' | 'join' | 'leave';
  timestamp: number;
}

export type GamePhase = 'lobby' | 'choosing' | 'drawing' | 'roundEnd' | 'gameOver';

export interface RoomInfo {
  roomId: string;
  players: Player[];
}

export interface RoundStartData {
  round: number;
  drawerId: string;
  drawerName: string;
  wordLength: number;
  wordHint: string;
}

export interface CorrectGuessData {
  playerId: string;
  playerName: string;
  points: number;
}

export interface RoundEndData {
  word: string;
  scores: Player[];
}

export interface GameOverData {
  winner: Player;
  scores: Player[];
}

export interface DrawPacket {
  tool: number;
  color: number; // Index into color palette
  size: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
