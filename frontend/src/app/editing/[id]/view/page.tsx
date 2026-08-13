import DashboardLayout from "@/app/dashboard/layout";
import EditingViewPage from "@/app/dashboard/editing/[id]/view/page";

export default function EditingViewDirectPage() {
  return (
    <DashboardLayout>
      <EditingViewPage />
    </DashboardLayout>
  );
}