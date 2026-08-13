"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEditingProject } from "@/hooks/useEditing";
import { editingOverallBadgeStyles, editingStages, editingWorkflowBadgeStyles } from "@/components/editing/editing-utils";

export default function EditingViewPage() {
  const params = useParams<{ id: string }>();
  const editingId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isLoading, isError, error } = useEditingProject(editingId || "");

  const project = data?.data;

  const completedStages = useMemo(() => {
    if (!project) return 0;
    return editingStages.filter((stage) => project[stage.key] === "completed").length;
  }, [project]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-4 w-72 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Card className="border-rose-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-rose-600">Editing project not found</CardTitle>
            <CardDescription>{error?.message || "We could not load the selected editing project."}</CardDescription>
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

  const progressPercent = Math.round((completedStages / editingStages.length) * 100);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">Editing Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Editing Project Details</h1>
          <p className="mt-1 text-sm text-slate-500">
            View the complete workflow, booking information, editor notes, and delivery progress.
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Booking Card</CardTitle>
            <CardDescription>Core booking and client details linked to this editing project.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs text-slate-500">Booking Number</p><p className="font-semibold text-slate-900">{project.bookingNumber}</p></div>
            <div><p className="text-xs text-slate-500">Event Name</p><p className="font-semibold text-slate-900">{project.eventName}</p></div>
            <div><p className="text-xs text-slate-500">Client Name</p><p className="font-semibold text-slate-900">{project.clientName}</p></div>
            <div><p className="text-xs text-slate-500">Mobile</p><p className="font-semibold text-slate-900">{project.mobile}</p></div>
            <div><p className="text-xs text-slate-500">Assigned Date</p><p className="font-semibold text-slate-900">{new Date(project.assignedDate).toLocaleDateString()}</p></div>
            <div><p className="text-xs text-slate-500">Editor</p><p className="font-semibold text-slate-900">{project.editorName}</p></div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Overall Progress</CardTitle>
            <CardDescription>Project progress across the full editing workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Overall Status</span>
              <Badge variant="outline" className={`capitalize ${editingOverallBadgeStyles[project.overallStatus]}`}>
                {project.overallStatus}
              </Badge>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-slate-500">{progressPercent}% of workflow stages are completed.</p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total Amount</span>
                <span className="font-semibold text-slate-900">₹{project.totalAmount.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Advance Paid</span>
                <span className="font-semibold text-emerald-600">₹{project.advanceAmount.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Balance Due</span>
                <span className="font-semibold text-rose-600">₹{project.balanceAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Workflow Timeline</CardTitle>
          <CardDescription>Visual tracking of each editing step from assignment to delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {editingStages.map((stage) => {
              const status = project[stage.key];
              const completed = status === "completed";
              return (
                <div key={stage.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${completed ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                        {completed ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{stage.label}</p>
                        <p className="text-xs text-slate-500">Current step status</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`capitalize ${editingWorkflowBadgeStyles[status]}`}>
                      {status === "in_progress" ? "In Progress" : status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Remarks</CardTitle>
          <CardDescription>Project notes captured during the editing process.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            {project.remarks || "No remarks added yet."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}