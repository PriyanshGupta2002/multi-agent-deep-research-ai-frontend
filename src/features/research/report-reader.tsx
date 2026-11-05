"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ReportMarkdown } from "@/features/research/components/report-markdown";
import { ReportSources } from "@/features/research/components/report-sources";
import { SaveReportButton } from "@/features/saved-reports/components/save-report-button";
import type {
  ResearchRecord,
  ResearchReportRecord,
} from "@/features/research/api/research-api";

function looksLikeMarkdown(content: string) {
  return (
    /(^|\n)\s{0,3}(#{1,6}\s+\S|[-*+]\s+\S|\d+\.\s+\S|>\s+\S|```|~~~|---\s*$)/m.test(
      content,
    ) ||
    /(^|\n)\s*\|.+\|\s*(\n|$)/m.test(content) ||
    /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/m.test(
      content,
    )
  );
}

function createMarkdownDownload(report: ResearchReportRecord) {
  const blob = new Blob([report.content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = report.research_id.replace(/[^a-z0-9-]/gi, "-");

  anchor.href = url;
  anchor.download = `${safeName || "research-report"}.md`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatReportDate(createdAt: string) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? createdAt
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ReportReader({
  report,
  research,
}: {
  report: ResearchReportRecord;
  research?: ResearchRecord;
}) {
  const researchId = report.research_id;
  const workspaceHref = `/research/${encodeURIComponent(researchId)}`;
  const structuredSources =
    report.structured_content?.aggregated_results?.sources ?? [];
  const isMarkdown = looksLikeMarkdown(report.content);

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-7 border-b pb-6">
        <Link
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          href={workspaceHref}
        >
          <ArrowLeft className="size-3.5" />
          Back to Research Workspace
        </Link>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {research?.status && (
                <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  {formatLabel(research.status)}
                </span>
              )}
              {research?.depth && (
                <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  {formatLabel(research.depth)} depth
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Report created {formatReportDate(report.created_at)}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">
              {research?.query || "Research report"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Research report
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <SaveReportButton
              canSave={research?.status === "completed"}
              researchId={researchId}
            />
            <button
              className={buttonVariants({ variant: "outline" })}
              onClick={() => createMarkdownDownload(report)}
              type="button"
            >
              <Download className="size-4" />
              Download Markdown
            </button>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,760px)_260px] xl:justify-center xl:gap-10">
        <article className="min-w-0">
          {report.content.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              The report contains no text.
            </p>
          ) : isMarkdown ? (
            <ReportMarkdown markdown={report.content} />
          ) : (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground/85">
              {report.content}
            </div>
          )}
        </article>

        <aside className="min-w-0 rounded-lg border bg-card px-3 py-4 xl:sticky xl:top-8">
          <ReportSources sources={structuredSources} />
        </aside>
      </div>

      <footer className="mt-10 border-t py-5 text-center text-xs text-muted-foreground">
        <Link
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
          href={workspaceHref}
        >
          Return to research workspace
          <ArrowUpRight className="size-3.5" />
        </Link>
      </footer>
    </div>
  );
}
