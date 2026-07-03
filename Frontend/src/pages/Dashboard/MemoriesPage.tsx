import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Tag, Calendar, Plus, ChevronDown, ChevronUp,
  Trash2, Edit, Sliders, Target, Briefcase, FileText, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

interface Preference {
  id: number;
  key: string;
  value: string;
}

interface Goal {
  id: number;
  title: string;
  description?: string;
  status: string; // active, completed, archived
  target_date?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string; // planning, active, completed, on_hold
}

interface Fact {
  id: number;
  content: string;
}

type TabType = 'preferences' | 'goals' | 'projects' | 'facts';

const API_URL = 'http://localhost:8000';

export const MemoriesPage: React.FC = () => {
  const { token } = useAuth();

  // State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('preferences');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);

  // Expanding card states for goals/projects descriptions
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null); // holds item being updated or null if creating new
  const [modalCategory, setModalCategory] = useState<TabType>('preferences');

  // Form States
  const [prefKey, setPrefKey] = useState('');
  const [prefValue, setPrefValue] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalStatus, setGoalStatus] = useState('active');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStatus, setProjStatus] = useState('active');

  const [factContent, setFactContent] = useState('');

  // Fetch all memories
  const fetchAllMemories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/memory/retrieve${search ? `?q=${encodeURIComponent(search)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || []);
        setGoals(data.goals || []);
        setProjects(data.projects || []);
        setFacts(data.facts || []);
      } else {
        throw new Error('Failed to retrieve memories.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMemories();
  }, [token, search]);

  // Open Modal Helpers
  const openNewModal = () => {
    setEditingItem(null);
    setModalCategory(activeTab);

    // Clear forms
    setPrefKey('');
    setPrefValue('');
    setGoalTitle('');
    setGoalDesc('');
    setGoalStatus('active');
    setGoalTargetDate('');
    setProjName('');
    setProjDesc('');
    setProjStatus('active');
    setFactContent('');

    setIsModalOpen(true);
  };

  const openEditModal = (category: TabType, item: any) => {
    setEditingItem(item);
    setModalCategory(category);

    if (category === 'preferences') {
      setPrefKey(item.key);
      setPrefValue(item.value);
    } else if (category === 'goals') {
      setGoalTitle(item.title);
      setGoalDesc(item.description || '');
      setGoalStatus(item.status);
      setGoalTargetDate(item.target_date ? item.target_date.substring(0, 10) : '');
    } else if (category === 'projects') {
      setProjName(item.name);
      setProjDesc(item.description || '');
      setProjStatus(item.status);
    } else if (category === 'facts') {
      setFactContent(item.content);
    }

    setIsModalOpen(true);
  };

  // Submit Operations
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let url = '';
    let method = 'POST';
    let body: any = {};

    if (modalCategory === 'preferences') {
      url = `${API_URL}/memory/preferences`;
      body = { key: prefKey, value: prefValue };
    } else if (modalCategory === 'goals') {
      url = editingItem ? `${API_URL}/memory/goals/${editingItem.id}` : `${API_URL}/memory/goals`;
      method = editingItem ? 'PUT' : 'POST';
      body = {
        title: goalTitle,
        description: goalDesc || null,
        status: goalStatus,
        target_date: goalTargetDate ? new Date(goalTargetDate).toISOString() : null
      };
    } else if (modalCategory === 'projects') {
      url = editingItem ? `${API_URL}/memory/projects/${editingItem.id}` : `${API_URL}/memory/projects`;
      method = editingItem ? 'PUT' : 'POST';
      body = {
        name: projName,
        description: projDesc || null,
        status: projStatus
      };
    } else if (modalCategory === 'facts') {
      url = editingItem ? `${API_URL}/memory/facts/${editingItem.id}` : `${API_URL}/memory/facts`;
      method = editingItem ? 'PUT' : 'POST';
      body = { content: factContent };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchAllMemories();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save memory item.');
      }
    } catch (err: any) {
      setError(err.message || 'Server transmission error');
    }
  };

  // Delete Action
  const handleDeleteItem = async (category: TabType, id: number) => {
    if (!confirm('Are you sure you want to delete this memory item?')) return;
    setError(null);
    try {
      let endpoint = '';
      if (category === 'preferences') endpoint = `preferences/${id}`;
      else if (category === 'goals') endpoint = `goals/${id}`;
      else if (category === 'projects') endpoint = `projects/${id}`;
      else if (category === 'facts') endpoint = `facts/${id}`;

      const res = await fetch(`${API_URL}/memory/${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAllMemories();
      } else {
        throw new Error('Failed to delete memory item.');
      }
    } catch (err: any) {
      setError(err.message || 'Server transmission error');
    }
  };

  // Rendering Pills/Tabs
  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'facts', label: 'Important Facts', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text"
            placeholder="Search memory vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
          />
        </div>

        <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={openNewModal}>
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer transition-all border flex items-center gap-2 flex-shrink-0 ${isSelected
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-650 dark:text-brand-400'
                  : 'bg-white/40 dark:bg-zinc-900/20 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-white/10'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vault Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Brain className="w-12 h-12 text-brand-550 dark:text-brand-400 mx-auto animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-4">Connecting to memory banks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              preferences.length > 0 ? (
                preferences.map((pref) => (
                  <GlassCard key={pref.id} className="p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded-md">
                          Preference Key
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => openEditModal('preferences', pref)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-brand-500 cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteItem('preferences', pref.id)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pref.key}</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 bg-slate-100/50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-white/5 font-mono">
                        {pref.value}
                      </p>
                    </div>
                  </GlassCard>
                ))
              ) : <NoMemoriesFound />
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              goals.length > 0 ? (
                goals.map((goal) => {
                  const isExpanded = expandedId === goal.id;
                  return (
                    <GlassCard key={goal.id} className="p-5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${goal.status === 'completed'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                : goal.status === 'archived'
                                  ? 'bg-slate-500/10 text-slate-500 dark:text-zinc-500'
                                  : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                              }`}>
                              {goal.status}
                            </span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openEditModal('goals', goal)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-brand-500 cursor-pointer">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteItem('goals', goal.id)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-red-500 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{goal.title}</h4>

                        {goal.description && (
                          <>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                              {goal.description}
                            </p>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-slate-200/50 dark:border-white/5 pt-2 text-xs text-slate-600 dark:text-zinc-450 leading-relaxed font-normal"
                                >
                                  {goal.description}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}

                        {goal.target_date && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {goal.description && (
                        <div className="mt-4 pt-3 border-t border-slate-200/30 dark:border-white/5 flex justify-end">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                            className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-brand-500 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Collapse' : 'View full details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </GlassCard>
                  );
                })
              ) : <NoMemoriesFound />
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              projects.length > 0 ? (
                projects.map((proj) => {
                  const isExpanded = expandedId === proj.id;
                  return (
                    <GlassCard key={proj.id} className="p-5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${proj.status === 'completed'
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                              : proj.status === 'on_hold'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                            }`}>
                            {proj.status.replace('_', ' ')}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openEditModal('projects', proj)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-brand-500 cursor-pointer">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteItem('projects', proj.id)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-red-500 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{proj.name}</h4>

                        {proj.description && (
                          <>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                              {proj.description}
                            </p>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-slate-200/50 dark:border-white/5 pt-2 text-xs text-slate-600 dark:text-zinc-450 leading-relaxed font-normal"
                                >
                                  {proj.description}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>

                      {proj.description && (
                        <div className="mt-4 pt-3 border-t border-slate-200/30 dark:border-white/5 flex justify-end">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                            className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-brand-500 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Collapse' : 'View full details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </GlassCard>
                  );
                })
              ) : <NoMemoriesFound />
            )}

            {/* Facts Tab */}
            {activeTab === 'facts' && (
              facts.length > 0 ? (
                facts.map((fact) => (
                  <GlassCard key={fact.id} className="p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded-md">
                          <Brain className="w-2.5 h-2.5" /> Fact
                        </span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEditModal('facts', fact)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-brand-500 cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteItem('facts', fact.id)} className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
                        {fact.content}
                      </p>
                    </div>
                  </GlassCard>
                ))
              ) : <NoMemoriesFound />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CRUD Glass Dialog Modal */}
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
                <Brain className="w-5 h-5 text-brand-500" />
                <span>{editingItem ? 'Edit Memory Entry' : 'Create Memory Entry'}</span>
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Category Selection when creating new */}
                {!editingItem && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Category</label>
                    <select
                      value={modalCategory}
                      onChange={(e) => setModalCategory(e.target.value as TabType)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="preferences">Preference</option>
                      <option value="goals">Goal</option>
                      <option value="projects">Project</option>
                      <option value="facts">Important Fact</option>
                    </select>
                  </div>
                )}

                {/* Preference Fields */}
                {modalCategory === 'preferences' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Preference Key</label>
                      <input
                        type="text"
                        placeholder="e.g. communication_style"
                        value={prefKey}
                        onChange={(e) => setPrefKey(e.target.value)}
                        required
                        disabled={!!editingItem} // Key is immutable for preference editing
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Preference Value</label>
                      <input
                        type="text"
                        placeholder="e.g. short, bulleted responses"
                        value={prefValue}
                        onChange={(e) => setPrefValue(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Goal Fields */}
                {modalCategory === 'goals' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Goal Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Master FastAPI with SQLite"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Description (Optional)</label>
                      <textarea
                        placeholder="Details about the goal, metrics for success..."
                        value={goalDesc}
                        onChange={(e) => setGoalDesc(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Status</label>
                        <select
                          value={goalStatus}
                          onChange={(e) => setGoalStatus(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 transition-all"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Target Date</label>
                        <input
                          type="date"
                          value={goalTargetDate}
                          onChange={(e) => setGoalTargetDate(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Project Fields */}
                {modalCategory === 'projects' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Project Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SecondMind AI Assistant"
                        value={projName}
                        onChange={(e) => setProjName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Description (Optional)</label>
                      <textarea
                        placeholder="What is this project about, tech stack used..."
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Status</label>
                      <select
                        value={projStatus}
                        onChange={(e) => setProjStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 transition-all"
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Fact Fields */}
                {modalCategory === 'facts' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Important Fact</label>
                    <textarea
                      placeholder="e.g. User works primarily in React and Python, is based in Boston, and owns a cat named Luna."
                      value={factContent}
                      onChange={(e) => setFactContent(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-3">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {editingItem ? 'Save Changes' : 'Add Memory'}
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

// Help sub-component for empty states
const NoMemoriesFound: React.FC = () => (
  <div className="col-span-full py-16 text-center">
    <Brain className="w-10 h-10 text-slate-350 dark:text-zinc-700 mx-auto opacity-50" />
    <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-400 mt-4">No records found</h4>
    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Add details using the 'New Entry' button above.</p>
  </div>
);
