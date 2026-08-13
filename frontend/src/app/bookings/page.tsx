import DashboardLayout from "@/app/dashboard/layout";
import BookingListPage from "@/app/dashboard/bookings/page";

export default function BookingsDirectPage() {
  return (
    <DashboardLayout>
      <BookingListPage />
    </DashboardLayout>
  );
}
