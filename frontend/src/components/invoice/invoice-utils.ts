import type { InvoiceBookingStatus } from "@/types/invoice";

export const invoiceStatusOptions: Array<{ value: InvoiceBookingStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

export const invoiceStatusStyles: Record<InvoiceBookingStatus, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  ongoing: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  pending: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
};

export function formatCurrency(value: number) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
