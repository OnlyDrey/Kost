import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, periodApi, userIncomeApi, Invoice, Period, UserIncome, PeriodStats } from '../services/api';
import { addToOfflineQueue } from '../idb/queue';

// Query keys
export const queryKeys = {
  invoices: (periodId?: string) => ['invoices', periodId] as const,
  invoice: (id: string) => ['invoice', id] as const,
  periods: () => ['periods'] as const,
  period: (id: string) => ['period', id] as const,
  currentPeriod: () => ['currentPeriod'] as const,
  periodStats: (id: string) => ['periodStats', id] as const,
  userIncomes: (periodId: string) => ['userIncomes', periodId] as const,
};

// Invoice hooks
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
    onError: async (error, variables) => {
      // Add to offline queue if network error
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      invoiceApi.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(data.id) });
    },
    onError: async (error, variables) => {
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
    onError: async (error, id) => {
      if (!navigator.onLine) {
        await addToOfflineQueue({
          method: 'DELETE',
          url: `/invoices/${id}`,
        });
      }
    },
  });
}

// Period hooks
export function usePeriods() {
  return useQuery({
    queryKey: queryKeys.periods(),
    queryFn: () => periodApi.getAll().then(res => res.data),
  });
}

export function usePeriod(id: string) {
  return useQuery({
    queryKey: queryKeys.period(id),
    queryFn: () => periodApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCurrentPeriod() {
  return useQuery({
    queryKey: queryKeys.currentPeriod(),
    queryFn: () => periodApi.getCurrent().then(res => res.data),
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) =>
      periodApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periods() });
    },
  });
}

export function useClosePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => periodApi.close(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod() });
    },
  });
}

export function usePeriodStats(id: string) {
  return useQuery({
    queryKey: queryKeys.periodStats(id),
    queryFn: () => periodApi.getStats(id).then(res => res.data),
    enabled: !!id,
  });
}

// User income hooks
export function useUserIncomes(periodId: string) {
  return useQuery({
    queryKey: queryKeys.userIncomes(periodId),
    queryFn: () => userIncomeApi.getByPeriod(periodId).then(res => res.data),
    enabled: !!periodId,
  });
}

export function useUpsertUserIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof userIncomeApi.upsert>[0]) =>
      userIncomeApi.upsert(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userIncomes(data.periodId) });
    },
  });
}
