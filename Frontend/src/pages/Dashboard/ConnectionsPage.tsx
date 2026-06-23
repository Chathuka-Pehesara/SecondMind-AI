import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, Info, Hand } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';

interface MindNode {
  id: number;
  label: string;
  left: string;
  top: string;
  glow: string;
  size: string;
}

export const ConnectionsPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes: MindNode[] = [
    { id: 1, label: 'SecondMind Core', left: '42%', top: '42%', glow: 'bg-brand-500 ring-brand-500/20', size: 'w-32 h-32' },
    { id: 2, label: 'Tailwind CSS v4', left: '15%', top: '20%', glow: 'bg-blue-500 ring-blue-500/20', size: 'w-24 h-24' },
    { id: 3, label: 'Vite Bundling', left: '20%', top: '65%', glow: 'bg-amber-500 ring-amber-500/20', size: 'w-24 h-24' },
    { id: 4, label: 'Framer Motion', left: '70%', top: '15%', glow: 'bg-purple-500 ring-purple-500/20', size: 'w-26 h-26' },
    { id: 5, label: 'React Router', left: '72%', top: '60%', glow: 'bg-rose-500 ring-rose-500/20', size: 'w-24 h-24' },
    { id: 6, label: 'Local Storage', left: '45%', top: '10%', glow: 'bg-emerald-500 ring-emerald-500/20', size: 'w-22 h-22' },
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Help Banner */}
      <GlassCard className="p-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl border border-brand-500/20">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Interactive Cognitive Canvas</h4>
            <p className="text-[10px] text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed">
              Drag nodes to reorganize topic relationships. (Animations powered by Framer Motion physics)
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
          <Hand className="w-3.5 h-3.5" />
          <span>Click & Drag Nodes</span>
        </div>
      </GlassCard>

      {/* Connection Area Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative rounded-2xl glass-effect border border-slate-200/50 dark:border-white/5 bg-slate-100/20 dark:bg-zinc-950/20 overflow-hidden cursor-crosshair"
      >
        {/* Radar concentric circular grid backdrops */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10">
          <div className="w-[80%] aspect-square rounded-full border border-dashed border-slate-400 dark:border-zinc-700" />
          <div className="w-[50%] aspect-square rounded-full border border-dashed border-slate-400 dark:border-zinc-700 absolute" />
          <div className="w-[20%] aspect-square rounded-full border border-dashed border-slate-400 dark:border-zinc-700 absolute" />
        </div>

        {/* Floating Node Map */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            drag
            dragConstraints={containerRef}
            dragElastic={0.15}
            dragMomentum={true}
            whileDrag={{ scale: 1.08, zIndex: 50 }}
            className={`absolute flex flex-col items-center justify-center p-3 rounded-full cursor-grab active:cursor-grabbing text-center shadow-lg border border-slate-200/40 dark:border-white/5 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md select-none group transition-shadow ${node.size}`}
            style={{ 
              left: node.left, 
              top: node.top,
            }}
          >
            {/* Center Core Dot */}
            <div className={`w-3.5 h-3.5 rounded-full ring-4 mb-2 animate-pulse ${node.glow}`} />
            
            {/* Label */}
            <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 tracking-tight leading-tight px-1 font-display">
              {node.label}
            </span>
            
            {/* Node ID indicator */}
            <span className="text-[8px] text-slate-400 dark:text-zinc-550 absolute bottom-2">
              id: 0{node.id}
            </span>
          </motion.div>
        ))}

        {/* Ambient watermark logo */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-25 pointer-events-none">
          <Network className="w-4 h-4 text-brand-500" />
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-400 font-mono">Cognitive Map Client</span>
        </div>
      </div>
    </div>
  );
};
