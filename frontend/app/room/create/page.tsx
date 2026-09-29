'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { motion } from 'framer-motion';

export default function CreateRoomPage() {
  const router = useRouter();
  const { playerName, setIsOwner } = useGameStore();

  useEffect(() => {
    if (!playerName) {
      router.push('/');
      return;
    }
    // Mark as owner and navigate to a special "new" room slug
    // The actual CREATE_ROOM message is sent from the room page once WS is ready
    setIsOwner(true);
    router.push('/room/new');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pastel-panel p-12 text-center w-full max-w-sm flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-6 bg-white p-6 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          🎨
        </motion.div>
        <h2 className="text-2xl font-black text-black uppercase tracking-wide">
          Setting up your room...
        </h2>
      </motion.div>
    </div>
  );
}
