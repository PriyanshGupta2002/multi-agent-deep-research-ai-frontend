"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authApi, getAuthenticatedUser } from "@/features/auth/api/auth-api";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/features/auth/types";

export const authUserQueryKey = ["auth", "current-user"] as const;

export function useAuthUser() {
  return useQuery<AuthUser | null>({
    queryKey: authUserQueryKey,
    queryFn: getAuthenticatedUser,
    enabled: typeof window !== "undefined",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(authUserQueryKey, user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      authApi.register(credentials),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      queryClient.setQueryData(authUserQueryKey, null);
      await queryClient.invalidateQueries({
        queryKey: authUserQueryKey,
        refetchType: "none",
      });
    },
  });
}
