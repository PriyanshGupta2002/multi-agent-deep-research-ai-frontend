import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export type ConversationScope = "research" | "workspace";

export type ConversationRecord = {
  id: string;
  scope: ConversationScope;
  research_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationListResponse = {
  items: ConversationRecord[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
};

export type ConversationCreateRequest = {
  scope: ConversationScope;
  research_id?: string;
  title?: string;
};

export type ConversationCitation = {
  number: number;
  source_id: string;
  research_id: string;
  title: string | null;
  url: string | null;
};

export type ConversationUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
};

export type FeedbackRating = "positive" | "negative";

export type MessageFeedback = {
  rating: FeedbackRating;
  updated_at?: string;
};

export type ConversationMetadata = {
  model?: string | null;
  usage?: ConversationUsage | null;
  cost?: number | null;
  cost_details?: Record<string, unknown> | null;
  suggested_questions?: string[];
  feedback?: MessageFeedback;
  [key: string]: unknown;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  citations: ConversationCitation[];
  message_metadata: ConversationMetadata | null;
  created_at: string;
  stream_state?: "streaming" | "regenerating" | "complete" | "error";
  retry_content?: string;
  stream_error?: string;
};

export type ConversationStreamEvent = {
  type:
    | "message_start"
    | "regeneration_start"
    | "token"
    | "citations"
    | "usage"
    | "cost"
    | "message_complete"
    | "error";
  data: unknown;
};

export type MessageFeedbackResponse = {
  message_id: string;
  rating: FeedbackRating;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeConversationUsage(
  value: unknown,
): ConversationUsage | null {
  if (!isRecord(value)) return null;
  const usage: ConversationUsage = {};
  for (const key of ["input_tokens", "output_tokens", "total_tokens"] as const) {
    const count = value[key];
    if (typeof count === "number" && Number.isFinite(count)) usage[key] = count;
  }
  return Object.keys(usage).length > 0 ? usage : null;
}

function parseMetadata(value: unknown): ConversationMetadata | null {
  if (!isRecord(value)) return null;
  const metadata: ConversationMetadata = { ...value };
  if (typeof value.model === "string" || value.model === null) {
    metadata.model = value.model;
  }
  metadata.usage = normalizeConversationUsage(value.usage);
  if (typeof value.cost === "number" && Number.isFinite(value.cost)) {
    metadata.cost = value.cost;
  } else if (value.cost === null) {
    metadata.cost = null;
  }
  if (isRecord(value.cost_details)) metadata.cost_details = value.cost_details;
  if (Array.isArray(value.suggested_questions)) {
    metadata.suggested_questions = value.suggested_questions.filter(
      (question): question is string =>
        typeof question === "string" && question.trim().length > 0,
    );
  } else {
    delete metadata.suggested_questions;
  }
  if (
    isRecord(value.feedback) &&
    (value.feedback.rating === "positive" ||
      value.feedback.rating === "negative")
  ) {
    metadata.feedback = {
      rating: value.feedback.rating,
      ...(typeof value.feedback.updated_at === "string"
        ? { updated_at: value.feedback.updated_at }
        : {}),
    };
  } else {
    delete metadata.feedback;
  }
  return metadata;
}

export function normalizeConversationCitations(
  value: unknown,
): ConversationCitation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.number !== "number") return [];
    return [
      {
        number: item.number,
        source_id: typeof item.source_id === "string" ? item.source_id : "",
        research_id:
          typeof item.research_id === "string" ? item.research_id : "",
        title: typeof item.title === "string" ? item.title : null,
        url: typeof item.url === "string" ? item.url : null,
      },
    ];
  });
}

function parseConversation(value: unknown): ConversationRecord {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.scope !== "research" && value.scope !== "workspace") ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    throw new Error("The conversation response has an unexpected format.");
  }
  return {
    id: value.id,
    scope: value.scope,
    research_id: typeof value.research_id === "string" ? value.research_id : null,
    title: typeof value.title === "string" ? value.title : null,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function parseMessages(payload: unknown): ConversationMessage[] {
  if (!Array.isArray(payload)) {
    throw new Error("The conversation messages response has an unexpected format.");
  }
  return payload.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.conversation_id !== "string" ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      typeof item.created_at !== "string"
    ) {
      return [];
    }
    return [
      {
        id: item.id,
        conversation_id: item.conversation_id,
        role: item.role,
        content: item.content,
        citations: normalizeConversationCitations(item.citations),
        message_metadata: parseMetadata(item.message_metadata),
        created_at: item.created_at,
        stream_state: "complete" as const,
      },
    ];
  });
}

