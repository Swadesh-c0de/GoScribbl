'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { WS_URL, EVENTS } from '@/lib/constants';
import { toast } from 'sonner';

type BinaryDrawHandler = (buffer: ArrayBuffer) => void;

interface WebSocketContextValue {
  sendMessage: (type: string, data: unknown) => void;
  sendBinary: (data: Uint8Array) => void;
  registerDrawHandler: (fn: BinaryDrawHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const drawHandlerRef = useRef<BinaryDrawHandler | null>(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!mountedRef.current) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (socketRef.current?.readyState === WebSocket.CONNECTING) return;

    const {
      setConnected, setPlayers, setPhase, setRoomId, setPlayerId,
      setCurrentRound, setTimeLeft, setWordHint, setWordChoices,
      setCurrentDrawerId, addMessage,
    } = useGameStore.getState();

    console.log('[WS] Connecting to', WS_URL);
    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';
    socketRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(1000); return; }
      console.log('[WS] Connected');
      useGameStore.getState().setConnected(true);
    };

    ws.onclose = (event) => {
      console.log('[WS] Closed', event.code, event.reason);
      useGameStore.getState().setConnected(false);
      socketRef.current = null;
      if (mountedRef.current && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      console.log('[WS] Error — connection failed');
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        drawHandlerRef.current?.(event.data);
        return;
      }

      if (typeof event.data !== 'string') return;

      try {
        const { type, data } = JSON.parse(event.data);
        console.log('[WS] Received:', type, data);

        switch (type) {
          case EVENTS.CONNECT:
            if (data?.playerId) setPlayerId(data.playerId);
            break;

          case EVENTS.ROOM_INFO:
            setRoomId(data.roomId);
            setPlayers(data.players);
            break;

          case EVENTS.GAME_STARTED:
            toast.success('Game Started! 🎉');
            break;

          case EVENTS.NEXT_ROUND:
            console.log('[WS] NEXT_ROUND received:', data);
            setCurrentDrawerId(data.drawerId);
            setCurrentRound(data.round);
            setWordHint('');
            setPhase('choosing');
            addMessage({
              id: Date.now().toString(),
              text: `${data.drawerName} is choosing a word...`,
              type: 'system',
              timestamp: Date.now(),
            });
            break;

          case EVENTS.ROUND_START:
            console.log('[WS] ROUND_START received:', data);
            setPhase('drawing');
            setCurrentRound(data.round);
            if (data.drawerId) setCurrentDrawerId(data.drawerId);
            setWordHint(data.wordHint ?? '');
            setWordChoices(null);
            addMessage({
              id: Date.now().toString(),
              text: `${data.drawerName} is drawing!`,
              type: 'system',
              timestamp: Date.now(),
            });
            break;

          case EVENTS.WORD_CHOICES: {
            const myId = useGameStore.getState().playerId;
            console.log('[WS] WORD_CHOICES received, words:', data.words, 'myId:', myId);
            setCurrentDrawerId(myId);
            setWordChoices(data.words);
            setPhase('choosing');
            setTimeout(() => {
              const state = useGameStore.getState();
              console.log('[WS] After WORD_CHOICES - phase:', state.phase, 'isDrawer:', state.isDrawer());
            }, 100);
            break;
          }

          case EVENTS.WORD_SELECTED:
            useGameStore.getState().setSelectedWord(data);
            break;

          case EVENTS.TIMER_UPDATE:
            setTimeLeft(data.timeLeft);
            break;

          case EVENTS.CORRECT_GUESS:
            addMessage({
              id: Date.now().toString(),
              playerId: data.playerId,
              playerName: data.playerName,
              text: `✅ ${data.playerName} guessed the word! (+${data.points} pts)`,
              type: 'correct',
              timestamp: Date.now(),
            });
            setPlayers(
              useGameStore.getState().players.map(p =>
                p.id === data.playerId
                  ? { ...p, score: p.score + data.points, hasGuessed: true }
                  : p
              )
            );
            break;

          case EVENTS.CHAT:
            addMessage({
              id: Date.now().toString(),
              playerId: data.playerId,
              playerName: data.playerName,
              text: data.text,
              type: 'chat',
              timestamp: Date.now(),
            });
            break;

          case EVENTS.CLEAR_CANVAS:
            drawHandlerRef.current?.(new ArrayBuffer(0));
            break;

          case EVENTS.ROUND_END:
            console.log('[WS] ROUND_END received');
            setPhase('roundEnd');
            setPlayers(data.scores);
            addMessage({
              id: Date.now().toString(),
              text: `Round over! The word was "${data.word}"`,
              type: 'system',
              timestamp: Date.now(),
            });
            break;

          case EVENTS.GAME_OVER:
            setPhase('gameOver');
            setPlayers(data.scores);
            toast.success(`🏆 Game Over! Winner: ${data.winner.name}`);
            break;

          case EVENTS.ERROR:
            toast.error(data.message);
            break;

          default:
            console.log('[WS] Unhandled:', type);
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close(1000, 'unmount');
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WS] Not connected — dropping:', type);
      toast.error('Not connected to server');
    }
  }, []);

  const sendBinary = useCallback((data: Uint8Array) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  }, []);

  const registerDrawHandler = useCallback((fn: BinaryDrawHandler) => {
    drawHandlerRef.current = fn;
    return () => { drawHandlerRef.current = null; };
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendMessage, sendBinary, registerDrawHandler }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used inside <WebSocketProvider>');
  return ctx;
}
