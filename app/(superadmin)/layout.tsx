"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell, Menu, X, Settings, LogOut, Clock, CheckCircle,
  XCircle, UserCheck, Warehouse, Users, Check, Trash2,
} from 'lucide-react';
import Sidebar, { AdminUser } from '@/components/superadmin/sidebar';
import Loading from './loading';
import { BrandingProvider, useBranding } from '@/lib/context/BrandingContext';
import { Toaster } from "@/components/ui/sonner";
import { cn } from '@/lib/utils';
import NotificationContext from '@/lib/context/NotificationContext';


interface WarehouseStats { pending: number; active: number; rejected: number; }
interface AgentStats { pending: number; approved: number; rejected: number; invite: number; }

export interface SuperAdminNotification {
  id: number;
  type: 'new_warehouse' | 'new_agent' | string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_table: string | null;
  is_read: boolean;
  created_at: string;
}


function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}


function NotifIcon({ type }: { type: string }) {
  if (type === 'agent_status_changed') {
    return (
      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
        <UserCheck className="w-4 h-4 text-purple-600" />
      </div>
    );
  }
  if (type === 'new_warehouse') {
    return (
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Warehouse className="w-4 h-4 text-blue-600" />
      </div>
    );
  }
  if (type === 'new_agent') {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-emerald-600" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <Bell className="w-4 h-4 text-gray-500" />
    </div>
  );
}


