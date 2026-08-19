'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Users as UsersIcon,
  PenTool,
  FileText,
  LoaderCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSidebar } from '@/context/SidebarContext';
import { apiRequest } from '@/lib/api';

interface SearchResultItem {
  id: string;
  type: 'booking' | 'meeting' | 'editing' | 'invoice';
  title: string;
  subtitle: string;
  url: string;
}

export function TopNav() {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        const input = containerRef.current?.querySelector('input');
        input?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch search results
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const items: SearchResultItem[] = [];

      try {
        const [bookingsRes, invoicesRes, editingRes] = await Promise.allSettled([
          apiRequest<{ success: boolean; data: any[] }>(`/bookings?search=${encodeURIComponent(trimmed)}`),
          apiRequest<{ success: boolean; data: any[] }>(`/dashboard/invoices?search=${encodeURIComponent(trimmed)}`),
          apiRequest<{ success: boolean; data: any[] }>(`/editing?search=${encodeURIComponent(trimmed)}`),
        ]);

        if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value?.data)) {
          bookingsRes.value.data.slice(0, 4).forEach((b) => {
            items.push({
              id: `b-${b.id}`,
              type: 'booking',
              title: `${b.clientName || 'Client'} (${b.bookingNumber})`,
              subtitle: `Event: ${b.eventName || 'N/A'} • Total: ₹${b.totalAmount || 0}`,
              url: `/dashboard/bookings`,
            });
          });
        }

        if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value?.data)) {
          invoicesRes.value.data.slice(0, 4).forEach((inv) => {
            items.push({
              id: `inv-${inv.id}`,
              type: 'invoice',
              title: `Invoice #${inv.invoiceNumber}`,
              subtitle: `Client: ${inv.clientName} • Grand Total: ₹${inv.grandTotal}`,
              url: `/invoice/${inv.id}`,
            });
          });
        }

        if (editingRes.status === 'fulfilled' && Array.isArray(editingRes.value?.data)) {
          editingRes.value.data.slice(0, 4).forEach((ed) => {
            items.push({
              id: `ed-${ed.id}`,
              type: 'editing',
              title: `Editing: ${ed.bookingNumber || ed.clientName || 'Project'}`,
              subtitle: `Editor: ${ed.editorName} • Status: ${ed.overallStatus}`,
              url: `/dashboard/editing/${ed.id}`,
            });
          });
        }
      } catch (err) {
        console.error('Search fetch error', err);
      } finally {
        setResults(items);
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  const getIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar className="size-4 text-sky-500" />;
      case 'invoice':
        return <FileText className="size-4 text-emerald-500" />;
      case 'editing':
        return <PenTool className="size-4 text-amber-500" />;
      default:
        return <UsersIcon className="size-4 text-indigo-500" />;
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8 print:hidden">
      {/* Left section: Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">Management Dashboard</h1>
      </div>

      {/* Center/Right: Interactive Global Search */}
      <div className="flex items-center gap-4">
        <div ref={containerRef} className="relative w-64 md:w-80 lg:w-96">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search bookings, invoices, editing... (Ctrl+K)"
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-3 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 md:inline-block">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Live Search Results Dropdown */}
          {isOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                  <LoaderCircle className="size-4 animate-spin text-sky-500" />
                  Searching records...
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.url)}
                      className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-semibold text-slate-900">{item.title}</p>
                        <p className="truncate text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  No matching bookings, invoices, or editing projects found for &quot;{query}&quot;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold uppercase text-xs">
            {user?.name?.charAt(0) || <User size={16} />}
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Admin'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
