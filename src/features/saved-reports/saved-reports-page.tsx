"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Clock3,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import type { ResearchDepth } from "@/features/research/api/research-api";
import { getSavedReportExcerpt } from "@/features/saved-reports/saved-report-excerpt";
import {
  useSavedReports,
  useUnsaveReport,
} from "@/features/saved-reports/hooks/use-saved-reports";
import type { SavedReport } from "@/features/saved-reports/api/saved-reports-api";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const depthLabels: Record<ResearchDepth, string> = {
  quick: "Quick",
  standard: "Standard",
  comprehensive: "Comprehensive",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date,
  );
}

function SavedReportCard({
  report,
  onUnsave,
  isUnsavePending,
  isMutationPending,
}: {
  report: SavedReport;
  onUnsave: (researchId: string) => void;
  isUnsavePending: boolean;
  isMutationPending: boolean;
}) {
  const reportHref = `/research/${encodeURIComponent(report.research_id)}/report`;

  return (
    <article className="flex min-h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
          <Bookmark className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-3 text-sm font-semibold leading-5 tracking-tight">
            {report.query}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {depthLabels[report.depth]}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock3 className="size-3" />
              Report {formatDate(report.report_created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-[6.25rem]">
        {report.report_preview.trim() ? (
          <p className="line-clamp-5 break-words text-xs leading-5 text-muted-foreground">
            {getSavedReportExcerpt(report.report_preview)}
          </p>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            No report preview is available.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5">
        <p className="text-[10px] text-muted-foreground">
          Saved {formatDate(report.saved_at)}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <Link
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
            href={reportHref}
          >
            Open full report
            <ArrowUpRight className="size-3.5" />
          </Link>
          <Button
            disabled={isMutationPending}
            onClick={() => onUnsave(report.research_id)}
            size="sm"
            variant="ghost"
          >
            {isUnsavePending ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Bookmark className="size-3.5" />
            )}
            {isUnsavePending ? "Removing…" : "Unsave"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function SavedReportsSkeleton() {
  return (
    <div
      aria-label="Loading saved reports"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="h-56 animate-pulse rounded-xl border bg-card"
          key={index}
        />
      ))}
      <span className="sr-only">Loading saved reports</span>
    </div>
  );
}

export function SavedReportsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [depth, setDepth] = useState<ResearchDepth | "">("");
  const [page, setPage] = useState(1);
  const limit = 9;
  const query = useSavedReports({
    page,
    limit,
    search: search || undefined,
    depth: depth || undefined,
  });
  const unsaveMutation = useUnsaveReport();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function updateDepth(value: ResearchDepth | "") {
    setDepth(value);
    setPage(1);
  }

  const result = query.data;
  const hasFilters = Boolean(search || depth);
  const isUnauthorized =
    query.error instanceof ApiError && query.error.status === 401;

  function handleUnsave(researchId: string) {
    unsaveMutation.mutate(researchId, {
      onSuccess: () => {
        if (result?.items.length === 1 && page > 1) {
          setPage((current) => current - 1);
        }
      },
    });
  }

  return (
    <main className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Saved Reports</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          A personal library of research reports you’ve saved for later.
        </p>
      </header>

      <section
        aria-label="Search and filter saved reports"
        className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search research questions</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search reports…"
            type="search"
            value={searchInput}
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span>Depth</span>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            onChange={(event) =>
              updateDepth(event.target.value as ResearchDepth | "")
            }
            value={depth}
          >
            <option value="">All depths</option>
            <option value="quick">Quick</option>
            <option value="standard">Standard</option>
            <option value="comprehensive">Comprehensive</option>
          </select>
        </label>
      </section>

      {query.isPending ? (
        <SavedReportsSkeleton />
      ) : query.isError ? (
        <div className="flex flex-col items-center rounded-xl border bg-card px-5 py-12 text-center">
          <p className="text-sm font-medium">
            {isUnauthorized
              ? "Sign in to view saved reports"
              : "Couldn’t load saved reports"}
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            {getResearchErrorMessage(
              query.error,
              "An unexpected error occurred while loading saved reports.",
            )}
          </p>
          {isUnauthorized ? (
            <Link
              className="mt-4 inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted"
              href="/login"
            >
              Sign in
            </Link>
          ) : (
            <Button
              className="mt-4"
              onClick={() => void query.refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
          )}
        </div>
      ) : !result || result.items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border bg-card px-5 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full border bg-muted/60 text-muted-foreground">
            {hasFilters ? (
              <Search className="size-4" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </div>
          <h2 className="mt-4 text-sm font-semibold">
            {hasFilters ? "No matching reports" : "No saved reports yet"}
          </h2>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            {hasFilters
              ? "Try another search or depth filter."
              : "Save a completed research report to keep it easy to find here."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {hasFilters ? (
              <Button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setDepth("");
                  setPage(1);
                }}
                size="sm"
                variant="outline"
              >
                Clear filters
              </Button>
            ) : (
              <>
                <Link
                  className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted"
                  href="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted"
                  href="/history"
                >
                  Research History
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {result.total} {result.total === 1 ? "report" : "reports"}
            </p>
            {query.isFetching && (
              <span className="text-[10px] text-muted-foreground">
                Updating…
              </span>
            )}
          </div>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((report) => (
              <SavedReportCard
                isUnsavePending={
                  unsaveMutation.isPending &&
                  unsaveMutation.variables === report.research_id
                }
                isMutationPending={unsaveMutation.isPending}
                key={report.id}
                onUnsave={handleUnsave}
                report={report}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Page {result.page} of {Math.max(result.total_pages, 1)} ·{" "}
              {result.total} saved {result.total === 1 ? "report" : "reports"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={result.page <= 1 || query.isFetching}
                onClick={() => setPage(result.page - 1)}
                size="sm"
                variant="outline"
              >
                <ArrowLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                disabled={!result.has_more || query.isFetching}
                onClick={() => setPage(result.page + 1)}
                size="sm"
                variant="outline"
              >
                Next
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
      {unsaveMutation.isSuccess && (
        <p
          aria-live="polite"
          className="mt-3 text-xs text-muted-foreground"
          role="status"
        >
          Report removed from your saved library.
        </p>
      )}
      {unsaveMutation.isError && (
        <p
          aria-live="polite"
          className={cn(
            "mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive",
          )}
          role="alert"
        >
          {getResearchErrorMessage(
            unsaveMutation.error,
            "Could not remove the report from your saved library.",
          )}
        </p>
      )}
    </main>
  );
}
