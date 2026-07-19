import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ChevronRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:8000';

interface ProjectData {
  id: number;
  name: string;
  status: string;
  progressData?: {
    progress: number;
    completed: number;
    total: number;
  };
}

export const ProjectWidget: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // get top 3 projects for widget
          const topProjects = data.slice(0, 3);
          
          const projectsWithProgress = await Promise.all(
            topProjects.map(async (p: any) => {
              const pRes = await fetch(`${API_URL}/projects/${p.id}/progress`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              let progressData = { progress: 0, completed: 0, total: 0 };
              if (pRes.ok) {
                progressData = await pRes.json();
              }
              return { ...p, progressData };
            })
          );
          setProjects(projectsWithProgress);
        }
      } catch (err) {
        console.error("Failed to fetch project progress", err);
      }
    };
    if (token) fetchProgress();
  }, [token]);

  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between border-t-4 border-t-brand-500 hover:border-t-brand-400 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-brand-500" />
            Active Projects
          </h3>
          <button onClick={() => navigate('/dashboard/projects')} className="text-[10px] text-slate-400 dark:text-zinc-500 cursor-pointer hover:text-brand-500">
            View all
          </button>
        </div>

        <div className="space-y-4">
          {projects.length > 0 ? projects.map(proj => (
            <div key={proj.id} className="space-y-2 cursor-pointer group" onClick={() => navigate(`/dashboard/projects/${proj.id}`)}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-brand-500 transition-colors">{proj.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {proj.progressData?.progress}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full" 
                  style={{ width: `${proj.progressData?.progress || 0}%` }}
                />
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-500 dark:text-zinc-400 italic">No active projects found.</p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200/50 dark:border-white/5 mt-6 pt-4 flex justify-center">
        <button onClick={() => navigate('/dashboard/projects')} className="text-xs font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer">
          <span>Manage your projects</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlassCard>
  );
};
