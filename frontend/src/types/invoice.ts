export type InvoiceBookingStatus = "completed" | "ongoing" | "pending";

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

export interface InvoiceListItem {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  discount: number;
  tax: number;
  grandTotal: number;
  notes: string | null;
  pdfUrl: string | null;
  weddingDates: string | null;
  clientAddress: string | null;
  servicesJson: string | null;
  albumDetailsJson: string | null;
  paymentTermsJson: string | null;
  bookingNumber: string;
  clientName: string;
  bookingStatus: InvoiceBookingStatus;
  editingOverallStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceBookingSummary {
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
  status: InvoiceBookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceMeetingSummary {
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
}

export interface InvoiceEditingSummary {
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
}

export interface InvoiceStudioSummary {
  studioName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber: string | null;
  logoUrl: string | null;
  invoicePrefix: string;
  instagramHandle: string | null;
}

export interface InvoiceDetailData {
  invoice: InvoiceListItem;
  booking: InvoiceBookingSummary;
  meeting: InvoiceMeetingSummary | null;
  editing: InvoiceEditingSummary | null;
  studio: InvoiceStudioSummary | null;
}

export interface InvoiceBookingContextData {
  booking: InvoiceBookingSummary;
  meeting: InvoiceMeetingSummary | null;
  editing: InvoiceEditingSummary | null;
  studio: InvoiceStudioSummary | null;
  defaults: {
    weddingDates: string;
    clientAddress: string;
    servicesJson: string;
    albumDetailsJson: string;
    paymentTermsJson: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InvoicesResponse {
  success: boolean;
  data: InvoiceListItem[];
  pagination: Pagination;
}

export interface InvoiceDetailResponse {
  success: boolean;
  data: InvoiceDetailData;
}

export interface InvoiceBookingContextResponse {
  success: boolean;
  data: InvoiceBookingContextData;
}

export interface InvoiceMutationResponse {
  success: boolean;
  data: InvoiceListItem;
}

export interface GetInvoicesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateInvoicePayload {
  bookingId: string;
  invoiceDate?: string;
  discount?: number;
  tax?: number;
  notes?: string;
  weddingDates?: string;
  clientAddress?: string;
  servicesJson?: string;
  albumDetailsJson?: string;
  paymentTermsJson?: string;
}

export interface UpdateInvoicePayload {
  discount?: number;
  tax?: number;
  notes?: string;
  weddingDates?: string;
  clientAddress?: string;
  servicesJson?: string;
  albumDetailsJson?: string;
  paymentTermsJson?: string;
}
