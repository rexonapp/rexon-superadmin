"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu, Settings, LogOut, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import Sidebar, { AdminUser } from '@/components/superadmin/sidebar';
import Loading from './loading';
import { BrandingProvider, useBranding } from '@/lib/context/BrandingContext';
import { Toaster } from "@/components/ui/sonner";

const menuItems = [
  { label: 'Dashboard',  path: '/'           },
  { label: 'Admin',      path: '/admin'      },
  { label: 'Agents',     path: '/agents'     },
  { label: 'Warehouses', path: '/warehouses' },
  { label: 'Settings',   path: '/settings'   },
];

interface WarehouseStats { pending: number; active: number; rejected: number; }
interface AgentStats     { pending: number; approved: number; rejected: number; invite: number; }


function SuperAdminInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState<AdminUser | null>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats>({ pending: 0, active: 0, rejected: 0 });
  const [agentStats, setAgentStats]         = useState<AgentStats>({ pending: 0, approved: 0, rejected: 0, invite: 0 });

  const pathname         = usePathname();
  const router           = useRouter();
  const { companyName, logoUrl } = useBranding();
  const isWarehousesPage = pathname?.startsWith('/warehouses');
  const isAgentsPage     = pathname?.startsWith('/agents');

  // Treat empty string / null / undefined all as "no image"
  const userImageUrl: string | undefined = (user as any)?.avatar_url || undefined;
  const userInitials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '';
  const userFullName = user ? `${user.first_name} ${user.last_name}` : '';

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser({
            id:          data.user.userId,
            username:    data.user.username,
            first_name:  data.user.firstName,
            last_name:   data.user.lastName,
            email:       data.user.email,
            role:        data.user.role ?? 'user',
            is_active:   true,
            avatar_url:  data.user.avatarUrl ?? null,
          } as AdminUser);
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
    (async () => {
      try {
        const res  = await fetch('/api/superadmin/warehouses');
        const data = await res.json();
        if (data.success && data.warehouses) {
          const ws = data.warehouses;
          setWarehouseStats({
            pending:  ws.filter((w: { status: string }) => w.status === 'Pending').length,
            active:   ws.filter((w: { status: string }) => w.status === 'Active').length,
            rejected: ws.filter((w: { status: string }) => w.status === 'rejected').length,
          });
        }
      } catch { /* silent */ }
    })();
  }, [isWarehousesPage]);

  useEffect(() => {
    if (!isAgentsPage) return;
    (async () => {
      try {
        const res  = await fetch('/api/superadmin/agents');
        const data = await res.json();
        if (data.success && data.agents) {
          const as_ = data.agents;
          setAgentStats({
            pending:  as_.filter((a: { status: string }) => a.status === 'pending').length,
            approved: as_.filter((a: { status: string }) => a.status === 'approved').length,
            rejected: as_.filter((a: { status: string }) => a.status === 'rejected').length,
            invite:   as_.filter((a: { status: string }) => a.status === 'invite').length,
          });
        }
      } catch { /* silent */ }
    })();
  }, [isAgentsPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch { /* silent */ }
  };

  if (!user) return <Loading />;

  return (
    <div className="fixed inset-0 bg-gray-50 flex overflow-hidden">

      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <main
        className={`
          flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden
          transition-[margin] duration-300 ease-in-out
          ml-0 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}
        `}
      >
        {/* ── Header ── */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 z-20">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">

            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost" size="icon"
                className="-ml-1 hover:bg-gray-100 shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>

              {/* Mobile logo pill — hidden on lg+ (sidebar handles it) */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-[10px] font-bold">
                      {(companyName || 'R')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate max-w-[120px]">
                  {companyName || 'Rexon'}
                </span>
              </div>

              {/* Warehouse stat pills */}
              {isWarehousesPage && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5">
                    <Clock className="w-3.5 h-12 text-amber-500 shrink-0" />
                    <span className="text-sm font-semibold text-amber-700">{warehouseStats.pending} Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                    <CheckCircle className="w-3.5 h-12 text-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700">{warehouseStats.active} Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5">
                    <XCircle className="w-3.5 h-12 text-rose-500 shrink-0" />
                    <span className="text-sm font-semibold text-rose-700">{warehouseStats.rejected} Rejected</span>
                  </div>
                </div>
              )}

              {/* Agent stat pills */}
              {isAgentsPage && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5">
                    <Clock className="w-3.5 h-12 text-amber-500 shrink-0" />
                    <span className="text-sm font-semibold text-amber-700">{agentStats.pending} Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                    <UserCheck className="w-3.5 h-12 text-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700">{agentStats.approved} Approved</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5">
                    <XCircle className="w-3.5 h-12 text-rose-500 shrink-0" />
                    <span className="text-sm font-semibold text-rose-700">{agentStats.rejected} Rejected</span>
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
                  {/*
                    PLACE 3 — Header top-right avatar button
                    • Has image  → show profile image only
                    • No image   → show initials only
                  */}
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 w-11 h-11 p-0">
                    <Avatar className="w-10 h-10">
                      {logoUrl ? (
                        <AvatarImage src={logoUrl} alt={userFullName} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold">
                          {userInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64">
               

                  {/* User row inside dropdown — always show avatar + name + email for context */}
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        {logoUrl ? (
                          <AvatarImage src={logoUrl} alt={userFullName} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-sm">
                            {userInitials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{userFullName}</p>
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

          {/* Mobile stats — warehouses */}
          {isWarehousesPage && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 shrink-0">
                <Clock className="w-3 h-11 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{warehouseStats.pending} Pending</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 shrink-0">
                <CheckCircle className="w-3 h-11 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">{warehouseStats.active} Active</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 shrink-0">
                <XCircle className="w-3 h-11 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700">{warehouseStats.rejected} Rejected</span>
              </div>
            </div>
          )}

          {/* Mobile stats — agents */}
          {isAgentsPage && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 shrink-0">
                <Clock className="w-3 h-11 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{agentStats.pending} Pending</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 shrink-0">
                <UserCheck className="w-3 h-11 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">{agentStats.approved} Approved</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 shrink-0">
                <XCircle className="w-3 h-11 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700">{agentStats.rejected} Rejected</span>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandingProvider>
      <SuperAdminInner>{children}
      <Toaster />
      </SuperAdminInner>
    </BrandingProvider>
  );
}