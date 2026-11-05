"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authUserQueryKey } from "@/features/auth/hooks/use-auth";
import {
  savedReportsApi,
  type GetSavedReportsParams,
  type SavedReportStatus,
  type SavedReportsResponse,
} from "@/features/saved-reports/api/saved-reports-api";
import { ApiError } from "@/lib/api/errors";

export const savedReportsListQueryKey = ["saved-reports", "list"] as const;
export const savedReportStatusQueryKey = (researchId: string) =>
  ["saved-reports", "status", researchId] as const;

function shouldRetrySavedReportsQuery(failureCount: number, error: Error) {
  return (
    failureCount < 1 &&
    (!(error instanceof ApiError) ||
      error.isNetworkError ||
      (error.status !== undefined && error.status >= 500))
  );
}

async function invalidateAuthOnUnauthorized(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
) {
  if (error instanceof ApiError && error.status === 401) {
    await queryClient.invalidateQueries({ queryKey: authUserQueryKey });
  }
}

export function useSavedReports(params: Required<
  Pick<GetSavedReportsParams, "page" | "limit">
> &
  Pick<GetSavedReportsParams, "search" | "depth">) {
  const queryClient = useQueryClient();

  return useQuery<SavedReportsResponse>({
    queryKey: [...savedReportsListQueryKey, params],
    queryFn: async () => {
      try {
        return await savedReportsApi.getSavedReports(params);
      } catch (error) {
        await invalidateAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    staleTime: 30_000,
    retry: shouldRetrySavedReportsQuery,
  });
}

export function useSavedReportStatus(
  researchId: string,
  enabled = true,
) {
  const queryClient = useQueryClient();

  return useQuery<SavedReportStatus>({
    queryKey: savedReportStatusQueryKey(researchId),
    queryFn: async () => {
      try {
        return await savedReportsApi.getSavedReportStatus(researchId);
      } catch (error) {
        await invalidateAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(researchId) && enabled,
    staleTime: 30_000,
    retry: shouldRetrySavedReportsQuery,
  });
}

export function useSaveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (researchId: string) =>
      savedReportsApi.saveReport(researchId),
    onSuccess: async (savedReport) => {
      queryClient.setQueryData<SavedReportStatus>(
        savedReportStatusQueryKey(savedReport.research_id),
        { research_id: savedReport.research_id, is_saved: true },
      );
      await queryClient.invalidateQueries({
        queryKey: savedReportsListQueryKey,
      });
    },
    onError: (error) => invalidateAuthOnUnauthorized(queryClient, error),
  });
}

export function useUnsaveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (researchId: string) =>
      savedReportsApi.unsaveReport(researchId),
    onSuccess: async (_result, researchId) => {
      queryClient.setQueryData<SavedReportStatus>(
        savedReportStatusQueryKey(researchId),
        { research_id: researchId, is_saved: false },
      );
      await queryClient.invalidateQueries({
        queryKey: savedReportsListQueryKey,
      });
    },
    onError: (error) => invalidateAuthOnUnauthorized(queryClient, error),
  });
}
