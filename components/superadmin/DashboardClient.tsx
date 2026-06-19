"use client";

import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Building2,
  UserCheck,
  Users,
  Clock,
  ArrowRight,
  Activity,
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

  const stats: Stats = dashData?.stats ?? initialData.stats;
  const recentActivity: ActivityItem[] = dashData?.recentActivity ?? initialData.recentActivity;

  const isRefreshing = dashValidating;

  const statCards = [
    { label: 'Total Properties', value: stats.totalWarehouses.toString(), icon: Building2, color: 'blue' as const, route: '/properties'  },
    // { label: 'Pending Approvals', value: stats.pendingApprovals.toString(), icon: Clock, color: 'cyan' as const },
    { label: 'Leads', value: stats.totalUsers.toString(), icon: Users, color: 'blue' as const,     route: '/leads'  },
    { label: 'Agents', value: stats.totalAgents.toString(), icon: UserCheck, color: 'cyan' as const, route: '/agents'},
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
          <RefreshCw className="w-3 h-3 animate-spin text-brand-teal-medium" />
          Refreshing…
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
        {statCards.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            index={idx}
            onClick={() => router.push(stat.route)}
          />
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

        {/* Recent Activity — 2 cols */}
        <GlassCard className="lg:col-span-3 p-6" gradient="blue">

          {/* Card header */}
          <div className="flex flex-row items-center justify-between mb-4 bg-brand-teal rounded-xl px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 ring-2 ring-white/30">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            </div>
            <div className="ml-auto">
            <Button
              onClick={() => router.push('/agentWarehouseActivity')}
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/20"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div
              className="w-full min-w-0 overflow-auto rounded-lg border border-gray-200"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E1 transparent",
              }}
            >
              <table className="w-full min-w-[52rem] md:min-w-full border-collapse text-left text-sm">
                <thead className="bg-brand-teal/15 sticky top-0 z-[1] shadow-[0_1px_0_0_rgb(20_184_166_/_0.2)]">
                  <tr>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">Property</th>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">Agent</th>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">City</th>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">Type</th>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">Price</th>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">Status</th>
                    <th className="p-2 sm:p-3 text-brand-teal-dark font-semibold whitespace-nowrap">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {recentActivity.map((activity, idx) => (
                    <tr key={activity.id} className={idx % 2 === 0 ? "bg-white hover:bg-brand-teal/5" : "bg-gray-50/60 hover:bg-brand-teal/5"}>
                      <td className="p-2 sm:p-3 font-medium align-top break-words min-w-[8rem]">
                        {activity.warehouse}
                      </td>

                      <td className="p-2 sm:p-3 align-top min-w-[10rem] max-w-[14rem]">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-medium break-words">{activity.full_name}</span>
                          <span className="text-xs text-gray-500 break-all">{activity.email}</span>
                        </div>
                      </td>

                      <td className="p-2 sm:p-3 align-top whitespace-nowrap">{activity.city}</td>

                      <td className="p-2 sm:p-3 capitalize align-top whitespace-nowrap">
                        {activity.action.includes("warehouse") ? "Warehouse" : "-"}
                      </td>

                      <td className="p-2 sm:p-3 align-top whitespace-nowrap">₹ {activity.price_per_sqft ?? "-"}</td>

                      <td className="p-2 sm:p-3 align-top">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border
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

                      <td className="p-2 sm:p-3 text-gray-500 align-top whitespace-nowrap">{activity.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-brand-teal/20 rounded-full blur-xl" />
                <Clock className="w-16 h-16 mx-auto mb-4 text-brand-teal/40 relative" />
              </div>
              <p className="text-lg font-semibold text-gray-700">No recent activity</p>
              <p className="text-sm text-gray-500 mt-1">Activity will appear here</p>
            </div>
          )}
        </GlassCard>

        {/* ── Quick Actions ── */}
        {/* <GlassCard className="p-6" gradient="cyan">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-brand-teal-medium/10 ring-4 ring-brand-teal-medium/10">
              <Sparkles className="w-5 h-5 text-brand-teal" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-brand-teal/25 to-transparent mb-6" />

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/warehouses')}
              className="w-full justify-between h-12 rounded-xl bg-gradient-to-r from-brand-teal-deep via-brand-teal to-brand-orange hover:from-brand-teal-dark hover:via-brand-teal-medium hover:to-brand-orange-deep text-white shadow-lg shadow-brand-teal/30 hover:shadow-xl hover:shadow-brand-orange/25 transition-all group"
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
                <UserCheck className="w-4 h-4 text-brand-teal" />
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
                <Users className="w-4 h-4 text-brand-teal-medium" />
                Manage Admin Users
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <Separator className="my-4 bg-gradient-to-r from-transparent via-brand-teal/25 to-transparent" />

           
          </div>
        </GlassCard> */}

      </div>
    </>
  );
}