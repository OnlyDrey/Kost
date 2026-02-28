import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../services/api';
import { queryKeys } from './queryKeys';

export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: Parameters<typeof paymentApi.create>[1] }) =>
      paymentApi.create(invoiceId, data).then(res => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: Parameters<typeof paymentApi.update>[1] }) =>
      paymentApi.update(paymentId, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(data.invoiceId) });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId }: { paymentId: string; invoiceId: string }) =>
      paymentApi.delete(paymentId).then(res => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
