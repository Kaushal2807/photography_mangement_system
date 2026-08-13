"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, CalendarDays, Users, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Meeting = {
  id: string;
  clientName: string;
  mobile: string;
  email: string | null;
  meetingDate: string;
  meetingTime: string;
  eventType: string;
  photographerName: string | null;
  eventLocation: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled" | "converted";
  createdAt: string;
  updatedAt: string;
};

const statusStyles: Record<Meeting["status"], string> = {
  scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  converted: "bg-amber-500/15 text-amber-300 border-amber-500/20",
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<Meeting[]>("/meetings");
      setMeetings(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, []);

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return meetings;
    }

    return meetings.filter((meeting) => {
      return [
        meeting.clientName,
        meeting.mobile,
        meeting.email ?? "",
        meeting.eventType,
        meeting.photographerName ?? "",
        meeting.eventLocation ?? "",
        meeting.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [meetings, search]);

  // Sheet/form state for Add/Edit
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    mobile: "",
    email: "",
    meetingDate: "",
    meetingTime: "",
    eventType: "",
    photographerName: "",
    eventLocation: "",
    notes: "",
    status: "scheduled",
  });

  // Convert Meeting to Booking state
  const [convertMeeting, setConvertMeeting] = useState<Meeting | null>(null);
  const [convertForm, setConvertForm] = useState({
    clientName: "",
    mobile: "",
    eventName: "",
    eventDate: "",
    photographerName: "",
    totalAmount: "",
    advanceAmount: "",
    status: "pending" as "pending" | "ongoing" | "completed",
  });
  const [convertMobileError, setConvertMobileError] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  function openConvertModal(meeting: Meeting) {
    setConvertMeeting(meeting);
    setConvertForm({
      clientName: meeting.clientName,
      mobile: meeting.mobile.replace(/\D/g, "").slice(0, 10),
      eventName: meeting.eventType,
      eventDate: meeting.meetingDate ? meeting.meetingDate.split("T")[0] : "",
      photographerName: meeting.photographerName ?? "",
      totalAmount: "",
      advanceAmount: "",
      status: "pending",
    });
    setConvertMobileError("");
  }

  async function handleConvertSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!convertMeeting) return;

    const digits = convertForm.mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setConvertMobileError("Mobile number must be 10 digits");
      return;
    }

    if (!convertForm.clientName.trim() || !convertForm.eventName.trim() || !convertForm.eventDate || convertForm.totalAmount === "") {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setIsConverting(true);
      // 1. Create Booking
      await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          clientName: convertForm.clientName.trim(),
          mobile: convertForm.mobile.trim(),
          eventName: convertForm.eventName.trim(),
          eventDate: convertForm.eventDate,
          photographerName: convertForm.photographerName.trim() || undefined,
          totalAmount: Number(convertForm.totalAmount) || 0,
          advanceAmount: Number(convertForm.advanceAmount) || 0,
          status: convertForm.status,
        }),
      });

      // 2. Update Meeting status to converted
      await apiRequest(`/meetings/${convertMeeting.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "converted" }),
      });

      setConvertMeeting(null);
      setSheetOpen(false);
      void loadMeetings();
      showToast("Meeting successfully converted to Booking!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to convert meeting to booking", "error");
    } finally {
      setIsConverting(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm({
      clientName: "",
      mobile: "",
      email: "",
      meetingDate: "",
      meetingTime: "",
      eventType: "",
      photographerName: "",
      eventLocation: "",
      notes: "",
      status: "scheduled",
    });
    setSheetOpen(true);
  }

  function openEdit(meeting: Meeting) {
    setEditingId(meeting.id);
    setForm({
      clientName: meeting.clientName,
      mobile: meeting.mobile,
      email: meeting.email ?? "",
      meetingDate: meeting.meetingDate.split("T")[0],
      meetingTime: meeting.meetingTime,
      eventType: meeting.eventType,
      photographerName: meeting.photographerName ?? "",
      eventLocation: meeting.eventLocation ?? "",
      notes: meeting.notes ?? "",
      status: meeting.status,
    });
    setSheetOpen(true);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    // final validation
    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (form.status === "converted" && editingId) {
      const currentMeeting = meetings.find((m) => m.id === editingId);
      if (currentMeeting) {
        setSheetOpen(false);
        openConvertModal({
          ...currentMeeting,
          clientName: form.clientName,
          mobile: form.mobile,
          eventType: form.eventType,
          meetingDate: form.meetingDate,
          photographerName: form.photographerName,
        });
        return;
      }
    }

    try {
      const payload = { ...form };
      if (editingId) {
        await apiRequest(`/meetings/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(`/meetings`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setSheetOpen(false);
      void loadMeetings();
      showToast("Meeting saved.", "success");
    } catch (err) {
      // show simple alert for now
      const message = err instanceof Error ? err.message : "Unable to save meeting";
      showToast(message, "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this meeting? This action cannot be undone.")) return;
    try {
      await apiRequest(`/meetings/${id}`, { method: "DELETE" });
      void loadMeetings();
      showToast("Meeting deleted.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete meeting", "error");
    }
  }

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validateField(name: string, value: string) {
    let msg = "";
    if (name === "clientName") {
      if (!value.trim()) msg = "Client name is required";
    }
    if (name === "mobile") {
      const digits = value.replace(/\D/g, "");
      if (!digits) msg = "Mobile is required";
      else if (digits.length !== 10) msg = "Mobile number must be 10 digits";
    }
    if (name === "meetingDate") {
      if (!value) msg = "Date is required";
    }
    if (name === "meetingTime") {
      if (!value) msg = "Time is required";
    }
    if (name === "eventType") {
      if (!value.trim()) msg = "Event type is required";
    }
    if (name === "email" && value) {
      // simple email check
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(value)) msg = "Enter a valid email";
    }
    setErrors((prev) => ({ ...prev, [name]: msg }));
    return msg;
  }
  function validateAll() {
    const validationErrors: Record<string, string> = {};
    ["clientName", "mobile", "meetingDate", "meetingTime", "eventType", "email"].forEach((k) => {
      const v = (form as any)[k] ?? "";
      const m = validateField(k, v);
      if (m) validationErrors[k] = m;
    });
    return validationErrors;
  }

  const summary = useMemo(() => {
    return {
      total: meetings.length,
      scheduled: meetings.filter((meeting) => meeting.status === "scheduled").length,
      completed: meetings.filter((meeting) => meeting.status === "completed").length,
      cancelled: meetings.filter((meeting) => meeting.status === "cancelled").length,
    };
  }, [meetings]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-sky-500">
            Meetings Module
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Meeting List</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track customer inquiries, meeting phases, and conversion status from one place.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => void loadMeetings()}
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button className="bg-sky-500 text-white hover:bg-sky-600" onClick={openAdd}>
            <Plus className="mr-2 size-4" />
            Add Meeting
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Meetings", value: summary.total, icon: Users },
          { label: "Scheduled", value: summary.scheduled, icon: CalendarDays },
          { label: "Completed", value: summary.completed, icon: CheckCircle2 },
          { label: "Cancelled", value: summary.cancelled, icon: XCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Icon size={22} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Search & Phase Filters</CardTitle>
          <CardDescription>
            Search by client name, mobile, email, event type, or status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search meetings..."
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Photographer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                      Loading meetings...
                    </TableCell>
                  </TableRow>
                ) : filteredMeetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                      No meetings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeetings.map((meeting) => (
                    <TableRow key={meeting.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="font-medium text-slate-900">{meeting.clientName}</div>
                        <div className="text-xs text-slate-500">ID: {meeting.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-900">{meeting.mobile}</div>
                        <div className="text-xs text-slate-500">{meeting.email ?? "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-900">{new Date(meeting.meetingDate).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">{meeting.meetingTime}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{meeting.eventType}</TableCell>
                      <TableCell className="text-slate-700">{meeting.photographerName ?? "-"}</TableCell>
                      <TableCell className="text-slate-700">{meeting.eventLocation ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[meeting.status]} variant="outline">
                          {meeting.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {meeting.status !== "converted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => openConvertModal(meeting)}
                            >
                              Convert to Booking
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(meeting)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => void handleDelete(meeting.id)}
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
        </CardContent>
      </Card>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="sm:max-w-2xl w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {editingId ? "Edit Meeting" : "Add New Meeting"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {editingId ? "Update meeting details and status." : "Enter client details, date, time, and event info."}
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Client Name *</label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={form.clientName}
                  onChange={(e) => {
                    setForm({ ...form, clientName: e.target.value });
                    validateField("clientName", e.target.value);
                  }}
                  className={`mt-1 ${errors.clientName ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {errors.clientName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.clientName}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                <Input
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm({ ...form, mobile: cleaned });
                    validateField("mobile", cleaned);
                  }}
                  className={`mt-1 ${errors.mobile ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {errors.mobile && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.mobile}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Email</label>
                <Input
                  placeholder="e.g. client@example.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    validateField("email", e.target.value);
                  }}
                  className={`mt-1 ${errors.email ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Meeting Date *</label>
                <Input
                  type="date"
                  value={form.meetingDate}
                  onChange={(e) => {
                    setForm({ ...form, meetingDate: e.target.value });
                    validateField("meetingDate", e.target.value);
                  }}
                  className={`mt-1 ${errors.meetingDate ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {errors.meetingDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.meetingDate}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Meeting Time *</label>
                <Input
                  type="time"
                  value={form.meetingTime}
                  onChange={(e) => {
                    setForm({ ...form, meetingTime: e.target.value });
                    validateField("meetingTime", e.target.value);
                  }}
                  className={`mt-1 ${errors.meetingTime ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {errors.meetingTime && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.meetingTime}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Event Type *</label>
                <Input
                  placeholder="e.g. Wedding Ceremony"
                  value={form.eventType}
                  onChange={(e) => {
                    setForm({ ...form, eventType: e.target.value });
                    validateField("eventType", e.target.value);
                  }}
                  className={`mt-1 ${errors.eventType ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {errors.eventType && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.eventType}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Photographer</label>
                <Input
                  placeholder="e.g. Amit Kumar"
                  value={form.photographerName}
                  onChange={(e) => setForm({ ...form, photographerName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Location</label>
                <Input
                  placeholder="e.g. Grand Palace Hotel"
                  value={form.eventLocation}
                  onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Notes / Details</label>
              <Textarea
                placeholder="Additional notes about client requirements..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 min-h-[70px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
              >
                <option value="scheduled">scheduled</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
                <option value="converted">converted</option>
              </select>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-sky-500 text-white hover:bg-sky-600">
                {editingId ? "Save Changes" : "Create Meeting"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONVERT MEETING TO BOOKING DIALOG */}
      <Dialog open={Boolean(convertMeeting)} onOpenChange={() => setConvertMeeting(null)}>
        <DialogContent className="sm:max-w-2xl w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Convert Meeting to Booking
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Confirm client details, event date, and enter payment breakdown to convert this meeting into an active booking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConvertSubmit} className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Client Name *</label>
                <Input
                  required
                  value={convertForm.clientName}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, clientName: e.target.value })
                  }
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                <Input
                  required
                  value={convertForm.mobile}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setConvertForm({ ...convertForm, mobile: cleaned });
                    if (cleaned.length === 10) setConvertMobileError("");
                    else if (cleaned.length > 0) setConvertMobileError("Mobile number must be 10 digits");
                  }}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className={`mt-1 ${convertMobileError ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                />
                {convertMobileError && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{convertMobileError}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Event Name *</label>
                <Input
                  required
                  value={convertForm.eventName}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, eventName: e.target.value })
                  }
                  placeholder="e.g. Wedding Ceremony"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Event Date *</label>
                <Input
                  type="date"
                  required
                  value={convertForm.eventDate}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, eventDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Photographer</label>
                <Input
                  value={convertForm.photographerName}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, photographerName: e.target.value })
                  }
                  placeholder="e.g. Amit Kumar"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Total Amount (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  required
                  placeholder="50000"
                  value={convertForm.totalAmount}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, totalAmount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Advance Paid (₹)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="15000"
                  value={convertForm.advanceAmount}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, advanceAmount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Booking Status</label>
                <select
                  value={convertForm.status}
                  onChange={(e) =>
                    setConvertForm({
                      ...convertForm,
                      status: e.target.value as any,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
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
                ₹{Math.max(0, (Number(convertForm.totalAmount) || 0) - (Number(convertForm.advanceAmount) || 0)).toLocaleString()}
              </span>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setConvertMeeting(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isConverting}
              >
                {isConverting ? "Converting..." : "Convert & Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-6 z-50">
          <div
            className={`max-w-xs rounded-md px-4 py-3 text-sm shadow-lg ${
              toast.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}