'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import Avatar from '@/components/shared/Avatar';
import PlayerList from '@/components/game/PlayerList';
import Chat from '@/components/game/Chat';
import { motion } from 'framer-motion';
import { EVENTS } from '@/lib/constants';
import { Copy, Check, Play } from 'lucide-react';

export default function Lobby() {
  const [copied, setCopied] = useState(false);
  const { roomId, players, isOwner, playerName } = useGameStore();
  const { sendMessage } = useWebSocket();

  const canStartGame = isOwner && players.length >= 2;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(roomId ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (canStartGame) {
      sendMessage(EVENTS.START_GAME, {});
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-4 gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pastel-panel p-8 w-full max-w-xl"
        >
          {/* Room Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-wide">
              Waiting Room
            </h1>
            <p className="text-gray-600 font-bold">
              Invite your friends to join!
            </p>
          </div>

          {/* Room Code */}
          <div className="bg-white rounded-xl p-6 mb-8 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-pastel-purple-deep"></div>
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest mb-2 text-center">Room Code</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-4xl font-mono font-black tracking-widest text-black bg-gray-100 px-4 py-2 rounded-lg border-2 border-black border-dashed">
                {roomId}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="p-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none"
              >
                {copied ? <Check size={24} strokeWidth={3} /> : <Copy size={24} strokeWidth={3} />}
              </motion.button>
            </div>
          </div>

          {/* Players Grid */}
          <div className="mb-8">
            <h3 className="font-black text-gray-800 mb-4 flex justify-between items-end border-b-3 border-black pb-2">
              <span>PLAYERS</span>
              <span className="text-sm bg-black text-white px-2 py-1 rounded-md">{players.length}/5</span>
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative">
                     <Avatar name={player.name} size={64} showBlink className="border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
                     {isOwner && player.id === players.find(p => p.id === useGameStore.getState().playerId)?.id && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black border-2 border-black rounded-full p-1 shadow-sm z-10">
                            <Check size={10} strokeWidth={4} />
                        </div>
                     )}
                  </div>
                  <span className="text-xs font-bold truncate w-full text-center bg-white border border-black rounded px-1 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {player.name}
                  </span>
                </motion.div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: 5 - players.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex flex-col items-center gap-2 opacity-60"
                >
                  <div className="w-16 h-16 rounded-xl border-3 border-dashed border-gray-400 bg-gray-50 flex items-center justify-center text-gray-300 font-black text-2xl">
                    ?
                  </div>
                  <span className="text-xs text-gray-400 font-bold">WAITING</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          {isOwner ? (
            <motion.button
              whileHover={{ scale: canStartGame ? 1.02 : 1 }}
              whileTap={{ scale: canStartGame ? 0.98 : 1 }}
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`w-full py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all border-3 border-black uppercase tracking-wider ${
                canStartGame
                  ? 'bg-pastel-green-dark text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-gray-400'
              }`}
            >
              <Play size={28} strokeWidth={3} fill="currentColor" className={canStartGame ? "text-black" : "text-gray-400"} />
              {canStartGame ? 'Start Game' : `Need ${2 - players.length} more player(s)`}
            </motion.button>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl border-3 border-black border-dashed">
              <p className="text-gray-500 font-black animate-pulse">WAITING FOR HOST TO START...</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-full lg:w-80 h-96 lg:h-auto">
        <Chat />
      </div>
    </div>
  );
}
