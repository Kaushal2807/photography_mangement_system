'use client';

import { StatCards } from '@/components/dashboard/StatCards';
import { RevenueCharts } from '@/components/dashboard/RevenueCharts';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function DashboardPage() {
  const { data: statsResponse, isLoading } = useDashboardStats();
  const dashboardData = statsResponse?.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stats */}
      <StatCards data={dashboardData?.stats} isLoading={isLoading} />

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueCharts
            revenue={dashboardData?.revenue}
            collection={dashboardData?.collection}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentActivities activities={dashboardData?.activities} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
