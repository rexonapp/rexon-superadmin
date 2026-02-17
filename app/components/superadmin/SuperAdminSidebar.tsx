'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Settings, 
  Package, 
  Menu, 
  X, 
  LogOut,
  Building2,
  UserCheck,
  Shield
} from 'lucide-react';

interface SuperAdminSidebarProps {
  session: any;
}

export default function SuperAdminSidebar({ session }: SuperAdminSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home, href: '/superadmin' },
    { id: 'users', label: 'Users', icon: Users, href: '/superadmin/users' },
    { id: 'properties', label: 'Properties', icon: Building2, href: '/superadmin/properties' },
    { id: 'agents', label: 'Agents', icon: UserCheck, href: '/superadmin/agents' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/superadmin/settings' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-500 ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        <div className="h-full bg-white/30 backdrop-blur-2xl border-r border-white/20 shadow-2xl">
          {/* Logo Section */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 transition-all duration-300 ${!sidebarOpen && 'lg:opacity-0'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    WarehouseOS
                  </h1>
                  <p className="text-xs text-gray-600">Super Admin</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                      : 'hover:bg-white/50 text-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'} transition-colors`} />
                  <span className={`font-semibold transition-all duration-300 ${
                    !sidebarOpen ? 'lg:opacity-0 lg:w-0' : 'opacity-100'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && sidebarOpen && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-white/20 bg-white/20 transition-all duration-300 ${!sidebarOpen && 'lg:opacity-0'}`}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                {session?.first_name?.[0]}{session?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {session?.first_name} {session?.last_name}
                </p>
                <p className="text-xs text-gray-600 truncate">{session?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}