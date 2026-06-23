import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glowColor,
  ...props
}) => {
  return (
    <motion.div
      className={`glass-effect rounded-2xl p-6 relative overflow-hidden transition-shadow duration-300 ${
        hoverEffect
          ? 'hover:shadow-lg dark:hover:shadow-brand-500/10 hover:border-brand-500/30 dark:hover:border-brand-500/30'
          : ''
      } ${className}`}
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {glowColor && (
        <div
          className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: glowColor }}
        />
      )}
      <div className="relative z-10 h-full w-full">{children}</div>
    </motion.div>
  );
};
