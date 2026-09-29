'use client';

import { motion } from 'framer-motion';
import NameInput from '@/components/home/NameInput';
import { Pencil, Palette, Gamepad2, Github, BookOpen, Info } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[10%] bg-white p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg]"
      >
        <Pencil className="w-16 h-16 text-pastel-purple-deep" strokeWidth={2.5} />
      </motion.div>
      
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[10%] bg-pastel-yellow-light p-5 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[12deg]"
      >
        <Palette className="w-20 h-20 text-pastel-pink-dark" strokeWidth={2.5} />
      </motion.div>
      
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[20%] bg-pastel-blue-light p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[3deg]"
      >
        <Gamepad2 className="w-12 h-12 text-pastel-green-dark" strokeWidth={2.5} />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-5xl flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8 relative"
        >
          <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '3px black' }}>
            Scrrbl<span className="text-pastel-pink-dark">IX</span>
          </h1>
          <motion.div 
            className="absolute -top-6 -right-10 bg-pastel-yellow p-2 rounded-lg border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Pencil className="w-8 h-8 text-black" />
          </motion.div>
        </motion.div>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-800 font-bold mb-12 text-center max-w-lg leading-relaxed tracking-wide bg-white/60 p-4 rounded-xl border-2 border-black/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          The ultimate multiplayer drawing & guessing game. <br/>
          <span className="text-pastel-purple-deep font-black">Draw</span>, <span className="text-pastel-pink-dark font-black">Guess</span>, and <span className="text-pastel-green-dark font-black">Win!</span>
        </motion.p>

        <div className="w-full flex justify-center">
          <NameInput />
        </div>

        {/* Footer links */}
        <motion.div 
          className="mt-16 flex flex-wrap justify-center gap-6 text-gray-700 font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <a href="#" className="flex items-center gap-2 hover:text-black transition-all px-5 py-2.5 rounded-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <BookOpen size={20} strokeWidth={2.5} />
            How to Play
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-black transition-all px-5 py-2.5 rounded-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Info size={20} strokeWidth={2.5} />
            About
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-black transition-all px-5 py-2.5 rounded-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Github size={20} strokeWidth={2.5} />
            Github
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
