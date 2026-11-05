import { ApiError } from "@/lib/api/errors";

export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.isNetworkError) {
    return "Could not connect to DeepResearch AI. Check your connection and try again.";
  }

  if (error.code === "AUTH_INVALID_CREDENTIALS") {
    return "The email or password you entered is incorrect.";
  }

  if (error.code === "AUTH_EMAIL_ALREADY_REGISTERED") {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (error.status === 422) {
    return "Some of the submitted information is invalid. Review the fields and try again.";
  }

  if (error.status !== undefined && error.status >= 500) {
    return "The authentication service is temporarily unavailable. Please try again.";
  }

  return error.message || fallback;
}