function AllNotificationsModal({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  notifications: SuperAdminNotification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
}) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 flex flex-col overflow-hidden"
        style={{ maxHeight: '80dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">All Notifications</span>
            {unreadCount > 0 && (
              <Badge className="h-5 text-[10px] bg-rose-100 text-rose-600 hover:bg-rose-100 border-0 px-1.5 font-semibold">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div
          className="flex-1 overflow-y-auto divide-y divide-gray-50"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-5 py-3.5 group transition-colors duration-100',
                  !n.is_read ? 'bg-blue-50/70 hover:bg-blue-50' : 'bg-white hover:bg-gray-50'
                )}
              >
                <NotifIcon type={n.type} />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => { if (!n.is_read) onMarkRead(n.id); }}
                >
                  <p className={cn(
                    'text-sm leading-snug',
                    !n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
                  )}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{timeAgo(n.created_at)}</p>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                  {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  <button
                    onClick={() => onDelete(n.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-rose-500 mt-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/40 px-5 py-3 text-center">
          <span className="text-[11px] text-gray-400">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
// ─── Notification Dropdown ────────────────────────────────────────────────────

interface NotifDropdownProps {
  notifications: SuperAdminNotification[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
}

// ─── Notification Dropdown ────────────────────────────────────────────────────

function NotifDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotifDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const PREVIEW_COUNT = 4;
  const preview = notifications.slice(0, PREVIEW_COUNT);
  const hasMore = notifications.length > PREVIEW_COUNT;

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <div className="relative" ref={ref}>
        {/* ── Bell button ── */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100"
          onClick={() => setOpen(p => !p)}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {/* ── Dropdown panel ── */}
        {open && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="h-5 text-[10px] bg-rose-100 text-rose-600 hover:bg-rose-100 border-0 px-1.5 font-semibold">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Preview list — max 4 items */}
            <div className="divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                preview.map(n => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 group transition-colors duration-100',
                      !n.is_read ? 'bg-blue-50/70 hover:bg-blue-50' : 'bg-white hover:bg-gray-50'
                    )}
                  >
                    <NotifIcon type={n.type} />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => { if (!n.is_read) onMarkRead(n.id); }}
                    >
                      <p className={cn(
                        'text-sm leading-snug',
                        !n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                      {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <button
                        onClick={() => onDelete(n.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-rose-500 mt-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer — "See all" if more than 4, else count */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/40">
                {hasMore ? (
                  <button
                    onClick={() => { setOpen(false); setShowAll(true); }}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    See all {notifications.length} notifications
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="px-4 py-2 text-center">
                    <span className="text-[11px] text-gray-400">
                      Showing all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Full notifications modal (rendered outside dropdown) ── */}
      <AllNotificationsModal
        open={showAll}
        onClose={() => setShowAll(false)}
        notifications={notifications}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
        onDelete={onDelete}
      />
    </>
  );
}

// ─── Main inner layout ────────────────────────────────────────────────────────

function SuperAdminInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats>({ pending: 0, active: 0, rejected: 0 });
  const [agentStats, setAgentStats] = useState<AgentStats>({ pending: 0, approved: 0, rejected: 0, invite: 0 });

  // ── Notification state ──
  const [notifications, setNotifications] = useState<SuperAdminNotification[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { companyName, logoUrl } = useBranding();

  const isWarehousesPage = pathname?.startsWith('/properties');
  const isAgentsPage = pathname?.startsWith('/agents');

  // const logoUrl: string | undefined = (user as any)?.avatar_url || undefined;
  const userInitials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '';
  const userFullName = user ? `${user.first_name} ${user.last_name}` : '';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Fetch all notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch { /* silent */ }
  }, []);

  // ── Mark single as read ──
  const handleMarkRead = useCallback(async (id: number) => {
    // Optimistic update first so UI feels instant
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`/api/superadmin/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Roll back on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
    }
  }, []);

  // ── Mark all as read ──
  const handleMarkAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch('/api/superadmin/notifications/read-all', { method: 'PATCH' });
    } catch {
      fetchNotifications(); // re-fetch to restore true state on failure
    }
  }, [fetchNotifications]);

  // ── Delete a notification ──
  const handleDelete = useCallback(async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/superadmin/notifications/${id}`, { method: 'DELETE' });
    } catch {
      fetchNotifications(); // restore if delete failed
    }
  }, [fetchNotifications]);

  // ── Sidebar responsive behaviour ──
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Auth ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser({
            id: data.user.userId,
            username: data.user.username,
            first_name: data.user.firstName,
            last_name: data.user.lastName,
            email: data.user.email,
            role: data.user.role ?? 'user',
            is_active: true,
            avatar_url: data.user.avatarUrl ?? null,
          } as AdminUser);
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  // ── Start polling once user is loaded ──
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchNotifications]);

  // ── Warehouse stats ──
  useEffect(() => {
    if (!isWarehousesPage) return;
    (async () => {
      try {
        const res = await fetch('/api/superadmin/warehouses');
        const data = await res.json();
        if (data.success && data.warehouses) {
          const ws = data.warehouses;
          setWarehouseStats({
            pending: ws.filter((w: { status: string }) => w.status === 'Pending').length,
            active: ws.filter((w: { status: string }) => w.status === 'Active').length,
            rejected: ws.filter((w: { status: string }) => w.status === 'rejected').length,
          });
        }
      } catch { /* silent */ }
    })();
  }, [isWarehousesPage]);

  // ── Agent stats ──
  useEffect(() => {
    if (!isAgentsPage) return;
    (async () => {
      try {
        const res = await fetch('/api/superadmin/agents');
        const data = await res.json();
        if (data.success && data.agents) {
          const as_ = data.agents;
          setAgentStats({
            pending: as_.filter((a: { status: string }) => a.status === 'pending').length,
            approved: as_.filter((a: { status: string }) => a.status === 'approved').length,
            rejected: as_.filter((a: { status: string }) => a.status === 'rejected').length,
            invite: as_.filter((a: { status: string }) => a.status === 'invite').length,
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
        className={cn(
          'flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden',
          'transition-[margin] duration-300 ease-in-out',
          'ml-0', sidebarOpen ? 'lg:ml-72' : 'lg:ml-20',
        )}
      >
        {/* ── Header ── */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 z-20">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">

            {/* Left ── hamburger + mobile logo + stat pills */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost" size="icon"
                className="-ml-1 hover:bg-gray-100 shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>

              {/* Mobile logo */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                  {logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    : <span className="text-white text-[10px] font-bold">{(companyName || 'R')[0].toUpperCase()}</span>
                  }
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate max-w-[120px]">
                  {companyName || 'Rexon'}
                </span>
              </div>

              {/* Warehouse stat pills */}
              {isWarehousesPage && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{warehouseStats.pending} Pending</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                    <CheckCircle className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-sm font-semibold text-emerald-600">{warehouseStats.active} Active</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-3 py-1 rounded-full">
                    <XCircle className="w-2 h-2 bg-rose-500 rounded-full" />
                    <span className="text-sm font-semibold text-rose-600">{warehouseStats.rejected} Rejected</span>
                  </div>
                </div>
              )}

              {/* Agent stat pills */}
              {isAgentsPage && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                   <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{agentStats.pending} Pending</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                    <UserCheck className="w-3.5 h-2 text-emerald-500 rounded-full" />
                    <span className="text-sm font-semibold text-emerald-600">{agentStats.approved} Approved</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-3 py-1 rounded-full">
                    <XCircle className="w-2 h-2 bg-rose-500 rounded-full" />
                    <span className="text-sm font-semibold text-rose-600">{agentStats.rejected} Rejected</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right ── bell + avatar */}
            <div className="flex items-center gap-2 shrink-0">

              {/* ── Notification bell ── */}
              <NotifDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onDelete={handleDelete}
              />

              {/* ── Avatar dropdown ── */}
              <DropdownMenu>
                {/* <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 w-11 h-11 p-0">
                    <Avatar className="w-10 h-10">
                      {logoUrl
                        ? <AvatarImage src={logoUrl} alt={userFullName} className="object-cover" />
                        : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold">
                            {userInitials}
                          </AvatarFallback>
                        )
                      }
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger> */}

                <DropdownMenuContent align="end" className="w-64">
                  {/* User info */}
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        {logoUrl
                          ? <AvatarImage src={logoUrl} alt={userFullName} className="object-cover" />
                          : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-sm">
                              {userInitials}
                            </AvatarFallback>
                          )
                        }
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

          {/* ── Mobile stat pills: warehouses ── */}
          {isWarehousesPage && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1  rounded-full">
                <Clock className="w-3 h-2 text-amber-500 rounded-full" />
                <span className="text-xs font-semibold text-amber-700">{warehouseStats.pending} Pending</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1  rounded-full">
                <CheckCircle className="w-3 h-2 text-emerald-500 rounded-full" />
                <span className="text-xs font-semibold text-emerald-600">{warehouseStats.active} Active</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1  rounded-full">
                <XCircle className="w-3 h-2 text-rose-500 rounded-full" />
                <span className="text-xs font-semibold text-rose-600">{warehouseStats.rejected} Rejected</span>
              </div>
            </div>
          )}

          {/* ── Mobile stat pills: agents ── */}
          {isAgentsPage && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1  rounded-full">
                <Clock className="w-3 h-2 text-amber-500 rounded-full" />
                <span className="text-xs font-semibold text-amber-700">{agentStats.pending} Pending</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1  rounded-full">
                <UserCheck className="w-3 h-2 text-emerald-500 rounded-full" />
                <span className="text-xs font-semibold text-emerald-600">{agentStats.approved} Approved</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1  rounded-full">
                <XCircle className="w-3 h-2 text-rose-400 rounded-full" />
                <span className="text-xs font-semibold text-rose-600">{agentStats.rejected} Rejected</span>
              </div>
            </div>
          )}
        </header>

        {/* ── Page content ── */}
        {/* ── Page content ── */}
        <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
          <NotificationContext.Provider value={{ refetchNotifications: fetchNotifications }}>
            {children}
          </NotificationContext.Provider>
        </div>
      </main>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandingProvider>
      <SuperAdminInner>
        {children}
        <Toaster />
      </SuperAdminInner>
    </BrandingProvider>
  );
}