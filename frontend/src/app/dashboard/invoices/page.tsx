"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Eye, Filter, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
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
import { useDeleteInvoice, useInvoices } from "@/hooks/useInvoices";
import axiosInstance from "@/lib/axios";
import { formatCurrency, invoiceStatusOptions, invoiceStatusStyles } from "@/components/invoice/invoice-utils";
import type { InvoiceListItem } from "@/types/invoice";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useInvoices({
    page,
    limit,
    search: search.trim(),
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteMutation = useDeleteInvoice();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const stats = useMemo(() => {
    const invoices = data?.data ?? [];
    return {
      total: data?.pagination.total ?? 0,
      pending: invoices.filter((item) => item.bookingStatus === "pending").length,
      ongoing: invoices.filter((item) => item.bookingStatus === "ongoing").length,
      completed: invoices.filter((item) => item.bookingStatus === "completed").length,
    };
  }, [data]);

  const exportToCSV = () => {
    const invoices = data?.data ?? [];
    if (!invoices.length) {
      showToast("No invoices available to export", "error");
      return;
    }

    const headers = [
      "Invoice Number",
      "Booking Number",
      "Client Name",
      "Invoice Date",
      "Grand Total",
      "Booking Status",
    ];

    const rows = invoices.map((item) => [
      `"${item.invoiceNumber}"`,
      `"${item.bookingNumber}"`,
      `"${item.clientName}"`,
      `"${new Date(item.invoiceDate).toLocaleDateString()}"`,
      item.grandTotal,
      `"${item.bookingStatus}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Invoices exported to CSV", "success");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      showToast("Invoice deleted successfully", "success");
      setDeleteId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete invoice", "error");
    }
  };

  const downloadPdf = async (invoice: InvoiceListItem) => {
    setDownloadingId(invoice.id);
    try {
      const response = await axiosInstance.get(`/invoice/${invoice.id}/pdf`, {
        responseType: "blob",
        params: { ts: Date.now() },
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("PDF downloaded successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to download PDF", "error");
    } finally {
      setDownloadingId(null);
    }
  };



  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">Invoice Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate and manage professional invoices for completed bookings.
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

          <Link href="/dashboard/invoices/new">
            <Button type="button" className="bg-sky-500 text-white hover:bg-sky-600">
              <Plus className="mr-2 size-4" />
              Generate Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Invoices", value: stats.total, icon: CheckCircle2, color: "text-sky-600 bg-sky-50" },
          { label: "Pending", value: stats.pending, icon: Filter, color: "text-rose-600 bg-rose-50" },
          { label: "Ongoing", value: stats.ongoing, icon: RefreshCw, color: "text-amber-600 bg-amber-50" },
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
          <CardTitle className="text-slate-900">Invoice List</CardTitle>
          <CardDescription>Search by invoice number, booking number, or client name.</CardDescription>

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
                placeholder="Search invoice..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {invoiceStatusOptions.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === tab.value
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
              {error?.message || "Failed to load invoices. Please check your connection."}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Invoice Number</TableHead>
                  <TableHead className="font-semibold text-slate-700">Booking Number</TableHead>
                  <TableHead className="font-semibold text-slate-700">Client Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Invoice Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Grand Total</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 rounded bg-slate-200" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.data.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No invoices found</h3>
                        <p className="max-w-sm text-sm text-slate-500">
                          We couldn&apos;t find any invoices matching your current filter criteria.
                        </p>
                        <Link href="/invoice/new">
                          <Button type="button" className="mt-2 bg-sky-500 text-white hover:bg-sky-600">
                            <Plus className="mr-2 size-4" />
                            Generate Invoice
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-sky-600">{invoice.invoiceNumber}</div>
                        <div className="mt-1 text-xs text-slate-500">{invoice.bookingStatus}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{invoice.bookingNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{invoice.clientName}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">{formatCurrency(invoice.grandTotal)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1.5 size-3.5" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={downloadingId === invoice.id}
                            onClick={() => void downloadPdf(invoice)}
                          >
                            <Download className={`mr-1.5 size-3.5 ${downloadingId === invoice.id ? "animate-spin" : ""}`} />
                            {downloadingId === invoice.id ? "Downloading..." : "PDF"}
                          </Button>
                          {/* Print removed - keep View, PDF, Delete */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteId(invoice.id)}
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
                <span className="font-semibold text-slate-900">{data.pagination.total}</span> invoices
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
            <DialogTitle className="text-rose-600">Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
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