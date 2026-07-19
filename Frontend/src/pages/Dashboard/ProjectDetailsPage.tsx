import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, ArrowLeft, Brain, Sparkles, AlertCircle,
  Clock, ShieldAlert, CheckCircle2, ChevronRight, X, Trash2, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { TaskBoard } from '../../components/projects/TaskBoard';
import type { Task } from '../../components/projects/TaskBoard';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
}

const API_URL = 'http://localhost:8000';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // AI insights states
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [aiRisk, setAiRisk] = useState<string | null>(null);

  // Modal states for task creation/editing
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('pending');

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const projRes = await fetch(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!projRes.ok) throw new Error('Failed to load project details');
      const projData = await projRes.json();
      setProject(projData);

      const tasksRes = await fetch(`${API_URL}/projects/${id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchProjectDetails();
  }, [token, id]);

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

      await fetch(`${API_URL}/projects/${id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      fetchProjectDetails(); // revert on fail
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await fetch(`${API_URL}/projects/${id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      fetchProjectDetails();
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this entire project? This action cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboard/projects');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        title: taskTitle,
        description: taskDesc || null,
        priority: taskPriority,
        status: taskStatus
      };

      const url = editingTask 
        ? `${API_URL}/projects/${id}/tasks/${editingTask.id}`
        : `${API_URL}/projects/${id}/tasks`;

      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsTaskModalOpen(false);
        fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewTaskModal = (status = 'pending') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const handleAiAction = async (endpoint: string, setter: (val: string) => void) => {
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/projects/${id}/ai/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Extract the key dynamically based on endpoint
        const val = data.estimate || data.analysis || JSON.stringify(data, null, 2);
        
        if (endpoint === 'suggest-tasks' && Array.isArray(data)) {
          // Auto-add tasks
          for (const t of data) {
            await fetch(`${API_URL}/projects/${id}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(t)
            });
          }
          fetchProjectDetails();
          setter("Added suggested tasks successfully!");
        } else {
          setter(val);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className="py-24 text-center">
      <FolderKanban className="w-12 h-12 text-brand-550 dark:text-brand-400 mx-auto animate-pulse" />
      <p className="text-xs text-slate-500 dark:text-zinc-450 mt-4">Loading project...</p>
    </div>
  );

  if (error || !project) return <div>Error loading project.</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <button onClick={() => navigate('/dashboard/projects')} className="text-xs text-slate-500 hover:text-brand-500 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to Projects
          </button>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            {project.name}
          </h2>
          {project.description && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={handleDeleteProject}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button variant="primary" size="sm" onClick={() => openNewTaskModal('pending')}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Kanban Board Area */}
        <div className="xl:col-span-3 flex flex-col h-full overflow-hidden">
          <TaskBoard
            tasks={tasks}
            onUpdateStatus={handleUpdateTaskStatus}
            onEdit={openEditTaskModal}
            onDelete={handleDeleteTask}
            onAdd={openNewTaskModal}
          />
        </div>

        {/* AI Assistant Sidebar */}
        <div className="xl:col-span-1 space-y-4 flex flex-col">
          <GlassCard className="p-5 flex-shrink-0 bg-gradient-to-br from-brand-600/10 to-brand-400/5 border-brand-500/20">
            <h3 className="font-bold text-sm text-brand-700 dark:text-brand-400 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" /> AI Assistant
            </h3>
            
            <div className="space-y-3">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full justify-start text-xs border-brand-500/20 hover:bg-brand-500/10"
                onClick={() => handleAiAction('suggest-tasks', (val) => alert(val))}
                disabled={aiLoading}
              >
                <Brain className="w-3.5 h-3.5" /> Suggest Tasks
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full justify-start text-xs border-brand-500/20 hover:bg-brand-500/10"
                onClick={() => handleAiAction('estimate-time', setAiEstimate)}
                disabled={aiLoading}
              >
                <Clock className="w-3.5 h-3.5" /> Estimate Time
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full justify-start text-xs border-brand-500/20 hover:bg-brand-500/10"
                onClick={() => handleAiAction('risk-analysis', setAiRisk)}
                disabled={aiLoading}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Analyze Risks
              </Button>
            </div>
          </GlassCard>

          {/* AI Insights Display */}
          {(aiEstimate || aiRisk) && (
            <GlassCard className="p-5 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {aiEstimate && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-brand-500" /> Time Estimate
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-wrap bg-slate-100/50 dark:bg-zinc-900/50 p-3 rounded-xl">
                      {aiEstimate}
                    </p>
                  </div>
                )}
                {aiRisk && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3 text-amber-500" /> Risk Analysis
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-wrap bg-slate-100/50 dark:bg-zinc-900/50 p-3 rounded-xl">
                      {aiRisk}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Task CRUD Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md z-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h3>
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Task Title</label>
                  <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-zinc-800/50 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                  <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-zinc-800/50 rounded-xl focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Priority</label>
                    <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-zinc-800/50 rounded-xl focus:outline-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                    <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-zinc-800/50 rounded-xl focus:outline-none">
                      <option value="pending">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
