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
  { label: 'Admin',      path: '/admin'      },
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

  return (
    /*
     * Root: covers exactly the viewport. overflow-hidden ensures nothing
     * on this element ever scrolls — children manage their own overflow.
     */
    <div className="fixed inset-0 bg-gray-50 flex overflow-hidden">

      {/* Sidebar — fixed, absolutely positioned inside the flex row */}
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/*
       * Main column: offset by sidebar width via margin.
       * flex-col so header stacks above content.
       * overflow-hidden so the content area below can flex properly.
       */}
      <main
        className={`
          flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden
          transition-[margin] duration-300 ease-in-out
          ml-0 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}
        `}
      >

        {/* ── Header — fixed height, never grows or shrinks ── */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 z-20">
          {/* Main header bar: 64px */}
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">

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

              {/* Stats pills — desktop only, no extra height */}
              {isWarehousesPage && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200  px-3 py-1.5">
                    <Clock className="w-3.5 h-12 text-amber-500 shrink-0" />
                    <span className="text-sm font-semibold text-amber-700">{stats.pending} Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                    <CheckCircle className="w-3.5 h-12 text-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700">{stats.active} Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200  px-3 py-1.5">
                    <XCircle className="w-3.5 h-12 text-rose-500 shrink-0" />
                    <span className="text-sm font-semibold text-rose-700">{stats.rejected} Rejected</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              </Button>

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
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer text-sm">
                    <Settings className="w-4 h-4 mr-2 text-gray-500" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-sm text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile stats strip — only renders on small screens on warehouses page */}
          {isWarehousesPage && (
            <div
              className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200  px-3 py-1 shrink-0">
                <Clock className="w-3 h-11 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{stats.pending} Pending</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 r px-3 py-1 shrink-0">
                <CheckCircle className="w-3 h-11 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">{stats.active} Active</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200  px-3 py-1 shrink-0">
                <XCircle className="w-3 h-11 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700">{stats.rejected} Rejected</span>
              </div>
            </div>
          )}
        </header>

        {/*
         * Content area: flex-1 takes all remaining height after the header.
         * overflow-hidden lets page components (like the warehouse table)
         * manage their own internal scrolling via their own overflow-auto.
         * Pages must use h-full and flex flex-col internally to fill this space.
         */}
        <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
          {children}
        </div>

      </main>
    </div>
  );
}