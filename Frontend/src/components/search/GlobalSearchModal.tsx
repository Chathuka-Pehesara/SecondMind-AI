import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, MessageSquare, Folder, CheckSquare, Target, BookOpen, X, File } from 'lucide-react';
import { searchApi, type SearchResult } from '../../services/searchApi';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'note': return <FileText size={18} className="text-blue-400" />;
    case 'chat': return <MessageSquare size={18} className="text-emerald-400" />;
    case 'project': return <Folder size={18} className="text-purple-400" />;
    case 'task': return <CheckSquare size={18} className="text-orange-400" />;
    case 'goal': return <Target size={18} className="text-pink-400" />;
    case 'document': return <File size={18} className="text-indigo-400" />;
    case 'fact': return <BookOpen size={18} className="text-cyan-400" />;
    default: return <FileText size={18} className="text-gray-400" />;
  }
};

const formatTypeLabel = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await searchApi.searchAll(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    switch (result.type) {
      case 'note':
        navigate(`/notes`); // Simplified navigation if Note page handles params, otherwise just Notes
        break;
      case 'chat':
        navigate(`/chat/${result.id}`);
        break;
      case 'project':
        navigate(`/projects/${result.id}`);
        break;
      case 'task':
        navigate(`/projects`);
        break;
      case 'document':
        if (result.conversation_id) navigate(`/chat/${result.conversation_id}`);
        break;
      case 'goal':
      case 'fact':
        navigate(`/memories`);
        break;
      default:
        break;
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-blue-500/30 text-blue-200 font-medium rounded-sm px-0.5">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 sm:px-0">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
            placeholder="Search across your entire SecondMind..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          )}
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {query.trim() && results.length === 0 && !loading && (
            <div className="py-14 text-center text-gray-400 flex flex-col items-center">
              <Search size={32} className="mb-3 text-gray-600" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 px-4 text-center text-gray-500 text-sm">
              <p>Start typing to search your chats, notes, projects, and more.</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="flex items-center gap-1"><FileText size={14}/> Notes</span>
                <span className="flex items-center gap-1"><MessageSquare size={14}/> Chats</span>
                <span className="flex items-center gap-1"><Folder size={14}/> Projects</span>
              </div>
            </div>
          )}

          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}-${index}`}
              className={`p-3 rounded-lg mb-1 cursor-pointer flex gap-3 transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-600/20 border border-blue-500/30' 
                  : 'hover:bg-gray-800 border border-transparent'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => handleSelect(result)}
            >
              <div className="mt-1">
                {getIconForType(result.type)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-gray-200'}`}>
                    {highlightText(result.title, query)}
                  </h4>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 ml-2 border border-gray-700">
                    {formatTypeLabel(result.type)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                  {highlightText(result.snippet, query)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center text-xs text-gray-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px]">↑</kbd> <kbd className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px]">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px]">Enter</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px]">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
