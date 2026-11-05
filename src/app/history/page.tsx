"use client";

import { useState } from "react";
import { ResearchHistoryList } from "@/features/research/components/research-history-list";
import { useResearches } from "@/features/research/hooks/use-researches";

const pageSize = 10;

export default function ResearchHistoryPage() {
  const [page, setPage] = useState(1);
  const { data } = useResearches(page, pageSize);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">
          Research history
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Browse your research, its status, and the depth of each investigation.
        </p>
      </div>
      <section
        aria-label="Research history"
        className="overflow-hidden rounded-xl border bg-card"
      >
        <div className="border-b px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold">All research</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {data
              ? `${data.total} ${data.total === 1 ? "project" : "projects"}`
              : "Your investigations"}
          </p>
        </div>
        <ResearchHistoryList
          limit={pageSize}
          onPageChange={setPage}
          page={page}
          paginated
        />
      </section>
    </div>
  );
}
