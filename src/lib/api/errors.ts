import axios from "axios";
import type { ApiErrorPayload } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly isNetworkError = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

export function normalizeApiError(error: unknown): Error {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error
      ? error
      : new Error("An unexpected error occurred.", { cause: error });
  }

  const payload = error.response?.data;
  const detail =
    typeof payload?.detail === "string"
      ? payload.detail
      : payload?.detail?.message;

  return new ApiError(
    detail || payload?.message || error.message,
    error.response?.status,
    payload?.error_code || payload?.code,
    !error.response,
    { cause: error },
  );
}
