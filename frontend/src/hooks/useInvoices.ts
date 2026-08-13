import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  CreateInvoicePayload,
  InvoiceBookingContextResponse,
  InvoiceMutationResponse,
  GetInvoicesQueryParams,
  InvoiceDetailResponse,
  InvoicesResponse,
  UpdateInvoicePayload,
} from "@/types/invoice";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params: GetInvoicesQueryParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(params: GetInvoicesQueryParams = {}) {
  return useQuery<InvoicesResponse, Error>({
    queryKey: invoiceKeys.list(params),
    queryFn: async () => {
      const response = await axiosInstance.get<InvoicesResponse>("/invoice", { params });
      return response.data;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery<InvoiceDetailResponse, Error>({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<InvoiceDetailResponse>(`/invoice/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useInvoiceBookingContext(bookingId: string) {
  return useQuery<InvoiceBookingContextResponse, Error>({
    queryKey: [...invoiceKeys.all, "booking-context", bookingId] as const,
    queryFn: async () => {
      const response = await axiosInstance.get<InvoiceBookingContextResponse>(
        `/invoice/booking/${bookingId}/context`
      );
      return response.data;
    },
    enabled: Boolean(bookingId),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation<InvoiceMutationResponse, Error, CreateInvoicePayload>({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post<InvoiceMutationResponse>("/invoice", payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation<InvoiceMutationResponse, Error, { id: string; payload: UpdateInvoicePayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.patch<InvoiceMutationResponse>(`/invoice/${id}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/invoice/${id}`);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
