import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none';
  
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 border border-brand-500/30',
    secondary: 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-slate-300/30 dark:border-zinc-700/50',
    glass: 'glass-effect backdrop-blur-md bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 text-slate-800 dark:text-zinc-100 border border-slate-200/40 dark:border-white/10 shadow-sm',
    outline: 'border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};
