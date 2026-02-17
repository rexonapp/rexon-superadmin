"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Settings, LogOut, Bell, Search, Building2, User2Icon, UserCheck, Menu, Warehouse, User, PanelLeftClose, PanelLeft } from 'lucide-react';
import Loading from './loading';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const menuItems = [
  { id: 'home', label: 'Dashboard', icon: Home, path: '/superadmin/home' },
  { id: 'users', label: 'Users', icon: Users, path: '/superadmin/users' },
  { id: 'agents', label: 'Agents', icon: UserCheck, path: '/superadmin/agents' },
  { id: 'warehouses', label: 'Warehouses', icon: Building2, path: '/superadmin/warehouses' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/superadmin/settings' },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getActiveTab = () => {
    const item = menuItems.find(item => pathname?.startsWith(item.path));
    return item?.label || 'Dashboard';
  };

  if (!user) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
      {/* Backdrop overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-500 ease-in-out ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-0'
        }`}
      >
        <div className="h-full relative">
          {/* Glassmorphism background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95 backdrop-blur-2xl border-r border-white/40 shadow-2xl" />

          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-cyan-500/5 to-sky-500/5 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative h-full flex flex-col">
            {/* Logo Section */}
            <div className="p-6 relative">
              <div className="flex items-center justify-between">
                {sidebarOpen ? (
                  <div className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600 flex items-center justify-center shadow-lg transition-all">
                        <User2Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
                        WarehouseOS
                      </h1>
                      <p className="text-xs font-medium text-blue-600/70">Super Admin Panel</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative group mx-auto">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600 flex items-center justify-center shadow-lg transition-all">
                      <User2Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Button */}
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-6 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm border border-blue-200/50 shadow-md hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 z-50"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-blue-600" />
                ) : (
                  <PanelLeft className="w-4 h-4 text-blue-600" />
                )}
              </Button>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.path);
                return (
                  <Button
                    key={item.id}
                    onClick={() => router.push(item.path)}
                    variant="ghost"
                    className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700'
                    } ${!sidebarOpen && 'justify-center px-0'}`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'} transition-colors relative z-10`} />
                    {sidebarOpen && (
                      <span className="font-semibold relative z-10">{item.label}</span>
                    )}
                  </Button>
                );
              })}
            </nav>

            <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

            {/* User Profile */}
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-auto p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 group ${
                      !sidebarOpen && 'justify-center px-2'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10 relative ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-sm font-bold">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {sidebarOpen && (
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-blue-600/70 truncate font-medium">{user.role?.toUpperCase()}</p>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-blue-200 shadow-xl">
                  <DropdownMenuItem onClick={() => router.push('/superadmin/settings')} className="cursor-pointer hover:bg-blue-50">
                    <Settings className="w-4 h-4 mr-2 text-blue-600" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-blue-100" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-500 ease-in-out ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/80 border-b border-white/40 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
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
                    {getActiveTab()}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5 font-medium">Manage your warehouse operations</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Go to Warehouse Button */}
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="hidden md:flex items-center gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all group"
                >
                  <Warehouse className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Go to Warehouse</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">/</Badge>
                </Button>

                {/* Search */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 w-48 lg:w-64 bg-white/50 border-blue-200 focus:border-blue-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Notifications */}
                <Button variant="outline" size="icon" className="relative border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all">
                  <Bell className="w-4 h-4 text-gray-700" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center shadow-lg font-bold animate-pulse">
                    3
                  </span>
                </Button>

                {/* Profile Avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-blue-50 transition-all group">
                      <Avatar className="w-9 h-9 relative ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-sm font-bold">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 border-blue-200 shadow-xl">
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
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs mt-1">
                            {user.role?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => router.push('/')} className="cursor-pointer hover:bg-blue-50 mt-1">
                      <Warehouse className="w-4 h-4 mr-2 text-blue-600" />
                      <span>Go to Warehouse</span>
                      <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs">/</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/superadmin/settings')} className="cursor-pointer hover:bg-blue-50">
                      <Settings className="w-4 h-4 mr-2 text-blue-600" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-blue-100" />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {children}
        </div>
      </main>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-blue-200::-webkit-scrollbar-thumb {
          background-color: rgb(191 219 254);
          border-radius: 3px;
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}