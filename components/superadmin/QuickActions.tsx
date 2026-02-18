'use client';

import Link from 'next/link';
import { ChevronRight, UserPlus, Building2, Settings, BarChart3 } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      label: 'Review Properties',
      icon: Building2,
      href: '/superadmin/properties',
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Manage Users',
      icon: UserPlus,
      href: '/superadmin/users',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Review Agents',
      icon: BarChart3,
      href: '/superadmin/agents',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'System Settings',
      icon: Settings,
      href: '/superadmin/settings',
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <div
      className="rounded-2xl bg-white/40 backdrop-blur-xl border border-white/20 p-6 hover:bg-white/50 transition-all duration-300"
      style={{ animation: 'slideUp 0.6s ease-out 0.5s backwards' }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              href={action.href}
              className={`w-full p-4 rounded-xl bg-gradient-to-r ${action.color} text-white font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 group flex items-center justify-between`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                {action.label}
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}