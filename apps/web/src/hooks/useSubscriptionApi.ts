import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi, Subscription } from '../services/api';
import { queryKeys } from './queryKeys';

export function useSubscriptions(activeOnly?: boolean) {
  return useQuery({
    queryKey: queryKeys.subscriptions(),
    queryFn: () => subscriptionApi.getAll(activeOnly).then(res => res.data),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: queryKeys.subscription(id),
    queryFn: () => subscriptionApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof subscriptionApi.create>[0]) =>
      subscriptionApi.create(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions() }),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subscription> }) =>
      subscriptionApi.update(id, data).then(res => res.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription(updated.id) });
      queryClient.setQueryData(queryKeys.subscription(updated.id), updated);
    },
  });
}

export function useToggleSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionApi.toggleActive(id).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions() }),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions() }),
  });
}

export function useGenerateSubscriptionInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => subscriptionApi.generateForPeriod(periodId).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod() });
    },
  });
}
