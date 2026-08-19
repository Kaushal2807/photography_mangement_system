"use client";

import type { InvoiceBookingSummary, InvoiceEditingSummary, InvoiceListItem, InvoiceMeetingSummary, InvoiceStudioSummary } from "@/types/invoice";
import { formatCurrency } from "@/components/invoice/invoice-utils";

type InvoicePreviewDocumentProps = {
  invoice: InvoiceListItem;
  booking: InvoiceBookingSummary;
  meeting: InvoiceMeetingSummary | null;
  editing: InvoiceEditingSummary | null;
  studio: InvoiceStudioSummary | null;
  logoSrc?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB");
}

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-slate-500">{title}</h3>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export function InvoicePreviewDocument({ invoice, booking, meeting, editing, studio, logoSrc }: InvoicePreviewDocumentProps) {
  const services = parseJsonArray<{ itemNo: number; description: string; days: string }>(invoice.servicesJson);
  const albumDetails = parseJsonArray<{ itemNo: number; description: string; qnt: string; finish: string }>(invoice.albumDetailsJson);
  const paymentTerms = (() => {
    if (invoice.paymentTermsJson) {
      try {
        return JSON.parse(invoice.paymentTermsJson) as { advance: number; weddingDay: number; handoverDay: number };
      } catch {
        // ignore
      }
    }
    const advance = booking.advanceAmount;
    const balance = booking.balanceAmount || Math.max(0, booking.totalAmount - advance);
    const weddingDay = Math.round(balance * 0.75);
    return { advance, weddingDay, handoverDay: Math.max(0, balance - weddingDay) };
  })();

  const studioName = studio?.studioName || "KANHA PHOTO & FILMS";
  const studioAddress = studio?.address || "Studio address not configured";
  const studioEmail = studio?.email || "studio@email.com";
  const studioPhone = studio?.mobile || "-";
  const gstNumber = studio?.gstNumber || "-";
  const invoiceDate = formatDate(invoice.invoiceDate);
  const eventDate = formatDate(booking.eventDate);
  const meetingDate = meeting ? formatDate(meeting.meetingDate) : null;
  const balanceDue = Math.max(0, booking.balanceAmount || booking.totalAmount - booking.advanceAmount);

  const lineItems = [
    { description: "Photography Package", qty: 1, rate: booking.totalAmount, amount: booking.totalAmount },
    { description: "Album Included", qty: albumDetails.length || 1, rate: 0, amount: 0 },
    { description: "Cinematic Video", qty: services.some((service) => /video/i.test(service.description)) ? 1 : 0, rate: 0, amount: 0 },
    { description: "Drone Coverage", qty: services.some((service) => /drone/i.test(service.description)) ? 1 : 0, rate: 0, amount: 0 },
    { description: "Extra Editing", qty: editing?.overallStatus === "completed" ? 1 : 0, rate: 0, amount: 0 },
    { description: "Additional Charges", qty: 1, rate: 0, amount: 0 },
  ];

  return (
    <section className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] print:max-w-none print:rounded-none print:border-none print:shadow-none">
      <div className="bg-[#0b2545] px-8 py-7 text-white">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 className="mt-2 text-2xl font-black tracking-tight">{studioName}</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">{studioAddress}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-200">
              <span>Phone: {studioPhone}</span>
              <span>Email: {studioEmail}</span>
              <span>GST: {gstNumber}</span>
            </div>
          </div>
          {logoSrc ? (
            <img src={logoSrc} alt={`${studioName} logo`} className="h-14 w-auto shrink-0 object-contain" />
          ) : null}
        </div>
      </div>

      <div className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">INVOICE</h1>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Invoice Number:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-semibold text-slate-900">Invoice Date:</span> {invoiceDate}</p>
              <p><span className="font-semibold text-slate-900">Booking Number:</span> {booking.bookingNumber}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Booking Status</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{booking.status}</p>
            {editing ? <p className="mt-1 text-xs text-slate-500">Editing: {editing.overallStatus}</p> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SectionCard title="Bill To">
            <p className="text-base font-bold uppercase tracking-tight text-slate-900">{booking.clientName}</p>
            <p className="mt-1 text-slate-600">{invoice.clientAddress || booking.mobile}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>Mobile: {booking.mobile}</p>
              {meeting?.email ? <p>Email: {meeting.email}</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Event Details">
            <p><span className="font-semibold text-slate-900">Event Name:</span> {booking.eventName}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Event Date:</span> {eventDate}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Location:</span> {meeting?.eventLocation || "-"}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Photographer:</span> {booking.photographerName || meeting?.photographerName || "-"}</p>
          </SectionCard>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionCard title="Meeting Information">
            <p><span className="font-semibold text-slate-900">Meeting Date:</span> {meetingDate || "-"}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Meeting Time:</span> {meeting?.meetingTime || "-"}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Meeting Notes:</span> {meeting?.notes || "-"}</p>
          </SectionCard>

          <SectionCard title="Editing Information">
            <p><span className="font-semibold text-slate-900">Editor Name:</span> {editing?.editorName || "-"}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Project Status:</span> {editing?.overallStatus || "-"}</p>
            <p className="mt-1"><span className="font-semibold text-slate-900">Completion Date:</span> {editing ? formatDate(editing.assignedDate) : "-"}</p>
          </SectionCard>
        </div>

        {services.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="bg-[#0b2545] px-4 py-2.5 font-semibold text-xs text-white uppercase tracking-[0.2em]">
              Coverage Services
            </div>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider">
                  <th className="w-12 px-4 py-2.5 font-semibold text-center">#</th>
                  <th className="px-4 py-2.5 font-semibold">Service Description</th>
                  <th className="w-32 px-4 py-2.5 font-semibold text-right">Days / Duration</th>
                </tr>
              </thead>
              <tbody>
                {services.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    <td className="border-b border-slate-200 px-4 py-2.5 text-center font-mono text-xs text-slate-400">{item.itemNo || index + 1}</td>
                    <td className="border-b border-slate-200 px-4 py-2.5 font-medium text-slate-900 uppercase">{item.description}</td>
                    <td className="border-b border-slate-200 px-4 py-2.5 text-right font-medium text-slate-700">{item.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {albumDetails.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="bg-[#0b2545] px-4 py-2.5 font-semibold text-xs text-white uppercase tracking-[0.2em]">
              Album Deliverables
            </div>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider">
                  <th className="w-12 px-4 py-2.5 font-semibold text-center">#</th>
                  <th className="px-4 py-2.5 font-semibold">Deliverable Item</th>
                  <th className="w-28 px-4 py-2.5 font-semibold text-center">Quantity</th>
                  <th className="w-36 px-4 py-2.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {albumDetails.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    <td className="border-b border-slate-200 px-4 py-2.5 text-center font-mono text-xs text-slate-400">{item.itemNo || index + 1}</td>
                    <td className="border-b border-slate-200 px-4 py-2.5 font-medium text-slate-900 uppercase">{item.description}</td>
                    <td className="border-b border-slate-200 px-4 py-2.5 text-center font-medium text-slate-700">{item.qnt}</td>
                    <td className="border-b border-slate-200 px-4 py-2.5 text-right font-medium text-slate-700 uppercase">{item.finish}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Notes & Terms">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Notes</p>
                <p className="mt-1 text-slate-700">{invoice.notes || "No special notes provided."}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Terms & Conditions</p>
                <p className="mt-1 text-slate-700">
                  {invoice.terms || studio?.invoiceTerms || "All deliverables are prepared according to studio standards. Final output is released after agreed payments are settled."}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Amount Summary">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.discount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tax</span>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-semibold text-slate-900">Grand Total</span>
                <span className="text-lg font-black text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Advance Paid</span>
                <span className="font-semibold text-slate-900">{formatCurrency(paymentTerms.advance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Balance Due</span>
                <span className="font-semibold text-slate-900">{formatCurrency(balanceDue)}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Authorized Signature</span></p>
            <div className="mt-8 w-56 border-t border-slate-300 pt-2 text-xs uppercase tracking-[0.25em] text-slate-400">Studio Sign & Stamp</div>
          </div>
            <div className="text-right text-xs text-slate-500">
              <p>{studioName}</p>
              <p>{studioAddress}</p>
              {studio?.invoiceFooter ? <p className="mt-1">{studio.invoiceFooter}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
