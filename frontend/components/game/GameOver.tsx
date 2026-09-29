'use client';

import { useGameStore } from '@/stores/gameStore';
import Avatar from '@/components/shared/Avatar';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { Trophy, Crown, RotateCcw, Medal } from 'lucide-react';

export default function GameOver() {
  const { players, resetGame } = useGameStore();
  const router = useRouter();

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  // Confetti effect on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#DCD0FF', '#FFB7B2', '#E2F0CB', '#B5EAD7']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#DCD0FF', '#FFB7B2', '#E2F0CB', '#B5EAD7']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    router.push('/');
  };

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="pastel-panel p-8 max-w-lg w-full mx-4 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-center mb-6"
      >
        <div className="bg-pastel-yellow/20 p-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Trophy className="w-20 h-20 text-yellow-500 fill-yellow-200 stroke-black stroke-2" />
        </div>
      </motion.div>

      <h1 className="text-4xl font-black text-black mb-2 tracking-tight uppercase drop-shadow-sm">Game Over!</h1>
      
      {winner && (
        <div className="my-8 bg-white p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-500 font-black uppercase tracking-widest text-xs mb-4">Winner</p>
          <motion.div 
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              <Avatar name={winner.name} size={96} showBlink className="border-4 border-black" />
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -top-6 -right-6 bg-white rounded-full p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-3 border-black"
              >
                <Crown className="w-8 h-8 text-yellow-500 fill-yellow-200 stroke-black stroke-2" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-black text-black">{winner.name}</h2>
            <div className="px-4 py-1 bg-pastel-pink/20 rounded-full border-2 border-black">
              <p className="text-xl font-black text-black">{winner.score} points</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="space-y-2 mb-8 max-h-48 overflow-y-auto custom-scrollbar pr-2">
        {sortedPlayers.slice(1).map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex items-center gap-4 p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <span className="font-black text-gray-400 w-8">#{index + 2}</span>
            <Avatar name={player.name} size={36} className="border-2 border-black" />
            <span className="flex-1 font-bold truncate text-left text-black">{player.name}</span>
            <span className="font-black text-black bg-gray-100 border border-black px-2 py-0.5 rounded-md">{player.score} pts</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePlayAgain}
        className="pastel-button btn-primary text-lg px-8 py-4 w-full flex items-center justify-center gap-2"
      >
        <RotateCcw size={20} strokeWidth={2.5} />
        Play Again
      </motion.button>
    </motion.div>
  );
}
