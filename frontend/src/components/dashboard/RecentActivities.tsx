'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStatsData } from '@/hooks/useDashboardStats';

type RecentActivitiesProps = {
  activities?: DashboardStatsData['activities'];
  isLoading?: boolean;
};

export function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  const activityList = activities ?? [];

  return (
    <Card className="h-full border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-base font-semibold text-slate-800">
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading activities...</p>
        ) : activityList.length === 0 ? (
          <p className="text-xs text-slate-400">No recent activities found.</p>
        ) : (
          <div className="relative ml-3 space-y-6 border-l border-slate-200">
            {activityList.map((activity, index) => (
              <div key={index} className="relative pl-6">
                <div
                  className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${activity.dotColor} ring-4 ring-white`}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-800">
                    {activity.title}
                  </span>
                  <span className="text-xs text-slate-500">{activity.description}</span>
                  <span className="text-xs font-medium text-slate-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
