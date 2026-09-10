import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getDashboardStats() {
    const [
      totalMeetings,
      upcomingMeetings,
      confirmedBookings,
      totalEditingProjects,
      completedEditingProjects,
      bookings,
      invoices,
      recentMeetings,
      recentBookings,
      recentEditing,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.meeting.count(),
      this.prisma.meeting.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.editingProject.count(),
      this.prisma.editingProject.count({ where: { overallStatus: 'COMPLETED' } }),
      this.prisma.booking.findMany({
        select: { totalAmount: true, advanceAmount: true, balanceAmount: true, createdAt: true },
      }),
      this.prisma.invoice.findMany({
        select: { grandTotal: true, createdAt: true },
      }),
      this.prisma.meeting.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, clientName: true, eventType: true, createdAt: true },
      }),
      this.prisma.booking.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, clientName: true, eventName: true, createdAt: true },
      }),
      this.prisma.editingProject.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { booking: { select: { clientName: true, eventName: true } } },
      }),
      this.prisma.invoice.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, invoiceNumber: true, grandTotal: true, createdAt: true, booking: { select: { clientName: true } } },
      }),
    ]);

    const pendingPaymentsAmount = bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalCollection = bookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last7Months: { name: string; year: number; month: number; revenue: number; collection: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last7Months.push({
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0,
        collection: 0,
      });
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const item = last7Months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (item) {
        item.revenue += inv.grandTotal || 0;
      }
    });

    bookings.forEach((b) => {
      const d = new Date(b.createdAt);
      const item = last7Months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (item) {
        item.collection += b.advanceAmount || 0;
      }
    });

    const activities: { title: string; description: string; createdAt: Date; dotColor: string }[] = [];

    recentMeetings.forEach((m) => {
      activities.push({
        title: `Meeting Scheduled`,
        description: `${m.clientName} - ${m.eventType}`,
        createdAt: m.createdAt,
        dotColor: 'bg-sky-500',
      });
    });

    recentBookings.forEach((b) => {
      activities.push({
        title: `New Booking Confirmed`,
        description: `${b.clientName} - ${b.eventName}`,
        createdAt: b.createdAt,
        dotColor: 'bg-emerald-500',
      });
    });

    recentEditing.forEach((e) => {
      activities.push({
        title: `Editing Project Created`,
        description: `${e.booking.clientName} (${e.editorName})`,
        createdAt: e.createdAt,
        dotColor: 'bg-orange-500',
      });
    });

    recentInvoices.forEach((inv) => {
      activities.push({
        title: `Invoice #${inv.invoiceNumber} Generated`,
        description: `${inv.booking?.clientName || 'Client'} - ₹${inv.grandTotal}`,
        createdAt: inv.createdAt,
        dotColor: 'bg-amber-500',
      });
    });

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const formatRelativeTime = (date: Date): string => {
      const diffMs = Date.now() - new Date(date).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    };

    return {
      success: true,
      data: {
        stats: {
          totalMeetings,
          upcomingMeetings,
          confirmedBookings,
          editingProjects: totalEditingProjects,
          pendingPayments: pendingPaymentsAmount,
          completedProjects: completedEditingProjects,
        },
        revenue: {
          totalRevenue,
          monthlyData: last7Months.map((m) => ({ name: m.name, value: m.revenue })),
        },
        collection: {
          totalCollection,
          monthlyData: last7Months.map((m) => ({ name: m.name, value: m.collection })),
        },
        activities: activities.slice(0, 5).map((act) => ({
          title: act.title,
          description: act.description,
          time: formatRelativeTime(act.createdAt),
          dotColor: act.dotColor,
        })),
      },
    };
  }
}

