import { apiClient } from "@/lib/api/client";
import type { ResearchDepth } from "@/features/research/api/research-api";

export type SavedReport = {
  id: string;
  research_id: string;
  query: string;
  depth: ResearchDepth;
  report_created_at: string;
  saved_at: string;
  report_preview: string;
};

export type SavedReportMutationResponse = {
  id: string;
  research_id: string;
  query: string;
  depth: ResearchDepth;
  report_created_at: string;
  saved_at: string;
};

export type SavedReportStatus = {
  research_id: string;
  is_saved: boolean;
};

export type UnsaveReportResponse = SavedReportStatus & {
  success: true;
};

export type SavedReportsResponse = {
  items: SavedReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
};

export type GetSavedReportsParams = {
  page?: number;
  limit?: number;
  search?: string;
  depth?: ResearchDepth;
};

const savedReportsPath = "/api/v1/saved-reports";

export const savedReportsApi = {
  async getSavedReports(
    params: GetSavedReportsParams = {},
  ): Promise<SavedReportsResponse> {
    const { data } = await apiClient.get<SavedReportsResponse>(
      savedReportsPath,
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          ...(params.search ? { search: params.search } : {}),
          ...(params.depth ? { depth: params.depth } : {}),
        },
      },
    );
    return data;
  },

  async saveReport(
    researchId: string,
  ): Promise<SavedReportMutationResponse> {
    const { data } = await apiClient.post<SavedReportMutationResponse>(
      savedReportsPath,
      { research_id: researchId },
    );
    return data;
  },

  async getSavedReportStatus(
    researchId: string,
  ): Promise<SavedReportStatus> {
    const { data } = await apiClient.get<SavedReportStatus>(
      `${savedReportsPath}/${encodeURIComponent(researchId)}/status`,
    );
    return data;
  },

  async unsaveReport(researchId: string): Promise<UnsaveReportResponse> {
    const { data } = await apiClient.delete<UnsaveReportResponse>(
      `${savedReportsPath}/${encodeURIComponent(researchId)}`,
    );
    return data;
  },
};
