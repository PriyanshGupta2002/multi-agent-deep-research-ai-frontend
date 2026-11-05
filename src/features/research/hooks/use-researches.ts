"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authUserQueryKey } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { researchApi } from "@/features/research/api/research-api";
import type {
  CreateResearchRequest,
  ResearchReportRecord,
  ResearchStatus,
} from "@/features/research/api/research-api";

export const researchListQueryKey = ["research", "list"] as const;
export const researchDetailQueryKey = (researchId: string) =>
  ["research", "detail", researchId] as const;
export const researchTasksQueryKey = (researchId: string) =>
  ["research", "tasks", researchId] as const;
export const researchSourcesQueryKey = (researchId: string) =>
  ["research", "sources", researchId] as const;
export const researchReportQueryKey = (researchId: string) =>
  ["research", "report", researchId] as const;

function shouldRetryResearchQuery(failureCount: number, error: Error) {
  return (
    failureCount < 1 &&
    (!(error instanceof ApiError) ||
      error.isNetworkError ||
      (error.status !== undefined && error.status >= 500))
  );
}

async function refreshAuthOnUnauthorized(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
) {
  if (error instanceof ApiError && error.status === 401) {
    await queryClient.invalidateQueries({ queryKey: authUserQueryKey });
  }
}

export function useResearches(page = 1, limit = 10) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...researchListQueryKey, { page, limit }],
    queryFn: async () => {
      try {
        return await researchApi.list(page, limit);
      } catch (error) {
        await refreshAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    staleTime: 30_000,
    retry: shouldRetryResearchQuery,
  });
}

export function useResearchDetail(researchId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: researchDetailQueryKey(researchId),
    queryFn: async () => {
      try {
        return await researchApi.get(researchId);
      } catch (error) {
        await refreshAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(researchId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 5_000 : false;
    },
    retry: shouldRetryResearchQuery,
  });
}

export function useResearchTasks(
  researchId: string,
  enabled: boolean,
  status?: ResearchStatus,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: researchTasksQueryKey(researchId),
    queryFn: async () => {
      try {
        return await researchApi.getTasks(researchId);
      } catch (error) {
        await refreshAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(researchId) && enabled,
    refetchInterval:
      status === "queued" || status === "running" ? 5_000 : false,
    retry: shouldRetryResearchQuery,
  });
}

export function useResearchSources(
  researchId: string,
  enabled: boolean,
  status?: ResearchStatus,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: researchSourcesQueryKey(researchId),
    queryFn: async () => {
      try {
        return await researchApi.getSources(researchId);
      } catch (error) {
        await refreshAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(researchId) && enabled,
    refetchInterval:
      status === "queued" || status === "running" ? 5_000 : false,
    retry: shouldRetryResearchQuery,
  });
}

export function useResearchReport(
  researchId: string,
  researchStatus?: ResearchStatus,
) {
  const queryClient = useQueryClient();

  return useQuery<ResearchReportRecord>({
    queryKey: researchReportQueryKey(researchId),
    queryFn: async () => {
      try {
        return await researchApi.getReport(researchId);
      } catch (error) {
        await refreshAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(researchId),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const error = query.state.error;
      const isReportNotReady =
        error instanceof ApiError &&
        error.code === "RESEARCH_REPORT_NOT_FOUND";
      return isReportNotReady &&
        (researchStatus === "queued" || researchStatus === "running")
        ? 10_000
        : false;
    },
    retry: shouldRetryResearchQuery,
  });
}

export function useCancelResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (researchId: string) => researchApi.cancel(researchId),
    onSuccess: async (research) => {
      queryClient.setQueryData(researchDetailQueryKey(research.id), research);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: researchDetailQueryKey(research.id),
        }),
        queryClient.invalidateQueries({
          queryKey: researchTasksQueryKey(research.id),
        }),
        queryClient.invalidateQueries({
          queryKey: researchSourcesQueryKey(research.id),
        }),
        queryClient.invalidateQueries({ queryKey: researchListQueryKey }),
      ]);
    },
    onError: (error) => refreshAuthOnUnauthorized(queryClient, error),
  });
}

export function useCreateResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateResearchRequest) =>
      researchApi.create(payload),
    onSuccess: async (research) => {
      queryClient.setQueryData(researchDetailQueryKey(research.id), research);
      await queryClient.invalidateQueries({
        queryKey: researchListQueryKey,
      });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 401) {
        await queryClient.invalidateQueries({
          queryKey: authUserQueryKey,
        });
      }
    },
  });
}
