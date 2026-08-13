import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  Booking,
  BookingsResponse,
  CreateBookingPayload,
  GetBookingsQueryParams,
  SingleBookingResponse,
  UpdateBookingPayload,
  UpdateBookingStatusPayload,
} from "@/types/booking";

// Query keys
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (params: GetBookingsQueryParams) => [...bookingKeys.lists(), params] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};

// Fetch bookings list
export function useBookings(params: GetBookingsQueryParams = {}) {
  return useQuery<BookingsResponse, Error>({
    queryKey: bookingKeys.list(params),
    queryFn: async () => {
      const response = await axiosInstance.get<BookingsResponse>("/bookings", {
        params,
      });
      return response.data;
    },
  });
}

// Fetch single booking
export function useBooking(id: string) {
  return useQuery<SingleBookingResponse, Error>({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<SingleBookingResponse>(`/bookings/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// Create booking
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<SingleBookingResponse, Error, CreateBookingPayload>({
    mutationFn: async (newBooking) => {
      const response = await axiosInstance.post<SingleBookingResponse>("/bookings", newBooking);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}

// Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    SingleBookingResponse,
    Error,
    { id: string; payload: UpdateBookingStatusPayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.patch<SingleBookingResponse>(
        `/bookings/${id}/status`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

// Update booking details
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation<
    SingleBookingResponse,
    Error,
    { id: string; payload: UpdateBookingPayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.patch<SingleBookingResponse>(
        `/bookings/${id}`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

// Delete booking
export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<{ success: boolean; message: string }>(
        `/bookings/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}
