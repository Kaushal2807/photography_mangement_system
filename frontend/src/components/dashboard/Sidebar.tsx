'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  PenTool,
  FileText,
  Settings,
  LogOut,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSidebar } from '@/context/SidebarContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meetings', href: '/dashboard/meetings', icon: Users },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Editing', href: '/dashboard/editing', icon: PenTool },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const { studioSettings, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const currentPath = pathname;

  return (
    <div
      className={`relative flex h-screen flex-col bg-[#0f172a] text-white transition-all duration-300 ease-in-out print:hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className={`flex h-20 shrink-0 items-center justify-between px-5`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
            <Camera size={20} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold leading-tight tracking-wide text-white">
                {studioSettings?.studioName || 'Studio Name'}
              </span>
              <span className="text-[0.65rem] uppercase tracking-wider text-slate-400">
                Management
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const current =
              currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  current
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    current ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            onClick={logout}
            title={isCollapsed ? 'Logout' : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="shrink-0 text-slate-400 group-hover:text-slate-200" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
