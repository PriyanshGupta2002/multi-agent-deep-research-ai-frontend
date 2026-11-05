import { ApiError } from "@/lib/api/errors";

export function getResearchErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.isNetworkError) {
    return "Could not connect to the research service. Check your connection and try again.";
  }

  if (error.code === "RESEARCH_ENQUEUE_FAILED") {
    return "The research service is temporarily unavailable. Please try again.";
  }

  if (error.status === 401) {
    return "Your session may have expired. Sign in again to continue.";
  }

  if (error.status === 403) {
    return "You don’t have permission to access this research.";
  }

  if (error.status === 404) {
    return "This research could not be found or is no longer available.";
  }

  if (error.status !== undefined && error.status >= 500) {
    return "The research service encountered a problem. Please try again.";
  }

  return error.message || fallback;
}
