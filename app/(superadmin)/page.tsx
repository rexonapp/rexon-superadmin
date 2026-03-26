

import DashboardClient from '@/components/superadmin/DashboardClient';
import { cookies } from 'next/headers';


export interface Stats {
  totalWarehouses: number;
  pendingApprovals: number;
  totalUsers: number;
  totalAgents: number;
  verifiedAgents: number;
  todayListings: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  warehouse?: string;
  city?: string;
  user?: string;
  price_per_sqft?: string;
  full_name?: string;
  email?: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'pending' | 'rejected';
}

export interface DashboardData {
  stats: Stats;
  recentActivity: ActivityItem[];
  agentActivities: any[];
}


const DEFAULT_STATS: Stats = {
  totalWarehouses: 0,
  pendingApprovals: 0,
  totalUsers: 0,
  totalAgents: 0,
  verifiedAgents: 0,
  todayListings: 0,
};


async function getDashboardData(): Promise<DashboardData> {
 
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  
  const cookieStore =await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const sharedHeaders: HeadersInit = {
    Cookie: cookieHeader,
    'Content-Type': 'application/json',
  };

  
  const [dashboardResult, agentResult] = await Promise.allSettled([
    fetch(`${baseUrl}/api/superadmin/dashboard`, {
      headers: sharedHeaders,
      
      next: { revalidate: 30 },
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Dashboard API responded with ${res.status}`);
      return res.json();
    }),

    fetch(`${baseUrl}/api/agents/recent-activity`, {
      headers: sharedHeaders,
      next: { revalidate: 30 },
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Agent API responded with ${res.status}`);
      return res.json();
    }),
  ]);

  // Safely unpack — a failed fetch falls back to defaults, never crashes the page.
  const stats: Stats =
    dashboardResult.status === 'fulfilled' && dashboardResult.value?.success
      ? dashboardResult.value.stats
      : DEFAULT_STATS;

    console.log('Dashboard Stats:', stats); // Log stats for debugging

  const recentActivity: ActivityItem[] =
    dashboardResult.status === 'fulfilled' && dashboardResult.value?.success
      ? (dashboardResult.value.recentActivity ?? [])
      : [];

  const agentActivities: any[] =
    agentResult.status === 'fulfilled' && agentResult.value?.success
      ? (agentResult.value.data?.activities ?? [])
      : [];

  // Log failures server-side so you can debug in terminal / server logs.
  if (dashboardResult.status === 'rejected') {
    console.error('[Dashboard SSR] Dashboard fetch failed:', dashboardResult.reason);
  }
  if (agentResult.status === 'rejected') {
    console.error('[Dashboard SSR] Agent fetch failed:', agentResult.reason);
  }

  return { stats, recentActivity, agentActivities };
}


export default async function SuperAdminDashboardPage() {
  const data = await getDashboardData();

  
  return <DashboardClient initialData={data} />;
}