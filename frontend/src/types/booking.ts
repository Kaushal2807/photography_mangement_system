export type BookingStatus = "completed" | "ongoing" | "pending";

export interface Booking {
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
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BookingsResponse {
  success: boolean;
  data: Booking[];
  pagination: Pagination;
}

export interface SingleBookingResponse {
  success: boolean;
  data: Booking;
}

export interface GetBookingsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateBookingPayload {
  bookingNumber?: string;
  clientName: string;
  mobile: string;
  eventName: string;
  eventDate: string;
  photographerName?: string;
  totalAmount: number;
  advanceAmount?: number;
  status?: BookingStatus;
}

export interface UpdateBookingPayload extends Partial<CreateBookingPayload> {}

export interface UpdateBookingStatusPayload {
  status: BookingStatus;
}
