"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Home, Users, Settings, LogOut, Building2,
  UserCheck, User2Icon, X,
} from 'lucide-react';
import { useBranding } from '@/lib/context/BrandingContext';

export interface AdminUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  is_active: boolean;
  avatar_url?: string | null;
}

interface SidebarProps {
  user: AdminUser;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'home',       label: 'Dashboard',  icon: Home,      path: '/'           },
  { id: 'admin',      label: 'Admin',      icon: Users,     path: '/admin'      },
  { id: 'agents',     label: 'Agents',     icon: UserCheck, path: '/agents'     },
  { id: 'properties', label: 'Properties', icon: Building2, path: '/properties' },
  { id: 'settings',   label: 'Settings',   icon: Settings,  path: '/settings'   },
];

export default function Sidebar({ user, sidebarOpen, setSidebarOpen, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { companyName, logoUrl } = useBranding();
  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  // Treat empty string / null / undefined all as "no image"
  const userImageUrl: string | undefined = user.avatar_url || undefined;
  const userInitials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
  const userFullName = toTitleCase(`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim());

  const handleNav = (path: string) => {
    router.push(path);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full z-40
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-72
          lg:translate-x-0
          ${sidebarOpen ? 'lg:w-72' : 'lg:w-20'}
        `}
      >
        <div className="h-full relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95 backdrop-blur-2xl border-r border-white/40 shadow-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-teal/8 via-brand-teal/5 to-brand-teal-deep/8 pointer-events-none" />

          <div className="relative h-full flex flex-col">

            {/* ── Brand ── */}
            <div className="p-5 relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shrink-0">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-teal-deep flex items-center justify-center">
                      <User2Icon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100 max-w-xs' : 'lg:opacity-0 lg:max-w-0 opacity-100 max-w-xs'}`}>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-brand-teal-dark via-brand-teal-medium to-brand-teal bg-clip-text text-transparent whitespace-nowrap">
                    {companyName || 'Rexon'}
                  </h1>
                  <p className="text-xs font-medium text-brand-teal-medium whitespace-nowrap">Super Admin Panel</p>
                </div>
              </div>

              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost" size="icon"
                className="lg:hidden w-8 h-8 rounded-lg hover:bg-brand-teal/10 text-gray-500"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-brand-teal/20 to-transparent" />

            {/* ── Nav ── */}
            <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-teal/25 scrollbar-track-transparent">
              {menuItems.map((item) => {
                const Icon     = item.icon;
                const isActive = item.path === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(item.path);

                return (
                  <Button
                    key={item.id}
                    onClick={() => handleNav(item.path)}
                    variant="ghost"
                    className={`
                      w-full h-12 rounded-xl transition-all duration-300 group relative overflow-hidden
                      ${isActive
                        ? 'bg-brand-teal-deep text-white shadow-lg shadow-brand-teal/30 hover:bg-brand-teal-dark hover:shadow-xl hover:shadow-brand-teal/35'
                        : 'text-gray-700 hover:bg-brand-teal/10 hover:text-brand-teal-dark'
                      }
                      justify-start gap-4 px-4
                      ${!sidebarOpen ? 'lg:justify-center lg:px-0' : ''}
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <Icon className={`w-5 h-5 relative z-10 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-brand-teal-medium'}`} />
                    <span className={`font-semibold relative z-10 transition-all duration-300 ${!sidebarOpen ? 'lg:hidden' : ''}`}>
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </nav>

            <Separator className="bg-gradient-to-r from-transparent via-brand-teal/20 to-transparent" />

            {/* ── User profile (bottom of sidebar) ── */}
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`
                      w-full h-auto p-3 rounded-xl hover:bg-brand-teal/10
                      transition-all duration-300 group
                      justify-start gap-3
                      ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}
                    `}
                  >
                    {/*
                      PLACE 1 — Sidebar bottom trigger avatar
                      • Has image  → show image only, no name/role text
                      • No image   → show initials + name/role text (hidden when collapsed)
                    */}
                    <Avatar className="w-10 h-10 ring-2 ring-brand-teal/25 group-hover:ring-brand-teal/50 transition-all shrink-0">
                      {logoUrl ? (
                        <AvatarImage src={logoUrl} alt={userFullName} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-brand-teal-medium to-brand-teal-dark text-white text-sm font-bold">
                          {userInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Name + role: visible only when there is NO profile image */}
                    {!userImageUrl && (
                      <div className={`flex-1 text-left overflow-hidden ${!sidebarOpen ? 'lg:hidden' : ''}`}>
                        <p className="font-semibold text-sm text-gray-900 truncate">{userFullName}</p>
                        <p className="text-xs text-brand-teal-medium truncate font-medium">{user.role?.toUpperCase()}</p>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                {/*
                  PLACE 2 — Sidebar dropdown menu header
                  Always shows avatar + full name + email (dropdown context needs it)
                */}
                <DropdownMenuContent side="top" align="start" className="w-56 border-brand-teal/25 shadow-xl mb-1">
                  <div className="px-3 py-2 border-b border-brand-teal/15 flex items-center gap-2.5">
                    <Avatar className="w-8 h-8 shrink-0">
                      {logoUrl ? (
                        <AvatarImage src={logoUrl} alt={logoUrl} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-brand-teal-medium to-brand-teal-dark text-white text-xs font-bold">
                          {userInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{userFullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => { router.push('/settings'); setSidebarOpen(false); }}
                    className="cursor-pointer hover:bg-brand-teal/10 mt-1"
                  >
                    <Settings className="w-4 h-4 mr-2 text-brand-teal-medium" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-brand-teal/15" />
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
    </>
  );
}