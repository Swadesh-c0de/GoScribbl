'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import PlayerList from './PlayerList';
import Chat from './Chat';
import Canvas from './Canvas';
import WordSelection from './WordSelection';
import RoundEnd from './RoundEnd';
import GameOver from './GameOver';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageCircle, X } from 'lucide-react';

export default function Game() {
  const { phase, timeLeft, currentRound, totalRounds, wordHint, currentDrawerId, players, selectedWord, wordChoices, playerId } = useGameStore();
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Find current drawer name
  const currentDrawer = players.find(p => p.id === currentDrawerId);
  // Compute isDrawer directly to avoid stale closure issues
  const amIDrawer = playerId !== null && playerId === currentDrawerId;

  // Debug logging
  // console.log('[GAME] Render - phase:', phase, 'amIDrawer:', amIDrawer, 'playerId:', playerId, 'currentDrawerId:', currentDrawerId, 'wordChoices:', wordChoices);

  return (
    <div className="flex h-screen w-full p-4 gap-6 overflow-hidden">
      {/* Left Sidebar - Players */}
      <div className="w-72 flex-shrink-0 hidden md:block h-full">
        <PlayerList />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        {/* Header - Timer & Word */}
        <div className="h-20 flex items-center justify-between px-6 py-2 bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-6">
            <div className="relative w-14 h-14 flex items-center justify-center bg-white rounded-full border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
              <span className={`font-black text-xl ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-black'}`}>{timeLeft}</span>
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="transparent"
                  strokeWidth="0"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke={timeLeft <= 10 ? '#EF4444' : '#9F8FEF'}
                  strokeWidth="4"
                  strokeDasharray="138"
                  strokeDashoffset={138 - (138 * timeLeft) / 60}
                  className="transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 truncate">Round {currentRound} / {totalRounds}</span>
              
              {phase === 'drawing' && amIDrawer ? (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-bold uppercase">Your Word</span>
                  <span className="text-2xl font-black text-pastel-purple-deep tracking-tight truncate">{selectedWord}</span>
                </div>
              ) : (
                <div className="flex gap-2 font-mono text-3xl tracking-widest font-black text-gray-800 overflow-x-auto no-scrollbar">
                  {wordHint.split('').map((char, i) => (
                    <span key={i} className={`flex items-center justify-center ${char === ' ' ? 'w-6' : 'min-w-[24px] border-b-4 border-black text-center pb-1'}`}>
                      {char === '_' ? '\u00A0' : char}
                    </span>
                  ))}
                  <sup className="text-xs text-gray-500 font-sans ml-2 self-start mt-2 font-bold">{wordHint.replace(/ /g, '').length}</sup>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden sm:block">
            {phase === 'choosing' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-pastel-yellow/20 rounded-full border-2 border-black animate-pulse">
                <Clock size={18} className="text-black" strokeWidth={2.5} />
                <span className="text-black font-bold text-sm">
                  {currentDrawer?.name} is choosing...
                </span>
              </div>
            )}
            {phase === 'drawing' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-pastel-green/20 rounded-full border-2 border-black">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-black" />
                <span className="text-black font-bold text-sm">
                  {currentDrawer?.name} is drawing
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative bg-white rounded-xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <Canvas />
          
          <AnimatePresence>
            {phase === 'roundEnd' && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-white/30"
              >
                <RoundEnd />
              </motion.div>
            )}

            {phase === 'choosing' && amIDrawer && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/40"
              >
                <WordSelection />
              </motion.div>
            )}

            {phase === 'gameOver' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-pastel-purple/90 backdrop-blur-xl"
              >
                <GameOver />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Sidebar - Chat */}
      <div className="w-80 flex-shrink-0 hidden lg:block h-full">
        <Chat />
      </div>

      {/* Mobile Chat Overlay Button - visible only on small screens */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <button 
          className="w-14 h-14 bg-black text-white rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px]"
          onClick={() => setShowMobileChat(true)}
        >
          <MessageCircle size={28} />
          {/* Unread indicator could go here */}
        </button>
      </div>

      {/* Mobile Chat Overlay */}
      <AnimatePresence>
        {showMobileChat && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white"
          >
            <div className="p-4 bg-pastel-purple/20 border-b-3 border-black flex items-center justify-between">
              <h3 className="font-black text-black text-xl uppercase tracking-wide flex items-center gap-2">
                <MessageCircle size={24} />
                Chat
              </h3>
              <button 
                onClick={() => setShowMobileChat(false)}
                className="p-2 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 bg-pastel-purple/10">
              <Chat />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
