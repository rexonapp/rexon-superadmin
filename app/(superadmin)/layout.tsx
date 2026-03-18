"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu, Settings, LogOut, Clock, CheckCircle, XCircle } from 'lucide-react';
import Sidebar, { AdminUser } from '@/components/superadmin/sidebar';
import Loading from './loading';

const menuItems = [
  { label: 'Dashboard',  path: '/'           },
  { label: 'Users',      path: '/users'      },
  { label: 'Agents',     path: '/agents'     },
  { label: 'Warehouses', path: '/warehouses' },
  { label: 'Settings',   path: '/settings'   },
];

function getActiveLabel(pathname: string | null): string {
  if (!pathname) return 'Dashboard';
  const exact = menuItems.find(i => i.path === pathname);
  if (exact) return exact.label;
  const prefix = menuItems
    .filter(i => i.path !== '/')
    .find(i => pathname.startsWith(i.path));
  return prefix?.label ?? 'Dashboard';
}

interface WarehouseStats {
  pending: number;
  active: number;
  rejected: number;
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<WarehouseStats>({ pending: 0, active: 0, rejected: 0 });
  const pathname = usePathname();
  const router = useRouter();
  const isWarehousesPage = pathname?.startsWith('/warehouses');

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser({
            id:         data.user.userId,
            username:   data.user.username,
            first_name: data.user.firstName,
            last_name:  data.user.lastName,
            email:      data.user.email,
            role:       data.user.role ?? 'user',
            is_active:  true,
          });
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    };
    fetchUser();
  }, [router]);

  // Fetch warehouse stats for navbar badges (only on warehouses page)
  useEffect(() => {
    if (!isWarehousesPage) return;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/superadmin/warehouses');
        const data = await res.json();
        if (data.success && data.warehouses) {
          const ws = data.warehouses;
          setStats({
            pending:  ws.filter((w: { status: string }) => w.status === 'Pending').length,
            active:   ws.filter((w: { status: string }) => w.status === 'Active').length,
            rejected: ws.filter((w: { status: string }) => w.status === 'rejected').length,
          });
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, [isWarehousesPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch { /* silent */ }
  };

  if (!user) return <Loading />;

  const pageLabel = getActiveLabel(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <main className={`transition-all duration-300 ease-in-out ml-0 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-1 hover:bg-gray-100 shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>

              <div className="min-w-0">
                <h1 className="text-[17px] font-semibold text-gray-900 truncate leading-tight">
                  {pageLabel}
                </h1>
                <p className="text-[12px] text-gray-400 hidden sm:block leading-tight mt-0.5">
                  Super Admin Panel
                </p>
              </div>

              {/* Warehouse stats pills — only shown on /warehouses */}
              {isWarehousesPage && (
                <div className="hidden md:flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="text-[12px] font-semibold text-amber-700">{stats.pending} Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-[12px] font-semibold text-emerald-700">{stats.active} Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-full px-3 py-1">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    <span className="text-[12px] font-semibold text-rose-700">{stats.rejected} Rejected</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100"
              >
                <Bell className="w-4.5 h-4.5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-3 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-sm">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <Badge className="mt-1 text-[10px] h-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {user.role?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2 text-gray-500" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile stats bar — only on /warehouses */}
          {isWarehousesPage && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-3 overflow-x-auto">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 shrink-0">
                <Clock className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">{stats.pending} Pending</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 shrink-0">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">{stats.active} Active</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-full px-3 py-1 shrink-0">
                <XCircle className="w-3 h-3 text-rose-500" />
                <span className="text-[11px] font-semibold text-rose-700">{stats.rejected} Rejected</span>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}