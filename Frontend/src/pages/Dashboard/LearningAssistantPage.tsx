import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, UploadCloud, BookOpen, Trash2, Brain, AlertCircle, ChevronRight, FileText, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

interface LearningMaterial {
  id: number;
  filename: string;
  summary: string;
  progress_score: number;
  created_at: string;
}

const API_URL = 'http://localhost:8000';

export const LearningAssistantPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/learning/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err: any) {
      setError("Failed to fetch study materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMaterials();
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/learning/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const newMaterial = await res.json();
      setMaterials([newMaterial, ...materials]);
      navigate(`/dashboard/learning/${newMaterial.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to upload and process file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this study module?')) return;
    try {
      await fetch(`${API_URL}/learning/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-brand-500" />
            Learning Assistant
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Upload materials and let AI generate your study guide.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <GlassCard className="p-8 border-dashed border-2 border-slate-300 dark:border-white/10 hover:border-brand-500/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative" onClick={() => !uploading && fileInputRef.current?.click()}>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.md,.pdf,.csv" 
          onChange={handleFileUpload}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center py-6">
            <Brain className="w-12 h-12 text-brand-500 animate-pulse mb-4" />
            <h3 className="font-bold text-slate-800 dark:text-zinc-200">AI is Analyzing Your Material...</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">Generating summary, flashcards, and quizzes.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 text-brand-500">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-zinc-200 mb-1">Click or drag file to upload</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
              Supports .txt, .md, .pdf files. We'll automatically build a comprehensive study module from it.
            </p>
          </div>
        )}
      </GlassCard>

      {/* Study Modules Grid */}
      <div className="mt-12">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-500" /> Your Study Modules
        </h3>

        {loading ? (
          <div className="py-12 text-center">
            <GraduationCap className="w-10 h-10 text-brand-500 mx-auto animate-pulse" />
            <p className="text-xs text-slate-500 mt-4">Loading materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-slate-200/50 dark:border-white/5">
            <p className="text-sm text-slate-500 dark:text-zinc-400">No study modules yet. Upload a file above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {materials.map(mod => (
              <GlassCard key={mod.id} className="p-5 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-1 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px]">
                        {mod.filename}
                      </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(mod.id); }} className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {mod.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400 mb-1.5 font-semibold">
                      <span>Mastery</span>
                      <span>{mod.progress_score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${mod.progress_score}%` }}></div>
                    </div>
                  </div>
                  
                  <Button variant="secondary" className="w-full justify-between text-xs font-semibold hover:border-brand-500 hover:text-brand-500 group/btn" onClick={() => navigate(`/dashboard/learning/${mod.id}`)}>
                    <span>Open Module</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover/btn:text-brand-500 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
