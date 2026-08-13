'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, CheckSquare, PenTool, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DashboardStatsData } from '@/hooks/useDashboardStats';

type StatCardsProps = {
  data?: DashboardStatsData['stats'];
  isLoading?: boolean;
};

export function StatCards({ data, isLoading }: StatCardsProps) {
  const cards = [
    {
      title: 'Total Meetings',
      value: isLoading ? '...' : String(data?.totalMeetings ?? 0),
      subtitle: 'Total Meetings Scheduled',
      icon: Users,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Upcoming Meetings',
      value: isLoading ? '...' : String(data?.upcomingMeetings ?? 0),
      subtitle: 'Meetings Pending/Upcoming',
      icon: Calendar,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      title: 'Confirmed Bookings',
      value: isLoading ? '...' : String(data?.confirmedBookings ?? 0),
      subtitle: 'Completed / Confirmed Bookings',
      icon: CheckSquare,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Editing Projects',
      value: isLoading ? '...' : String(data?.editingProjects ?? 0),
      subtitle: 'Total Editing Projects',
      icon: PenTool,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Pending Payments',
      value: isLoading ? '...' : `₹${(data?.pendingPayments ?? 0).toLocaleString('en-IN')}`,
      subtitle: 'Total Outstanding Balance',
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Completed Projects',
      value: isLoading ? '...' : String(data?.completedProjects ?? 0),
      subtitle: 'Projects Delivered',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500">{stat.title}</span>
                <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
                <span className="text-xs text-slate-400">{stat.subtitle}</span>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                <Icon className={stat.iconColor} size={24} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
