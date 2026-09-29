'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/shared/Avatar';
import { motion } from 'framer-motion';
import { Play, Users, ArrowRight, User } from 'lucide-react';

export default function NameInput() {
  const [name, setName] = useState('');
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!name.trim()) return;
    setPlayerName(name);
    router.push('/room/create'); 
  };

  const handleJoinRoom = () => {
    if (!name.trim()) return;
    setPlayerName(name);
    router.push('/room/join');
  };

  return (
    <div className="pastel-panel p-8 md:p-10 w-full max-w-md flex flex-col items-center gap-8 relative overflow-visible bg-white">
      {/* Avatar Section */}
      <div className="relative group">
        <div className="absolute inset-0 bg-pastel-purple/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative"
        >
          <Avatar 
            name={name} 
            size={120} 
            className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-105 transition-transform duration-300 bg-white"
            showBlink={true}
          />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-full border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-pastel-purple-deep"
          >
            <User size={20} strokeWidth={3} />
          </motion.div>
        </motion.div>
      </div>

      <div className="w-full space-y-5">
        <div className="relative group">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 15))}
            placeholder="Enter your nickname"
            className="w-full px-6 py-4 rounded-xl border-3 border-black bg-white text-xl font-bold text-center text-gray-800 placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            {name && <ArrowRight className="text-black animate-pulse" size={24} strokeWidth={3} />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateRoom}
            disabled={!name.trim()}
            className="pastel-button btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 py-4 h-24"
          >
            <Play size={24} fill="currentColor" />
            <span>Create Room</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleJoinRoom}
            disabled={!name.trim()}
            className="pastel-button btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 py-4 h-24"
          >
            <Users size={24} />
            <span>Join Room</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
