import { apiClient } from "@/lib/api/client";

export type ResearchDepth = "quick" | "standard" | "comprehensive";
export type ResearchStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ResearchRecord = {
  id: string;
  query: string;
  depth: ResearchDepth;
  status: ResearchStatus;
  created_at: string;
};

export type ResearchTaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  result: string | null;
  error: string | null;
};

export type ResearchSourceRecord = {
  id: string;
  url: string;
  title: string | null;
  snippet: string | null;
  source_metadata: Record<string, unknown> | null;
  created_at: string;
};

export type StructuredReportSource = {
  title?: string | null;
  url?: string | null;
  published_date?: string | null;
};

export type StructuredResearchFinding = {
  claim: string;
  explanation: string;
  supporting_sources?: string[];
};

export type StructuredAggregatedResults = {
  research?: string;
  findings?: StructuredResearchFinding[];
  sources?: StructuredReportSource[] | null;
  conflicting_evidence?: string[];
  research_gaps?: string[];
};

export type ResearchReportStructuredContent = {
  aggregated_results?: StructuredAggregatedResults | null;
  critic_score?: number | null;
  critic_feedback?: string | null;
  retry_count?: number | null;
};

export type ResearchReportRecord = {
  id: string;
  research_id: string;
  content: string;
  structured_content: ResearchReportStructuredContent | null;
  created_at: string;
};

export type ResearchListResponse = {
  items: ResearchRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
};

export type CreateResearchRequest = {
  query: string;
  depth: ResearchDepth;
};

const researchPath = "/api/v1/research";

export const researchApi = {
  async list(page = 1, limit = 10): Promise<ResearchListResponse> {
    const { data } = await apiClient.get<ResearchListResponse>(researchPath, {
      params: { page, limit },
    });
    return data;
  },

  async create(payload: CreateResearchRequest): Promise<ResearchRecord> {
    const { data } = await apiClient.post<ResearchRecord>(
      researchPath,
      payload,
    );
    return data;
  },

  async get(researchId: string): Promise<ResearchRecord> {
    const { data } = await apiClient.get<ResearchRecord>(
      `${researchPath}/${encodeURIComponent(researchId)}`,
    );
    return data;
  },

  async getTasks(researchId: string): Promise<ResearchTaskRecord[]> {
    const { data } = await apiClient.get<ResearchTaskRecord[]>(
      `${researchPath}/${encodeURIComponent(researchId)}/tasks`,
    );
    return data;
  },

  async getSources(researchId: string): Promise<ResearchSourceRecord[]> {
    const { data } = await apiClient.get<ResearchSourceRecord[]>(
      `${researchPath}/${encodeURIComponent(researchId)}/sources`,
    );
    return data;
  },

  async getReport(researchId: string): Promise<ResearchReportRecord> {
    const { data } = await apiClient.get<ResearchReportRecord>(
      `${researchPath}/${encodeURIComponent(researchId)}/report`,
    );
    return data;
  },

  async cancel(researchId: string): Promise<ResearchRecord> {
    const { data } = await apiClient.post<ResearchRecord>(
      `${researchPath}/${encodeURIComponent(researchId)}/cancel`,
    );
    return data;
  },
};
