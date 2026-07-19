import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';

interface TopNavProps {
  onOpenSidebar: () => void;
  onOpenSearch?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenSidebar, onOpenSearch }) => {
  const location = useLocation();

  // Dynamically set page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path === '/dashboard/memories') return 'Memory Vault';
    if (path === '/dashboard/connections') return 'Cognitive Connections';
    if (path === '/settings') return 'Settings';
    return 'SecondMind';
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="flex items-center justify-between h-16 px-6 glass-effect border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-30">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 lg:hidden text-slate-500 dark:text-zinc-400 cursor-pointer"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
        <h1 className="font-display font-semibold text-lg text-slate-900 dark:text-zinc-100 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Search Mockup - ChatGPT/Linear style */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4 cursor-pointer" onClick={onOpenSearch}>
        <div className="relative w-full group pointer-events-none">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Search memories, thoughts..."
            className="w-full pl-10 pr-12 py-1.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200 cursor-pointer"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-slate-200/70 dark:border-white/10 bg-white dark:bg-zinc-950/80 text-[9px] font-medium text-slate-400 dark:text-zinc-500 shadow-sm">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action Button */}
        <Button variant="glass" size="sm" className="hidden sm:inline-flex border-dashed">
          <Plus className="w-4 h-4" />
          <span>New Thought</span>
        </Button>

        {/* Notifications Button */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-zinc-800/40 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-all cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Floating Mini Glow element */}
        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 hidden md:block" />
      </div>
    </header>
  );
};
