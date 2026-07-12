import React, { useState, useEffect } from 'react';

import { Plus, Search, Sparkles, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NoteCard } from '../../components/notes/NoteCard';
import { NoteEditor } from '../../components/notes/NoteEditor';

export const NotesPage: React.FC = () => {
  const { token } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [token]);

  useEffect(() => {
    if (notes.length > 0 && !suggestions.length) {
      fetchSuggestions();
    }
  }, [notes, token]);

  const fetchNotes = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/notes/suggestions/topics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNew = () => {
    setSelectedNote({
      id: null,
      title: 'Untitled Note',
      content: '',
      folder: 'General'
    });
  };

  const handleSave = async (id: number | null, data: any) => {
    if (!token) return null;
    const url = id ? `http://localhost:8000/notes/${id}` : 'http://localhost:8000/notes';
    const method = id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const savedNote = await res.json();
        if (id) {
          setNotes(prev => prev.map(n => n.id === id ? savedNote : n));
        } else {
          setNotes(prev => [savedNote, ...prev]);
        }
        setSelectedNote(savedNote);
        return savedNote;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
        setSelectedNote(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoSummary = async (id: number) => {
    if (!token) return null;
    try {
      const res = await fetch(`http://localhost:8000/notes/${id}/auto-summary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
        setSelectedNote(updatedNote);
        return updatedNote;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleAutoTags = async (id: number) => {
    if (!token) return null;
    try {
      const res = await fetch(`http://localhost:8000/notes/${id}/auto-tags`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
        setSelectedNote(updatedNote);
        return updatedNote;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 overflow-hidden pt-4 pb-2">
      {/* Left Sidebar: Notes List */}
      <div className="w-80 flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Smart Notes
            </h2>
            <button
              onClick={handleCreateNew}
              className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 dark:text-brand-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-slate-500 text-sm mt-4">Loading notes...</div>
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={selectedNote?.id === note.id}
                onClick={() => setSelectedNote(note)}
              />
            ))
          ) : (
            <div className="text-center text-slate-500 text-sm mt-8 px-4">
              No notes found. Create your first smart note!
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSave}
            onDelete={handleDelete}
            onAutoSummary={handleAutoSummary}
            onAutoTags={handleAutoTags}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-6 shadow-sm shadow-brand-500/20">
              <Sparkles className="w-10 h-10 text-brand-500" />
            </div>
            <h2 className="text-2xl font-display font-semibold text-slate-800 dark:text-zinc-100 mb-2">
              Welcome to Smart Notes
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 max-w-md mb-8">
              Write notes, generate intelligent summaries, automatically tag content, and discover related ideas seamlessly.
            </p>
            
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Create New Note
            </button>

            {suggestions.length > 0 && (
              <div className="mt-12 w-full max-w-2xl">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> AI Suggestions
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        handleCreateNew();
                        setSelectedNote((prev: any) => ({ ...prev, title: sug }));
                      }}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/5 text-sm text-slate-700 dark:text-zinc-300 hover:border-brand-300 dark:hover:border-brand-500/30 transition-colors shadow-sm"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
