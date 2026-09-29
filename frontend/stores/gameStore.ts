import { create } from 'zustand';
import { Player, RoomInfo, GamePhase, ChatMessage } from '../types';

interface GameState {
  // Connection
  connected: boolean;
  setConnected: (connected: boolean) => void;
  
  // Player
  playerId: string | null;
  playerName: string;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  
  // Room
  roomId: string | null;
  isOwner: boolean;
  players: Player[];
  setRoomId: (id: string | null) => void;
  setPlayers: (players: Player[]) => void;
  setIsOwner: (isOwner: boolean) => void;
  
  // Game
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
  wordHint: string;
  wordChoices: string[] | null;
  currentDrawerId: string | null;
  selectedWord: string | null;
  setPhase: (phase: GamePhase) => void;
  setCurrentRound: (round: number) => void;
  setTimeLeft: (time: number) => void;
  setWordHint: (hint: string) => void;
  setWordChoices: (choices: string[] | null) => void;
  setCurrentDrawerId: (id: string | null) => void;
  setSelectedWord: (word: string | null) => void;
  
  // Computed
  isDrawer: () => boolean;
  
  // Chat
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  
  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Connection
  connected: false,
  setConnected: (connected) => set({ connected }),
  
  // Player
  playerId: null,
  playerName: '',
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  
  // Room
  roomId: null,
  isOwner: false,
  players: [],
  setRoomId: (roomId) => set({ roomId }),
  setPlayers: (players) => set({ players }),
  setIsOwner: (isOwner) => set({ isOwner }),
  
  // Game
  phase: 'lobby',
  currentRound: 0,
  totalRounds: 3,
  timeLeft: 0,
  wordHint: '',
  wordChoices: null,
  currentDrawerId: null,
  selectedWord: null,
  setPhase: (phase) => set({ phase }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setWordHint: (wordHint) => set({ wordHint }),
  setWordChoices: (wordChoices) => set({ wordChoices }),
  setCurrentDrawerId: (currentDrawerId) => set({ currentDrawerId }),
  setSelectedWord: (selectedWord) => set({ selectedWord }),
  
  // Computed
  isDrawer: () => {
    const state = get();
    return state.playerId !== null && state.playerId === state.currentDrawerId;
  },
  
  // Chat
  messages: [],
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message].slice(-50)
  })),
  clearMessages: () => set({ messages: [] }),
  
  // Reset
  resetGame: () => set({
    phase: 'lobby',
    currentRound: 0,
    timeLeft: 0,
    wordHint: '',
    wordChoices: null,
    currentDrawerId: null,
    selectedWord: null,
    messages: [],
    players: [],
    roomId: null,
    isOwner: false
  })
}));
