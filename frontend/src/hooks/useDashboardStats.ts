import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export interface DashboardStatsData {
  stats: {
    totalMeetings: number;
    upcomingMeetings: number;
    confirmedBookings: number;
    editingProjects: number;
    pendingPayments: number;
    completedProjects: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyData: { name: string; value: number }[];
  };
  collection: {
    totalCollection: number;
    monthlyData: { name: string; value: number }[];
  };
  activities: {
    title: string;
    description: string;
    time: string;
    dotColor: string;
  }[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStatsData;
}

export function useDashboardStats() {
  return useQuery<DashboardStatsResponse, Error>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await axiosInstance.get<DashboardStatsResponse>('/dashboard/stats');
      return res.data;
    },
    refetchInterval: 10000,
  });
}
