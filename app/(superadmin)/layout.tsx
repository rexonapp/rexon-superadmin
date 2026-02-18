"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Menu, Warehouse, Settings, LogOut } from 'lucide-react';
import Sidebar, { AdminUser } from '@/components/superadmin/sidebar';
import Loading from './loading';

// ── Nav label helper ──────────────────────────────────────────────────────────
const menuItems = [
  { label: 'Dashboard',  path: '/'           },
  { label: 'Users',      path: '/users'      },
  { label: 'Agents',     path: '/agents'     },
  { label: 'Warehouses', path: '/warehouses' },
  { label: 'Settings',   path: '/settings'   },
];

function getActiveLabel(pathname: string | null): string {
  if (!pathname) return 'Dashboard';
  // Exact match first (for root '/')
  const exact = menuItems.find(i => i.path === pathname);
  if (exact) return exact.label;
  // Prefix match for nested routes
  const prefix = menuItems
    .filter(i => i.path !== '/')
    .find(i => pathname.startsWith(i.path));
  return prefix?.label ?? 'Dashboard';
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser]               = useState<AdminUser | null>(null);
  const pathname                      = usePathname();
  const router                        = useRouter();

  // Fetch the logged-in user from /api/auth/me
  // The session stores: userId, email, firstName, lastName, role (from lib/session.ts)
  // We map those to AdminUser shape here.
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.user) {
          // /api/auth/me returns the JWT payload (SessionData):
          // { userId, email, firstName, lastName, authProvider, role }
          // Map to AdminUser so Sidebar gets the right shape
          setUser({
            id:         data.user.userId,
            username:   data.user.username ,
            first_name: data.user.firstName,
            last_name:  data.user.lastName,
            email:      data.user.email,
            role:       data.user.role ?? 'user',
            is_active:  true,
          });
        } else {
          // No session — middleware should catch this, but redirect as fallback
          router.replace('/login');
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        router.replace('/login');
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Show loading spinner until user session is resolved
  if (!user) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main
        className={`transition-all duration-500 ease-in-out ${
          sidebarOpen ? 'ml-72' : 'ml-20'
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/80 border-b border-white/40 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">

              {/* Left — mobile toggle + page title */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden -ml-2 hover:bg-blue-50"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
                    {getActiveLabel(pathname)}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5 font-medium">
                    Manage your warehouse operations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
               

                {/* Search */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 w-48 lg:w-64 bg-white/50 border-blue-200 focus:border-blue-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Notifications */}
                <Button
                  variant="outline"
                  size="icon"
                  className="relative border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <Bell className="w-4 h-4 text-gray-700" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center shadow-lg font-bold animate-pulse">
                    3
                  </span>
                </Button>

                {/* Profile dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full hover:bg-blue-50 transition-all group"
                    >
                      <Avatar className="w-9 h-9 ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-sm font-bold">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 border-blue-200 shadow-xl">
                    {/* User info panel */}
                    <div className="px-3 py-3 border-b border-blue-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white font-bold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs mt-1">
                            {user.role?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                

                    <DropdownMenuItem
                      onClick={() => router.push('/settings')}
                      className="cursor-pointer hover:bg-blue-50"
                    >
                      <Settings className="w-4 h-4 mr-2 text-blue-600" />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-blue-100" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <div className="p-6">{children}</div>
      </main>

      <style jsx global>{`
        @keyframes shimmer {
          0%   { background-position: -1000px 0; }
          100% { background-position:  1000px 0; }
        }
        .scrollbar-thin::-webkit-scrollbar          { width: 6px; }
        .scrollbar-thumb-blue-200::-webkit-scrollbar-thumb {
          background-color: rgb(191 219 254);
          border-radius: 3px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}