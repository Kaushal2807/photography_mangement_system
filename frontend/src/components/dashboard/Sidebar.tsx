'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  PenTool,
  FileText,
  BarChart,
  Settings,
  LogOut,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meetings', href: '/dashboard/meetings', icon: Users },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Editing', href: '/dashboard/editing', icon: PenTool },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const { studioSettings, logout } = useAuth();
  const pathname = usePathname();
  const currentPath = pathname;
  
  return (
    <div className="flex h-screen w-64 flex-col bg-[#0f172a] text-white print:hidden">
      <div className="flex h-20 shrink-0 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
          <Camera size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight tracking-wide text-white">
            {studioSettings?.studioName || 'Studio Name'}
          </span>
          <span className="text-[0.65rem] uppercase tracking-wider text-slate-400">
            Management
          </span>
        </div>
      </div>

      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const current =
              currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  current
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                <Icon size={18} className={current ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
          >
            <LogOut size={18} className="text-slate-500 group-hover:text-slate-300" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
