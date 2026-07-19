import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { GlobalSearchModal } from '../search/GlobalSearchModal';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-darkBg relative">
      {/* Ambient background glow elements */}
      <div className="glow-orb w-[500px] h-[500px] bg-brand-500/10 -top-40 -right-40" />
      <div className="glow-orb w-[600px] h-[600px] bg-indigo-500/5 -bottom-60 -left-60" />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 overflow-hidden">
        {/* Top Header */}
        <TopNav 
          onOpenSidebar={() => setSidebarOpen(true)} 
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Dynamic Animated Content Panel */}
        {(() => {
          const isChatPage = location.pathname === '/dashboard/chat';
          return (
            <div className={`flex-1 relative min-h-0 ${isChatPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
              <AnimatePresence mode="wait">
                <motion.main
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className={`max-w-7xl mx-auto w-full ${
                    isChatPage ? 'p-4 md:p-6 h-full flex flex-col overflow-hidden min-h-0' : 'p-6 md:p-8'
                  }`}
                >
                  <Outlet />
                </motion.main>
              </AnimatePresence>
            </div>
          );
        })()}
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </div>
  );
};
