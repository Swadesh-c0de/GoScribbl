'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { COLORS, BRUSH_SIZES, EVENTS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Trash2, Eye } from 'lucide-react';

interface Point { x: number; y: number; }

// Backend binary packet: 12 bytes
// [0] msgType  [1] tool  [2] colorIdx  [3] brushSize
// [4-5] x1  [6-7] y1  [8-9] x2  [10-11] y2  (all big-endian uint16)
const DRAW_PACKET_SIZE = 12;
const CANVAS_W = 800;
const CANVAS_H = 600;

function encodePacket(tool: number, colorIdx: number, size: number, from: Point, to: Point): Uint8Array {
  const buf = new ArrayBuffer(DRAW_PACKET_SIZE);
  const v = new DataView(buf);
  v.setUint8(0, 0x01);
  v.setUint8(1, tool);
  v.setUint8(2, colorIdx);
  v.setUint8(3, size);
  v.setUint16(4, Math.round(from.x), false);
  v.setUint16(6, Math.round(from.y), false);
  v.setUint16(8, Math.round(to.x), false);
  v.setUint16(10, Math.round(to.y), false);
  return new Uint8Array(buf);
}

function decodePacket(buf: ArrayBuffer) {
  if (buf.byteLength < DRAW_PACKET_SIZE) return null;
  const v = new DataView(buf);
  return {
    tool:     v.getUint8(1),
    colorIdx: v.getUint8(2),
    size:     v.getUint8(3),
    x1:       v.getUint16(4, false),
    y1:       v.getUint16(6, false),
    x2:       v.getUint16(8, false),
    y2:       v.getUint16(10, false),
  };
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  const { phase, playerId, currentDrawerId } = useGameStore();
  const { sendBinary, sendMessage, registerDrawHandler } = useWebSocket();

  // Compute isDrawer directly to avoid stale closure issues
  const amIDrawer = playerId !== null && playerId === currentDrawerId;
  const canDraw = amIDrawer && phase === 'drawing';

  // Set internal canvas resolution once
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const paintLine = useCallback((from: Point, to: Point, strokeColor: string, size: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  // Register binary draw handler from remote players
  useEffect(() => {
    const unregister = registerDrawHandler((buffer: ArrayBuffer) => {
      if (buffer.byteLength === 0) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }
        return;
      }
      const pkt = decodePacket(buffer);
      if (!pkt) return;
      const strokeColor = pkt.tool === 1 ? '#ffffff' : (COLORS[pkt.colorIdx] ?? '#000000');
      paintLine({ x: pkt.x1, y: pkt.y1 }, { x: pkt.x2, y: pkt.y2 }, strokeColor, pkt.size);
    });
    return unregister;
  }, [registerDrawHandler, paintLine]);

  // Clear canvas on new round
  useEffect(() => {
    if (phase === 'choosing' || phase === 'roundEnd') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }
    }
  }, [phase]);

  // Convert a mouse/touch event to canvas-space coordinates
  // Uses the canvas element's bounding rect so it works at any CSS scale
  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    // Map from CSS pixels → internal canvas pixels
    return {
      x: ((clientX - rect.left) / rect.width)  * CANVAS_W,
      y: ((clientY - rect.top)  / rect.height) * CANVAS_H,
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    e.preventDefault();
    const pt = getCoords(e);
    if (pt) { isDrawingRef.current = true; lastPointRef.current = pt; }
  }, [canDraw, getCoords]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !canDraw) return;
    e.preventDefault();
    const pt = getCoords(e);
    const last = lastPointRef.current;
    if (!pt || !last) return;

    const strokeColor = tool === 'eraser' ? '#ffffff' : color;
    paintLine(last, pt, strokeColor, brushSize);

    const colorIdx = COLORS.indexOf(color);
    sendBinary(encodePacket(tool === 'eraser' ? 1 : 0, colorIdx >= 0 ? colorIdx : 0, brushSize, last, pt));

    lastPointRef.current = pt;
  }, [canDraw, tool, color, brushSize, getCoords, paintLine, sendBinary]);

  const handleEnd = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    sendMessage(EVENTS.CLEAR_CANVAS, {});
  }, [sendMessage]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Canvas area — fills available space, canvas scales via CSS */}
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center bg-gray-50/50 p-4 overflow-hidden rounded-xl">
        <canvas
          ref={canvasRef}
          className={`bg-white shadow-sm rounded-lg ${canDraw ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, 
            objectFit: 'contain',
            touchAction: 'none'
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {!canDraw && phase === 'drawing' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="bg-white text-black px-6 py-2 rounded-full font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 border-3 border-black uppercase tracking-wide">
              <Eye size={20} className="text-black" strokeWidth={2.5} />
              Watch and guess!
            </div>
          </div>
        )}
      </div>

      {/* Drawing Tools */}
      {canDraw && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border-3 border-black p-4 flex flex-wrap items-center justify-center gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl z-10"
        >
          <div className="flex gap-2 flex-wrap justify-center">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('brush'); }}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  color === c && tool === 'brush' ? 'border-black scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-200 hover:border-black'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-0.5 h-8 bg-black/10" />

          <div className="flex gap-3 items-center">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`rounded-full bg-black transition-all hover:scale-110 ${
                  brushSize === s ? 'ring-2 ring-black ring-offset-2 scale-110' : 'opacity-40 hover:opacity-100'
                }`}
                style={{ width: s + 8, height: s + 8 }}
              />
            ))}
          </div>

          <div className="w-0.5 h-8 bg-black/10" />

          <div className="flex gap-2">
            <button onClick={() => setTool('brush')}
              className={`p-2.5 rounded-xl transition-all border-2 ${tool === 'brush' ? 'bg-pastel-purple text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-100 hover:text-black'}`}
              title="Brush"
            >
              <Pencil size={20} strokeWidth={2.5} />
            </button>
            <button onClick={() => setTool('eraser')}
              className={`p-2.5 rounded-xl transition-all border-2 ${tool === 'eraser' ? 'bg-gray-200 text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-100 hover:text-black'}`}
              title="Eraser"
            >
              <Eraser size={20} strokeWidth={2.5} />
            </button>
            <button onClick={handleClear}
              className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-2 border-transparent hover:border-red-200 transition-all ml-2"
              title="Clear Canvas"
            >
              <Trash2 size={20} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
