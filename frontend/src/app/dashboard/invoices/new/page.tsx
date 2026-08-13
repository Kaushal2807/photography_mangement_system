"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBookings } from "@/hooks/useBookings";
import { useCreateInvoice, useInvoiceBookingContext } from "@/hooks/useInvoices";
import { formatCurrency } from "@/components/invoice/invoice-utils";
import type { AlbumDetailItem, ServiceItem } from "@/types/invoice";

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

const invoiceSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  weddingDates: z.string().optional(),
  clientAddress: z.string().optional(),
  discount: z.number().min(0),
  tax: z.number().min(0),
  notes: z.string().optional(),
  advance: z.number().min(0).optional(),
  weddingDay: z.number().min(0).optional(),
  handoverDay: z.number().min(0).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoiceNewPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [albumDetails, setAlbumDetails] = useState<AlbumDetailItem[]>(DEFAULT_ALBUM_DETAILS);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      bookingId: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      weddingDates: "",
      clientAddress: "",
      discount: 0,
      tax: 0,
      notes: "",
      advance: 0,
      weddingDay: 0,
      handoverDay: 0,
    },
  });

  const bookingId = form.watch("bookingId");

  const { data: bookingData, isLoading: bookingsLoading } = useBookings({
    page: 1,
    limit: 1000,
  });
  const { data: bookingContextData } = useInvoiceBookingContext(bookingId);

  const createInvoiceMutation = useCreateInvoice();
  const discount = Number(form.watch("discount") || 0);
  const tax = Number(form.watch("tax") || 0);

  const selectedBooking = useMemo(
    () => bookingData?.data.find((booking) => booking.id === bookingId) ?? null,
    [bookingData, bookingId]
  );

  const bookingContext = bookingContextData?.data;

  const contextServices = useMemo<ServiceItem[]>(() => {
    if (!bookingContext?.defaults.servicesJson) return DEFAULT_SERVICES;
    try {
      return JSON.parse(bookingContext.defaults.servicesJson) as ServiceItem[];
    } catch {
      return DEFAULT_SERVICES;
    }
  }, [bookingContext]);

  const contextAlbumDetails = useMemo<AlbumDetailItem[]>(() => {
    if (!bookingContext?.defaults.albumDetailsJson) return DEFAULT_ALBUM_DETAILS;
    try {
      return JSON.parse(bookingContext.defaults.albumDetailsJson) as AlbumDetailItem[];
    } catch {
      return DEFAULT_ALBUM_DETAILS;
    }
  }, [bookingContext]);

  useEffect(() => {
    if (!bookingId || !selectedBooking) return;

    const invoiceDate = form.getValues("invoiceDate") || new Date().toISOString().split("T")[0];
    form.setValue("invoiceDate", invoiceDate);

    const weddingDates = bookingContext?.defaults.weddingDates
      || (() => {
        const d = new Date(selectedBooking.eventDate);
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
      })();
    form.setValue("weddingDates", weddingDates);
    form.setValue("clientAddress", bookingContext?.defaults.clientAddress || "");

    const parsedPayments = bookingContext?.defaults.paymentTermsJson
      ? (() => {
          try {
            return JSON.parse(bookingContext.defaults.paymentTermsJson) as { advance: number; weddingDay: number; handoverDay: number };
          } catch {
            return null;
          }
        })()
      : null;

    const total = selectedBooking.totalAmount;
    const advance = parsedPayments?.advance ?? selectedBooking.advanceAmount;
    const balance = selectedBooking.balanceAmount || Math.max(0, total - advance);
    const wDay = parsedPayments?.weddingDay ?? Math.round(balance * 0.75);
    const hDay = parsedPayments?.handoverDay ?? Math.max(0, balance - wDay);

    form.setValue("advance", advance);
    form.setValue("weddingDay", wDay);
    form.setValue("handoverDay", hDay);
    setServices(contextServices);
    setAlbumDetails(contextAlbumDetails);
  }, [bookingContext, bookingId, contextAlbumDetails, contextServices, form, selectedBooking]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const subtotal = selectedBooking?.totalAmount ?? 0;
  const grandTotal = Math.max(0, subtotal - discount + tax);

  const onSubmit = async (values: InvoiceFormValues) => {
    if (!selectedBooking) {
      showToast("Please select a booking first", "error");
      return;
    }

    try {
      const paymentTerms = {
        advance: Number(values.advance) || 0,
        weddingDay: Number(values.weddingDay) || 0,
        handoverDay: Number(values.handoverDay) || 0,
      };

      const response = await createInvoiceMutation.mutateAsync({
        bookingId: values.bookingId,
        invoiceDate: values.invoiceDate,
        weddingDates: values.weddingDates?.trim() || undefined,
        clientAddress: values.clientAddress?.trim() || undefined,
        discount: Number(values.discount) || 0,
        tax: Number(values.tax) || 0,
        notes: values.notes?.trim() || undefined,
        servicesJson: JSON.stringify(services),
        albumDetailsJson: JSON.stringify(albumDetails),
        paymentTermsJson: JSON.stringify(paymentTerms),
      });

      showToast("Invoice generated successfully", "success");
      router.push(`/invoice/${response.data.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate invoice", "error");
    }
  };

  const bookingOptions = bookingData?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">Invoice Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Generate Professional Invoice</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a high-end 2-page photography invoice with full coverage breakdown & album specifications.
          </p>
        </div>

        <Link href="/invoice">
          <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="mr-2 size-4" />
            Back to List
          </Button>
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">1. Booking & Client Details</CardTitle>
            <CardDescription>Select the booking to auto-populate client and event information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Select Booking *</label>
              <select
                {...form.register("bookingId")}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Select a booking</option>
                {bookingOptions.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingNumber} - {booking.clientName} - {booking.eventName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Invoice Date *</label>
              <Input type="date" className="mt-1" {...form.register("invoiceDate")} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Wedding / Event Dates</label>
              <Input className="mt-1" placeholder="e.g. 27-01-2027 / 28-01-2027" {...form.register("weddingDates")} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Client Name</label>
              <Input className="mt-1 bg-slate-50" value={selectedBooking?.clientName ?? ""} disabled placeholder="Auto-filled from booking" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Client Mobile</label>
              <Input className="mt-1 bg-slate-50" value={selectedBooking?.mobile ?? ""} disabled placeholder="Auto-filled from booking" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Billing Address / Location</label>
              <Input className="mt-1" placeholder="e.g. 7 Rajstambh Society, Vadodara" {...form.register("clientAddress")} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">2. Coverage Services (Page 1 Table)</CardTitle>
                  <CardDescription>Auto-loaded package rows from booking context</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map((service, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-semibold text-slate-400">{idx + 1}.</span>
                  <Input
                    className="flex-1 text-xs uppercase"
                    value={service.description}
                      readOnly
                    placeholder="Description"
                  />
                  <Input
                    className="w-20 text-xs text-center"
                    value={service.days}
                      readOnly
                    placeholder="Days"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">3. Album Deliverables (Page 2 Table)</CardTitle>
                  <CardDescription>Auto-loaded album deliverables from booking context</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {albumDetails.map((album, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-semibold text-slate-400">{idx + 1}.</span>
                  <Input
                    className="flex-1 text-xs uppercase"
                    value={album.description}
                      readOnly
                    placeholder="Description"
                  />
                  <Input
                    className="w-20 text-xs"
                    value={album.qnt}
                      readOnly
                    placeholder="Qnt"
                  />
                  <Input
                    className="w-24 text-xs uppercase"
                    value={album.finish}
                      readOnly
                    placeholder="Finish"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">4. Payment Condition Breakdown</CardTitle>
              <CardDescription>Configure payment stages for Advance, Wedding Day & Handover</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Advance (₹)</label>
                <Input type="number" min="0" className="mt-1" {...form.register("advance", { valueAsNumber: true })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Wedding Day (₹)</label>
                <Input type="number" min="0" className="mt-1" {...form.register("weddingDay", { valueAsNumber: true })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Handover Day (₹)</label>
                <Input type="number" min="0" className="mt-1" {...form.register("handoverDay", { valueAsNumber: true })} />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-600">Invoice Notes</label>
                <Textarea {...form.register("notes")} placeholder="Optional invoice notes or payment instructions" className="mt-1 min-h-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">5. Amount Summary</CardTitle>
              <CardDescription>Subtotal, Discount, Tax & Final Grand Total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Discount (₹)</label>
                  <Input type="number" min="0" className="mt-1" {...form.register("discount", { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tax (₹)</label>
                  <Input type="number" min="0" className="mt-1" {...form.register("tax", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-base">
                <span className="font-semibold text-slate-900">Grand Total</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
              </div>

              {selectedBooking ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Booking selected and ready for invoice generation
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/invoice">
            <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="bg-sky-500 text-white hover:bg-sky-600" disabled={createInvoiceMutation.isPending || bookingsLoading}>
            {createInvoiceMutation.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            {createInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
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