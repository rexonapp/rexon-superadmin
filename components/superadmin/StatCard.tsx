'use client';

import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
  change: string;
  color: 'blue' | 'purple' | 'orange' | 'emerald' | 'violet' | 'rose' | 'cyan' | 'amber';
  index: number;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    gradient: 'from-blue-500/20 via-transparent to-cyan-500/20',
    ring: 'ring-blue-500/20',
    badge: 'bg-blue-100 text-blue-700',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    gradient: 'from-purple-500/20 via-transparent to-pink-500/20',
    ring: 'ring-purple-500/20',
    badge: 'bg-purple-100 text-purple-700',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600',
    gradient: 'from-violet-500/20 via-transparent to-indigo-500/20',
    ring: 'ring-violet-500/20',
    badge: 'bg-violet-100 text-violet-700',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    gradient: 'from-orange-500/20 via-transparent to-amber-500/20',
    ring: 'ring-orange-500/20',
    badge: 'bg-orange-100 text-orange-700',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    gradient: 'from-amber-500/20 via-transparent to-yellow-500/20',
    ring: 'ring-amber-500/20',
    badge: 'bg-amber-100 text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    gradient: 'from-emerald-500/20 via-transparent to-teal-500/20',
    ring: 'ring-emerald-500/20',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    gradient: 'from-rose-500/20 via-transparent to-pink-500/20',
    ring: 'ring-rose-500/20',
    badge: 'bg-rose-100 text-rose-700',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600',
    gradient: 'from-cyan-500/20 via-transparent to-blue-500/20',
    ring: 'ring-cyan-500/20',
    badge: 'bg-cyan-100 text-cyan-700',
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  change,
  color,
  index,
}: StatCardProps) {
  const colors = colorClasses[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 p-6 hover:bg-white/60 transition-all duration-500 hover:shadow-2xl hover:border-white/80"
      style={{
        animation: `slideUp 0.6s ease-out ${index * 0.1}s backwards`,
      }}
    >
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      />

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Floating orbs */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-all duration-700`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3.5 rounded-xl ${colors.bg} ring-4 ${colors.ring} transition-colors duration-300`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.badge} font-semibold text-xs`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{change}</span>
          </div>
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          {value}
        </h3>
        <p className="text-sm text-gray-600 font-semibold tracking-wide">{label}</p>
      </div>
    </div>
  );
}