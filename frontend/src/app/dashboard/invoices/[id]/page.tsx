"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InvoicePreviewDocument } from "@/components/invoice/InvoicePreviewDocument";
import { formatCurrency, invoiceStatusStyles } from "@/components/invoice/invoice-utils";
import { useInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import type { AlbumDetailItem, ServiceItem } from "@/types/invoice";
import axiosInstance from "@/lib/axios";

const DEFAULT_SERVICES: ServiceItem[] = [
  { itemNo: 1, description: "TRADITIONAL PHOTO", days: "02" },
  { itemNo: 2, description: "TRADITIONAL VIDEO", days: "02" },
  { itemNo: 3, description: "CANDID PHOTO", days: "02" },
  { itemNo: 4, description: "CINEMATIC VIDEO", days: "02" },
  { itemNo: 5, description: "DRONE", days: "02" },
];

const DEFAULT_ALBUM_DETAILS: AlbumDetailItem[] = [
  { itemNo: 1, description: "12X36 ALBUM", qnt: "300PC", finish: "MAT" },
  { itemNo: 2, description: "MINI BOOK", qnt: "01", finish: "GLOSSY" },
  { itemNo: 3, description: "CALENDAR", qnt: "01", finish: "WALL" },
  { itemNo: 4, description: "BAG", qnt: "01", finish: "PHOTO" },
  { itemNo: 5, description: "FRAME 12X18", qnt: "01", finish: "MAT" },
  { itemNo: 6, description: "ACRYLIC FRAME", qnt: "01", finish: "GLASS" },
  { itemNo: 7, description: "PENDRIVE + BOX", qnt: "01", finish: "BOX" },
];

const invoiceUpdateSchema = z.object({
  weddingDates: z.string().optional(),
  clientAddress: z.string().optional(),
  discount: z.number().min(0),
  tax: z.number().min(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type InvoiceUpdateValues = z.infer<typeof invoiceUpdateSchema>;

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [albumDetails, setAlbumDetails] = useState<AlbumDetailItem[]>(DEFAULT_ALBUM_DETAILS);

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
      terms: "",
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
      terms: invoice.terms ?? studio?.invoiceTerms ?? "",
    });

    if (invoice.servicesJson) {
      try {
        setServices(JSON.parse(invoice.servicesJson));
      } catch {
        setServices(DEFAULT_SERVICES);
      }
    } else {
      setServices(DEFAULT_SERVICES);
    }

    if (invoice.albumDetailsJson) {
      try {
        setAlbumDetails(JSON.parse(invoice.albumDetailsJson));
      } catch {
        setAlbumDetails(DEFAULT_ALBUM_DETAILS);
      }
    } else {
      setAlbumDetails(DEFAULT_ALBUM_DETAILS);
    }
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

  const handleServiceChange = (index: number, field: keyof ServiceItem, value: string) => {
    setServices((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddService = () => {
    setServices((prev) => [
      ...prev,
      { itemNo: prev.length + 1, description: "", days: "01" },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, itemNo: idx + 1 }))
    );
  };

  const handleAlbumDetailChange = (index: number, field: keyof AlbumDetailItem, value: string) => {
    setAlbumDetails((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddAlbumDetail = () => {
    setAlbumDetails((prev) => [
      ...prev,
      { itemNo: prev.length + 1, description: "", qnt: "01", finish: "" },
    ]);
  };

  const handleRemoveAlbumDetail = (index: number) => {
    setAlbumDetails((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, itemNo: idx + 1 }))
    );
  };

  const statusClass = useMemo(() => {
    if (!invoice?.bookingStatus) return "border-slate-200 bg-slate-50 text-slate-700";
    return invoiceStatusStyles[invoice.bookingStatus] ?? "border-slate-200 bg-slate-50 text-slate-700";
  }, [invoice?.bookingStatus]);

  const grandTotal = useMemo(() => invoice?.grandTotal ?? 0, [invoice]);

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
          terms: values.terms?.trim() || undefined,
          servicesJson: JSON.stringify(services),
          albumDetailsJson: JSON.stringify(albumDetails),
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

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">2. Coverage Services</h4>
                    <p className="text-xs text-slate-500">Edit service descriptions and days</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddService}
                    className="h-7 border-sky-200 text-xs text-sky-600 hover:bg-sky-50"
                  >
                    <Plus className="mr-1 size-3" />
                    Add Service
                  </Button>
                </div>
                <div className="space-y-2.5">
                  {services.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-xs font-semibold text-slate-400">{idx + 1}.</span>
                      <Input
                        className="flex-1 text-xs uppercase"
                        value={service.description}
                        onChange={(e) => handleServiceChange(idx, "description", e.target.value)}
                        placeholder="Description"
                      />
                      <Input
                        className="w-20 text-center text-xs"
                        value={service.days}
                        onChange={(e) => handleServiceChange(idx, "days", e.target.value)}
                        placeholder="Days"
                      />
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleRemoveService(idx)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">3. Album Deliverables</h4>
                    <p className="text-xs text-slate-500">Edit album deliverable details</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAlbumDetail}
                    className="h-7 border-sky-200 text-xs text-sky-600 hover:bg-sky-50"
                  >
                    <Plus className="mr-1 size-3" />
                    Add Deliverable
                  </Button>
                </div>
                <div className="space-y-2.5">
                  {albumDetails.map((album, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-xs font-semibold text-slate-400">{idx + 1}.</span>
                      <Input
                        className="flex-1 text-xs uppercase"
                        value={album.description}
                        onChange={(e) => handleAlbumDetailChange(idx, "description", e.target.value)}
                        placeholder="Description"
                      />
                      <Input
                        className="w-20 text-xs"
                        value={album.qnt}
                        onChange={(e) => handleAlbumDetailChange(idx, "qnt", e.target.value)}
                        placeholder="Qnt"
                      />
                      <Input
                        className="w-24 text-xs uppercase"
                        value={album.finish}
                        onChange={(e) => handleAlbumDetailChange(idx, "finish", e.target.value)}
                        placeholder="Amount"
                      />
                      {albumDetails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleRemoveAlbumDetail(idx)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Notes</label>
                <Textarea {...form.register("notes")} className="mt-1 min-h-24" placeholder="Payment instructions, reminders, or internal notes" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Terms & Conditions</label>
                <Textarea {...form.register("terms")} className="mt-1 min-h-24" placeholder="Terms and conditions for this invoice" />
              </div>
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
