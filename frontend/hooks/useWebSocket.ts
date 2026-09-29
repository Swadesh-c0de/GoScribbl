import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { WS_URL, EVENTS } from '@/lib/constants';
import { toast } from 'sonner';

export const useWebSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  
  const {
    setConnected,
    setPlayers,
    setPhase,
    setRoomId,
    setPlayerId,
    setIsOwner,
    setCurrentRound,
    setTimeLeft,
    setWordHint,
    setWordChoices,
    setCurrentDrawerId,
    addMessage,
  } = useGameStore();

  const connect = useCallback(() => {
    // Guard against SSR
    if (typeof window === 'undefined') return;
    
    // Prevent multiple connection attempts
    if (isConnectingRef.current) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (socketRef.current?.readyState === WebSocket.CONNECTING) return;

    isConnectingRef.current = true;
    console.log('Connecting to WebSocket:', WS_URL);
    
    try {
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setConnected(true);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('Disconnected from WebSocket', event.code, event.reason);
        setConnected(false);
        isConnectingRef.current = false;
        socketRef.current = null;
        
        // Only reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        // Error details are not available in browser for security reasons
        console.log('WebSocket connection error');
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        // Handle binary data (draw events) separately
        if (event.data instanceof Blob) {
          return;
        }

        if (event.data instanceof ArrayBuffer) {
          return;
        }

        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          console.log('Received message:', type, data);

          switch (type) {
            case EVENTS.ROOM_INFO:
              setRoomId(data.roomId);
              setPlayers(data.players);
              break;
              
            case EVENTS.GAME_STARTED:
              setPhase('roundEnd');
              toast.success('Game Started!');
              break;
              
            case EVENTS.ROUND_START:
              setPhase('drawing');
              setCurrentRound(data.round);
              setCurrentDrawerId(data.drawerId);
              setWordHint(data.wordHint);
              setWordChoices(null);
              addMessage({
                id: Date.now().toString(),
                text: `Round ${data.round} started! ${data.drawerName} is drawing.`,
                type: 'system',
                timestamp: Date.now()
              });
              break;
              
            case EVENTS.WORD_CHOICES:
              setPhase('choosing');
              setWordChoices(data.words);
              toast.info('Choose a word to draw!');
              break;
              
            case EVENTS.TIMER_UPDATE:
              setTimeLeft(data.timeLeft);
              break;
              
            case EVENTS.CORRECT_GUESS:
              addMessage({
                id: Date.now().toString(),
                playerId: data.playerId,
                playerName: data.playerName,
                text: 'guessed the word!',
                type: 'correct',
                timestamp: Date.now()
              });
              break;
              
            case EVENTS.CHAT:
              addMessage({
                id: Date.now().toString(),
                playerId: data.playerId,
                playerName: data.playerName,
                text: data.text,
                type: 'chat',
                timestamp: Date.now()
              });
              break;
              
            case EVENTS.ROUND_END:
              setPhase('roundEnd');
              setPlayers(data.scores);
              addMessage({
                id: Date.now().toString(),
                text: `Round ended! The word was "${data.word}"`,
                type: 'system',
                timestamp: Date.now()
              });
              break;
              
            case EVENTS.GAME_OVER:
              setPhase('gameOver');
              setPlayers(data.scores);
              toast.success(`Game Over! Winner: ${data.winner.name}`);
              break;
              
            case EVENTS.ERROR:
              toast.error(data.message);
              break;
              
            default:
              console.log('Unhandled message type:', type);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      isConnectingRef.current = false;
    }
  }, [
    setConnected, setPlayers, setPhase, setRoomId, 
    setPlayerId, setIsOwner, setCurrentRound, setTimeLeft, setWordHint, 
    setWordChoices, setCurrentDrawerId, addMessage
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: string, data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected, cannot send:', type);
    }
  }, []);

  const sendBinary = useCallback((data: Uint8Array) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { sendMessage, sendBinary, connected: socketRef.current?.readyState === WebSocket.OPEN };
};
