import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
    const { login, error, clearError, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        clearError();
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearError();

        // client validation
        if (!email || !password) {
            setFormError('Please fill n all credintials');
            return;
        }

        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            // API error handle by context
        } finally {
            setSubmitting(false);
        }

    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background glow animations */}
            <div className="glow-orb w-[500px] h-[500px] bg-brand-500/10 -top-20 -right-20 animate-float" />
            <div className="glow-orb w-[600px] h-[600px] bg-indigo-500/5 -bottom-40 -left-20 animate-float-delayed" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                            <Brain className="w-5.5 h-5.5" />
                        </div>
                        <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
                            SecondMind
                        </span>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-zinc-450 mt-2">Access your cognitive memories and nodes</p>
                </div>

                <GlassCard glowColor="rgba(139, 92, 246, 0.1)">
                    <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-6 text-center">Welcome Back</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Message banner */}
                        {(formError || error) && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{formError || error}</span>
                            </motion.div>
                        )}

                        {/* Email field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                                <a href="#" className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-650 dark:hover:text-zinc-300 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className="w-full mt-2" disabled={submitting}>
                            {submitting ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-450">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                            Create an account
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );

};