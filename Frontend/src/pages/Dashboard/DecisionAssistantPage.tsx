import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Brain, CheckCircle2, AlertTriangle, ShieldCheck, 
  TrendingUp, Trash2, ArrowRight, History, Sparkles, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

interface ComparisonRow {
  feature: string;
  [key: string]: string; // options A, B, etc.
}

interface Decision {
  id: number;
  query: string;
  pros: string[];
  cons: string[];
  risks: string[];
  benefits: string[];
  recommendation: string;
  confidence_score: number;
  comparison_table: ComparisonRow[];
  created_at: string;
}

const API_URL = 'http://localhost:8000';

export const DecisionAssistantPage: React.FC = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Decision[]>([]);
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/decisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0 && !activeDecision) {
          setActiveDecision(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch decision history", err);
    }
  };

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setActiveDecision(null);

    try {
      const res = await fetch(`${API_URL}/decisions/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Analysis failed');
      }

      const newDecision = await res.json();
      setActiveDecision(newDecision);
      setQuery('');
      fetchHistory(); // Refresh history
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this decision from history?')) return;
    try {
      await fetch(`${API_URL}/decisions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeDecision?.id === id) {
        setActiveDecision(null);
      }
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/20';
    return 'text-red-500 bg-red-500/20';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const renderComparisonTable = (table: ComparisonRow[]) => {
    if (!table || table.length === 0) return null;
    
    // Extract column headers dynamically
    const allKeys = new Set<string>();
    table.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
    allKeys.delete('feature'); // usually the first column

    const columns = ['feature', ...Array.from(allKeys)];

    return (
      <div className="overflow-x-auto w-full mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-white/10">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  {col === 'feature' ? 'Criteria' : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => (
              <tr key={i} className="border-b border-slate-200/20 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 text-xs ${j === 0 ? 'font-semibold text-slate-700 dark:text-zinc-300' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-7 h-7 text-brand-500" />
            AI Decision Assistant
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Weigh options and make data-driven choices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Column: History & Input */}
        <div className="xl:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">
          <GlassCard className="p-4 flex-shrink-0">
            <form onSubmit={handleAnalyze} className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                What are you deciding?
              </label>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Should I migrate from React to Next.js for my portfolio?"
                className="w-full bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-500/50 resize-none h-24 text-slate-800 dark:text-zinc-200"
                required
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? <Sparkles className="w-4 h-4 animate-spin-slow" /> : <Brain className="w-4 h-4" />}
                {loading ? 'Analyzing...' : 'Analyze Decision'}
              </Button>
            </form>
          </GlassCard>

          <GlassCard className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/30">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" /> Past Decisions
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous decisions.</p>
              ) : (
                history.map(dec => (
                  <div 
                    key={dec.id} 
                    onClick={() => setActiveDecision(dec)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      activeDecision?.id === dec.id 
                      ? 'bg-brand-500/10 border-brand-500/30' 
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 line-clamp-2">
                      {dec.query}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(dec.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Active Analysis Results */}
        <div className="xl:col-span-3 flex flex-col h-full overflow-hidden">
          {error ? (
            <GlassCard className="p-6 h-full flex items-center justify-center">
              <div className="text-center text-red-500 max-w-sm">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            </GlassCard>
          ) : loading ? (
            <GlassCard className="p-6 h-full flex flex-col items-center justify-center">
              <Sparkles className="w-12 h-12 text-brand-500 animate-bounce mb-4" />
              <p className="text-sm text-slate-600 dark:text-zinc-400 animate-pulse">Consulting the AI Oracle...</p>
            </GlassCard>
          ) : activeDecision ? (
            <GlassCard className="p-6 h-full flex flex-col overflow-y-auto">
              
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200/50 dark:border-white/10">
                <div className="max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {activeDecision.query}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Analyzed on {new Date(activeDecision.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${getScoreColor(activeDecision.confidence_score)}`}>
                    <span className="text-2xl font-display font-bold">{activeDecision.confidence_score}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest leading-tight">Confidence<br/>Score</span>
                  </div>
                  <button onClick={() => handleDelete(activeDecision.id)} className="text-[10px] text-red-500 hover:underline mt-2 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete Record
                  </button>
                </div>
              </div>

              {/* Recommendation Box */}
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-brand-600/10 to-brand-400/5 border border-brand-500/20 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-500/20 blur-3xl rounded-full" />
                <h4 className="text-sm font-bold text-brand-700 dark:text-brand-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Recommendation
                </h4>
                <p className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
                  {activeDecision.recommendation}
                </p>
              </div>

              {/* Four Quadrants: Pros/Cons/Benefits/Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                
                {/* Pros */}
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Pros
                  </h4>
                  <ul className="space-y-2">
                    {activeDecision.pros?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Cons
                  </h4>
                  <ul className="space-y-2">
                    {activeDecision.cons?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Long-term Benefits
                  </h4>
                  <ul className="space-y-2">
                    {activeDecision.benefits?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Potential Risks
                  </h4>
                  <ul className="space-y-2">
                    {activeDecision.risks?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Comparison Table */}
              {activeDecision.comparison_table && activeDecision.comparison_table.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-3">
                    Comparison Matrix
                  </h4>
                  {renderComparisonTable(activeDecision.comparison_table)}
                </div>
              )}

            </GlassCard>
          ) : (
            <GlassCard className="p-6 h-full flex flex-col items-center justify-center text-center opacity-70">
              <Scale className="w-16 h-16 text-slate-300 dark:text-zinc-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-300">No Decision Selected</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-500 mt-2 max-w-sm">
                Enter a decision prompt on the left to get a detailed AI analysis, or select a past decision from your history.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
