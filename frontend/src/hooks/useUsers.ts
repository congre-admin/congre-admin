import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { QUERY_OPTIONS } from './queryConfig';
import type { AdminUser, Perfil } from '../types';

const QUERY_KEYS = {
  users: (ssId: string) => ['users', ssId] as const,
  perfilesAdmin: (ssId: string) => ['perfilesAdmin', ssId] as const,
};

export function useUsers(ssId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.users(ssId),
    queryFn: async () => {
      return dataService.getUsers(ssId);
    },
    enabled: !!ssId,
    ...QUERY_OPTIONS,
  });
}

export function usePerfilesAdmin(ssId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.perfilesAdmin(ssId),
    queryFn: async () => {
      return dataService.getPerfilesAdmin(ssId);
    },
    enabled: !!ssId,
    ...QUERY_OPTIONS,
  });
}

export function useCreateUser(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { username: string; email?: string; password: string; perfilIds?: string[] }) => {
      return dataService.createUser(ssId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users(ssId) });
    },
  });
}

export function useUpdateUser(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; username?: string; email?: string; perfilIds?: string[]; active?: boolean }) => {
      return dataService.updateUser(ssId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users(ssId) });
    },
  });
}

export function useDeleteUser(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return dataService.deleteUser(ssId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users(ssId) });
    },
  });
}

export function useCreateProfile(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; nombre: string; descripcion?: string; permisos: Record<string, any> }) => {
      return dataService.createProfile(ssId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfilesAdmin(ssId) });
    },
  });
}

export function useUpdateProfile(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; nombre?: string; descripcion?: string; permisos?: Record<string, any> }) => {
      return dataService.updateProfile(ssId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfilesAdmin(ssId) });
    },
  });
}

export function useDeleteProfile(ssId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      return dataService.deleteProfile(ssId, profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.perfilesAdmin(ssId) });
    },
  });
}