"use client";

import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  UserCheck,
  Users,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import StatCard from '@/components/superadmin/StatCard';
import GlassCard from '@/components/superadmin/GlassCard';
import { useRouter } from 'next/navigation';
import { DashboardData, ActivityItem, Stats } from '@/app/(superadmin)/page';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  });

interface Props {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: Props) {
  const router = useRouter();

  const { data: dashData, isValidating: dashValidating } = useSWR(
    '/api/superadmin/dashboard',
    fetcher,
    {
      fallbackData: {
        success: true,
        stats: initialData.stats,
        recentActivity: initialData.recentActivity,
      },
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  const { data: agentData, isValidating: agentValidating } = useSWR(
    '/api/agents/recent-activity',
    fetcher,
    {
      fallbackData: {
        success: true,
        data: { activities: initialData.agentActivities },
      },
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  const stats: Stats = dashData?.stats ?? initialData.stats;
  const recentActivity: ActivityItem[] = dashData?.recentActivity ?? initialData.recentActivity;
  const agentActivities: any[] = agentData?.data?.activities ?? initialData.agentActivities;

  const isRefreshing = dashValidating || agentValidating;

  const statCards = [
    { label: 'Total Warehouses', value: stats.totalWarehouses.toString(), icon: Building2, color: 'blue' as const },
    { label: 'Pending Approvals', value: stats.pendingApprovals.toString(), icon: Clock, color: 'cyan' as const },
    { label: 'Leads', value: stats.totalUsers.toString(), icon: Users, color: 'blue' as const },
    { label: 'Agent Network', value: stats.totalAgents.toString(), icon: UserCheck, color: 'cyan' as const },
  ];

  return (
    <>
      {/* ── Webkit thin scrollbar — injected once, scoped to .activity-scroll ── */}
      <style>{`
        .activity-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .activity-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .activity-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 999px;
        }
        .activity-scroll::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>

      {/* Refreshing toast */}
      {isRefreshing && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 shadow-sm text-xs text-gray-500">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          Refreshing…
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            index={idx}
          />
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity — 2 cols */}
        <GlassCard className="lg:col-span-2 p-6" gradient="blue">

          {/* Card header */}
          <div className="flex flex-row items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 ring-4 ring-blue-500/10">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="ml-auto">
            <Button
              onClick={() => router.push('/agentWarehouseActivity')}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>`
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-6" />

          {recentActivity.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── Activity Table ── */}
              <div className="col-span-1 md:col-span-2">
                {recentActivity.length > 0 ? (
                  <div
                    className="overflow-x-auto"
                    style={{
                      maxHeight: "460px",
                      overflowY: "auto",
                      scrollbarWidth: "thin",
                      scrollbarColor: "#CBD5E1 transparent",
                    }}
                  >
                    <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-3 text-left  text-gray-500 font-semibold">Property</th>
                          <th className="p-3 text-left  text-gray-500 font-semibold">Agent</th>
                          <th className="p-3 text-left  text-gray-500 font-semibold">City</th>
                          <th className="p-3 text-left  text-gray-500 font-semibold">Type</th>
                          <th className="p-3 text-left  text-gray-500 font-semibold">Price</th>
                          <th className="p-3 text-left  text-gray-500 font-semibold">Status</th>
                          <th className="p-3 text-left  text-gray-500 font-semibold">Created</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentActivity.map((activity) => (
                          <tr key={activity.id} className="border-t hover:bg-white/60">
                            {/* Property */}
                            <td className="p-3 font-medium">
                              {activity.warehouse}
                            </td>

                            {/* Agent */}
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{activity.full_name}</span>
                                <span className="text-xs text-gray-500">{activity.email}</span>
                              </div>
                            </td>

                            {/* City */}
                            <td className="p-3">
                              {activity.city}
                            </td>

                            {/* Type */}
                            <td className="p-3 capitalize">
                              {activity.action.includes("warehouse") ? "Warehouse" : "-"}
                            </td>

                            {/* Price */}
                            <td className="p-3">₹ {activity.price_per_sqft ?? "-"}</td>

                            {/* Status */}
                            <td className="p-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold border
                                  ${
                                    activity.status === "success"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : activity.status === "pending"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : activity.status === "rejected"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-gray-50 text-gray-600 border-gray-200"
                                  }`}
                              >
                                {activity.status === "success"
                                  ? "Active"
                                  : activity.status === "pending"
                                    ? "Pending"
                                    : activity.status === "rejected"
                                      ? "Rejected"
                                      : activity.status}
                              </span>
                            </td>

                            {/* Created */}
                            <td className="p-3 text-gray-500">{activity.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-6 text-center">
                    No recent activity found
                  </p>
                )}
              </div>

              {/* ── Agent Activity ── */}
              {/* <div className="flex flex-col"> */}
              {/* <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Agent Activity</h3>
                  <Button
                    onClick={() => router.push('/agentActivity')}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div> */}

              {/* {agentActivities.length > 0 ? (
                  <div
                    className="activity-scroll space-y-3 pr-2"
                    style={{
                      maxHeight: '460px',
                      overflowY: 'auto',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#CBD5E1 transparent',
                    }}
                  >
                    {agentActivities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-white/60 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{activity.action}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {activity.user}
                            {activity.email ? ` (${activity.email})` : ''}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">
                          {new Date(activity.time).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-6 text-center">No agent activity</p>
                )} */}
              {/* </div> */}

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

        {/* ── Quick Actions ── */}
        {/* <GlassCard className="p-6" gradient="cyan">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/10 ring-4 ring-cyan-500/10">
              <Sparkles className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-6" />

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/warehouses')}
              className="w-full justify-between h-12 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 hover:from-blue-700 hover:via-cyan-700 hover:to-sky-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all group"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Building2 className="w-4 h-4" />
                Review Warehouses
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <Button
              onClick={() => router.push('/agents')}
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
              onClick={() => router.push('/admin')}
              className="w-full justify-between h-12 rounded-xl bg-white/50 hover:bg-white/80 text-gray-900 border border-white/60 hover:border-white/80 shadow-sm hover:shadow-md transition-all group"
              variant="outline"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4 text-blue-600" />
                Manage Admin Users
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <Separator className="my-4 bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />

           
          </div>
        </GlassCard> */}

      </div>
    </>
  );
}