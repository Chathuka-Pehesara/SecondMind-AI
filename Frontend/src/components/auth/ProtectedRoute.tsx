import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex flex-col items-center justify-center relative">
                <div className="glow-orb w-[400px] h-[400px] bg-brand-500/10 -top-20 -right-20" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 animate-pulse">
                        <Brain className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-450 tracking-wider">
                        Accessing Mind Vault...
                    </span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />
}