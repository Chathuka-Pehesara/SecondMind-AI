import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  Brain,
  Network,
  X,
  Sparkles,
  Command,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Chat', path: '/dashboard/chat', icon: MessageSquare },
    { name: 'Memory Vault', path: '/dashboard/memories', icon: Brain },
    { name: 'Connections', path: '/dashboard/connections', icon: Network },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 glass-effect border-r border-slate-200/50 dark:border-white/10 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header / Brand Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/50 dark:border-white/5">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              SecondMind
            </span>
          </NavLink>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 lg:hidden text-slate-500 dark:text-zinc-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/50 dark:hover:bg-zinc-800/20'
                  }`
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute inset-0 bg-brand-500/10 dark:bg-brand-500/15 border-l-2 border-brand-500 dark:border-brand-400 rounded-xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <item.icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-105 duration-200 ${isActive ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300'
                  }`} />
                <span className="relative z-10">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Premium Upgrade Promo & Profile */}
        <div className="p-4 border-t border-slate-200/50 dark:border-white/5">
          {/* Sparkles promo card */}
          <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-tr from-brand-600/10 to-brand-500/5 border border-brand-500/20 dark:border-brand-500/10 mb-4 group">
            <div className="absolute top-0 right-0 p-1 opacity-25 group-hover:opacity-50 transition-opacity">
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
            <h4 className="text-xs font-semibold text-brand-700 dark:text-brand-350 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5" />
              Pro Features
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Unlock cognitive mappings & infinite mind vaults.
            </p>
            <button className="w-full mt-3 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-white dark:hover:text-white hover:bg-brand-600 dark:hover:bg-brand-500 border border-brand-500/30 rounded-lg py-1.5 transition-all cursor-pointer">
              Upgrade Now
            </button>
          </div>

          {/* Profile Card Dynamic Integration */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-zinc-800/20 transition-all group relative">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-brand-500/10 flex items-center justify-center font-display font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
              {userInitials}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-zinc-950 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                {user?.full_name || 'User Profile'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-455 truncate">
                {user?.email || 'authenticated'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/40"
            >
              {/* Logout icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
