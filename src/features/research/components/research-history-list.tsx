"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { authUserQueryKey } from "@/features/auth/hooks/use-auth";
import { useResearches } from "@/features/research/hooks/use-researches";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import type {
  ResearchDepth,
  ResearchRecord,
  ResearchStatus,
} from "@/features/research/api/research-api";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const statusClassNames: Record<ResearchStatus, string> = {
  queued: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  running: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  completed:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "border-destructive/25 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const statusLabels: Record<ResearchStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const depthLabels: Record<ResearchDepth, string> = {
  quick: "Quick",
  standard: "Standard",
  comprehensive: "Comprehensive",
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ResearchRow({ research }: { research: ResearchRecord }) {
  const search = new URLSearchParams({
    topic: research.query,
    depth: research.depth,
  });
  const href = `/research/${encodeURIComponent(research.id)}?${search.toString()}`;

  return (
    <Link
      className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:px-5"
      href={href}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
          <Search className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium leading-5 group-hover:underline">
            {research.query}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3" />
              {formatCreatedAt(research.created_at)}
            </span>
            <span>{depthLabels[research.depth]}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-medium",
            statusClassNames[research.status],
          )}
        >
          {statusLabels[research.status]}
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

function HistorySkeleton() {
  return (
    <div aria-label="Loading research history" className="divide-y" role="status">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5" key={index}>
          <div className="size-9 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading research history</span>
    </div>
  );
}

export function ResearchHistoryList({
  page = 1,
  limit = 5,
  paginated = false,
  onPageChange,
}: {
  page?: number;
  limit?: number;
  paginated?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const query = useResearches(page, limit);
  const queryClient = useQueryClient();
  const result = query.data;

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      void queryClient.invalidateQueries({ queryKey: authUserQueryKey });
    }
  }, [query.error, queryClient]);

  if (query.isPending) return <HistorySkeleton />;

  if (query.isError) {
    return (
      <div className="flex flex-col items-center px-5 py-10 text-center">
        <p className="text-sm font-medium">Couldn’t load research history</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          {getResearchErrorMessage(
            query.error,
            "An unexpected error occurred while loading research.",
          )}
        </p>
        <Button
          className="mt-4"
          onClick={() => void query.refetch()}
          size="sm"
          variant="outline"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  if (!result || result.items.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full border bg-muted/60 text-muted-foreground">
          <Clock3 className="size-4" />
        </div>
        <p className="mt-3 text-sm font-medium">No research yet</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          Start an investigation and it will appear here with its live status.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y">
        {result.items.map((research) => (
          <ResearchRow key={research.id} research={research} />
        ))}
      </div>
      {paginated && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-muted-foreground">
            Page {result.page} of {Math.max(result.total_pages, 1)} · {result.total}{" "}
            {result.total === 1 ? "research" : "research projects"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={result.page <= 1 || !onPageChange}
              onClick={() => onPageChange?.(result.page - 1)}
              size="sm"
              variant="outline"
            >
              <ArrowLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              disabled={!result.has_more || !onPageChange}
              onClick={() => onPageChange?.(result.page + 1)}
              size="sm"
              variant="outline"
            >
              Next
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
