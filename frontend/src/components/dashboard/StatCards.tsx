import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, CheckSquare, PenTool, AlertCircle, CheckCircle2 } from 'lucide-react';

const stats = [
  {
    title: 'Total Meetings',
    value: '120',
    subtitle: 'Total Meetings',
    icon: Users,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Upcoming Meetings',
    value: '34',
    subtitle: 'Upcoming Meetings',
    icon: Calendar,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    title: 'Confirmed Bookings',
    value: '30',
    subtitle: 'Confirmed Bookings',
    icon: CheckSquare,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    title: 'Editing Projects',
    value: '20',
    subtitle: 'Editing Projects',
    icon: PenTool,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Pending Payments',
    value: '0',
    subtitle: 'Pending Payments',
    icon: AlertCircle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Completed Projects',
    value: '20',
    subtitle: 'Completed Projects',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="border-slate-200 bg-white shadow-sm">
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
