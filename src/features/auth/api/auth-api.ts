import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/features/auth/types";

const authPath = "/api/v1/auth";

export const authApi = {
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const { data } = await apiClient.post<AuthUser>(
      `${authPath}/register`,
      credentials,
    );
    return data;
  },

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { data } = await apiClient.post<AuthUser>(
      `${authPath}/login`,
      credentials,
    );
    return data;
  },

  async currentUser(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>(`${authPath}/me`);
    return data;
  },

  async refresh(): Promise<AuthUser> {
    const { data } = await apiClient.post<AuthUser>(`${authPath}/refresh`);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post<{ message: string }>(`${authPath}/logout`);
  },
};

let refreshInFlight: Promise<AuthUser> | null = null;

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    return await authApi.currentUser();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      refreshInFlight ??= authApi.refresh().finally(() => {
        refreshInFlight = null;
      });
      return await refreshInFlight;
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        return null;
      }

      throw refreshError;
    }
  }
}
