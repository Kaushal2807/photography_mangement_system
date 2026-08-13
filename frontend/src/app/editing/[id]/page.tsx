import DashboardLayout from "@/app/dashboard/layout";
import EditingEditPage from "@/app/dashboard/editing/[id]/page";

export default function EditingEditDirectPage() {
  return (
    <DashboardLayout>
      <EditingEditPage />
    </DashboardLayout>
  );
}