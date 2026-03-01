/**
 * Barrel re-export — keeps all existing import paths working while the
 * implementation now lives in focused per-domain files.
 *
 * New code should import directly from the domain file (e.g.
 * `import { useInvoices } from './useInvoiceApi'`) for better tree-shaking
 * and readability.
 */

export { queryKeys } from './queryKeys';

export {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from './useInvoiceApi';

export {
  usePeriods,
  usePeriod,
  useCurrentPeriod,
  useCreatePeriod,
  useClosePeriod,
  useReopenPeriod,
  useGetPeriodDeletionInfo,
  useDeletePeriod,
  usePeriodStats,
} from './usePeriodApi';

export {
  useUserIncomes,
  useUpsertUserIncome,
} from './useIncomeApi';

export {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUploadAvatar,
  useRemoveAvatar,
  useUploadVendorLogo,
} from './useUserApi';

export {
  useChangePassword,
  useDeleteMyAccount,
  useTwoFactorStatus,
  useSetupTwoFactor,
  useEnableTwoFactor,
  useDisableTwoFactor,
  useRegenerateRecoveryCodes,
} from './useAuthApi';

export {
  useAddPayment,
  useUpdatePayment,
  useDeletePayment,
} from './usePaymentApi';

export {
  useCategories,
  useAddCategory,
  useRemoveCategory,
  useRemoveCategoriesBulk,
  useRenameCategory,
  usePaymentMethods,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useRemovePaymentMethodsBulk,
  useRenamePaymentMethod,
  useCurrency,
  useUpdateCurrency,
  useCurrencySymbolPosition,
  useUpdateCurrencySymbolPosition,
  useCurrencyFormatter,
  useVendors,
  useAddVendor,
  useUpdateVendor,
  useRemoveVendor,
  useRemoveVendorsBulk,
} from './useFamilyApi';

export {
  useSubscriptions,
  useSubscription,
  useCreateSubscription,
  useUpdateSubscription,
  useToggleSubscription,
  useDeleteSubscription,
  useGenerateSubscriptionInvoices,
} from './useSubscriptionApi';
