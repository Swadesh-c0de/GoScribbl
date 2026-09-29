'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import NameInput from '@/components/home/NameInput';
import { Pencil, Palette, Gamepad2, Github, BookOpen, Info, X } from 'lucide-react';

type InfoPanel = 'how-to-play' | 'about' | null;

export default function Home() {
  const [infoPanel, setInfoPanel] = useState<InfoPanel>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[10%] bg-white p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-6"
      >
        <Pencil className="w-16 h-16 text-pastel-purple-deep" strokeWidth={2.5} />
      </motion.div>
      
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[10%] bg-pastel-yellow-light p-5 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12"
      >
        <Palette className="w-20 h-20 text-pastel-pink-dark" strokeWidth={2.5} />
      </motion.div>
      
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[20%] bg-pastel-blue-light p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3"
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
            Go<span className="text-pastel-pink-dark">Scribbl</span>
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
          <button type="button" onClick={() => setInfoPanel('how-to-play')} className="flex items-center gap-2 hover:text-black transition-all px-5 py-2.5 rounded-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <BookOpen size={20} strokeWidth={2.5} />
            How to Play
          </button>
          <button type="button" onClick={() => setInfoPanel('about')} className="flex items-center gap-2 hover:text-black transition-all px-5 py-2.5 rounded-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Info size={20} strokeWidth={2.5} />
            About
          </button>
          <a href="#" className="flex items-center gap-2 hover:text-black transition-all px-5 py-2.5 rounded-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Github size={20} strokeWidth={2.5} />
            Github
          </a>
        </motion.div>
      </motion.div>

      {infoPanel && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
          role="presentation"
          onClick={() => setInfoPanel(null)}
        >
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-panel-title"
            className="pastel-panel relative w-full max-w-lg p-6 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInfoPanel(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg border-2 border-black bg-white p-1.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {infoPanel === 'how-to-play' ? (
              <>
                <p className="mb-2 text-sm font-black uppercase tracking-widest text-pastel-purple-deep">Quick guide</p>
                <h2 id="info-panel-title" className="mb-6 pr-10 text-3xl font-black text-black">How to Play</h2>
                <ol className="space-y-4 text-left text-base font-bold leading-relaxed text-gray-800">
                  <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-yellow font-black">1</span><span>Enter your name and create a room, or join a room with its code.</span></li>
                  <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-pink font-black">2</span><span>When it is your turn, choose a word and draw it on the canvas.</span></li>
                  <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-blue font-black">3</span><span>Guess what the other player is drawing by sending messages in chat.</span></li>
                  <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-green font-black">4</span><span>Score points for quick correct guesses. The highest score wins.</span></li>
                </ol>
              </>
            ) : (
              <>
                <p className="mb-2 text-sm font-black uppercase tracking-widest text-pastel-pink-dark">Meet the game</p>
                <h2 id="info-panel-title" className="mb-4 pr-10 text-3xl font-black text-black">About GoScribbl</h2>
                <p className="text-base font-bold leading-relaxed text-gray-800">GoScribbl is a fast, friendly multiplayer drawing game built for spontaneous rounds with friends. Take turns drawing clever clues, guessing boldly, and enjoying the chaos together.</p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm font-black text-black">
                  <div className="rounded-lg border-2 border-black bg-pastel-yellow p-3">Draw</div>
                  <div className="rounded-lg border-2 border-black bg-pastel-pink p-3">Guess</div>
                  <div className="rounded-lg border-2 border-black bg-pastel-green p-3">Win</div>
                </div>
              </>
            )}
          </motion.section>
        </div>
      )}
    </div>
  );
}
