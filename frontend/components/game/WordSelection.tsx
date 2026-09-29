'use client';

import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { motion } from 'framer-motion';
import { EVENTS } from '@/lib/constants';
import { Edit3, Star } from 'lucide-react';

export default function WordSelection() {
  const { wordChoices, setSelectedWord, setPhase } = useGameStore();
  const { sendMessage } = useWebSocket();

  const handleSelectWord = (word: string) => {
    setSelectedWord(word);
    // Backend expects raw string: json.Unmarshal(msg.Data, &word)
    sendMessage(EVENTS.WORD_SELECTED, word);
    setPhase('drawing');
  };

  if (!wordChoices || wordChoices.length === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="pastel-panel p-8 max-w-lg w-full mx-4"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          className="inline-flex justify-center p-4 bg-pastel-purple/20 rounded-full mb-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Edit3 className="w-12 h-12 text-black" strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-3xl font-black text-black tracking-tight uppercase">
          Choose a word!
        </h2>
        <p className="text-gray-600 font-bold mt-2">Pick something fun to draw</p>
      </div>
      
      <div className="flex flex-col gap-4">
        {wordChoices.map((word, index) => (
          <motion.button
            key={word}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectWord(word)}
            className="group relative w-full py-4 px-6 text-xl font-black rounded-2xl bg-white border-3 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all flex items-center justify-between overflow-hidden"
          >
            <span className="relative z-10">{word}</span>
            <Star className="w-6 h-6 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity stroke-black stroke-2" fill="currentColor" />
            <div className="absolute inset-0 bg-pastel-purple/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </motion.button>
        ))}
      </div>

      <p className="text-center text-gray-500 mt-8 text-sm font-bold">
        Choose wisely! Your friends will try to guess it.
      </p>
    </motion.div>
  );
}
