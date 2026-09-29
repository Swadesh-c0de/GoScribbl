'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENTS } from '@/lib/constants';
import { Send, MessageCircle } from 'lucide-react';

export default function Chat() {
  const [text, setText] = useState('');
  const { messages, phase } = useGameStore();
  const { sendMessage } = useWebSocket();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // console.log('[CHAT] Sending message:', text, 'phase:', phase);
    sendMessage(EVENTS.GUESS, { text });
    setText('');
  };

  return (
    <div className="pastel-panel h-full flex flex-col overflow-hidden bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="p-3 bg-pastel-purple/20 border-b-3 border-black flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
        <h3 className="font-black text-black uppercase tracking-wide">Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-white">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm p-2 rounded-xl break-words border-2 font-bold
                ${msg.type === 'system' ? 'bg-blue-100 text-blue-900 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center' : ''}
                ${msg.type === 'correct' ? 'bg-green-100 text-green-900 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center' : ''}
                ${msg.type === 'join' ? 'bg-yellow-100 text-yellow-900 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center' : ''}
                ${msg.type === 'leave' ? 'bg-pink-100 text-pink-900 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center' : ''}
                ${msg.type === 'chat' ? 'bg-gray-50 border-gray-200 text-gray-800' : ''}
              `}
            >
              {msg.type === 'chat' && (
                <span className="font-black text-black mr-1">
                  {msg.playerName}:
                </span>
              )}
              <span>{msg.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-gray-50 border-t-3 border-black flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={phase === 'drawing' ? "Type your guess here..." : "Chat here..."}
          className="flex-1 px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-sm bg-white font-bold text-black placeholder:text-gray-400"
          maxLength={100}
        />
        <button 
          type="submit"
          className="p-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim()}
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
