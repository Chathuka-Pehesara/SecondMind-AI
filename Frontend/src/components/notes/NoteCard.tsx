import React from 'react';
import { motion } from 'framer-motion';
import { Folder, Tag as TagIcon, Clock } from 'lucide-react';

interface NoteCardProps {
  note: any;
  isActive: boolean;
  onClick: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, isActive, onClick }) => {
  let tags: string[] = [];
  try {
    tags = typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags;
  } catch (e) {
    tags = [];
  }

  const formattedDate = new Date(note.updated_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all border ${
        isActive 
          ? 'bg-brand-500/10 border-brand-500 shadow-sm' 
          : 'bg-white/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/5 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/80'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold truncate text-sm flex-1 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-zinc-200'}`}>
          {note.title || 'Untitled Note'}
        </h3>
      </div>
      
      <div className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">
        {note.summary || note.content || 'No content...'}
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">
          <Folder className="w-3 h-3" />
          <span className="truncate max-w-[60px]">{note.folder}</span>
        </div>
        
        {Array.isArray(tags) && tags.slice(0, 2).map((tag, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 px-1.5 py-0.5 rounded-md">
            <TagIcon className="w-3 h-3" />
            <span className="truncate max-w-[60px]">{tag}</span>
          </div>
        ))}
        {Array.isArray(tags) && tags.length > 2 && (
          <div className="text-[10px] text-slate-500 px-1 py-0.5">+{tags.length - 2}</div>
        )}
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
        <Clock className="w-3 h-3" />
        {formattedDate}
      </div>
    </motion.div>
  );
};
