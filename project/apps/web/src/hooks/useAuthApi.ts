import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

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
