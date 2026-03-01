import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodApi } from '../services/api';
import { queryKeys } from './queryKeys';

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
    mutationFn: (data: { id: string; autoImportSubscriptions?: boolean }) =>
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

export function useGetPeriodDeletionInfo(id: string) {
  return useQuery({
    queryKey: ['periodDeletionInfo', id],
    queryFn: () => periodApi.getDeletionInfo(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useDeletePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => periodApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod() });
    },
  });
}


export function useReopenPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => periodApi.reopen(id).then(res => res.data),
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
