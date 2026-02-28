import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invoiceApi, periodApi, userIncomeApi, userApi, authApi, paymentApi, familyApi, subscriptionApi, Invoice, Period, UserIncome, PeriodStats, User, Subscription } from '../services/api';
import { addToOfflineQueue } from '../idb/queue';
import { useSettings } from '../stores/settings.context';
import { formatCurrency } from '../utils/currency';

// Query keys
export const queryKeys = {
  invoices: (periodId?: string) => ['invoices', periodId] as const,
  invoice: (id: string) => ['invoice', id] as const,
  periods: () => ['periods'] as const,
  period: (id: string) => ['period', id] as const,
  currentPeriod: () => ['currentPeriod'] as const,
  periodStats: (id: string) => ['periodStats', id] as const,
  userIncomes: (periodId: string) => ['userIncomes', periodId] as const,
  users: () => ['users'] as const,
  user: (id: string) => ['user', id] as const,
  categories: () => ['categories'] as const,
  paymentMethods: () => ['paymentMethods'] as const,
  currency: () => ['currency'] as const,
  currencySymbolPosition: () => ['currencySymbolPosition'] as const,
  vendors: () => ['vendors'] as const,
  subscriptions: () => ['subscriptions'] as const,
  subscription: (id: string) => ['subscription', id] as const,
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> & { distributionRules?: any } }) =>
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

// User hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: () => userApi.getAll().then(res => res.data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof userApi.create>[0]) =>
      userApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof userApi.update>[1] }) =>
      userApi.update(id, data).then(res => res.data),
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(user.id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return userApi.uploadAvatar(id, fd).then(r => r.data);
    },
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(user.id) });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.removeAvatar(id).then(r => r.data),
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(user.id) });
    },
  });
}

export function useUploadVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('logo', file);
      return familyApi.uploadVendorLogo(id, fd).then(r => r.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors() }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword).then(res => res.data),
  });
}


export function useDeleteMyAccount() {
  return useMutation({
    mutationFn: (currentPassword: string) =>
      authApi.deleteMyAccount(currentPassword).then(res => res.data),
  });
}


export function useTwoFactorStatus() {
  return useQuery({
    queryKey: ['twoFactorStatus'],
    queryFn: () => authApi.getTwoFactorStatus().then(res => res.data),
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: () => authApi.setupTwoFactor().then(res => res.data),
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authApi.enableTwoFactor(code).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['twoFactorStatus'] }),
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currentPassword: string) => authApi.disableTwoFactor(currentPassword).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['twoFactorStatus'] }),
  });
}

export function useRegenerateRecoveryCodes() {
  return useMutation({
    mutationFn: (currentPassword: string) => authApi.regenerateRecoveryCodes(currentPassword).then(res => res.data),
  });
}

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

// Family settings hooks
// Family configuration data rarely changes; cache it for 30 minutes to reduce
// unnecessary round-trips when multiple components mount on the same page.
const FAMILY_CONFIG_STALE_MS = 1000 * 60 * 30;

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

// Currency hooks
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

// Vendor hooks
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

// Subscription hooks
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
