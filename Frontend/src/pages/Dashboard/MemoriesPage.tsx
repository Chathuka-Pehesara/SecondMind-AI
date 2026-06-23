import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Tag, Calendar, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

interface Memory {
  id: number;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export const MemoriesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const categories = ['All', 'Development', 'Design', 'Architecture', 'AI Systems'];

  const memories: Memory[] = [
    {
      id: 1,
      title: 'Tailwind CSS v4 Configuration',
      category: 'Development',
      date: '2026-06-22',
      excerpt: 'Transition from postcss config to css-first imports using the @theme rules in v4.',
      content: 'Tailwind CSS v4 removes the need for tailwind.config.js and postcss.config.js. Everything is configured directly inside the main CSS file using the @import "tailwindcss" directive, @theme extensions, and @custom-variant declarations. The Vite plugin handles compilation natively.',
      tags: ['Tailwind', 'CSS', 'Vite', 'React']
    },
    {
      id: 2,
      title: 'Framer Motion Spring Physics',
      category: 'Design',
      date: '2026-06-20',
      excerpt: 'Standardizing tactile spring constants for micro-animations and button presses.',
      content: 'For rapid button presses, use a high stiffness (500) and moderate damping (15) to create a mechanical, clicky feeling. For layout transitions or modals, use stiffness 300 to 380 and damping 30 to prevent jittering while maintaining high-fidelity response.',
      tags: ['Framer Motion', 'Animation', 'UI', 'UX']
    },
    {
      id: 3,
      title: 'Local First Databases comparison',
      category: 'Architecture',
      date: '2026-06-18',
      excerpt: 'Evaluating IndexedDB, RxDB, and OPFS for client-side storage structures.',
      content: 'IndexedDB is ideal for base local storage and widely supported, but lacks native schema migration. RxDB wraps IndexedDB with query reactivity. OPFS (Origin Private File System) is outstanding for SQLite integration, giving near-native local I/O performance in the browser.',
      tags: ['IndexedDB', 'SQLite', 'OPFS', 'LocalFirst']
    },
    {
      id: 4,
      title: 'Agentic Cognitive Abstractions',
      category: 'AI Systems',
      date: '2026-06-15',
      excerpt: 'How agents decompose user prompts into sequential tool-execution steps.',
      content: 'Agents leverage structured loops (often referred to as ReAct: Reason + Act) to run terminal commands, inspect folder systems, and edit file content sequentially. High fidelity state trackers like task.md keep long-running goals aligned.',
      tags: ['AI', 'Agents', 'Planning', 'Automation']
    }
  ];

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.excerpt.toLowerCase().includes(search.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text"
            placeholder="Search within memory vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
          />
        </div>

        <Button variant="primary" size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all border flex-shrink-0 ${
              selectedCategory === category
                ? 'bg-brand-500/10 border-brand-500/40 text-brand-650 dark:text-brand-400'
                : 'bg-white/40 dark:bg-zinc-900/20 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredMemories.length > 0 ? (
            filteredMemories.map((memory) => {
              const isExpanded = expandedId === memory.id;
              return (
                <GlassCard 
                  key={memory.id}
                  hoverEffect={!isExpanded}
                  className="p-5 flex flex-col justify-between self-start overflow-hidden transition-all duration-300"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider bg-brand-500/10 dark:bg-brand-500/15 px-2 py-0.5 rounded-md">
                          <Tag className="w-2.5 h-2.5" />
                          {memory.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{memory.title}</h4>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        {memory.date}
                      </div>
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      {memory.excerpt}
                    </p>

                    {/* Expandable Panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-200/50 dark:border-white/5 pt-3 mt-3 text-xs text-slate-655 dark:text-zinc-350 leading-relaxed font-normal bg-slate-100/5 dark:bg-zinc-950/5 p-2 rounded-lg"
                        >
                          {memory.content}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {memory.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="text-[9px] font-medium text-slate-450 dark:text-zinc-500 bg-slate-200/40 dark:bg-zinc-800/30 px-2 py-0.5 rounded-md border border-slate-200/20 dark:border-white/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expand button */}
                  <div className="mt-4 pt-3 border-t border-slate-200/30 dark:border-white/5 flex justify-end">
                    <button 
                      onClick={() => toggleExpand(memory.id)}
                      className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-brand-500 dark:hover:text-brand-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Expand details'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center">
              <Brain className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto animate-pulse" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-300 mt-4">No matching memories found</h4>
              <p className="text-xs text-slate-550 dark:text-zinc-500 mt-1">Try widening your search keywords or tags.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
