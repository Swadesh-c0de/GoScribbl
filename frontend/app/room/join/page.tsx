'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { motion } from 'framer-motion';
import Avatar from '@/components/shared/Avatar';
import { ArrowLeft } from 'lucide-react';

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();
  const { playerName } = useGameStore();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    // Strip full URL if pasted (e.g. http://localhost:3000/room/66a0cedb -> 66a0cedb)
    const code = roomCode.trim().replace(/.*\/room\//, '');
    router.push(`/room/${code}`);
  };

  // Redirect if no player name
  if (!playerName) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pastel-panel p-8 w-full max-w-md"
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-black font-bold hover:text-gray-600 mb-6 transition-colors border-2 border-black rounded-full px-4 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] bg-white w-fit"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back
        </button>

        <div className="flex flex-col items-center mb-6">
          <Avatar name={playerName} size={80} showBlink className="border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
          <p className="mt-3 font-black text-xl text-black bg-white border-2 border-black px-3 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{playerName}</p>
        </div>

        <h1 className="text-3xl font-black text-center text-black mb-6 uppercase tracking-wide">
          Join a Room
        </h1>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.trim())}
              placeholder="e.g. 66a0cedb"
              className="w-full px-4 py-3 text-center text-2xl font-mono font-black tracking-widest rounded-xl border-3 border-black bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-300 text-black uppercase"
              maxLength={36}
              autoFocus
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!roomCode.trim()}
            className="w-full pastel-button btn-primary py-4 text-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            Join Room
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
