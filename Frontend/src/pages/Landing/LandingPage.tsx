import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, 
  ArrowRight, 
  Sparkles, 
  Network, 
  Cpu, 
  Lock, 
  ChevronRight,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('scrollable');
    document.body.classList.add('scrollable');
    return () => {
      document.documentElement.classList.remove('scrollable');
      document.body.classList.remove('scrollable');
    };
  }, []);

  // Container variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-zinc-100 relative overflow-x-hidden flex flex-col">
      {/* Background Orbs */}
      <div className="glow-orb w-[700px] h-[700px] bg-brand-500/10 -top-60 -right-40 animate-float" />
      <div className="glow-orb w-[800px] h-[800px] bg-indigo-500/5 -bottom-80 -left-40 animate-float-delayed" />

      {/* Marketing Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200/40 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">SecondMind AI</span>
        </div>

        <div className="flex items-center gap-4">
          <NavLinkTo to="/dashboard" className="hidden sm:inline-block text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-brand-500 transition-colors" navigate={navigate}>
            Overview
          </NavLinkTo>
          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
          >
            <span>Launch App</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex-1 flex flex-col items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl flex flex-col items-center"
        >
          {/* Accent Pill */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 dark:border-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-6 shadow-sm shadow-brand-500/5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Phase 1 Concept Release</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tight text-slate-900 dark:text-white"
          >
            Your second brain,
            <span className="block mt-1 bg-gradient-to-r from-brand-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
              powered by local memory.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-500 dark:text-zinc-400 mt-6 max-w-2xl leading-relaxed font-normal"
          >
            SecondMind AI stores, connects, and structures your thoughts, notes, and records. An elegant cognitive mapping workspace designed for hyper-focus.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto"
          >
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Explore Features</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: 'spring' as const }}
          className="w-full max-w-5xl mt-20 relative rounded-2xl border border-slate-200/50 dark:border-white/10 p-2 bg-slate-200/30 dark:bg-zinc-950/20 shadow-2xl dark:shadow-brand-500/5 pointer-events-none"
        >
          <div className="rounded-xl overflow-hidden glass-effect border border-slate-200/40 dark:border-white/5 relative aspect-video flex flex-col">
            {/* Top Bar Mock */}
            <div className="h-10 bg-slate-100/55 dark:bg-zinc-950/40 border-b border-slate-200/40 dark:border-white/5 px-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <div className="px-16 py-0.5 rounded-md bg-slate-200/40 dark:bg-zinc-900/60 text-[10px] text-slate-400 dark:text-zinc-500 border border-slate-200/20 dark:border-white/5 font-mono">
                app.secondmind.ai/dashboard
              </div>
              <div className="w-8" />
            </div>
            {/* Inner Dashboard View Mock */}
            <div className="flex-1 bg-white/70 dark:bg-[#0c0c0e]/80 p-6 flex flex-col md:flex-row gap-6 text-left">
              {/* Sidebar Mock */}
              <div className="w-40 border-r border-slate-200/50 dark:border-white/5 pr-4 hidden md:flex flex-col gap-3">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3 w-28 rounded bg-brand-500/20 border-l border-brand-500" />
                <div className="h-3 w-24 rounded bg-slate-200/50 dark:bg-zinc-800/50" />
                <div className="h-3 w-20 rounded bg-slate-200/50 dark:bg-zinc-800/50" />
                <div className="h-3 w-26 rounded bg-slate-200/50 dark:bg-zinc-800/50" />
              </div>
              {/* Content Panel Mock */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Header Mock */}
                <div className="flex justify-between items-center">
                  <div className="h-5 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
                  <div className="h-5 w-12 rounded bg-brand-500/20" />
                </div>
                {/* Metrics Mock */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-100/30 dark:bg-zinc-900/20 p-3">
                    <div className="h-2 w-8 rounded bg-slate-300 dark:bg-zinc-700" />
                    <div className="h-4 w-12 rounded bg-slate-400 dark:bg-zinc-600 mt-2" />
                  </div>
                  <div className="h-16 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-100/30 dark:bg-zinc-900/20 p-3">
                    <div className="h-2 w-10 rounded bg-slate-300 dark:bg-zinc-700" />
                    <div className="h-4 w-8 rounded bg-brand-500 mt-2" />
                  </div>
                  <div className="h-16 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-100/30 dark:bg-zinc-900/20 p-3">
                    <div className="h-2 w-8 rounded bg-slate-300 dark:bg-zinc-700" />
                    <div className="h-4 w-10 rounded bg-slate-400 dark:bg-zinc-600 mt-2" />
                  </div>
                </div>
                {/* Chart Mock */}
                <div className="flex-1 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-100/30 dark:bg-zinc-900/20 p-4 flex flex-col justify-end gap-3 min-h-[140px]">
                  <div className="flex gap-2 items-end justify-between h-20">
                    <div className="h-6 w-full rounded bg-slate-300 dark:bg-zinc-800" />
                    <div className="h-12 w-full rounded bg-slate-300 dark:bg-zinc-800" />
                    <div className="h-8 w-full rounded bg-slate-300 dark:bg-zinc-800" />
                    <div className="h-16 w-full rounded bg-brand-500/80" />
                    <div className="h-10 w-full rounded bg-slate-300 dark:bg-zinc-800" />
                    <div className="h-14 w-full rounded bg-slate-300 dark:bg-zinc-800" />
                    <div className="h-20 w-full rounded bg-brand-500" />
                  </div>
                </div>
              </div>
            </div>
            {/* Absolute Glow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50/10 via-transparent to-transparent pointer-events-none dark:from-darkBg/10" />
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full border-t border-slate-200/40 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Supercharge your mental focus
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 mt-4 leading-relaxed">
            Beautifully designed utilities to offload cognitive strain and mapping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard hoverEffect glowColor="rgba(139, 92, 246, 0.15)" className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-650 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">Cognitive Mappings</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Auto-generate interactive charts mapping connected logs, tasks, and ideas in real-time.
            </p>
          </GlassCard>

          <GlassCard hoverEffect glowColor="rgba(59, 130, 246, 0.15)" className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">Contextual Sync</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Organize topics through smart notebooks, automatically tagging linked reference concepts.
            </p>
          </GlassCard>

          <GlassCard hoverEffect glowColor="rgba(168, 85, 247, 0.15)" className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">Local Vault</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Encryption at rest. Your notes, concepts, and relationships stay locked in your browser.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 w-full text-center">
        <GlassCard className="bg-gradient-to-tr from-brand-600/10 to-indigo-600/5 border border-brand-500/20 dark:border-brand-500/10 p-10 md:p-16 flex flex-col items-center">
          <Activity className="w-10 h-10 text-brand-500 animate-pulse mb-6" />
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            Ready to expand your bandwidth?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-4 max-w-md">
            Step into the SecondMind workspace today. Experience frictionless mental structuring.
          </p>
          <Button 
            variant="primary" 
            size="md" 
            onClick={() => navigate('/dashboard')}
            className="mt-8"
          >
            <span>Launch Workspace</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center text-xs text-slate-400 dark:text-zinc-650 border-t border-slate-200/40 dark:border-white/5 mt-auto bg-slate-50/50 dark:bg-darkBg/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SecondMind AI. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-650 dark:hover:text-zinc-400 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-650 dark:hover:text-zinc-400 cursor-pointer">Terms</span>
            <span className="hover:text-slate-650 dark:hover:text-zinc-400 cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Inline auxiliary navigation utility
const NavLinkTo: React.FC<{ to: string; className: string; children: React.ReactNode; navigate: ReturnType<typeof useNavigate> }> = ({ to, className, children, navigate }) => (
  <button onClick={() => navigate(to)} className={`${className} cursor-pointer bg-transparent border-none`}>
    {children}
  </button>
);
