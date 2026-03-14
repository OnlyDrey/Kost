import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, Invoice } from '../services/api';
import { addToOfflineQueue } from '../idb/queue';
import { queryKeys } from './queryKeys';

export function useInvoices(periodId?: string) {
  return useQuery({
    queryKey: queryKeys.invoices(periodId),
    queryFn: () => invoiceApi.getAll({ periodId }).then(res => res.data),
    enabled: !!periodId,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => invoiceApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof invoiceApi.create>[0]) =>
      invoiceApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['currentPeriod'] });
    },
    onError: async (_error, variables) => {
      if (!navigator.onLine) {
        await addToOfflineQueue({
          method: 'POST',
          url: '/invoices',
          data: variables,
        });
      }
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> & { distributionRules?: unknown } }) =>
      invoiceApi.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(data.id) });
    },
    onError: async (_error, variables) => {
      if (!navigator.onLine) {
        await addToOfflineQueue({
          method: 'PATCH',
          url: `/invoices/${variables.id}`,
          data: variables.data,
        });
      }
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: async (_error, id) => {
      if (!navigator.onLine) {
        await addToOfflineQueue({
          method: 'DELETE',
          url: `/invoices/${id}`,
        });
      }
    },
  });
}
