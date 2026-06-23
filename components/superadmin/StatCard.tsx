'use client';

import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  mobileLabel?: string;
  value: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  color: 'blue' | 'purple' | 'orange' | 'emerald' | 'violet' | 'rose' | 'cyan' | 'amber';
  index: number;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-brand-teal/10',
    text: 'text-brand-teal-medium',
    hover: 'bg-brand-teal/15',
    ring: 'ring-brand-teal/20',
    badge: 'bg-brand-teal/15 text-brand-teal-dark',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    hover: 'bg-purple-500/15',
    ring: 'ring-purple-500/20',
    badge: 'bg-purple-100 text-purple-700',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600',
    hover: 'bg-violet-500/15',
    ring: 'ring-violet-500/20',
    badge: 'bg-violet-100 text-violet-700',
  },
  orange: {
    bg: 'bg-brand-orange/10',
    text: 'text-brand-orange-hover',
    hover: 'bg-brand-orange/15',
    ring: 'ring-brand-orange/20',
    badge: 'bg-brand-orange/15 text-brand-orange-dark',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    hover: 'bg-amber-500/15',
    ring: 'ring-amber-500/20',
    badge: 'bg-amber-100 text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    hover: 'bg-emerald-500/15',
    ring: 'ring-emerald-500/20',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    hover: 'bg-rose-500/15',
    ring: 'ring-rose-500/20',
    badge: 'bg-rose-100 text-rose-700',
  },
  cyan: {
    bg: 'bg-brand-teal-medium/10',
    text: 'text-brand-teal',
    hover: 'bg-brand-teal-medium/15',
    ring: 'ring-brand-teal-medium/20',
    badge: 'bg-brand-teal-medium/15 text-brand-teal-deep',
  },
};

export default function StatCard({
  label,
  mobileLabel,
  value,
  icon: Icon,
  trend,
  change,
  color,
  index,
  onClick,
}: StatCardProps) {
  const colors = colorClasses[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-white/40 backdrop-blur-xl border border-white/60 p-2 sm:p-3 hover:bg-white/60 transition-all duration-500 hover:shadow-2xl hover:border-white/80"
      style={{
        animation: `slideUp 0.6s ease-out ${index * 0.1}s backwards`,
      }}
    >
      {/* Animated hover background */}
      <div
        className={`absolute inset-0 ${colors.hover} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      />

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Floating orbs */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 ${colors.hover} rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-all duration-700`} />

      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
        <div className={`shrink-0 p-2 sm:p-3.5 rounded-lg sm:rounded-xl ${colors.bg} ring-2 sm:ring-4 ${colors.ring} transition-colors duration-300`}>
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${colors.text}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl sm:text-3xl font-bold text-gray-900 leading-none mb-0.5 sm:mb-1">
            {value}
          </h3>
          {mobileLabel && <p className="sm:hidden text-[10px] leading-tight text-gray-600 font-semibold tracking-wide truncate">{mobileLabel}</p>}
          <p className={cn(mobileLabel ? 'hidden sm:block' : '', 'text-[10px] leading-tight sm:text-sm text-gray-600 font-semibold tracking-wide truncate')}>{label}</p>
        </div>
      </div>
    </div>
  );
}