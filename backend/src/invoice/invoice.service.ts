import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BookingStatus as PrismaBookingStatus } from '@prisma/client';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { booking: { include: { editingProject: true } } };
}>;

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { editingProject: true };
}>;

type MeetingSummary = {
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
  status: string;
  createdAt: string;
  updatedAt: string;
} | null;

type EditingSummary = {
  id: string;
  bookingId: string;
  bookingNumber: string;
  editorName: string;
  assignedDate: string;
  selectionStatus: string;
  albumStatus: string;
  videoStatus: string;
  coverStatus: string;
  pendriveStatus: string;
  handoverStatus: string;
  overallStatus: string;
  remarks: string | null;
} | null;

export interface ServiceItem {
  itemNo: number;
  description: string;
  days: string;
}

export interface AlbumDetailItem {
  itemNo: number;
  description: string;
  qnt: string;
  finish: string;
}

export interface PaymentCondition {
  advance: number;
  weddingDay: number;
  handoverDay: number;
}

type InvoiceDetailPayload = {
  invoice: ReturnType<InvoiceService['mapInvoiceResponse']>;
  booking: {
    id: string;
    bookingNumber: string;
    clientName: string;
    mobile: string;
    eventName: string;
    eventDate: string;
    photographerName: string | null;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  meeting: MeetingSummary;
  editing: EditingSummary;
  studio: {
    studioName: string;
    ownerName: string;
    mobile: string;
    email: string;
    address: string;
    gstNumber: string | null;
    logoUrl: string | null;
    invoicePrefix: string;
    invoiceStartingNumber?: number;
    defaultTaxPercentage?: number;
    invoiceTerms?: string | null;
    invoiceFooter?: string | null;
    instagramHandle: string | null;
  } | null;
};

type InvoiceContextPayload = {
  booking: {
    id: string;
    bookingNumber: string;
    clientName: string;
    mobile: string;
    eventName: string;
    eventDate: string;
    photographerName: string | null;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  meeting: MeetingSummary;
  editing: EditingSummary;
  studio: InvoiceDetailPayload['studio'];
  defaults: {
    weddingDates: string;
    clientAddress: string;
    servicesJson: string;
    albumDetailsJson: string;
    paymentTermsJson: string;
    terms: string;
  };
};

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value?: string): string | undefined {
    return value?.trim();
  }

  private formatMoney(value: number): string {
    return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  private getInvoiceDirectory(): string {
    const defaultDir = join(process.cwd(), 'uploads', 'invoices');
    try {
      mkdirSync(defaultDir, { recursive: true });
      return defaultDir;
    } catch {
      const fallbackDir = join(tmpdir(), 'invoices');
      try {
        mkdirSync(fallbackDir, { recursive: true });
      } catch {
        // ignore
      }
      return fallbackDir;
    }
  }

  private ensureInvoiceDirectory() {
    return this.getInvoiceDirectory();
  }

  private getDefaultServices(): ServiceItem[] {
    return [
      { itemNo: 1, description: 'TRADITIONAL PHOTO', days: '02' },
      { itemNo: 2, description: 'TRADITIONAL VIDEO', days: '02' },
      { itemNo: 3, description: 'CANDID PHOTO', days: '02' },
      { itemNo: 4, description: 'CINEMATIC VIDEO', days: '02' },
      { itemNo: 5, description: 'DRONE', days: '02' },
    ];
  }

  private getDefaultAlbumDetails(): AlbumDetailItem[] {
    return [
      { itemNo: 1, description: '12X36 ALBUM', qnt: '300PC', finish: 'MAT' },
      { itemNo: 2, description: 'MINI BOOK', qnt: '01', finish: 'GLOSSY' },
      { itemNo: 3, description: 'CALENDAR', qnt: '01', finish: 'WALL' },
      { itemNo: 4, description: 'BAG', qnt: '01', finish: 'PHOTO' },
      { itemNo: 5, description: 'FRAME 12X18', qnt: '01', finish: 'MAT' },
      { itemNo: 6, description: 'ACRYLIC FRAME', qnt: '01', finish: 'GLASS' },
      { itemNo: 7, description: 'PENDRIVE + BOX', qnt: '01', finish: 'BOX' },
    ];
  }

  private parseJsonArray<T>(value: string | null, fallback: T[]): T[] {
    if (!value) return fallback;

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }

  private getDefaultPaymentTerms(totalAmount: number, advanceAmount: number, balanceAmount: number): PaymentCondition {
    const total = Number(totalAmount) || 0;
    const advance = Number(advanceAmount) || 0;
    const balance = Number(balanceAmount) || Math.max(0, total - advance);
    const weddingDay = Math.round(balance * 0.75);
    const handoverDay = Math.max(0, balance - weddingDay);

    return {
      advance,
      weddingDay,
      handoverDay,
    };
  }

  private mapInvoiceResponse(invoice: InvoiceWithRelations) {
    return {
      id: invoice.id,
      bookingId: invoice.bookingId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      totalAmount: Number(invoice.totalAmount),
      discount: Number(invoice.discount),
      tax: Number(invoice.tax),
      grandTotal: Number(invoice.grandTotal),
      notes: invoice.notes,
      terms: invoice.terms,
      pdfUrl: invoice.pdfUrl,
      weddingDates: invoice.weddingDates,
      clientAddress: invoice.clientAddress,
      servicesJson: invoice.servicesJson,
      albumDetailsJson: invoice.albumDetailsJson,
      paymentTermsJson: invoice.paymentTermsJson,
      bookingNumber: invoice.booking.bookingNumber,
      clientName: invoice.booking.clientName,
      bookingStatus: invoice.booking.status.toLowerCase(),
      editingOverallStatus: invoice.booking.editingProject?.overallStatus?.toLowerCase() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  private mapBookingResponse(booking: BookingWithRelations) {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      clientName: booking.clientName,
      mobile: booking.mobile,
      eventName: booking.eventName,
      eventDate: booking.eventDate.toISOString(),
      photographerName: booking.photographerName,
      totalAmount: Number(booking.totalAmount),
      advanceAmount: Number(booking.advanceAmount),
      balanceAmount: Number(booking.balanceAmount),
      status: booking.status.toLowerCase(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };
  }

  private mapMeetingResponse(meeting: Awaited<ReturnType<InvoiceService['findRelatedMeeting']>>) {
    if (!meeting) return null;

    return {
      id: meeting.id,
      clientName: meeting.clientName,
      mobile: meeting.mobile,
      email: meeting.email,
      meetingDate: meeting.meetingDate.toISOString(),
      meetingTime: meeting.meetingTime,
      eventType: meeting.eventType,
      photographerName: meeting.photographerName,
      eventLocation: meeting.eventLocation,
      notes: meeting.notes,
      status: meeting.status.toLowerCase(),
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    };
  }

  private mapEditingResponse(editingProject: BookingWithRelations['editingProject'], bookingNumber?: string) {
    if (!editingProject) return null;

    return {
      id: editingProject.id,
      bookingId: editingProject.bookingId,
      bookingNumber: bookingNumber ?? editingProject.bookingId,
      editorName: editingProject.editorName,
      assignedDate: editingProject.assignedDate.toISOString(),
      selectionStatus: editingProject.selectionStatus.toLowerCase(),
      albumStatus: editingProject.albumStatus.toLowerCase(),
      videoStatus: editingProject.videoStatus.toLowerCase(),
      coverStatus: editingProject.coverStatus.toLowerCase(),
      pendriveStatus: editingProject.pendriveStatus.toLowerCase(),
      handoverStatus: editingProject.handoverStatus.toLowerCase(),
      overallStatus: editingProject.overallStatus.toLowerCase(),
      remarks: editingProject.remarks,
    };
  }

  private async getStudioSettings() {
    const studio = await this.prisma.studioSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    return studio;
  }

  private async findRelatedMeeting(booking: { clientName: string; mobile: string; eventDate: Date }) {
    return this.prisma.meeting.findFirst({
      where: {
        OR: [
          { clientName: booking.clientName, mobile: booking.mobile },
          { mobile: booking.mobile },
        ],
      },
      orderBy: [{ meetingDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private buildInvoiceDefaults(booking: BookingWithRelations, meeting: Awaited<ReturnType<InvoiceService['findRelatedMeeting']>>, studio: Awaited<ReturnType<InvoiceService['getStudioSettings']>>) {
    const weddingDateText = `${new Date(booking.eventDate).toLocaleDateString('en-GB')}`;
    const meetingDateText = meeting ? new Date(meeting.meetingDate).toLocaleDateString('en-GB') : weddingDateText;
    const eventLocation = meeting?.eventLocation?.trim();
    const services = JSON.stringify(this.getDefaultServices());
    const albumDetails = JSON.stringify(this.getDefaultAlbumDetails());

    return {
      weddingDates: meetingDateText,
      clientAddress: eventLocation || '',
      servicesJson: services,
      albumDetailsJson: albumDetails,
      paymentTermsJson: JSON.stringify(
        this.getDefaultPaymentTerms(booking.totalAmount, booking.advanceAmount, booking.balanceAmount),
      ),
      terms: (studio as any)?.invoiceTerms || 'All deliverables are prepared according to studio standards. Final output is released after agreed payments are settled.',
    };
  }

  private async loadInvoiceContext(bookingId: string): Promise<InvoiceContextPayload> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { editingProject: true },
    });

    if (!booking) {
      throw new NotFoundException({ success: false, message: 'Booking not found' });
    }

    const meeting = await this.findRelatedMeeting(booking);
    const studio = await this.getStudioSettings();

    return {
      booking: this.mapBookingResponse(booking),
      meeting: this.mapMeetingResponse(meeting),
      editing: this.mapEditingResponse(booking.editingProject),
      studio: studio
        ? {
            studioName: studio.studioName,
            ownerName: studio.ownerName,
            mobile: studio.mobile,
            email: studio.email,
            address: studio.address,
            gstNumber: studio.gstNumber,
            logoUrl: studio.logoUrl,
            invoicePrefix: studio.invoicePrefix,
            instagramHandle: studio.instagramHandle,
          }
        : null,
      defaults: this.buildInvoiceDefaults(booking, meeting, studio),
    };
  }

  private mapStatusToPrisma(status?: string): PrismaBookingStatus | undefined {
    if (!status || status === 'all') return undefined;
    switch (status.toLowerCase()) {
      case 'completed':
        return PrismaBookingStatus.COMPLETED;
      case 'ongoing':
        return PrismaBookingStatus.ONGOING;
      case 'pending':
        return PrismaBookingStatus.PENDING;
      default:
        return undefined;
    }
  }

  private async buildInvoiceNumber() {
    const studio = await this.getStudioSettings();
    const prefix = (studio?.invoicePrefix || 'INV').trim().toUpperCase();
    const year = new Date().getFullYear();
    const invoicePrefix = `${prefix}-${year}-`;

    const latest = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: invoicePrefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    const latestSequence = latest?.invoiceNumber?.split('-').pop();
    const nextNumber = (Number(latestSequence) || 0) + 1;
    return `${invoicePrefix}${String(nextNumber).padStart(4, '0')}`;
  }

  private async calculateGrandTotal(totalAmount: number, discount: number, tax: number) {
    return Math.max(0, Number(totalAmount) - Number(discount) + Number(tax));
  }

  private resolvePuppeteerExecutablePath(): string | undefined {
    if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    try {
      const defaultPath = puppeteer.executablePath();
      if (defaultPath && existsSync(defaultPath)) {
        return defaultPath;
      }
    } catch {
      // Ignore if executablePath() is not available
    }

    const candidates = [
      // Linux candidates
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      // macOS candidate
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      // Windows candidates
      join(homedir(), '.cache', 'puppeteer', 'chrome', 'win64-151.0.7922.138', 'chrome-win64', 'chrome.exe'),
      join(homedir(), '.cache', 'puppeteer', 'chrome', 'win64-148.0.7778.97', 'chrome-win64', 'chrome.exe'),
      join(homedir(), '.cache', 'puppeteer', 'chrome-headless-shell', 'win64-151.0.7922.138', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];

    return candidates.find((candidate): candidate is string => !!candidate && existsSync(candidate));
  }

  buildInvoiceHtmlDocument(
    invoice: Pick<
      InvoiceWithRelations,
      'invoiceNumber' | 'invoiceDate' | 'notes' | 'terms' | 'totalAmount' | 'discount' | 'tax' | 'grandTotal' | 'clientAddress' | 'servicesJson' | 'albumDetailsJson' | 'paymentTermsJson' | 'booking'
    >,
    studio: Pick<
      NonNullable<InvoiceDetailPayload['studio']>,
      'studioName' | 'address' | 'email' | 'mobile' | 'gstNumber' | 'invoiceFooter' | 'invoiceTerms' | 'logoUrl'
    > | null,
    meeting?: Awaited<ReturnType<InvoiceService['findRelatedMeeting']>>,
  ) {
    const services: ServiceItem[] = this.parseJsonArray(invoice.servicesJson, this.getDefaultServices());
    const albumDetails: AlbumDetailItem[] = this.parseJsonArray(invoice.albumDetailsJson, this.getDefaultAlbumDetails());
    const paymentTerms: PaymentCondition = invoice.paymentTermsJson
      ? JSON.parse(invoice.paymentTermsJson)
      : this.getDefaultPaymentTerms(Number(invoice.totalAmount), Number(invoice.booking.advanceAmount), Number(invoice.booking.balanceAmount));
    const studioName = studio?.studioName || 'KANHA PHOTO & FILMS';
    const studioAddress = studio?.address || 'Studio address not configured';
    const studioEmail = studio?.email || 'studio@email.com';
    const studioPhone = studio?.mobile || '-';
    const gstNumber = studio?.gstNumber || '-';
    const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB');
    const eventDate = new Date(invoice.booking.eventDate).toLocaleDateString('en-GB');
    const meetingDate = meeting ? new Date(meeting.meetingDate).toLocaleDateString('en-GB') : '-';
    const balanceDue = Math.max(0, Number(invoice.booking.balanceAmount) || Number(invoice.totalAmount) - Number(invoice.booking.advanceAmount));
    const notesText = invoice.notes || 'No special notes provided.';
    const lineItems = [
      { description: 'Photography Package', qty: 1, rate: Number(invoice.totalAmount), amount: Number(invoice.totalAmount) },
      { description: 'Album Included', qty: albumDetails.length || 1, rate: 0, amount: 0 },
      { description: 'Cinematic Video', qty: services.some((service) => /video/i.test(service.description)) ? 1 : 0, rate: 0, amount: 0 },
      { description: 'Drone Coverage', qty: services.some((service) => /drone/i.test(service.description)) ? 1 : 0, rate: 0, amount: 0 },
      { description: 'Extra Editing', qty: invoice.booking.editingProject ? 1 : 0, rate: 0, amount: 0 },
      { description: 'Additional Charges', qty: 1, rate: 0, amount: 0 },
    ];

    const logoDataUri = studio?.logoUrl && existsSync(studio.logoUrl)
      ? `data:image/${studio.logoUrl.toLowerCase().endsWith('.svg') ? 'svg+xml' : 'png'};base64,${readFileSync(studio.logoUrl).toString('base64')}`
      : null;

    const logoMarkup = logoDataUri
      ? `<img src="${logoDataUri}" alt="${studioName} logo" style="height: 52px; width: auto; object-fit: contain;" />`
      : `<div style="font-size: 18px; font-weight: 700; letter-spacing: 0.06em;">${studioName}</div>`;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${invoice.invoiceNumber}</title>
          <style>
            @page { size: A4; margin: 8mm; }
            html, body { margin: 0; padding: 0; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
            body { display: flex; justify-content: center; padding: 0; }
            .page { width: 210mm; min-height: 297mm; background: white; box-sizing: border-box; }
            .header { background: #0b2545; padding: 26px 32px 18px; color: white; }
            .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
            .brand { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; }
            .address { margin-top: 8px; font-size: 10px; color: #dbeafe; }
            .meta { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 16px; font-size: 9px; color: #dbeafe; }
            .content { padding: 24px 32px 24px; }
            .title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
            .title { font-size: 22px; font-weight: 700; letter-spacing: 0.06em; }
            .detail-list { margin-top: 12px; font-size: 10px; line-height: 1.6; color: #475569; }
            .detail-list strong { color: #0f172a; }
            .status-box { width: 150px; border: 1px solid #dbe2ea; background: #f8fafc; border-radius: 12px; padding: 12px 14px; text-align: left; }
            .status-label { font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase; color: #64748b; }
            .status-value { margin-top: 6px; font-size: 14px; font-weight: 700; text-transform: uppercase; }
            .status-edit { margin-top: 5px; font-size: 9px; color: #64748b; }
            .two-col { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; page-break-inside: avoid; break-inside: avoid; }
            .card { border: 1px solid #e2e8f0; border-radius: 16px; background: white; padding: 14px 16px; page-break-inside: avoid; break-inside: avoid; }
            .card-title { font-size: 9px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: #475569; }
            .card-body { margin-top: 12px; font-size: 10px; line-height: 1.8; color: #334155; }
            .card-body strong { color: #0f172a; }
            .table-wrap { margin-top: 18px; border: 1px solid #dbe2ea; border-radius: 16px; overflow: hidden; page-break-inside: avoid !important; break-inside: avoid !important; }
            table { width: 100%; border-collapse: collapse; }
            thead th { background: #0b2545; color: #ffffff; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; text-align: left; padding: 12px 14px; font-weight: 700; }
            .subhead th { background: #f1f5f9 !important; color: #334155 !important; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
            tbody td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155; }
            tbody tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .amount-summary { margin-top: 18px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; page-break-inside: avoid !important; break-inside: avoid !important; }
            .summary-table { width: 100%; border-collapse: collapse; }
            .summary-table td { padding: 6px 0; font-size: 10px; color: #334155; }
            .summary-table .total td { padding-top: 10px; border-top: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; }
            .footer-signature { margin-top: 24px; padding: 12px 0 24px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid !important; break-inside: avoid !important; }
            .signature-box { width: 160px; text-align: center; }
            .signature-line { border-top: 1px solid #cbd5e1; height: 18px; }
            .signature-label { margin-top: 6px; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: #64748b; }
            .footer-note { text-align: right; font-size: 9px; color: #64748b; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="header-row">
                <div>
                  <div class="brand">${studioName}</div>
                  <div class="address">${studioAddress}</div>
                  <div class="meta">
                    <span>Phone: ${studioPhone}</span>
                    <span>Email: ${studioEmail}</span>
                    <span>GST: ${gstNumber}</span>
                  </div>
                </div>
                <div>${logoMarkup}</div>
              </div>
            </div>

            <div class="content">
              <div class="title-row">
                <div>
                  <div class="title">INVOICE</div>
                  <div class="detail-list">
                    <div><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</div>
                    <div><strong>Invoice Date:</strong> ${invoiceDate}</div>
                    <div><strong>Booking Number:</strong> ${invoice.booking.bookingNumber}</div>
                  </div>
                </div>
                <div class="status-box">
                  <div class="status-label">Status</div>
                  <div class="status-value">${invoice.booking.status}</div>
                  <div class="status-edit">Editing: ${invoice.booking.editingProject?.overallStatus || '-'}</div>
                </div>
              </div>

              <div class="two-col">
                <div class="card">
                  <div class="card-title">Bill To</div>
                  <div class="card-body">
                    <div><strong>${invoice.booking.clientName}</strong></div>
                    <div>${invoice.clientAddress || invoice.booking.mobile}</div>
                    <div>Mobile: ${invoice.booking.mobile}</div>
                    ${meeting?.email ? `<div>Email: ${meeting.email}</div>` : ''}
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">Event Details</div>
                  <div class="card-body">
                    <div><strong>Event Name:</strong> ${invoice.booking.eventName}</div>
                    <div><strong>Event Date:</strong> ${eventDate}</div>
                    <div><strong>Location:</strong> ${meeting?.eventLocation || '-'}</div>
                    <div><strong>Photographer:</strong> ${invoice.booking.photographerName || meeting?.photographerName || '-'}</div>
                  </div>
                </div>
              </div>

              <div class="two-col">
                <div class="card">
                  <div class="card-title">Meeting Information</div>
                  <div class="card-body">
                    <div><strong>Meeting Date:</strong> ${meetingDate}</div>
                    <div><strong>Meeting Time:</strong> ${meeting?.meetingTime || '-'}</div>
                    <div><strong>Meeting Notes:</strong> ${meeting?.notes || '-'}</div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">Editing Information</div>
                  <div class="card-body">
                    <div><strong>Editor Name:</strong> ${invoice.booking.editingProject?.editorName || '-'}</div>
                    <div><strong>Project Status:</strong> ${invoice.booking.editingProject?.overallStatus || '-'}</div>
                    <div><strong>Completion Date:</strong> ${invoice.booking.editingProject ? new Date(invoice.booking.editingProject.assignedDate).toLocaleDateString('en-GB') : '-'}</div>
                  </div>
                </div>
              </div>

              ${services.length > 0 ? `
              <div class="table-wrap">
                <div style="background: #0b2545; color: #ffffff; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; padding: 10px 14px; font-weight: 700;">
                  Coverage Services
                </div>
                <table>
                  <thead>
                    <tr class="subhead">
                      <th style="width: 30px; text-align: center;">#</th>
                      <th style="text-align: left;">Service Description</th>
                      <th style="text-align: right;">Days / Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${services.map((item, idx) => `
                      <tr>
                        <td style="text-align: center; color: #94a3b8;">${item.itemNo || idx + 1}</td>
                        <td style="font-weight: 600; text-transform: uppercase;">${item.description}</td>
                        <td style="text-align: right;">${item.days}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              ${albumDetails.length > 0 ? `
              <div class="table-wrap">
                <div style="background: #0b2545; color: #ffffff; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; padding: 10px 14px; font-weight: 700;">
                  Album Deliverables
                </div>
                <table>
                  <thead>
                    <tr class="subhead">
                      <th style="width: 30px; text-align: center;">#</th>
                      <th style="text-align: left;">Deliverable Item</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${albumDetails.map((item, idx) => `
                      <tr>
                        <td style="text-align: center; color: #94a3b8;">${item.itemNo || idx + 1}</td>
                        <td style="font-weight: 600; text-transform: uppercase;">${item.description}</td>
                        <td style="text-align: center;">${item.qnt}</td>
                        <td style="text-align: right; text-transform: uppercase;">${item.finish}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <div class="amount-summary">
                <div class="card">
                  <div class="card-title">Notes & Terms</div>
                  <div class="card-body">
                    <div><strong>Notes</strong></div>
                    <div>${notesText}</div>
                    <div style="margin-top: 12px;"><strong>Terms & Conditions</strong></div>
                    <div>${invoice.terms || studio?.invoiceTerms || 'All deliverables are prepared according to studio standards. Final output is released after agreed payments are settled.'}</div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">Amount Summary</div>
                  <div class="card-body">
                    <table class="summary-table">
                      <tr><td>Subtotal</td><td style="text-align: right;">₹${Number(invoice.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                      <tr><td>Discount</td><td style="text-align: right;">₹${Number(invoice.discount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                      <tr><td>Tax</td><td style="text-align: right;">₹${Number(invoice.tax).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                      <tr class="total"><td>Grand Total</td><td style="text-align: right;">₹${Number(invoice.grandTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                      <tr><td>Advance Paid</td><td style="text-align: right;">₹${Number(paymentTerms.advance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                      <tr><td>Balance Due</td><td style="text-align: right;">₹${Number(balanceDue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                    </table>
                  </div>
                </div>
              </div>

              <div class="footer-signature">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-label">Authorized Signature</div>
                </div>
                <div class="footer-note">
                  <div>${studioName}</div>
                  <div>${studioAddress}</div>
                  ${studio?.invoiceFooter ? `<div>${studio.invoiceFooter}</div>` : ''}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private async buildInvoicePdf(invoice: InvoiceWithRelations, studio: Awaited<ReturnType<InvoiceService['getStudioSettings']>>) {
    const dir = this.ensureInvoiceDirectory();
    const fileName = `${invoice.invoiceNumber}.pdf`;
    const filePath = join(dir, fileName);

    const meeting = await this.findRelatedMeeting(invoice.booking);
    const html = this.buildInvoiceHtmlDocument(invoice, studio, meeting);

    try {
      const execPath = this.resolvePuppeteerExecutablePath();
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: execPath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        const buffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
        });
        await import('fs/promises').then((fs) => fs.writeFile(filePath, buffer)).catch(() => undefined);
        return { filePath, buffer, fileName: `invoice-${invoice.invoiceNumber}.pdf` };
      } finally {
        await browser.close();
      }
    } catch (puppeteerErr) {
      // Serverless / Linux cloud environments without Chromium installed fallback to PDFKit
      const buffer = await this.generatePdfWithPdfKit(invoice, studio, meeting);
      await import('fs/promises').then((fs) => fs.writeFile(filePath, buffer)).catch(() => undefined);
      return { filePath, buffer, fileName: `invoice-${invoice.invoiceNumber}.pdf` };
    }
  }

  private generatePdfWithPdfKit(
    invoice: InvoiceWithRelations,
    studio: Awaited<ReturnType<InvoiceService['getStudioSettings']>>,
    meeting?: Awaited<ReturnType<InvoiceService['findRelatedMeeting']>>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const studioName = studio?.studioName || 'KANHA PHOTO & FILMS';
        const studioAddress = studio?.address || '';
        const studioEmail = studio?.email || '';
        const studioMobile = studio?.mobile || '';
        const studioGst = studio?.gstNumber || '';

        // Top Header
        doc.fillColor('#0284c7').fontSize(22).font('Helvetica-Bold').text(studioName, 40, 40);
        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        if (studioAddress) doc.text(studioAddress);
        const contactLine = [
          studioEmail ? `Email: ${studioEmail}` : '',
          studioMobile ? `Phone: ${studioMobile}` : '',
          studioGst ? `GST: ${studioGst}` : '',
        ]
          .filter(Boolean)
          .join('  |  ');
        if (contactLine) doc.text(contactLine);

        // Right side header
        doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 40, { align: 'right' });
        doc.fillColor('#64748b').fontSize(9).font('Helvetica');
        doc.text(`Invoice No: ${invoice.invoiceNumber}`, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}`, { align: 'right' });
        doc.text(`Booking No: ${invoice.booking.bookingNumber}`, { align: 'right' });

        doc.moveDown(1.5);
        const startY = Math.max(doc.y, 110);

        // Divider line
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, startY).lineTo(555, startY).stroke();

        // Bill To
        const billToY = startY + 12;
        doc.fillColor('#0284c7').fontSize(11).font('Helvetica-Bold').text('BILLED TO:', 40, billToY);
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(invoice.booking.clientName, 40, billToY + 16);
        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        if (invoice.clientAddress) {
          doc.text(invoice.clientAddress, 40, billToY + 30);
        }

        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        doc.text(`Event Date: ${new Date(invoice.booking.eventDate).toLocaleDateString('en-GB')}`, 350, billToY + 16, { align: 'right' });

        const tableStartY = Math.max(doc.y + 20, billToY + 60);

        // Table Header
        doc.rect(40, tableStartY, 515, 22).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
        doc.text('DESCRIPTION', 50, tableStartY + 6);
        doc.text('AMOUNT', 400, tableStartY + 6, { align: 'right' });

        let currentY = tableStartY + 28;
        const services: ServiceItem[] = this.parseJsonArray(invoice.servicesJson, this.getDefaultServices());
        if (services.length > 0) {
          services.forEach((s) => {
            doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text(`${s.itemNo}. ${s.description}`, 50, currentY);
            if (s.days) {
              doc.fillColor('#64748b').fontSize(8).text(`(${s.days} days)`, 250, currentY);
            }
            currentY += 18;
          });
        } else {
          doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text('Photography & Videography Services', 50, currentY);
          currentY += 18;
        }

        currentY += 10;
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, currentY).lineTo(555, currentY).stroke();
        currentY += 12;

        const formatMoney = (amount: number) => `Rs. ${Number(amount).toLocaleString('en-IN')}`;

        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        doc.text('Total Package Amount:', 300, currentY, { align: 'left' });
        doc.text(formatMoney(Number(invoice.totalAmount)), 400, currentY, { align: 'right' });
        currentY += 16;

        if (Number(invoice.discount) > 0) {
          doc.text('Discount:', 300, currentY, { align: 'left' });
          doc.text(`- ${formatMoney(Number(invoice.discount))}`, 400, currentY, { align: 'right' });
          currentY += 16;
        }

        if (Number(invoice.tax) > 0) {
          doc.text('Tax:', 300, currentY, { align: 'left' });
          doc.text(`+ ${formatMoney(Number(invoice.tax))}`, 400, currentY, { align: 'right' });
          currentY += 16;
        }

        doc.rect(295, currentY, 260, 24).fill('#e0f2fe');
        doc.fillColor('#0369a1').fontSize(11).font('Helvetica-Bold');
        doc.text('GRAND TOTAL:', 305, currentY + 6);
        doc.text(formatMoney(Number(invoice.grandTotal)), 400, currentY + 6, { align: 'right' });
        currentY += 32;

        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        doc.text('Advance Received:', 300, currentY, { align: 'left' });
        doc.text(formatMoney(Number(invoice.booking.advanceAmount)), 400, currentY, { align: 'right' });
        currentY += 16;

        doc.font('Helvetica-Bold').fillColor('#0f172a');
        doc.text('Balance Due:', 300, currentY, { align: 'left' });
        doc.text(formatMoney(Number(invoice.booking.balanceAmount)), 400, currentY, { align: 'right' });
        currentY += 24;

        if (invoice.notes) {
          doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Notes & Instructions:', 40, currentY);
          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(invoice.notes, 40, currentY + 12);
        }

        if (studio?.invoiceFooter) {
          doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(studio.invoiceFooter, 40, 780, { align: 'center', width: 515 });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async findAll(query: GetInvoicesQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};
    const search = this.normalizeText(query.search);
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
        { booking: { clientName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const statusEnum = this.mapStatusToPrisma(query.status);
    if (statusEnum) {
      where.booking = { status: statusEnum };
    }

    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { booking: { include: { editingProject: true } } },
      }),
    ]);

    return {
      success: true,
      data: invoices.map((invoice) => this.mapInvoiceResponse(invoice)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { booking: { include: { editingProject: true } } },
    });

    if (!invoice) {
      throw new NotFoundException({ success: false, message: 'Invoice not found' });
    }

    const studio = await this.getStudioSettings();
    const meeting = await this.findRelatedMeeting(invoice.booking);

    return {
      success: true,
      data: {
        invoice: this.mapInvoiceResponse(invoice),
        booking: this.mapBookingResponse(invoice.booking),
        meeting: this.mapMeetingResponse(meeting),
        editing: this.mapEditingResponse(invoice.booking.editingProject, invoice.booking.bookingNumber),
        studio: studio
          ? {
              studioName: studio.studioName,
              ownerName: studio.ownerName,
              mobile: studio.mobile,
              email: studio.email,
              address: studio.address,
              gstNumber: studio.gstNumber,
              logoUrl: studio.logoUrl,
              invoicePrefix: studio.invoicePrefix,
              invoiceStartingNumber: (studio as any).invoiceStartingNumber,
              defaultTaxPercentage: (studio as any).defaultTaxPercentage,
              invoiceTerms: (studio as any).invoiceTerms,
              invoiceFooter: (studio as any).invoiceFooter,
              instagramHandle: studio.instagramHandle,
            }
          : null,
      } satisfies InvoiceDetailPayload,
    };
  }

  async getBookingContext(bookingId: string) {
    return {
      success: true,
      data: await this.loadInvoiceContext(bookingId),
    };
  }

  async create(createInvoiceDto: CreateInvoiceDto) {
    const bookingId = this.normalizeText(createInvoiceDto.bookingId);
    if (!bookingId) {
      throw new BadRequestException({ success: false, message: 'bookingId is required' });
    }

    const context = await this.loadInvoiceContext(bookingId);
    const booking = context.booking;

    const existing = await this.prisma.invoice.findFirst({ where: { bookingId } });
    if (existing) {
      throw new BadRequestException({
        success: false,
        message: 'An invoice already exists for this booking',
      });
    }

    const discount = Math.max(0, Number(createInvoiceDto.discount) || 0);
    const studio = await this.getStudioSettings();
    const defaultTaxPct = (studio as any)?.defaultTaxPercentage ?? 0;
    const totalAmount = Number(booking.totalAmount);
    const tax = createInvoiceDto.tax !== undefined && createInvoiceDto.tax !== null
      ? Math.max(0, Number(createInvoiceDto.tax))
      : Math.round((Number(totalAmount) * Number(defaultTaxPct)) / 100);
    const grandTotal = await this.calculateGrandTotal(totalAmount, discount, tax);
    const invoiceNumber = await this.buildInvoiceNumber();
    const invoiceDate = createInvoiceDto.invoiceDate ? new Date(createInvoiceDto.invoiceDate) : new Date();
    const defaults = context.defaults;

    const invoice = await this.prisma.invoice.create({
      data: {
        bookingId,
        invoiceNumber,
        invoiceDate,
        totalAmount,
        discount,
        tax,
        grandTotal,
        notes: this.normalizeText(createInvoiceDto.notes) ?? null,
        terms: this.normalizeText(createInvoiceDto.terms) ?? defaults.terms,
        weddingDates: this.normalizeText(createInvoiceDto.weddingDates) ?? defaults.weddingDates,
        clientAddress: this.normalizeText(createInvoiceDto.clientAddress) ?? defaults.clientAddress,
        servicesJson: createInvoiceDto.servicesJson ?? defaults.servicesJson,
        albumDetailsJson: createInvoiceDto.albumDetailsJson ?? defaults.albumDetailsJson,
        paymentTermsJson: createInvoiceDto.paymentTermsJson ?? defaults.paymentTermsJson,
      },
      include: { booking: { include: { editingProject: true } } },
    });

    const pdf = await this.buildInvoicePdf(invoice, studio);

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: pdf.filePath },
      include: { booking: { include: { editingProject: true } } },
    });

    return {
      success: true,
      data: this.mapInvoiceResponse(updated),
    };
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const existing = await this.prisma.invoice.findUnique({ where: { id }, include: { booking: { include: { editingProject: true } } } });
    if (!existing) {
      throw new NotFoundException({ success: false, message: 'Invoice not found' });
    }

    const discount = updateInvoiceDto.discount !== undefined ? Math.max(0, Number(updateInvoiceDto.discount)) : Number(existing.discount);
    const tax = updateInvoiceDto.tax !== undefined ? Math.max(0, Number(updateInvoiceDto.tax)) : Number(existing.tax);
    const grandTotal = await this.calculateGrandTotal(Number(existing.totalAmount), discount, tax);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        discount,
        tax,
        grandTotal,
        ...(updateInvoiceDto.notes !== undefined
          ? { notes: this.normalizeText(updateInvoiceDto.notes) ?? null }
          : {}),
        ...(updateInvoiceDto.terms !== undefined
          ? { terms: this.normalizeText(updateInvoiceDto.terms) ?? null }
          : {}),
        ...(updateInvoiceDto.weddingDates !== undefined
          ? { weddingDates: this.normalizeText(updateInvoiceDto.weddingDates) ?? null }
          : {}),
        ...(updateInvoiceDto.clientAddress !== undefined
          ? { clientAddress: this.normalizeText(updateInvoiceDto.clientAddress) ?? null }
          : {}),
        ...(updateInvoiceDto.servicesJson !== undefined
          ? { servicesJson: updateInvoiceDto.servicesJson }
          : {}),
        ...(updateInvoiceDto.albumDetailsJson !== undefined
          ? { albumDetailsJson: updateInvoiceDto.albumDetailsJson }
          : {}),
        ...(updateInvoiceDto.paymentTermsJson !== undefined
          ? { paymentTermsJson: updateInvoiceDto.paymentTermsJson }
          : {}),
      },
      include: { booking: { include: { editingProject: true } } },
    });

    const studio = await this.getStudioSettings();
    const pdf = await this.buildInvoicePdf(invoice, studio);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { pdfUrl: pdf.filePath },
      include: { booking: { include: { editingProject: true } } },
    });

    return {
      success: true,
      data: this.mapInvoiceResponse(updated),
    };
  }

  async updateStudioLogo(filePath: string) {
    const studio = await this.prisma.studioSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!studio) {
      throw new NotFoundException({ success: false, message: 'Studio settings not found' });
    }

    const updated = await this.prisma.studioSettings.update({
      where: { id: studio.id },
      data: { logoUrl: filePath },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ success: false, message: 'Invoice not found' });
    }

    if (existing.pdfUrl && existsSync(existing.pdfUrl)) {
      const pdfPath = existing.pdfUrl;
      await import('fs/promises').then((fs) => fs.unlink(pdfPath).catch(() => undefined));
    }

    await this.prisma.invoice.delete({ where: { id } });

    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  }

  async downloadPdf(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: { booking: { include: { editingProject: true } } } });
    if (!invoice) {
      throw new NotFoundException({ success: false, message: 'Invoice not found' });
    }

    const studio = await this.getStudioSettings();
    const pdf = await this.buildInvoicePdf(invoice, studio);
    try {
      await this.prisma.invoice.update({ where: { id }, data: { pdfUrl: pdf.filePath } });
    } catch {
      // Ignore DB update error if file system is read-only
    }

    return { buffer: pdf.buffer, filename: `${invoice.invoiceNumber}.pdf` };
  }
}