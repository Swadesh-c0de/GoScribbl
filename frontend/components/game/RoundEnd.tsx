'use client';

import { useGameStore } from '@/stores/gameStore';
import Avatar from '@/components/shared/Avatar';
import { motion } from 'framer-motion';
import { Palette, Crown, Trophy } from 'lucide-react';

export default function RoundEnd() {
  const { players, currentRound, totalRounds } = useGameStore();
  
  // Get the word from the last system message
  const lastSystemMsg = useGameStore.getState().messages.find(m => m.type === 'system' && m.text.includes('The word was'));
  const word = lastSystemMsg?.text.match(/"([^"]+)"/)?.[1] || '???';

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="pastel-panel p-8 max-w-md w-full mx-4"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex justify-center mb-4"
        >
          <div className="bg-pastel-purple/20 p-4 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Palette className="w-16 h-16 text-black" strokeWidth={2.5} />
          </div>
        </motion.div>
        <h2 className="text-xl font-black text-gray-500 uppercase tracking-wide">The word was</h2>
        <motion.h1 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-5xl font-black text-black mt-2 tracking-tight drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]"
          style={{ WebkitTextStroke: '1px black' }}
        >
          {word}
        </motion.h1>
      </div>

      <div className="space-y-3 mb-8">
        {sortedPlayers.slice(0, 5).map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${
              index === 0 
                ? 'bg-pastel-yellow border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                : 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="font-black text-lg w-8 text-center flex justify-center">
              {index === 0 ? (
                <Crown className="w-6 h-6 text-yellow-500 fill-yellow-200 stroke-black stroke-2" />
              ) : (
                <span className="text-gray-500">#{index + 1}</span>
              )}
            </div>
            
            <Avatar name={player.name} size={40} className="border-2 border-black" />
            
            <span className="flex-1 font-black truncate text-black">{player.name}</span>
            
            <div className="flex items-center gap-1 font-black text-black">
              <Trophy size={14} strokeWidth={2.5} />
              <span>{player.score}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-block px-4 py-1 bg-gray-100 rounded-full border-2 border-black">
          <p className="font-black text-black text-sm">Round {currentRound} / {totalRounds}</p>
        </div>
        <p className="text-sm mt-3 text-black font-bold animate-pulse">Next round starting soon...</p>
      </div>
    </motion.div>
  );
}
