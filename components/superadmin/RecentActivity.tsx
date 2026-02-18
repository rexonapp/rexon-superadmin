'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Building2, UserCheck, Clock } from 'lucide-react';

interface RecentActivityProps {
  warehouses: any[];
  agents: any[];
  pendingWarehouses: number;
  pendingAgents: number;
}

export default function RecentActivity({
  warehouses,
  agents,
  pendingWarehouses,
  pendingAgents,
}: RecentActivityProps) {
  const activities = [
    ...warehouses.slice(0, 3).map((w) => ({
      type: 'warehouse',
      title: w.title,
      user: `${w.first_name} ${w.last_name}`,
      status: w.status,
      time: w.created_at,
    })),
    ...agents.slice(0, 2).map((a) => ({
      type: 'agent',
      title: a.full_name,
      user: a.email,
      status: a.status,
      time: a.created_at,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div
      className="lg:col-span-2 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/20 p-6 hover:bg-white/50 transition-all duration-300"
      style={{ animation: 'slideUp 0.6s ease-out 0.4s backwards' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <div className="flex gap-2">
          {pendingWarehouses > 0 && (
            <Link
              href="/superadmin/properties"
              className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-700 font-semibold hover:bg-orange-500/30 transition-colors"
            >
              {pendingWarehouses} pending properties
            </Link>
          )}
          {pendingAgents > 0 && (
            <Link
              href="/superadmin/agents"
              className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 font-semibold hover:bg-blue-500/30 transition-colors"
            >
              {pendingAgents} pending agents
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:bg-white/70 transition-all duration-300 group cursor-pointer"
            >
              <div
                className={`p-2 rounded-lg ${
                  activity.type === 'warehouse'
                    ? 'bg-purple-500/20'
                    : 'bg-blue-500/20'
                }`}
              >
                {activity.type === 'warehouse' ? (
                  <Building2 className="w-5 h-5 text-purple-600" />
                ) : (
                  <UserCheck className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 truncate">{activity.user}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activity.status === 'pending'
                        ? 'bg-orange-500/20 text-orange-700'
                        : activity.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-700'
                        : 'bg-red-500/20 text-red-700'
                    }`}
                  >
                    {activity.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.time), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}