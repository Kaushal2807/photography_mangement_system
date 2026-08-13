import type { EditingOverallStatus, EditingWorkflowStatus } from "@/types/editing";

export const editingWorkflowOptions: Array<{
  value: EditingWorkflowStatus;
  label: string;
}> = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const editingOverallOptions: Array<{
  value: EditingOverallStatus;
  label: string;
}> = [
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

export const editingWorkflowBadgeStyles: Record<EditingWorkflowStatus, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  pending: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
};

export const editingOverallBadgeStyles: Record<EditingOverallStatus, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  ongoing: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  pending: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
};

export const editingStages = [
  { key: "selectionStatus", label: "Selection" },
  { key: "albumStatus", label: "Album" },
  { key: "videoStatus", label: "Video" },
  { key: "coverStatus", label: "Cover" },
  { key: "pendriveStatus", label: "Pendrive" },
  { key: "handoverStatus", label: "Delivered" },
] as const;

export function formatEditingStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
