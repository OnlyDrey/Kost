import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, familyApi, User } from '../services/api';
import { queryKeys } from './queryKeys';

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
