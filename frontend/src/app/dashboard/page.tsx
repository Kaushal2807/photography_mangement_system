import { StatCards } from '@/components/dashboard/StatCards';
import { RevenueCharts } from '@/components/dashboard/RevenueCharts';
import { RecentActivities } from '@/components/dashboard/RecentActivities';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Stats */}
      <StatCards />

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueCharts />
        </div>
        <div className="lg:col-span-1">
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
