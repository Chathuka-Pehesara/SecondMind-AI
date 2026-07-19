import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, GraduationCap, Map, Target, Layers, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  is_mastered: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
}

interface StudyModule {
  id: number;
  filename: string;
  summary: string;
  roadmap: string[];
  progress_score: number;
  flashcards: Flashcard[];
  quiz_questions: QuizQuestion[];
}

const API_URL = 'http://localhost:8000';

export const StudyModulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [module, setModule] = useState<StudyModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'flashcards' | 'quiz'>('overview');

  // Flashcard state
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const fetchModule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/learning/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setModule(await res.json());
      } else {
        navigate('/dashboard/learning');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchModule();
  }, [token, id]);

  const updateFlashcardMastery = async (flashcardId: number, is_mastered: boolean) => {
    if (!module) return;
    try {
      setModule(prev => prev ? {
        ...prev,
        flashcards: prev.flashcards.map(fc => fc.id === flashcardId ? { ...fc, is_mastered } : fc)
      } : null);

      await fetch(`${API_URL}/learning/flashcards/${flashcardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_mastered })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextFlashcard = () => {
    setFcFlipped(false);
    setTimeout(() => {
      setFcIndex(prev => (prev + 1) % (module?.flashcards.length || 1));
    }, 150);
  };

  const submitQuiz = async () => {
    if (!module) return;
    let correct = 0;
    module.quiz_questions.forEach(q => {
      if (quizAnswers[q.id] === q.correct_answer) correct++;
    });
    const score = (correct / module.quiz_questions.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);

    // Update overall progress
    try {
      await fetch(`${API_URL}/learning/materials/${id}/progress?score=${score}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setModule(prev => prev ? { ...prev, progress_score: score } : null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !module) return (
    <div className="py-24 text-center">
      <GraduationCap className="w-12 h-12 text-brand-500 mx-auto animate-pulse" />
      <p className="text-xs text-slate-500 mt-4">Loading study module...</p>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button onClick={() => navigate('/dashboard/learning')} className="text-xs text-slate-500 hover:text-brand-500 flex items-center gap-1 w-fit">
          <ArrowLeft className="w-3 h-3" /> Back to Learning Hub
        </button>
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded-md text-[10px] font-bold uppercase tracking-wider border border-brand-500/20">
                Study Module
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> {module.filename}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              Mastery Hub
            </h2>
          </div>
          
          <div className="text-right">
             <div className="text-3xl font-display font-bold text-brand-500">{module.progress_score.toFixed(0)}%</div>
             <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
        >
          <Map className="w-4 h-4" /> Overview & Roadmap
        </button>
        <button 
          onClick={() => setActiveTab('flashcards')} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'flashcards' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
        >
          <Layers className="w-4 h-4" /> Flashcards ({module.flashcards.filter(f => f.is_mastered).length}/{module.flashcards.length})
        </button>
        <button 
          onClick={() => setActiveTab('quiz')} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'quiz' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
        >
          <Target className="w-4 h-4" /> Final Quiz
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 h-full flex flex-col border-t-4 border-t-blue-500">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> AI Executive Summary
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {module.summary}
              </p>
            </GlassCard>

            <GlassCard className="p-6 h-full flex flex-col border-t-4 border-t-emerald-500">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-emerald-500" /> Learning Roadmap
              </h3>
              <div className="space-y-4">
                {module.roadmap && module.roadmap.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                        {idx + 1}
                      </div>
                      {idx !== module.roadmap.length - 1 && <div className="w-0.5 h-full bg-emerald-500/20 my-1"></div>}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-zinc-300 pt-0.5 pb-4 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* FLASHCARDS TAB */}
        {activeTab === 'flashcards' && module.flashcards.length > 0 && (
          <div className="flex flex-col items-center max-w-2xl mx-auto w-full pt-8">
            <div className="w-full flex justify-between items-center mb-6 px-4">
              <span className="text-sm font-bold text-slate-500">Card {fcIndex + 1} of {module.flashcards.length}</span>
              <span className="text-xs px-2 py-1 bg-brand-500/10 text-brand-500 rounded-md font-semibold">
                {module.flashcards.filter(f => f.is_mastered).length} Mastered
              </span>
            </div>

            <div className="relative w-full aspect-video perspective-1000">
              <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                animate={{ rotateY: fcFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={() => setFcFlipped(!fcFlipped)}
              >
                {/* Front */}
                <GlassCard className="absolute inset-0 backface-hidden p-8 flex items-center justify-center text-center shadow-xl border-slate-300 dark:border-white/10 hover:border-brand-500/50 transition-colors bg-white/80 dark:bg-zinc-900/80">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                    {module.flashcards[fcIndex].front}
                  </h3>
                  <div className="absolute bottom-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
                    Click to flip
                  </div>
                </GlassCard>

                {/* Back */}
                <GlassCard className="absolute inset-0 backface-hidden p-8 flex items-center justify-center text-center shadow-xl border-brand-500/40 bg-brand-50/90 dark:bg-brand-900/20 rotate-y-180">
                  <p className="text-lg font-medium text-slate-800 dark:text-zinc-200 leading-relaxed overflow-y-auto max-h-full">
                    {module.flashcards[fcIndex].back}
                  </p>
                </GlassCard>
              </motion.div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button 
                variant={module.flashcards[fcIndex].is_mastered ? "primary" : "secondary"}
                onClick={() => {
                  updateFlashcardMastery(module.flashcards[fcIndex].id, !module.flashcards[fcIndex].is_mastered);
                  if(!module.flashcards[fcIndex].is_mastered) handleNextFlashcard();
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {module.flashcards[fcIndex].is_mastered ? "Mastered" : "Mark Mastered"}
              </Button>
              <Button variant="secondary" onClick={handleNextFlashcard}>
                Next Card <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && module.quiz_questions.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {quizSubmitted && (
              <GlassCard className={`p-6 border-l-4 ${quizScore >= 80 ? 'border-l-emerald-500' : quizScore >= 50 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Quiz Results: {quizScore.toFixed(0)}%</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  {quizScore >= 80 ? 'Excellent work! You have mastered this material.' : 
                   quizScore >= 50 ? 'Good effort, but there is still room for review.' : 
                   'You might want to review the flashcards and summary again.'}
                </p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>Retake Quiz</Button>
              </GlassCard>
            )}

            {module.quiz_questions.map((q, i) => (
              <GlassCard key={q.id} className="p-6">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex gap-2">
                  <span className="text-brand-500">{i + 1}.</span> {q.question}
                </h4>
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const isSelected = quizAnswers[q.id] === opt;
                    const isCorrect = opt === q.correct_answer;
                    
                    let bgClass = "bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 dark:hover:bg-zinc-700/50";
                    let borderClass = isSelected ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-slate-700 dark:text-zinc-300";
                    
                    if (quizSubmitted) {
                      if (isCorrect) {
                        bgClass = "bg-emerald-500/10";
                        borderClass = "border-emerald-500 text-emerald-600 dark:text-emerald-400";
                      } else if (isSelected && !isCorrect) {
                        bgClass = "bg-red-500/10";
                        borderClass = "border-red-500 text-red-600 dark:text-red-400";
                      } else {
                        bgClass = "bg-slate-50 dark:bg-zinc-900/50 opacity-50";
                        borderClass = "border-transparent text-slate-500";
                      }
                    }

                    return (
                      <div 
                        key={j} 
                        onClick={() => !quizSubmitted && setQuizAnswers(prev => ({...prev, [q.id]: opt}))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${bgClass} ${borderClass}`}
                      >
                        <span className="text-sm font-medium">{opt}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ))}

            {!quizSubmitted && (
              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < module.quiz_questions.length}>
                  Submit Quiz
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
