import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementApi } from "../services/api";

export function useSettlementSummary(periodId?: string) {
  return useQuery({
    queryKey: ["settlements", "summary", periodId],
    queryFn: () => settlementApi.getSummary(periodId!).then((res) => res.data),
    enabled: !!periodId,
    staleTime: 30_000,
  });
}

export function useSettlementWarnings(periodId?: string) {
  return useQuery({
    queryKey: ["settlements", "warnings", periodId],
    queryFn: () => settlementApi.getWarnings(periodId!).then((res) => res.data),
    enabled: !!periodId,
    staleTime: 30_000,
  });
}

export function useCreateSettlementEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settlementApi.createEntry,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["settlements", "summary", variables.periodId] });
    },
  });
}

export function useCreateSettlementPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settlementApi.createPlan,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["settlements", "summary", variables.sourcePeriodId] });
    },
  });
}

export function useReverseSettlementEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ periodId, entryId, comment }: { periodId: string; entryId: string; comment: string }) =>
      settlementApi.reverseEntry(periodId, entryId, comment),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["settlements", "summary", variables.periodId] });
    },
  });
}
