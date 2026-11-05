"use client";

import { Bookmark, BookmarkCheck, LoaderCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useSaveReport,
  useSavedReportStatus,
  useUnsaveReport,
} from "@/features/saved-reports/hooks/use-saved-reports";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import { ApiError } from "@/lib/api/errors";

export function SaveReportButton({
  researchId,
  canSave,
  size = "default",
}: {
  researchId: string;
  canSave: boolean;
  size?: "default" | "sm";
}) {
  const statusQuery = useSavedReportStatus(researchId, canSave);
  const saveMutation = useSaveReport();
  const unsaveMutation = useUnsaveReport();
  const mutationError = saveMutation.error ?? unsaveMutation.error;
  const pending = saveMutation.isPending || unsaveMutation.isPending;
  const isSaved = statusQuery.data?.is_saved === true;
  const isChecking = canSave && statusQuery.isPending;
  const statusError = statusQuery.error;
  const error = statusError ?? mutationError;
  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const isForbidden = error instanceof ApiError && error.status === 403;

  function toggleSavedState() {
    if (!canSave || pending || isChecking || statusQuery.isError) return;

    saveMutation.reset();
    unsaveMutation.reset();

    if (isSaved) {
      unsaveMutation.mutate(researchId);
    } else {
      saveMutation.mutate(researchId);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        aria-pressed={isSaved}
        disabled={!canSave || pending || isChecking || statusQuery.isError}
        onClick={toggleSavedState}
        size={size}
        title={
          canSave
            ? undefined
            : "Only completed research reports can be saved."
        }
        variant="outline"
      >
        {pending || isChecking ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="size-4 fill-current" />
        ) : (
          <Bookmark className="size-4" />
        )}
        {pending
          ? isSaved
            ? "Removing…"
            : "Saving…"
          : isChecking
            ? "Checking…"
            : isSaved
              ? "Saved"
              : "Save Report"}
      </Button>

      {error ? (
        <div
          aria-live="polite"
          className="max-w-64 text-[11px] leading-4 text-destructive"
          role="alert"
        >
          <p>
            {getResearchErrorMessage(
              error,
              "Could not update your saved reports.",
            )}
          </p>
          {isUnauthorized ? (
            <Link
              className="mt-1 inline-block font-medium underline underline-offset-2"
              href="/login"
            >
              Sign in again
            </Link>
          ) : !isForbidden && statusQuery.isError ? (
            <button
              className="mt-1 inline-flex items-center gap-1 font-medium underline underline-offset-2"
              onClick={() => void statusQuery.refetch()}
              type="button"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