function parseSseFrame(frame: string): ConversationStreamEvent | undefined {
  let eventType: string | undefined;
  const dataLines: string[] = [];

  for (const line of frame.split(/\r\n|\r|\n/)) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }
  if (dataLines.length === 0) return undefined;

  const rawData = dataLines.join("\n");
  let data: unknown = rawData;
  try {
    data = JSON.parse(rawData) as unknown;
  } catch {
    // The SSE protocol permits plain-text data.
  }
  const record = isRecord(data) ? data : undefined;
  const type = eventType ?? record?.type ?? record?.event;
  if (
    type !== "message_start" &&
    type !== "regeneration_start" &&
    type !== "token" &&
    type !== "citations" &&
    type !== "usage" &&
    type !== "cost" &&
    type !== "message_complete" &&
    type !== "error"
  ) {
    return undefined;
  }
  return { type, data };
}

export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ConversationStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      while (true) {
        const boundary = /\r\n\r\n|\r\r|\n\n/.exec(buffer);
        if (!boundary || boundary.index === undefined) break;
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const event = parseSseFrame(frame);
        if (event) yield event;
      }
      if (done) {
        if (buffer.trim()) {
          const event = parseSseFrame(buffer);
          if (event) yield event;
        }
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") return payload;
  if (isRecord(payload)) {
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.detail === "string") return payload.detail;
    if (isRecord(payload.detail) && typeof payload.detail.message === "string") {
      return payload.detail.message;
    }
  }
  return fallback;
}

async function streamEvents(
  path: string,
  signal: AbortSignal,
  onEvent: (event: ConversationStreamEvent) => void,
  options: { body?: string; fallback: string },
): Promise<void> {
  const baseURL =
    apiClient.defaults.baseURL ||
    (typeof window === "undefined" ? "" : window.location.origin);
  const response = await fetch(new URL(path, baseURL), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: options.body } : {}),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      // Preserve the plain-text server error.
    }
    throw new ApiError(errorMessage(payload, options.fallback), response.status);
  }
  if (!response.body) {
    throw new Error("The streaming response did not include a readable body.");
  }
  for await (const event of parseSSEStream(response.body)) onEvent(event);
}

export const conversationsApi = {
  async list(
    scope?: ConversationScope,
    page = 1,
    limit = 100,
  ): Promise<ConversationListResponse> {
    const { data } = await apiClient.get<unknown>("/api/v1/conversations", {
      params: { scope, page, limit },
    });
    if (
      !isRecord(data) ||
      !Array.isArray(data.items) ||
      typeof data.total !== "number" ||
      typeof data.page !== "number" ||
      typeof data.limit !== "number" ||
      typeof data.has_next !== "boolean"
    ) {
      throw new Error("The conversation list response has an unexpected format.");
    }
    return {
      items: data.items.map(parseConversation),
      total: data.total,
      page: data.page,
      limit: data.limit,
      has_next: data.has_next,
    };
  },

  async create(payload: ConversationCreateRequest): Promise<ConversationRecord> {
    const { data } = await apiClient.post<unknown>(
      "/api/v1/conversations",
      payload,
    );
    return parseConversation(data);
  },

  async get(conversationId: string): Promise<ConversationRecord> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
    );
    return parseConversation(data);
  },

  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
    return parseMessages(data);
  },

  async submitMessageFeedback(
    conversationId: string,
    messageId: string,
    rating: FeedbackRating,
  ): Promise<MessageFeedbackResponse> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/feedback`,
      { rating },
    );
    if (
      !isRecord(data) ||
      typeof data.message_id !== "string" ||
      data.message_id !== messageId ||
      (data.rating !== "positive" && data.rating !== "negative") ||
      data.rating !== rating
    ) {
      throw new Error("The message feedback response has an unexpected format.");
    }
    return { message_id: data.message_id, rating: data.rating };
  },

  async findOrCreateResearch(researchId: string): Promise<ConversationRecord> {
    let page = 1;
    while (true) {
      const result = await conversationsApi.list("research", page, 100);
      const existing = result.items.find(
        (conversation) => conversation.research_id === researchId,
      );
      if (existing) return existing;
      if (!result.has_next) break;
      page += 1;
    }
    return conversationsApi.create({
      scope: "research",
      research_id: researchId,
    });
  },

  async streamMessage(
    conversationId: string,
    content: string,
    signal: AbortSignal,
    onEvent: (event: ConversationStreamEvent) => void,
  ): Promise<void> {
    const path = `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/stream`;
    await streamEvents(path, signal, onEvent, {
      body: JSON.stringify({ content }),
      fallback: "Could not send your message.",
    });
  },

  async regenerateMessage(
    conversationId: string,
    messageId: string,
    signal: AbortSignal,
    onEvent: (event: ConversationStreamEvent) => void,
  ): Promise<void> {
    const path = `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/regenerate`;
    await streamEvents(path, signal, onEvent, {
      fallback: "Could not regenerate the response.",
    });
  },
};
