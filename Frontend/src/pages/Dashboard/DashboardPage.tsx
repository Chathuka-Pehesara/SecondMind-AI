import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Network, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Layers, 
  ArrowUpRight, 
  RefreshCw,
  Search
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

export const DashboardPage: React.FC = () => {
  // Container variants for layout staggering
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
  };

  const metrics = [
    { name: 'Memory Nodes', value: '142', description: '+12 notes this week', icon: Brain, color: 'rgba(139, 92, 246, 0.15)', textClass: 'text-brand-500' },
    { name: 'Connection Density', value: '84.2%', description: 'Strong logical mappings', icon: Network, color: 'rgba(59, 130, 246, 0.15)', textClass: 'text-blue-500' },
    { name: 'Response Latency', value: '12 ms', description: 'Instant cognitive lookups', icon: Clock, color: 'rgba(16, 185, 129, 0.15)', textClass: 'text-emerald-500' },
    { name: 'Vault Security', value: 'Local Only', description: 'AES-256 encrypted', icon: ShieldCheck, color: 'rgba(239, 68, 68, 0.15)', textClass: 'text-rose-500' },
  ];

  const recentActivities = [
    { id: 1, action: 'Synced node metadata', details: 'Cognitive mapping rules file parsed', time: '4m ago', status: 'success' },
    { id: 2, action: 'Linked 4 overlapping memories', details: 'Merged "Tailwind CSS v4 config" and "Vite bundler"', time: '1h ago', status: 'linked' },
    { id: 3, action: 'Index optimized', details: 'Pruned 12 disconnected search vectors', time: '5h ago', status: 'optimized' },
    { id: 4, action: 'New thought logged', details: '"Framer Motion spring transition values"', time: '1d ago', status: 'success' },
  ];

  const quickActions = [
    { title: 'Semantic Search', desc: 'Find thoughts by semantic relevance instead of keywords.', icon: Search, actionText: 'Search' },
    { title: 'Graph Canvas', desc: 'Interact with visual mapping web showing related themes.', icon: Layers, actionText: 'Open Canvas' },
    { title: 'Cognitive Sync', desc: 'Index new resources and update references in bulk.', icon: RefreshCw, actionText: 'Start Sync' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-2xl glass-effect border border-slate-200/50 dark:border-white/5 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-52 h-52 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 dark:text-white flex items-center gap-2">
            Welcome back, John <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
            SecondMind is fully synchronized. Your cognitive vault is secure and local.
          </p>
        </div>
        <div className="relative z-10 flex gap-2">
          <Button variant="glass" size="sm">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Sync Vault</span>
          </Button>
          <Button variant="primary" size="sm">
            <span>+ New Thought</span>
          </Button>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metrics.map((metric) => (
          <GlassCard 
            key={metric.name} 
            hoverEffect 
            glowColor={metric.color}
            className="p-5 flex flex-col justify-between h-36"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{metric.name}</span>
              <div 
                className="p-2 rounded-xl border flex items-center justify-center"
                style={{ 
                  backgroundColor: metric.color,
                  borderColor: metric.color.replace('0.15', '0.3')
                }}
              >
                <metric.icon className={`w-4 h-4 ${metric.textClass}`} />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <h3 className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                {metric.value}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{metric.description}</p>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Main Grid: Feed & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-500" />
                  Recent Cognitive Activity
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 cursor-pointer hover:text-brand-500">View logs</span>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex gap-4 p-3 rounded-xl border border-slate-200/40 dark:border-white/5 bg-slate-100/10 dark:bg-zinc-900/10 hover:bg-slate-100/40 dark:hover:bg-zinc-800/20 transition-all group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                        activity.status === 'success' ? 'bg-emerald-500' :
                        activity.status === 'linked' ? 'bg-brand-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                          {activity.action}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">{activity.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{activity.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-slate-200/50 dark:border-white/5 mt-6 pt-4 flex justify-center">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer">
                <span>Configure local vector index settings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right Column: Quick Action Cards */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center mb-1">
            <h3 className="font-display font-semibold text-sm text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">
              Actions
            </h3>
          </div>

          {quickActions.map((action) => (
            <GlassCard 
              key={action.title} 
              hoverEffect 
              glowColor="rgba(139, 92, 246, 0.08)"
              className="p-5 flex flex-col justify-between gap-4 border-l-4 border-l-slate-400/40 dark:border-l-zinc-700/50 hover:border-l-brand-500 dark:hover:border-l-brand-400"
            >
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-zinc-455">
                  <action.icon className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{action.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">{action.desc}</p>
                </div>
              </div>
              <div className="flex justify-end items-center">
                <button className="text-[11px] font-semibold text-brand-650 dark:text-brand-450 hover:underline flex items-center gap-1 cursor-pointer">
                  <span>{action.actionText}</span>
                  <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Auxiliary Chevron Icon
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);
