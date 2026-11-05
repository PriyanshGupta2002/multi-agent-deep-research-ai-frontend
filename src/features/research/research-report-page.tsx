"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { useResearchDetail, useResearchReport } from "@/features/research/hooks/use-researches";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import { ReportReader } from "@/features/research/report-reader";

function ReportSkeleton() {
  return (
    <div
      aria-label="Loading research report"
      className="mx-auto max-w-6xl animate-pulse space-y-5"
      role="status"
    >
      <div className="h-5 w-36 rounded bg-muted" />
      <div className="h-24 rounded-xl border bg-card" />
      <div className="h-80 rounded-xl border bg-card" />
      <span className="sr-only">Loading research report</span>
    </div>
  );
}

function ReportError({
  researchId,
  error,
  retry,
}: {
  researchId: string;
  error: Error;
  retry: () => void;
}) {
  const isReportNotReady =
    error instanceof ApiError &&
    error.code === "RESEARCH_REPORT_NOT_FOUND";
  const isUnknownResearch =
    error instanceof ApiError && error.code === "RESEARCH_NOT_FOUND";
  const isUnauthorized =
    error instanceof ApiError && error.status === 401;
  const isForbidden =
    error instanceof ApiError && error.status === 403;
  const workspaceHref = `/research/${encodeURIComponent(researchId)}`;

  if (isReportNotReady) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
          <span className="text-sm font-semibold">R</span>
        </div>
        <h1 className="mt-4 text-lg font-semibold">Report is not ready yet</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The report has not been published for this research. If the research
          is still in progress, this page will check again automatically.
        </p>
        <Link
          className={`${buttonVariants({ variant: "outline" })} mt-5`}
          href={workspaceHref}
        >
          Return to research workspace
        </Link>
      </main>
    );
  }

  const title = isUnknownResearch
    ? "Research unavailable"
    : isUnauthorized
      ? "Sign in required"
      : isForbidden
        ? "Access denied"
        : "Couldn’t load report";
  const description = getResearchErrorMessage(
    error,
    "An unexpected error occurred while loading the report.",
  );

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {isUnauthorized ? (
          <Link className={buttonVariants({ variant: "outline" })} href="/login">
            Sign in
          </Link>
        ) : isUnknownResearch || isForbidden ? (
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/"
          >
            Back to dashboard
          </Link>
        ) : (
          <Button onClick={retry} variant="outline">
            Try again
          </Button>
        )}
        {!isUnauthorized && !isUnknownResearch && !isForbidden && (
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={workspaceHref}
          >
            Research workspace
          </Link>
        )}
      </div>
    </main>
  );
}

export function ResearchReportPage({ researchId }: { researchId: string }) {
  const researchQuery = useResearchDetail(researchId);
  const researchStatus = researchQuery.data?.status;
  const reportQuery = useResearchReport(researchId, researchStatus);
  const reportError = reportQuery.error;
  const refetchReport = reportQuery.refetch;
  const refreshedAfterCompletion = useRef(false);

  useEffect(() => {
    const currentStatus = researchQuery.data?.status;
    if (currentStatus !== "completed") {
      refreshedAfterCompletion.current = false;
      return;
    }

    if (
      !refreshedAfterCompletion.current &&
      reportError instanceof ApiError &&
      reportError.code === "RESEARCH_REPORT_NOT_FOUND"
    ) {
      refreshedAfterCompletion.current = true;
      void refetchReport();
    }
  }, [researchQuery.data?.status, reportError, refetchReport]);

  if (reportQuery.isPending) return <ReportSkeleton />;
  if (reportQuery.isError) {
    return (
      <ReportError
        error={reportQuery.error}
        researchId={researchId}
        retry={() => void reportQuery.refetch()}
      />
    );
  }

  return (
    <ReportReader
      report={reportQuery.data}
      research={researchQuery.data}
    />
  );
}
