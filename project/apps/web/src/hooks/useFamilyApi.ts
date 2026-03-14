import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { familyApi } from '../services/api';
import { useSettings } from '../stores/settings.context';
import { formatCurrency } from '../utils/currency';
import { queryKeys } from './queryKeys';

// Family configuration data rarely changes; cache for 30 minutes to reduce
// unnecessary round-trips when multiple components mount on the same page.
const FAMILY_CONFIG_STALE_MS = 1000 * 60 * 30;

// ── Categories ────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => familyApi.getCategories().then(res => res.data),
    staleTime: FAMILY_CONFIG_STALE_MS,
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => familyApi.addCategory(name).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useRemoveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => familyApi.removeCategory(name).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useRemoveCategoriesBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => familyApi.removeCategoriesBulk(names).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useRenameCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      familyApi.renameCategory(oldName, newName).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

// ── Payment methods ───────────────────────────────────────────────────────────

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: () => familyApi.getPaymentMethods().then(res => res.data),
    staleTime: FAMILY_CONFIG_STALE_MS,
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => familyApi.addPaymentMethod(name).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() }),
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => familyApi.removePaymentMethod(name).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() }),
  });
}

export function useRemovePaymentMethodsBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => familyApi.removePaymentMethodsBulk(names).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() }),
  });
}

export function useRenamePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      familyApi.renamePaymentMethod(oldName, newName).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() }),
  });
}

// ── Currency ──────────────────────────────────────────────────────────────────

export function useCurrency() {
  return useQuery({
    queryKey: queryKeys.currency(),
    queryFn: () => familyApi.getCurrency().then(res => res.data),
    staleTime: FAMILY_CONFIG_STALE_MS,
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currency: string) => familyApi.updateCurrency(currency).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.currency() }),
  });
}

export function useCurrencySymbolPosition() {
  return useQuery({
    queryKey: queryKeys.currencySymbolPosition(),
    queryFn: () => familyApi.getCurrencySymbolPosition().then(res => res.data),
    staleTime: FAMILY_CONFIG_STALE_MS,
  });
}

export function useUpdateCurrencySymbolPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (position: 'Before' | 'After') =>
      familyApi.updateCurrencySymbolPosition(position).then(res => res.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.currencySymbolPosition() }),
  });
}

/**
 * Returns a pre-configured currency formatter that automatically applies the
 * family's currencySymbolPosition, currency code, and locale settings.
 * Use this hook instead of calling formatCurrency directly so the symbol
 * position preference is honoured everywhere.
 */
export function useCurrencyFormatter() {
  const { data: currency = 'NOK' } = useCurrency();
  const { data: symbolPosition = 'Before' } = useCurrencySymbolPosition();
  const { settings } = useSettings();

  return useCallback(
    (cents: number, showCurrency = true) =>
      formatCurrency(cents, currency, showCurrency, settings.locale, symbolPosition as 'Before' | 'After'),
    [currency, symbolPosition, settings.locale],
  );
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export function useVendors() {
  return useQuery({
    queryKey: queryKeys.vendors(),
    queryFn: () => familyApi.getVendors().then(res => res.data),
    staleTime: FAMILY_CONFIG_STALE_MS,
  });
}

export function useAddVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, logoUrl }: { name: string; logoUrl?: string }) =>
      familyApi.addVendor(name, logoUrl).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors() }),
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; logoUrl?: string | null } }) =>
      familyApi.updateVendor(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors() }),
  });
}

export function useRemoveVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyApi.removeVendor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors() }),
  });
}

export function useRemoveVendorsBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => familyApi.removeVendorsBulk(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors() }),
  });
}
