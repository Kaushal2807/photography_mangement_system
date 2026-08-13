'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardStatsData } from '@/hooks/useDashboardStats';

type RevenueChartsProps = {
  revenue?: DashboardStatsData['revenue'];
  collection?: DashboardStatsData['collection'];
  isLoading?: boolean;
};

export function RevenueCharts({ revenue, collection, isLoading }: RevenueChartsProps) {
  const revenueData = revenue?.monthlyData?.length
    ? revenue.monthlyData
    : [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
        { name: 'Jul', value: 0 },
      ];

  const collectionData = collection?.monthlyData?.length
    ? collection.monthlyData
    : [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
        { name: 'Jul', value: 0 },
      ];

  const formattedTotalRevenue = isLoading
    ? '...'
    : `₹${(revenue?.totalRevenue ?? 0).toLocaleString('en-IN')}`;

  const formattedTotalCollection = isLoading
    ? '...'
    : `₹${(collection?.totalCollection ?? 0).toLocaleString('en-IN')}`;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Monthly Revenue Chart */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Monthly Revenue</h3>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formattedTotalRevenue}</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payment Collection Chart */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Payment Collection</h3>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formattedTotalCollection}</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collection']}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPayment)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
