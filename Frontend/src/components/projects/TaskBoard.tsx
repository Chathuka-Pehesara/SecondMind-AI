import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string; // pending, in_progress, completed
  priority: string; // low, medium, high
  deadline?: string;
}

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: number, newStatus: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onAdd: (status: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks, onUpdateStatus, onEdit, onDelete, onAdd
}) => {

  const columns = [
    { id: 'pending', title: 'To Do', color: 'slate' },
    { id: 'in_progress', title: 'In Progress', color: 'brand' },
    { id: 'completed', title: 'Completed', color: 'emerald' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-full pb-4 overflow-x-auto min-w-[800px] lg:min-w-0">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="flex flex-col gap-4 bg-slate-100/30 dark:bg-zinc-900/20 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-${col.color}-500`} />
                {col.title}
                <span className="text-xs font-normal text-slate-500 bg-slate-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </h3>
              <button
                onClick={() => onAdd(col.id)}
                className="p-1 text-slate-400 hover:text-brand-500 hover:bg-white dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {colTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GlassCard className="p-4 group border border-slate-200/60 dark:border-white/10 hover:border-brand-500/30 dark:hover:border-brand-500/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-brand-500 cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-tight">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        {/* Status change actions */}
                        <div className="flex gap-1 w-full justify-between">
                          {col.id !== 'pending' ? (
                            <button
                              onClick={() => onUpdateStatus(task.id, col.id === 'completed' ? 'in_progress' : 'pending')}
                              className="text-[10px] text-slate-500 hover:text-brand-500 flex items-center gap-1 cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                          ) : <div />}

                          {col.id !== 'completed' ? (
                            <button
                              onClick={() => onUpdateStatus(task.id, col.id === 'pending' ? 'in_progress' : 'completed')}
                              className="text-[10px] text-slate-500 hover:text-brand-500 flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md"
                            >
                              {col.id === 'pending' ? 'Start' : 'Complete'} <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md">
                              <CheckCircle className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};
