import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const settingsKeys = {
  studio: ['settings', 'studio'] as const,
  invoice: ['settings', 'invoice'] as const,
  account: ['settings', 'account'] as const,
};

export function useStudioSettings() {
  return useQuery({
    queryKey: settingsKeys.studio,
    queryFn: async () => {
      const res = await axiosInstance.get('/settings/studio');
      return res.data;
    },
  });
}

export function useUpdateStudioSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.patch('/settings/studio', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.studio }),
  });
}

export function useInvoiceSettings() {
  return useQuery({
    queryKey: settingsKeys.invoice,
    queryFn: async () => {
      const res = await axiosInstance.get('/settings/invoice');
      return res.data;
    },
  });
}

export function useUpdateInvoiceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.patch('/settings/invoice', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.invoice }),
  });
}

export function useAccount() {
  return useQuery({
    queryKey: settingsKeys.account,
    queryFn: async () => {
      const res = await axiosInstance.get('/settings/account');
      return res.data;
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.patch('/settings/account', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.account }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post('/settings/account/change-password', payload);
      return res.data;
    },
  });
}
