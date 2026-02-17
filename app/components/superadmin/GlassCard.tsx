'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';
  onClick?: () => void;
}

const gradients = {
  violet: 'from-violet-500/10 via-transparent to-indigo-500/10',
  blue: 'from-blue-500/10 via-transparent to-cyan-500/10',
  emerald: 'from-emerald-500/10 via-transparent to-teal-500/10',
  amber: 'from-amber-500/10 via-transparent to-orange-500/10',
  rose: 'from-rose-500/10 via-transparent to-pink-500/10',
  cyan: 'from-cyan-500/10 via-transparent to-blue-500/10',
};

const borderGradients = {
  violet: 'hover:border-violet-300/50',
  blue: 'hover:border-blue-300/50',
  emerald: 'hover:border-emerald-300/50',
  amber: 'hover:border-amber-300/50',
  rose: 'hover:border-rose-300/50',
  cyan: 'hover:border-cyan-300/50',
};

export default function GlassCard({
  children,
  className,
  hover = true,
  gradient = 'violet',
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-500',
        'bg-white/40 border border-white/60 shadow-lg',
        hover && 'hover:shadow-2xl hover:bg-white/60',
        borderGradients[gradient],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Animated gradient background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700',
          gradients[gradient]
        )}
      />

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
