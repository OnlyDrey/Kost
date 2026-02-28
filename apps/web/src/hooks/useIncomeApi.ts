import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userIncomeApi } from '../services/api';
import { queryKeys } from './queryKeys';

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
