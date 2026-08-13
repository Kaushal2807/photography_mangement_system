'use client';

import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export function TopNav() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 print:hidden">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search placeholder */}
        <div className="flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
          <Search size={20} />
        </div>

        {/* Notifications */}
        <div className="relative flex cursor-pointer items-center text-slate-400 hover:text-slate-600">
          <Bell size={20} />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold uppercase">
            {user?.name?.charAt(0) || <User size={16} />}
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium text-slate-700 leading-tight">{user?.name || 'Loading...'}</span>
            <span className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
