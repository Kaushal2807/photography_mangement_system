"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Eye,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteEditingProject, useEditingProjects, useCreateEditingProject } from "@/hooks/useEditing";
import { useBookings } from "@/hooks/useBookings";
import { editingOverallBadgeStyles, editingStages, editingWorkflowBadgeStyles, editingWorkflowOptions } from "@/components/editing/editing-utils";
import type { EditingProject, EditingOverallStatus, EditingWorkflowStatus } from "@/types/editing";

const overallLabels: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
];

function stageBadgeValue(status: EditingProject["selectionStatus"]) {
  return status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);
}

export default function EditingListPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useEditingProjects({
    page,
    limit,
    search: search.trim(),
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteMutation = useDeleteEditingProject();
  const createMutation = useCreateEditingProject();

  const { data: bookingData } = useBookings({
    page: 1,
    limit: 1000,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    bookingId: "",
    editorName: "",
    assignedDate: new Date().toISOString().split("T")[0],
    selectionStatus: "pending" as EditingWorkflowStatus,
    albumStatus: "pending" as EditingWorkflowStatus,
    videoStatus: "pending" as EditingWorkflowStatus,
    coverStatus: "pending" as EditingWorkflowStatus,
    pendriveStatus: "pending" as EditingWorkflowStatus,
    handoverStatus: "pending" as EditingWorkflowStatus,
    remarks: "",
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  function openAddModal() {
    setAddForm({
      bookingId: "",
      editorName: "",
      assignedDate: new Date().toISOString().split("T")[0],
      selectionStatus: "pending",
      albumStatus: "pending",
      videoStatus: "pending",
      coverStatus: "pending",
      pendriveStatus: "pending",
      handoverStatus: "pending",
      remarks: "",
    });
    setAddErrors({});
    setIsAddOpen(true);
  }

  const selectedBooking = useMemo(
    () => bookingData?.data.find((b) => b.id === addForm.bookingId) ?? null,
    [bookingData, addForm.bookingId]
  );

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!addForm.bookingId) errors.bookingId = "Booking is required";
    if (!addForm.editorName.trim()) errors.editorName = "Editor name is required";

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    try {
      await createMutation.mutateAsync({
        bookingId: addForm.bookingId,
        editorName: addForm.editorName.trim(),
        assignedDate: addForm.assignedDate,
        selectionStatus: addForm.selectionStatus,
        albumStatus: addForm.albumStatus,
        videoStatus: addForm.videoStatus,
        coverStatus: addForm.coverStatus,
        pendriveStatus: addForm.pendriveStatus,
        handoverStatus: addForm.handoverStatus,
        remarks: addForm.remarks.trim() || undefined,
      });

      setIsAddOpen(false);
      showToast("Editing project created successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create editing project", "error");
    }
  }

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const stats = useMemo(() => {
    const projects = data?.data ?? [];
    return {
      total: data?.pagination.total ?? 0,
      pending: projects.filter((item) => item.overallStatus === "pending").length,
      ongoing: projects.filter((item) => item.overallStatus === "ongoing").length,
      completed: projects.filter((item) => item.overallStatus === "completed").length,
    };
  }, [data]);

  const exportToCSV = () => {
    const projects = data?.data ?? [];
    if (!projects.length) {
      showToast("No editing records available to export", "error");
      return;
    }

    const headers = [
      "Booking Number",
      "Client Name",
      "Event Name",
      "Editor",
      "Assigned Date",
      "Selection",
      "Album",
      "Video",
      "Cover",
      "Pendrive",
      "Handover",
      "Overall Status",
    ];

    const rows = projects.map((item) => [
      `"${item.bookingNumber}"`,
      `"${item.clientName}"`,
      `"${item.eventName}"`,
      `"${item.editorName}"`,
      `"${new Date(item.assignedDate).toLocaleDateString()}"`,
      `"${item.selectionStatus}"`,
      `"${item.albumStatus}"`,
      `"${item.videoStatus}"`,
      `"${item.coverStatus}"`,
      `"${item.pendriveStatus}"`,
      `"${item.handoverStatus}"`,
      `"${item.overallStatus}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `editing_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Editing records exported to CSV", "success");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      showToast("Editing project deleted successfully", "success");
      setDeleteId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete editing project", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">
            Editing Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Editing Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track selection, album, video, cover, pendrive, and handover progress after a booking is completed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => void refetch()}
          >
            <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={exportToCSV}
          >
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>

          <Button
            type="button"
            onClick={openAddModal}
            className="bg-sky-500 text-white hover:bg-sky-600"
          >
            <Plus className="mr-2 size-4" />
            Add Editing
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Projects", value: stats.total, icon: CheckCircle2, color: "text-sky-600 bg-sky-50" },
          { label: "Pending", value: stats.pending, icon: Filter, color: "text-rose-600 bg-rose-50" },
          { label: "Ongoing", value: stats.ongoing, icon: LoaderCircle, color: "text-amber-600 bg-amber-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon size={22} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-slate-900">Editing List</CardTitle>
          <CardDescription>
            Search by booking number, client name, editor name, or event name.
          </CardDescription>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search editing project..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {overallLabels.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Show</span>
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isError ? (
            <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error?.message || "Failed to load editing projects. Please check your connection."}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Booking Number</TableHead>
                  <TableHead className="font-semibold text-slate-700">Client Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Event Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Editor</TableHead>
                  <TableHead className="font-semibold text-slate-700">Assigned Date</TableHead>
                  {editingStages.map((stage) => (
                    <TableHead key={stage.key} className="font-semibold text-slate-700">
                      {stage.label}
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-slate-700">Overall Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      {Array.from({ length: 13 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 rounded bg-slate-200" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.data.length ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <LoaderCircle size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No editing projects found</h3>
                        <p className="max-w-sm text-sm text-slate-500">
                          No records match the current search or status filter.
                        </p>
                        <Button
                          type="button"
                          onClick={openAddModal}
                          className="mt-2 bg-sky-500 text-white hover:bg-sky-600"
                        >
                          <Plus className="mr-2 size-4" />
                          Add Editing
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-sky-600">{item.bookingNumber}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.booking.status}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{item.clientName}</div>
                        <div className="text-xs text-slate-500">{item.mobile}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{item.eventName}</TableCell>
                      <TableCell className="text-slate-700">{item.editorName}</TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(item.assignedDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      {editingStages.map((stage) => {
                        const status = item[stage.key];
                        return (
                          <TableCell key={stage.key}>
                            <Badge variant="outline" className={`capitalize ${editingWorkflowBadgeStyles[status]}`}>
                              {stageBadgeValue(status)}
                            </Badge>
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${editingOverallBadgeStyles[item.overallStatus]}`}>
                          {item.overallStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/editing/${item.id}/view`}
                            className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-slate-200 bg-white px-2.5 text-[0.8rem] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="mr-1.5 size-3.5" />
                            View
                          </Link>
                          <Link
                            href={`/dashboard/editing/${item.id}`}
                            className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-slate-200 bg-white px-2.5 text-[0.8rem] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Pencil className="mr-1.5 size-3.5" />
                            Edit
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="mr-1.5 size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data?.pagination ? (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row">
              <div className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-900">{data.data.length ? (page - 1) * limit + 1 : 0}</span> to{" "}
                <span className="font-semibold text-slate-900">{Math.min(page * limit, data.pagination.total)}</span> of{" "}
                <span className="font-semibold text-slate-900">{data.pagination.total}</span> editing projects
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="px-2 text-xs font-medium text-slate-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((value) => Math.min(data.pagination.totalPages, value + 1))}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete Editing Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this editing project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD EDITING PROJECT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-2xl w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Add New Editing Project
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Select a booking and assign the editor responsible for this workflow.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Select Booking *</label>
                <select
                  value={addForm.bookingId}
                  onChange={(e) => {
                    setAddForm({ ...addForm, bookingId: e.target.value });
                    if (e.target.value) setAddErrors((prev) => ({ ...prev, bookingId: "" }));
                  }}
                  className={`mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors ${addErrors.bookingId ? "border-rose-400" : ""}`}
                >
                  <option value="">Select a booking</option>
                  {(bookingData?.data ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} - {b.clientName} ({b.eventName})
                    </option>
                  ))}
                </select>
                {addErrors.bookingId && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{addErrors.bookingId}</p>
                )}
              </div>

              {selectedBooking && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Client Name</label>
                    <Input className="mt-1 bg-slate-50 text-slate-700" value={selectedBooking.clientName} disabled />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Event Name</label>
                    <Input className="mt-1 bg-slate-50 text-slate-700" value={selectedBooking.eventName} disabled />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700">Editor Name *</label>
                <Input
                  required
                  placeholder="e.g. Rahul Editor"
                  value={addForm.editorName}
                  onChange={(e) => {
                    setAddForm({ ...addForm, editorName: e.target.value });
                    if (e.target.value.trim()) setAddErrors((prev) => ({ ...prev, editorName: "" }));
                  }}
                  className={`mt-1 ${addErrors.editorName ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {addErrors.editorName && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{addErrors.editorName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assigned Date</label>
                <Input
                  type="date"
                  value={addForm.assignedDate}
                  onChange={(e) => setAddForm({ ...addForm, assignedDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              {editingStages.map((stage) => (
                <div key={stage.key}>
                  <label className="text-xs font-semibold text-slate-700">{stage.label}</label>
                  <select
                    value={addForm[stage.key]}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        [stage.key]: e.target.value as EditingWorkflowStatus,
                      })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                  >
                    {editingWorkflowOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Remarks / Notes</label>
              <Textarea
                placeholder="Optional notes for editor or studio team..."
                value={addForm.remarks}
                onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                className="mt-1 min-h-[70px]"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-sky-500 text-white hover:bg-sky-600"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Save Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${
              toast.type === "success"
                ? "border border-emerald-500/20 bg-slate-900 text-emerald-400"
                : "border border-rose-500/20 bg-slate-900 text-rose-400"
            }`}
          >
            <CheckCircle2 className="size-4" />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}