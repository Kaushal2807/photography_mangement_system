"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InvoicePreviewDocument } from "@/components/invoice/InvoicePreviewDocument";
import { formatCurrency, invoiceStatusStyles } from "@/components/invoice/invoice-utils";
import { useInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import axiosInstance from "@/lib/axios";

const invoiceUpdateSchema = z.object({
  weddingDates: z.string().optional(),
  clientAddress: z.string().optional(),
  discount: z.number().min(0),
  tax: z.number().min(0),
  notes: z.string().optional(),
});

type InvoiceUpdateValues = z.infer<typeof invoiceUpdateSchema>;

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  // const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data, isLoading, isError, error, refetch } = useInvoice(invoiceId || "");
  const updateInvoiceMutation = useUpdateInvoice();

  const invoice = data?.data.invoice;
  const booking = data?.data.booking;
  const meeting = data?.data.meeting;
  const editing = data?.data.editing;
  const studio = data?.data.studio;

  const form = useForm<InvoiceUpdateValues>({
    resolver: zodResolver(invoiceUpdateSchema),
    defaultValues: {
      weddingDates: "",
      clientAddress: "",
      discount: 0,
      tax: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (!invoice || !booking) return;

    const eventDate = new Date(booking.eventDate);
    const dateStr = `${eventDate.getDate().toString().padStart(2, "0")}-${(eventDate.getMonth() + 1).toString().padStart(2, "0")}-${eventDate.getFullYear()}`;

    form.reset({
      weddingDates: invoice.weddingDates || dateStr,
      clientAddress: invoice.clientAddress || "",
      discount: invoice.discount,
      tax: invoice.tax,
      notes: invoice.notes ?? "",
    });
  }, [booking, form, invoice]);

  useEffect(() => {
    if (searchParams.get("print") === "1") {
      const timer = window.setTimeout(() => window.print(), 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchParams]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const statusClass = useMemo(() => {
    if (!invoice?.bookingStatus) return "border-slate-200 bg-slate-50 text-slate-700";
    return invoiceStatusStyles[invoice.bookingStatus] ?? "border-slate-200 bg-slate-50 text-slate-700";
  }, [invoice?.bookingStatus]);

  const grandTotal = useMemo(() => invoice?.grandTotal ?? 0, [invoice]);

  // Logo upload removed from invoice detail (managed from Settings)

  const onSubmit = async (values: InvoiceUpdateValues) => {
    if (!invoiceId) return;

    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoiceId,
        payload: {
          weddingDates: values.weddingDates?.trim() || undefined,
          clientAddress: values.clientAddress?.trim() || undefined,
          discount: Number(values.discount) || 0,
          tax: Number(values.tax) || 0,
          notes: values.notes?.trim() || undefined,
        },
      });

      showToast("Invoice updated successfully", "success");
      void refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update invoice", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-8 pt-2 print:max-w-none print:px-0">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-4 w-72 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 h-[80vh] animate-pulse rounded-3xl bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !invoice || !booking) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-2">
        <Card className="border-rose-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-rose-600">Invoice not found</CardTitle>
            <CardDescription>{error?.message || "We could not load the selected invoice."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/invoice">
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="mr-2 size-4" />
                Back to List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadPdf = () => {
    // Use the print view so the browser "Save as PDF" matches the on-screen preview
    window.open(`/invoice/${invoice.id}?print=1`, "_blank", "noopener,noreferrer");
  };

  const printInvoice = () => {
    window.open(`/invoice/${invoice.id}?print=1`, "_blank", "noopener,noreferrer");
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const logoSrc = `${apiBase}/invoice/logo/file?t=${Date.now()}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-8 pt-2 print:max-w-none print:px-0">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">Invoice Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Invoice Preview</h1>
          <p className="mt-1 text-sm text-slate-500">
            A print-ready invoice document that follows the studio blueprint and only exposes invoice-specific edits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/invoice">
            <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="mr-2 size-4" />
              Back to List
            </Button>
          </Link>

          {/* Upload Logo, Download PDF, Print removed from invoice detail toolbar - use listing actions and Settings for logo */}
        </div>
      </div>

      <InvoicePreviewDocument
        invoice={invoice}
        booking={booking}
        meeting={meeting ?? null}
        editing={editing ?? null}
        studio={studio ?? null}
        logoSrc={studio?.logoUrl ? logoSrc : undefined}
      />

      <Card className="mx-auto w-full max-w-[210mm] border-slate-200 bg-white shadow-sm print:hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-slate-900">Invoice Adjustments</CardTitle>
              <CardDescription>Only invoice-specific fields remain editable here.</CardDescription>
            </div>
            <Badge variant="outline" className={statusClass}>
              {invoice.bookingStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Invoice Date / Wedding Date</label>
                <Input className="mt-1" placeholder="e.g. 27-01-2027" {...form.register("weddingDates")} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Billing Address</label>
                <Input className="mt-1" placeholder="Invoice billing address" {...form.register("clientAddress")} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Discount (₹)</label>
                <Input type="number" min="0" className="mt-1" {...form.register("discount", { valueAsNumber: true })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Tax (₹)</label>
                <Input type="number" min="0" className="mt-1" {...form.register("tax", { valueAsNumber: true })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Notes</label>
              <Textarea {...form.register("notes")} className="mt-1 min-h-28" placeholder="Payment instructions, reminders, or internal notes" />
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-1">
                <span className="text-xs font-medium text-slate-500">Subtotal</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-1">
                <span className="text-xs font-medium text-slate-500">Grand Total</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-1">
                <span className="text-xs font-medium text-slate-500">Balance Due</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(Math.max(0, booking.balanceAmount || booking.totalAmount - booking.advanceAmount))}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link href="/invoice">
                <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="bg-sky-500 text-white hover:bg-sky-600" disabled={updateInvoiceMutation.isPending}>
                {updateInvoiceMutation.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                {updateInvoiceMutation.isPending ? "Saving..." : "Save Changes & Regenerate PDF"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 print:hidden">
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
