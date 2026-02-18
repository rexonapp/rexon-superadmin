
"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Home, Users, Settings, LogOut, Building2,
  UserCheck, User2Icon, PanelLeftClose, PanelLeft,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;         // SERIAL in superadmin_users
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  is_active: boolean;
}

interface SidebarProps {
  user: AdminUser;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const menuItems = [
  { id: 'home',       label: 'Dashboard',  icon: Home,      path: '/'           },
  { id: 'users',      label: 'Users',      icon: Users,     path: '/users'      },
  { id: 'agents',     label: 'Agents',     icon: UserCheck, path: '/agents'     },
  { id: 'warehouses', label: 'Warehouses', icon: Building2, path: '/warehouses' },
  { id: 'settings',   label: 'Settings',   icon: Settings,  path: '/settings'   },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar({ user, sidebarOpen, setSidebarOpen, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 transition-all duration-500 ease-in-out ${
        sidebarOpen ? 'w-72 translate-x-0' : 'w-20 translate-x-0'
      }`}
    >
      <div className="h-full relative">
        {/* Glass background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95 backdrop-blur-2xl border-r border-white/40 shadow-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-cyan-500/5 to-sky-500/5 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative h-full flex flex-col">

          {/* ── Logo ─────────────────────────────────────────────────────────── */}
          <div className="p-6 relative">
            <div className="flex items-center justify-between">
              {sidebarOpen ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600 flex items-center justify-center shadow-lg">
                    <User2Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
                      WarehouseOS
                    </h1>
                    <p className="text-xs font-medium text-blue-600/70">Super Admin Panel</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600 flex items-center justify-center shadow-lg">
                    <User2Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Collapse toggle */}
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-6 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm border border-blue-200/50 shadow-md hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 z-50"
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-4 h-4 text-blue-600" />
                : <PanelLeft      className="w-4 h-4 text-blue-600" />
              }
            </Button>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          {/* ── Nav ──────────────────────────────────────────────────────────── */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            {menuItems.map((item) => {
              const Icon     = item.icon;
              const isActive = item.path === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.path);

              return (
                <Button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  variant="ghost"
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700'
                  } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                    }`}
                  />
                  {sidebarOpen && (
                    <span className="font-semibold relative z-10">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </nav>

          <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          {/* ── User profile ──────────────────────────────────────────────────── */}
          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-auto p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 group ${
                    !sidebarOpen ? 'justify-center px-2' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-sm font-bold">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-blue-600/70 truncate font-medium">
                        {user.role?.toUpperCase()}
                      </p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 border-blue-200 shadow-xl mb-1">
                <div className="px-3 py-2 border-b border-blue-100">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="cursor-pointer hover:bg-blue-50 mt-1"
                >
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-100" />
                <DropdownMenuItem
                  onClick={onLogout}
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
    </aside>
  );
}