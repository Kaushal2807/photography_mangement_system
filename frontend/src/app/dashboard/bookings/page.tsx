"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBookings,
  useCreateBooking,
  useDeleteBooking,
  useUpdateBooking,
  useUpdateBookingStatus,
} from "@/hooks/useBookings";
import { Booking, BookingStatus } from "@/types/booking";

// Status Badges design
const statusBadgeStyles: Record<BookingStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium",
  ongoing: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium",
  pending: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-medium",
};

export default function BookingListPage() {
  // State for query params
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("eventDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // TanStack Query
  const { data, isLoading, isError, error, refetch, isFetching } = useBookings({
    page,
    limit,
    search: search.trim(),
    status: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateBooking();
  const deleteMutation = useDeleteBooking();
  const updateStatusMutation = useUpdateBookingStatus();
  const updateBookingMutation = useUpdateBooking();

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // View modal state
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    mobile: "",
    eventName: "",
    eventDate: "",
    photographerName: "",
    totalAmount: "",
    advanceAmount: "",
    status: "pending" as BookingStatus,
  });
  const [mobileError, setMobileError] = useState("");

  // Delete confirmation modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Open add modal
  const openAddModal = () => {
    setEditingBooking(null);
    setBookingForm({
      clientName: "",
      mobile: "",
      eventName: "",
      eventDate: "",
      photographerName: "",
      totalAmount: "",
      advanceAmount: "",
      status: "pending",
    });
    setMobileError("");
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingForm({
      clientName: booking.clientName,
      mobile: booking.mobile,
      eventName: booking.eventName,
      eventDate: booking.eventDate ? booking.eventDate.split("T")[0] : "",
      photographerName: booking.photographerName ?? "",
      totalAmount: String(booking.totalAmount),
      advanceAmount: String(booking.advanceAmount),
      status: booking.status,
    });
    setMobileError("");
    setIsModalOpen(true);
  };

  const validateMobile = (mobileVal: string) => {
    const digits = mobileVal.replace(/\D/g, "");
    if (!digits) {
      setMobileError("Mobile number is required");
      return false;
    }
    if (digits.length !== 10) {
      setMobileError("Mobile number must be 10 digits");
      return false;
    }
    setMobileError("");
    return true;
  };

  // Submit add/edit form
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMobile(bookingForm.mobile)) {
      return;
    }

    if (!bookingForm.clientName.trim() || !bookingForm.eventName.trim() || !bookingForm.eventDate || bookingForm.totalAmount === "") {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      if (editingBooking) {
        await updateBookingMutation.mutateAsync({
          id: editingBooking.id,
          payload: {
            clientName: bookingForm.clientName.trim(),
            mobile: bookingForm.mobile.trim(),
            eventName: bookingForm.eventName.trim(),
            eventDate: bookingForm.eventDate,
            photographerName: bookingForm.photographerName.trim() || undefined,
            totalAmount: Number(bookingForm.totalAmount) || 0,
            advanceAmount: Number(bookingForm.advanceAmount) || 0,
            status: bookingForm.status,
          },
        });
        showToast("Booking updated successfully", "success");
      } else {
        await createMutation.mutateAsync({
          clientName: bookingForm.clientName.trim(),
          mobile: bookingForm.mobile.trim(),
          eventName: bookingForm.eventName.trim(),
          eventDate: bookingForm.eventDate,
          photographerName: bookingForm.photographerName.trim() || undefined,
          totalAmount: Number(bookingForm.totalAmount) || 0,
          advanceAmount: Number(bookingForm.advanceAmount) || 0,
          status: bookingForm.status,
        });
        showToast("Booking created successfully", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save booking",
        "error"
      );
    }
  };

  // Change booking status
  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        payload: { status: newStatus },
      });
      showToast(`Booking status updated to ${newStatus}`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update status",
        "error"
      );
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      showToast("Booking deleted successfully", "success");
      setDeleteId(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete booking",
        "error"
      );
    }
  };

  // CSV Export feature
  const exportToCSV = () => {
    if (!data?.data || data.data.length === 0) {
      showToast("No bookings available to export", "error");
      return;
    }

    const headers = [
      "Booking ID",
      "Client Name",
      "Mobile",
      "Event Name",
      "Event Date",
      "Photographer",
      "Total Amount",
      "Advance Amount",
      "Balance Amount",
      "Status",
    ];

    const rows = data.data.map((b) => [
      `"${b.bookingNumber}"`,
      `"${b.clientName}"`,
      `"${b.mobile}"`,
      `"${b.eventName}"`,
      `"${new Date(b.eventDate).toLocaleDateString()}"`,
      `"${b.photographerName || "-"}"`,
      b.totalAmount,
      b.advanceAmount,
      b.balanceAmount,
      `"${b.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Bookings exported to CSV", "success");
  };

  // Stats summary calculation
  const stats = useMemo(() => {
    const bookings = data?.data || [];
    return {
      total: data?.pagination?.total || 0,
      pending: bookings.filter((b) => b.status === "pending").length,
      ongoing: bookings.filter((b) => b.status === "ongoing").length,
      completed: bookings.filter((b) => b.status === "completed").length,
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">
            Booking Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Booking List</h1>
          <p className="mt-1 text-sm text-slate-500">
            View, filter, track payment status, and manage all confirmed photography bookings.
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
            Add Booking
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: Calendar, color: "text-sky-600 bg-sky-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-rose-600 bg-rose-50" },
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

      {/* Main Content Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-slate-900">Bookings List</CardTitle>
          <CardDescription>
            Search by client name, booking number, mobile, or event name.
          </CardDescription>

          {/* TOP TOOLBAR: Search (Left), Status Filter (Center), Sort (Right) */}
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left: Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search booking..."
              />
            </div>

            {/* Center: Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "ongoing", label: "Ongoing" },
                { id: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.id}
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

            {/* Right: Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [b, o] = e.target.value.split("-");
                  setSortBy(b);
                  setSortOrder(o as "asc" | "desc");
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="eventDate-desc">Date (Newest First)</option>
                <option value="eventDate-asc">Date (Oldest First)</option>
                <option value="totalAmount-desc">Amount (High to Low)</option>
                <option value="totalAmount-asc">Amount (Low to High)</option>
                <option value="clientName-asc">Client Name (A-Z)</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Error Banner */}
          {isError ? (
            <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error?.message || "Failed to load bookings. Please check your connection."}
            </div>
          ) : null}

          {/* BOOKING TABLE */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Booking ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Client Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Event Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Photographer</TableHead>
                  <TableHead className="font-semibold text-slate-700">Total Amount</TableHead>
                  <TableHead className="font-semibold text-slate-700">Advance Amount</TableHead>
                  <TableHead className="font-semibold text-slate-700">Balance Amount</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* LOADING SKELETON */}
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell><div className="h-4 w-20 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-4 w-28 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-4 w-24 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-4 w-24 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-4 w-16 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-4 w-16 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-4 w-16 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="h-6 w-20 rounded bg-slate-200" /></TableCell>
                      <TableCell><div className="ml-auto h-8 w-16 rounded bg-slate-200" /></TableCell>
                    </TableRow>
                  ))
                ) : !data?.data || data.data.length === 0 ? (
                  /* EMPTY STATE */
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No bookings found</h3>
                        <p className="max-w-sm text-sm text-slate-500">
                          We couldn&apos;t find any bookings matching your current filter criteria.
                        </p>
                        <Button
                          type="button"
                          onClick={openAddModal}
                          className="mt-2 inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
                        >
                          <Plus className="mr-2 size-4" />
                          Create Booking
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  /* TABLE ROWS */
                  data.data.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Booking ID & Event Name */}
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded">
                          {booking.bookingNumber}
                        </span>
                        <div className="mt-1 text-xs font-medium text-slate-700">
                          {booking.eventName}
                        </div>
                      </TableCell>

                      {/* Client Name & Mobile */}
                      <TableCell>
                        <div className="font-medium text-slate-900">{booking.clientName}</div>
                        <div className="text-xs text-slate-500">{booking.mobile}</div>
                      </TableCell>

                      {/* Event Date */}
                      <TableCell>
                        <div className="text-slate-900 font-medium">
                          {new Date(booking.eventDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </TableCell>

                      {/* Photographer */}
                      <TableCell className="text-slate-700">
                        {booking.photographerName || (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="font-semibold text-slate-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </TableCell>

                      {/* Advance Amount */}
                      <TableCell className="text-slate-600">
                        ₹{booking.advanceAmount.toLocaleString()}
                      </TableCell>

                      {/* Balance Amount */}
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            booking.balanceAmount > 0
                              ? "text-rose-600"
                              : "text-emerald-600"
                          }`}
                        >
                          ₹{booking.balanceAmount.toLocaleString()}
                        </span>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${statusBadgeStyles[booking.status]}`}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewBooking(booking)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(booking)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteId(booking.id)}
                          >
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

          {/* PAGINATION CONTROLS */}
          {data?.pagination && data.pagination.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row">
              <div className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {(page - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(page * limit, data.pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {data.pagination.total}
                </span>{" "}
                bookings
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* VIEW BOOKING DIALOG */}
      <Dialog open={Boolean(viewBooking)} onOpenChange={() => setViewBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Booking Details</DialogTitle>
            <DialogDescription>
              {viewBooking?.bookingNumber} - {viewBooking?.eventName}
            </DialogDescription>
          </DialogHeader>

          {viewBooking && (
            <div className="flex flex-col gap-4 py-2 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-400">Client Name</p>
                  <p className="font-semibold text-slate-900">{viewBooking.clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mobile</p>
                  <p className="font-semibold text-slate-900">{viewBooking.mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Event Date</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(viewBooking.eventDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Photographer</p>
                  <p className="font-semibold text-slate-900">
                    {viewBooking.photographerName || "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-bold text-slate-900">₹{viewBooking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Advance Paid:</span>
                  <span className="font-medium text-emerald-600">₹{viewBooking.advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-medium">Balance Due:</span>
                  <span className="font-bold text-rose-600">₹{viewBooking.balanceAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Current Status:</span>
                <Badge className={`capitalize ${statusBadgeStyles[viewBooking.status]}`}>
                  {viewBooking.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBooking(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT BOOKING DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {editingBooking ? "Edit Booking" : "Create New Booking"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {editingBooking
                ? `Update booking details for ${editingBooking.bookingNumber}.`
                : "Enter client details, event date, assigned photographer, and payment breakdown."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Client Name *</label>
                <Input
                  required
                  value={bookingForm.clientName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, clientName: e.target.value })
                  }
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Mobile Number *</label>
                <Input
                  required
                  value={bookingForm.mobile}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setBookingForm({ ...bookingForm, mobile: cleaned });
                    if (cleaned.length === 10) {
                      setMobileError("");
                    } else if (cleaned.length > 0) {
                      setMobileError("Mobile number must be 10 digits");
                    }
                  }}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className={`mt-1 ${mobileError ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {mobileError && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{mobileError}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Event Name *</label>
                <Input
                  required
                  value={bookingForm.eventName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, eventName: e.target.value })
                  }
                  placeholder="e.g. Wedding Ceremony"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Event Date *</label>
                <Input
                  type="date"
                  required
                  value={bookingForm.eventDate}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, eventDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Photographer</label>
                <Input
                  value={bookingForm.photographerName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, photographerName: e.target.value })
                  }
                  placeholder="e.g. Amit Kumar"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Total Amount (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  required
                  placeholder="50000"
                  value={bookingForm.totalAmount}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, totalAmount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Advance Paid (₹)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="15000"
                  value={bookingForm.advanceAmount}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, advanceAmount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Status</label>
                <select
                  value={bookingForm.status}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      status: e.target.value as BookingStatus,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="pending">pending</option>
                  <option value="ongoing">ongoing</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            </div>

            {/* Calculated Balance Preview */}
            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-medium text-slate-600">Calculated Balance Amount:</span>
              <span className="text-base font-bold text-slate-900">
                ₹{Math.max(0, (Number(bookingForm.totalAmount) || 0) - (Number(bookingForm.advanceAmount) || 0)).toLocaleString()}
              </span>
            </div>

            <DialogFooter className="mt-4 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-sky-500 text-white hover:bg-sky-600"
                disabled={createMutation.isPending || updateBookingMutation.isPending}
              >
                {createMutation.isPending || updateBookingMutation.isPending
                  ? "Saving..."
                  : editingBooking
                  ? "Save Changes"
                  : "Save Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${
              toast.type === "success"
                ? "bg-slate-900 text-emerald-400 border border-emerald-500/20"
                : "bg-slate-900 text-rose-400 border border-rose-500/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-400" />
            ) : (
              <XCircle className="size-4 text-rose-400" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
