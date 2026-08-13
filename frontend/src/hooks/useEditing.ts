import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  CreateEditingPayload,
  EditingProjectsResponse,
  GetEditingQueryParams,
  SingleEditingProjectResponse,
  UpdateEditingPayload,
  UpdateEditingProgressPayload,
} from "@/types/editing";

export const editingKeys = {
  all: ["editing"] as const,
  lists: () => [...editingKeys.all, "list"] as const,
  list: (params: GetEditingQueryParams) => [...editingKeys.lists(), params] as const,
  details: () => [...editingKeys.all, "detail"] as const,
  detail: (id: string) => [...editingKeys.details(), id] as const,
};

export function useEditingProjects(params: GetEditingQueryParams = {}) {
  return useQuery<EditingProjectsResponse, Error>({
    queryKey: editingKeys.list(params),
    queryFn: async () => {
      const response = await axiosInstance.get<EditingProjectsResponse>("/editing", {
        params,
      });
      return response.data;
    },
  });
}

export function useEditingProject(id: string) {
  return useQuery<SingleEditingProjectResponse, Error>({
    queryKey: editingKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<SingleEditingProjectResponse>(`/editing/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateEditingProject() {
  const queryClient = useQueryClient();

  return useMutation<SingleEditingProjectResponse, Error, CreateEditingPayload>({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post<SingleEditingProjectResponse>("/editing", payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editingKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: editingKeys.all });
    },
  });
}

export function useUpdateEditingProject() {
  const queryClient = useQueryClient();

  return useMutation<SingleEditingProjectResponse, Error, { id: string; payload: UpdateEditingPayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.patch<SingleEditingProjectResponse>(`/editing/${id}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: editingKeys.all });
      void queryClient.invalidateQueries({ queryKey: editingKeys.detail(variables.id) });
    },
  });
}

export function useUpdateEditingProgress() {
  const queryClient = useQueryClient();

  return useMutation<SingleEditingProjectResponse, Error, { id: string; payload: UpdateEditingProgressPayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.patch<SingleEditingProjectResponse>(
        `/editing/${id}/progress`,
        payload
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: editingKeys.all });
      void queryClient.invalidateQueries({ queryKey: editingKeys.detail(variables.id) });
    },
  });
}

export function useDeleteEditingProject() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/editing/${id}`);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editingKeys.lists() });
    },
  });
}