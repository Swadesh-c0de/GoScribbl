'use client';

import { useGameStore } from '@/stores/gameStore';
import Avatar from '@/components/shared/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, Trophy, User } from 'lucide-react';

export default function PlayerList() {
  const { players, currentDrawerId, playerId } = useGameStore();

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="pastel-panel p-4 flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-center gap-2 mb-2">
        <User className="w-5 h-5 text-pastel-purple-deep" />
        <h3 className="text-xl font-bold text-pastel-purple-deep">Players</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        <AnimatePresence>
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              layout
              className={`
                relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                ${player.id === playerId ? 'bg-pastel-yellow border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                ${player.hasGuessed ? 'bg-pastel-green border-black' : ''}
              `}
            >
              <div className="font-black text-black text-lg w-6 text-center">
                #{index + 1}
              </div>
              
              <div className="relative">
                <Avatar name={player.name} size={42} showBlink={player.id === playerId} className="border-2 border-black" />
                {player.isDrawer && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black text-black"
                  >
                    <Pencil size={12} strokeWidth={3} />
                  </motion.div>
                )}
                {player.hasGuessed && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black text-green-600"
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="font-black text-gray-800 truncate flex items-center gap-1">
                  {player.name}
                  {player.id === playerId && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded-md font-black tracking-wide">YOU</span>}
                </div>
                <div className="text-sm text-gray-600 font-bold flex items-center gap-1">
                  <Trophy size={12} strokeWidth={2.5} />
                  {player.score} pts
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
