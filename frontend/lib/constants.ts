export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

export const EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Room
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_INFO: 'room_info',
  
  // Game Flow
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  NEXT_ROUND: 'next_round',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  
  // Word Selection
  WORD_CHOICES: 'word_choices',
  WORD_SELECTED: 'word_selected',
  
  // Gameplay
  TIMER_UPDATE: 'timer_update',
  GUESS: 'guess',
  CORRECT_GUESS: 'correct_guess',
  CHAT: 'chat',
  SCORE_UPDATE: 'score_update',
  
  // Drawing
  DRAW: 'draw',
  CLEAR_CANVAS: 'clear_canvas',
  
  // Errors
  ERROR: 'error'
};

export const COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#c1c1c1', // Grey
  '#ef130b', // Red
  '#ff7100', // Orange
  '#ffe400', // Yellow
  '#00cc00', // Green
  '#00b2ff', // Light Blue
  '#231fd3', // Blue
  '#a300ba', // Purple
  '#d37caa', // Pink
  '#a0522d'  // Brown
];

export const BRUSH_SIZES = [2, 5, 10, 20];
