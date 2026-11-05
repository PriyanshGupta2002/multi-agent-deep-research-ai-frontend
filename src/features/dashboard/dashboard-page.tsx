"use client";

import {
  ArrowUpRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import { ResearchComposer } from "@/features/dashboard/components/research-composer";
import { ResearchHistoryList } from "@/features/research/components/research-history-list";
import { useResearches } from "@/features/research/hooks/use-researches";

export function DashboardPage() {
  const researchQuery = useResearches(1, 5);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">
            Your Research Workspace
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted-foreground">
            Turn complex questions into structured, evidence-backed research.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:self-auto">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Workspace ready
        </div>
      </div>

      <ResearchComposer />

      <section aria-label="Workspace overview" className="mt-8">
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Research projects
            </p>
            {researchQuery.isPending ? (
              <div
                aria-label="Loading research count"
                className="mt-2 h-8 w-12 animate-pulse rounded bg-muted"
                role="status"
              />
            ) : (
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {researchQuery.isError ? "—" : researchQuery.data.total}
              </p>
            )}
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Search className="size-4" />
          </div>
          {researchQuery.isError && (
            <button
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => void researchQuery.refetch()}
              type="button"
            >
              Retry
            </button>
          )}
        </div>
      </section>

      <section
        aria-labelledby="recent-research-title"
        className="mt-8 overflow-hidden rounded-xl border bg-card"
      >
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold" id="recent-research-title">
              Recent research
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick up where you left off.
            </p>
          </div>
          <Link
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="/history"
          >
            View history <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <ResearchHistoryList limit={5} />
      </section>
    </div>
  );
}
