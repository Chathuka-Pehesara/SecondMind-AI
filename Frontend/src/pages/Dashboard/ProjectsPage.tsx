import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Plus, Target, CheckCircle2,
  Clock, AlertCircle, Calendar, ChevronRight, X, Brain
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

interface Project {
  id: int;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  created_at: string;
}

const API_URL = 'http://localhost:8000';

export const ProjectsPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDeadline, setProjDeadline] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data || []);
      } else {
        throw new Error('Failed to retrieve projects.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProjects();
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        name: projName,
        description: projDesc || null,
        status: 'active',
        deadline: projDeadline ? new Date(projDeadline).toISOString() : null
      };

      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setProjName('');
        setProjDesc('');
        setProjDeadline('');
        fetchProjects();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to create project.');
      }
    } catch (err: any) {
      setError(err.message || 'Server transmission error');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-brand-500 border-brand-500/20 bg-brand-500/10';
      case 'completed': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
      case 'on_hold': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
      default: return 'text-slate-500 border-slate-500/20 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-brand-500" />
            Project Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Organize your work with AI-powered insights</p>
        </div>

        <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <FolderKanban className="w-12 h-12 text-brand-550 dark:text-brand-400 mx-auto animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-4">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="col-span-full py-16 text-center">
          <FolderKanban className="w-10 h-10 text-slate-350 dark:text-zinc-700 mx-auto opacity-50" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-400 mt-4">No projects yet</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <GlassCard key={proj.id} className="p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200 cursor-pointer" onClick={() => navigate(`/dashboard/projects/${proj.id}`)}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusColor(proj.status)}`}>
                    {proj.status.replace('_', ' ')}
                  </span>
                  {proj.deadline && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3" />
                      {new Date(proj.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{proj.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    {proj.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                 <div className="flex -space-x-1">
                    {/* Placeholder for assignees / AI insights indicator */}
                    <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/20 border border-white dark:border-zinc-900 flex items-center justify-center text-[9px] font-bold text-brand-600 dark:text-brand-400">AI</div>
                 </div>
                 <span className="text-[10px] font-semibold text-brand-500 flex items-center gap-1">
                   Open Board <ChevronRight className="w-3 h-3" />
                 </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md z-10 bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-brand-500" />
                <span>Create New Project</span>
              </h3>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Website Redesign"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Description</label>
                  <textarea
                    placeholder="Goals, target audience, tech stack..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={projDeadline}
                    onChange={(e) => setProjDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Create Project
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
