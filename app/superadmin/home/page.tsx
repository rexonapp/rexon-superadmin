"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, UserCheck, Users, Clock, TrendingUp, ArrowUpRight, ArrowRight, Activity, Sparkles } from 'lucide-react';
import StatCard from '@/components/superadmin/StatCard';
import GlassCard from '@/components/superadmin/GlassCard';
import Loading from '../loading';

interface Stats {
  totalWarehouses: number;
  pendingApprovals: number;
  totalUsers: number;
  totalAgents: number;
  verifiedAgents: number;
  todayListings: number;
}

interface Activity {
  id: string;
  action: string;
  warehouse?: string;
  user?: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'pending';
}

export default function SuperAdminHome() {
  const [stats, setStats] = useState<Stats>({
    totalWarehouses: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalAgents: 0,
    verifiedAgents: 0,
    todayListings: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/superadmin/dashboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Warehouses',
      value: stats.totalWarehouses.toString(),
      change: `+${stats.todayListings}`,
      icon: Building2,
      color: 'blue' as const,
      trend: 'up' as const,
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      change: 'Action needed',
      icon: Clock,
      color: 'cyan' as const,
      trend: 'neutral' as const,
    },
    {
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      change: 'Active',
      icon: Users,
      color: 'blue' as const,
      trend: 'up' as const,
    },
    {
      label: 'Agent Network',
      value: stats.totalAgents.toString(),
      change: `${stats.verifiedAgents} verified`,
      icon: UserCheck,
      color: 'cyan' as const,
      trend: 'up' as const,
    },
  ];

  if (loading) {
    return (
      <Loading/>)
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            change={stat.change}
            color={stat.color}
            index={idx}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2 p-6" gradient="blue">
          <div className="flex flex-row items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 ring-4 ring-blue-500/10">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-6" />

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/40 hover:bg-white/60 border border-white/40 hover:border-white/60 transition-all duration-300 group"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                        activity.status === 'success' ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' :
                        activity.status === 'warning' ? 'bg-sky-500 shadow-lg shadow-sky-500/50' :
                        activity.status === 'pending' ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50' :
                        'bg-blue-500 shadow-lg shadow-blue-500/50'
                      } animate-pulse`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 font-medium">
                      {activity.warehouse || activity.user || 'System'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap font-medium bg-gray-100/80 px-2 py-1 rounded-full">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                <Clock className="w-16 h-16 mx-auto mb-4 text-blue-300 relative" />
              </div>
              <p className="text-lg font-semibold text-gray-700">No recent activity</p>
              <p className="text-sm text-gray-500 mt-1">Activity will appear here</p>
            </div>
          )}
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6" gradient="cyan">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/10 ring-4 ring-cyan-500/10">
              <Sparkles className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-6" />

          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/superadmin/warehouses'}
              className="w-full justify-between h-12 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 hover:from-blue-700 hover:via-cyan-700 hover:to-sky-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all group"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Building2 className="w-4 h-4" />
                Review Warehouses
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <Button
              onClick={() => window.location.href = '/superadmin/agents'}
              className="w-full justify-between h-12 rounded-xl bg-white/50 hover:bg-white/80 text-gray-900 border border-white/60 hover:border-white/80 shadow-sm hover:shadow-md transition-all group"
              variant="outline"
            >
              <span className="flex items-center gap-2 font-semibold">
                <UserCheck className="w-4 h-4 text-cyan-600" />
                Verify Agents
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <Button
              onClick={() => window.location.href = '/superadmin/users'}
              className="w-full justify-between h-12 rounded-xl bg-white/50 hover:bg-white/80 text-gray-900 border border-white/60 hover:border-white/80 shadow-sm hover:shadow-md transition-all group"
              variant="outline"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4 text-blue-600" />
                Manage Users
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <Separator className="my-4 bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />

            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">System Status</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
