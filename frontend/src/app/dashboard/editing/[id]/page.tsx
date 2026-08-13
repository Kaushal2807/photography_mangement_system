"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEditingProject, useUpdateEditingProgress, useUpdateEditingProject } from "@/hooks/useEditing";
import { editingStages, editingWorkflowOptions } from "@/components/editing/editing-utils";

const workflowSchema = z.object({
  editorName: z.string().min(1, "Editor name is required"),
  selectionStatus: z.enum(["pending", "in_progress", "completed"]),
  albumStatus: z.enum(["pending", "in_progress", "completed"]),
  videoStatus: z.enum(["pending", "in_progress", "completed"]),
  coverStatus: z.enum(["pending", "in_progress", "completed"]),
  pendriveStatus: z.enum(["pending", "in_progress", "completed"]),
  handoverStatus: z.enum(["pending", "in_progress", "completed"]),
  remarks: z.string().optional(),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

export default function EditingEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const editingId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, isLoading, isError, error } = useEditingProject(editingId || "");
  const updateProjectMutation = useUpdateEditingProject();
  const updateProgressMutation = useUpdateEditingProgress();

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      editorName: "",
      selectionStatus: "pending",
      albumStatus: "pending",
      videoStatus: "pending",
      coverStatus: "pending",
      pendriveStatus: "pending",
      handoverStatus: "pending",
      remarks: "",
    },
  });

  useEffect(() => {
    if (!data?.data) return;

    form.reset({
      editorName: data.data.editorName,
      selectionStatus: data.data.selectionStatus,
      albumStatus: data.data.albumStatus,
      videoStatus: data.data.videoStatus,
      coverStatus: data.data.coverStatus,
      pendriveStatus: data.data.pendriveStatus,
      handoverStatus: data.data.handoverStatus,
      remarks: data.data.remarks ?? "",
    });
  }, [data, form]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const bookingSummary = data?.data;

  const onSubmit = async (values: WorkflowFormValues) => {
    if (!editingId) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: editingId,
        payload: {
          editorName: values.editorName.trim(),
          remarks: values.remarks?.trim() || undefined,
        },
      });

      await updateProgressMutation.mutateAsync({
        id: editingId,
        payload: {
          selectionStatus: values.selectionStatus,
          albumStatus: values.albumStatus,
          videoStatus: values.videoStatus,
          coverStatus: values.coverStatus,
          pendriveStatus: values.pendriveStatus,
          handoverStatus: values.handoverStatus,
        },
      });

      showToast("Editing project updated successfully", "success");
      router.push("/dashboard/editing");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update editing project", "error");
    }
  };

  const selectedBooking = useMemo(() => bookingSummary?.booking, [bookingSummary]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-4 w-72 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !bookingSummary) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Card className="border-rose-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-rose-600">Editing project not found</CardTitle>
            <CardDescription>
              {error?.message || "We could not load the selected editing project."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/editing"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to List
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">Editing Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit Editing Project</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update the assigned editor, workflow stages, and remarks for this project.
          </p>
        </div>

        <Link
          href="/dashboard/editing"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to List
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Booking Information</CardTitle>
            <CardDescription>Booking details are read-only for an existing editing project.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Booking Number</label>
              <Input className="mt-1 bg-slate-50" value={bookingSummary.bookingNumber} disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Assigned Date</label>
              <Input type="date" className="mt-1 bg-slate-50" value={bookingSummary.assignedDate.split("T")[0]} disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Client Name</label>
              <Input className="mt-1 bg-slate-50" value={bookingSummary.clientName} disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Event Name</label>
              <Input className="mt-1 bg-slate-50" value={bookingSummary.eventName} disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Booking Status</label>
              <Input className="mt-1 bg-slate-50" value={bookingSummary.bookingStatus} disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Editor Name</label>
              <Input className="mt-1 bg-slate-50" value={bookingSummary.editorName} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Editor Information</CardTitle>
            <CardDescription>Update the assigned editor name and notes here.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Editor Name *</label>
              <Input {...form.register("editorName")} placeholder="Enter editor name" className="mt-1" />
              {form.formState.errors.editorName && (
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.editorName.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Overall Status</label>
              <Input className="mt-1 bg-slate-50" value={bookingSummary.overallStatus} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Workflow Status</CardTitle>
            <CardDescription>Change the status of each editing stage.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {editingStages.map((stage) => (
              <div key={stage.key}>
                <label className="text-xs font-semibold text-slate-600">{stage.label}</label>
                <select
                  {...form.register(stage.key)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {editingWorkflowOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Remarks</CardTitle>
            <CardDescription>Add or update notes about the editing progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea {...form.register("remarks")} placeholder="Optional remarks" className="min-h-28" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/editing"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            className="bg-sky-500 text-white hover:bg-sky-600"
            disabled={updateProjectMutation.isPending || updateProgressMutation.isPending}
          >
            {updateProjectMutation.isPending || updateProgressMutation.isPending ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {updateProjectMutation.isPending || updateProgressMutation.isPending
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </div>
      </form>

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