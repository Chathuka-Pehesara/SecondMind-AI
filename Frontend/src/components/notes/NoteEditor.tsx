import React, { useState, useEffect } from 'react';

import { Save, Sparkles, Tag as TagIcon, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Note {
  id: number;
  title: string;
  content: string;
  summary?: string;
  tags?: string;
  folder: string;
  updated_at: string;
}

interface NoteEditorProps {
  note: Note | null;
  onSave: (id: number | null, data: Partial<Note>) => Promise<Note>;
  onDelete: (id: number) => Promise<void>;
  onAutoSummary: (id: number) => Promise<Note>;
  onAutoTags: (id: number) => Promise<Note>;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onDelete,
  onAutoSummary,
  onAutoTags
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState('General');
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const { token } = useAuth();
  const [relatedNotes, setRelatedNotes] = useState<any[]>([]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolder(note.folder);
      fetchRelated(note.id);
    } else {
      setTitle('');
      setContent('');
      setFolder('General');
      setRelatedNotes([]);
    }
  }, [note]);

  const fetchRelated = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/notes/${id}/related`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRelatedNotes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(note?.id || null, { title, content, folder });
    setIsSaving(false);
  };

  const handleSummary = async () => {
    if (!note?.id) return;
    setIsSummarizing(true);
    await onAutoSummary(note.id);
    setIsSummarizing(false);
  };

  const handleTags = async () => {
    if (!note?.id) return;
    setIsTagging(true);
    await onAutoTags(note.id);
    setIsTagging(false);
  };

  let tagsArray: string[] = [];
  try {
    tagsArray = note?.tags ? JSON.parse(note.tags) : [];
  } catch (e) {
    tagsArray = [];
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/20">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="text-lg font-semibold bg-transparent border-none outline-none text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:ring-0 p-0 w-full md:w-64"
          />
          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 hidden md:block"></div>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="Folder"
            className="text-sm bg-transparent border-none outline-none text-slate-500 dark:text-zinc-400 placeholder:text-slate-300 focus:ring-0 p-0 w-24 hidden md:block"
          />
        </div>
        <div className="flex items-center gap-2">
          {note?.id && (
            <>
              <button
                onClick={handleSummary}
                disabled={isSummarizing || !content.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSummarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Auto Summary
              </button>
              <button
                onClick={handleTags}
                disabled={isTagging || !content.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isTagging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TagIcon className="w-3.5 h-3.5" />}
                Auto Tags
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-lg transition-colors shadow-sm"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Note
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {note?.summary && (
            <div className="mb-6 p-4 rounded-xl bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10">
              <h4 className="text-xs font-semibold text-brand-700 dark:text-brand-400 flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Summary
              </h4>
              <p className="text-sm text-slate-700 dark:text-zinc-300">{note.summary}</p>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your note here..."
            className="flex-1 w-full resize-none bg-transparent border-none outline-none text-slate-700 dark:text-zinc-200 placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:ring-0 text-base leading-relaxed"
          />

          {tagsArray.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
              {tagsArray.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  <TagIcon className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar (Related Notes) */}
        {note?.id && relatedNotes.length > 0 && (
          <div className="w-72 border-l border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-zinc-900/30 p-4 overflow-y-auto hidden lg:block">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Related Notes</h3>
            <div className="space-y-3">
              {relatedNotes.map(rel => (
                <div key={rel.id} className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/5 shadow-sm hover:border-brand-300 dark:hover:border-brand-500/30 transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-zinc-200 mb-1">{rel.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{rel.summary || 'No summary available.'}</p>
                  <div className="mt-2 text-[10px] text-brand-600 font-medium bg-brand-50 dark:bg-brand-500/10 w-fit px-1.5 py-0.5 rounded">
                    {(rel.similarity * 100).toFixed(0)}% Match
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
