"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CircleDot,
  Clock3,
  FileText,
  Layers3,
  Pause,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentActivity } from "@/features/research/components/agent-activity";
import { TaskList } from "@/features/research/components/task-list";
import type {
  ResearchStatus,
  ResearchWorkspaceData,
} from "@/features/research/types";
import { cn } from "@/lib/utils";

const sections = [
  { id: "agents", label: "Agents" },
  { id: "tasks", label: "Tasks" },
  { id: "sources", label: "Sources" },
  { id: "activity", label: "Activity" },
  { id: "report-preview", label: "Report" },
];

function StatusBadge({ status }: { status: ResearchStatus }) {
  const styles: Record<ResearchStatus, string> = {
    "In progress":
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    Completed:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Cancelled: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function PanelHeading({
  eyebrow,
  title,
  description,
  action,
  headingId,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  headingId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h2 className="text-sm font-semibold" id={headingId}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ResearchProgress({
  data,
  status,
}: {
  data: ResearchWorkspaceData;
  status: ResearchStatus;
}) {
  const completedTasks = data.tasks.filter(
    (task) => task.status === "Completed",
  ).length;
  const progress =
    status === "Completed"
      ? 100
      : Math.round((completedTasks / data.tasks.length) * 100);
  const activeAgents = data.agents.filter(
    (agent) => agent.status === "Working",
  ).length;

  const metrics = [
    { label: "Tasks completed", value: `${completedTasks} / ${data.tasks.length}`, icon: Check },
    { label: "Active agents", value: `${activeAgents}`, icon: Users },
    { label: "Sources discovered", value: `${data.sourcesDiscovered}`, icon: BookOpen },
  ];

  return (
    <section
      aria-labelledby="progress-title"
      className="rounded-xl border bg-card"
      id="progress"
    >
      <div className="flex flex-col gap-5 p-4 sm:p-5 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold" id="progress-title">
                Research progress
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {status === "Cancelled"
                  ? "This mock investigation has been cancelled."
                  : "Your research team is working through the investigation."}
              </p>
            </div>
            <span className="text-lg font-semibold tabular-nums">{progress}%</span>
          </div>
          <div
            aria-label={`Research progress: ${progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x border-t pt-4 md:w-[52%] md:border-l md:border-t-0 md:pl-5 md:pt-0">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div className="px-2 first:pl-0 last:pr-0 sm:px-4" key={label}>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="size-3.5 shrink-0" />
                <span className="text-[10px] leading-4 sm:text-xs">{label}</span>
              </div>
              <p className="mt-2 text-sm font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SourcesPanel({ data }: { data: ResearchWorkspaceData }) {
  return (
    <section
      aria-labelledby="sources-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="sources"
    >
      <PanelHeading
        description="A small preview of source candidates in this mock workspace."
        headingId="sources-title"
        title="Sources"
        action={
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
            {data.sourcesDiscovered} discovered
          </span>
        }
      />
      <div className="divide-y">
        {data.sources.map((source) => (
          <a
            className="group block px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5"
            href={source.href}
            key={source.domain}
            rel="noreferrer"
            target="_blank"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium group-hover:underline">
                  {source.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {source.domain}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {source.description}
                </p>
              </div>
              <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
          </a>
        ))}
      </div>
      <p className="border-t bg-muted/20 px-4 py-3 text-[11px] leading-5 text-muted-foreground sm:px-5">
        Mock source examples for interface preview only. These are not verified
        research results or citations.
      </p>
    </section>
  );
}

function ActivityTimeline({ data }: { data: ResearchWorkspaceData }) {
  return (
    <section
      aria-labelledby="activity-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="activity"
    >
      <PanelHeading
        description="A chronological view of the mock research run."
        headingId="activity-title"
        title="Activity"
      />
      <ol className="px-4 py-2 sm:px-5">
        {data.timeline.map((event, index) => (
          <li className="relative flex gap-3 py-3" key={event.title}>
            {index < data.timeline.length - 1 && (
              <span className="absolute bottom-0 left-[7px] top-7 w-px bg-border" />
            )}
            <span
              className={cn(
                "z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border bg-card",
                event.complete
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {event.complete ? (
                <Check className="size-2.5" />
              ) : (
                <CircleDot className="size-2.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-xs font-medium">{event.title}</p>
                <time className="text-[10px] text-muted-foreground">{event.time}</time>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {event.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReportPreview({
  researchId,
  topic,
  depth,
  status,
}: {
  researchId: string;
  topic: string;
  depth: string;
  status: ResearchStatus;
}) {
  const isComplete = status === "Completed";
  const reportParams = new URLSearchParams({
    topic,
    depth,
  });
  const reportHref = `/research/${encodeURIComponent(researchId)}/report?${reportParams.toString()}`;

  return (
    <section
      aria-labelledby="report-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="report-preview"
    >
      <PanelHeading
        description="Open a demonstration report with sample content and source citations."
        headingId="report-title"
        title="Report preview"
        action={
          <Link
            className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
            href={reportHref}
          >
            View report <ArrowUpRight className="size-3.5" />
          </Link>
        }
      />
      <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          <FileText className="size-4" />
        </div>
        <p className="mt-3 text-sm font-medium">
          {isComplete ? "Report ready" : "Your report is taking shape"}
        </p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          {isComplete
            ? "The demonstration report is ready to preview."
            : "Preview sample report content. It does not reflect completed research."}
        </p>
      </div>
    </section>
  );
}

export function ResearchWorkspace({ data }: { data: ResearchWorkspaceData }) {
  const [status, setStatus] = useState<ResearchStatus>(data.status);
  const completedCount = useMemo(
    () => data.tasks.filter((task) => task.status === "Completed").length,
    [data.tasks],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                {data.depth} depth
              </span>
            </div>
            <h1 className="mt-3 max-w-4xl text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">
              {data.topic}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Created {data.createdAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers3 className="size-3.5" />
                Mock research workspace
              </span>
            </div>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            disabled={status !== "In progress"}
            onClick={() => setStatus("Cancelled")}
            variant="outline"
          >
            <Pause className="size-4" />
            {status === "Cancelled" ? "Research cancelled" : "Cancel research"}
          </Button>
        </div>
        {status === "Cancelled" && (
          <p
            aria-live="polite"
            className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground"
          >
            This is a mock interaction. The research status was updated locally;
            no backend request was made.
          </p>
        )}
      </div>

      <nav
        aria-label="Research workspace sections"
        className="sticky top-16 z-10 -mx-4 mb-5 flex gap-1 overflow-x-auto border-y bg-background/95 px-4 py-2 backdrop-blur-sm sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10"
      >
        {sections.map(({ id, label }) => (
          <a
            className="shrink-0 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href={`#${id}`}
            key={id}
          >
            {label}
          </a>
        ))}
      </nav>

      <ResearchProgress data={data} status={status} />

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-5">
          <section
            aria-labelledby="agents-title"
            className="overflow-hidden rounded-xl border bg-card"
            id="agents"
          >
            <PanelHeading
              description="Specialized agents working across the research pipeline."
              headingId="agents-title"
              title="Agent activity"
              action={
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {data.agents.length} agents
                </span>
              }
            />
            <AgentActivity agents={data.agents} />
          </section>

          <section
            aria-labelledby="tasks-title"
            className="overflow-hidden rounded-xl border bg-card"
            id="tasks"
          >
            <PanelHeading
              description="Expand a task to review its scope and current notes."
              headingId="tasks-title"
              title="Task execution"
              action={
                <span className="text-xs tabular-nums text-muted-foreground">
                  {completedCount} / {data.tasks.length} complete
                </span>
              }
            />
            <TaskList tasks={data.tasks} />
          </section>

          <ReportPreview
            researchId={data.id}
            status={status}
            topic={data.topic}
            depth={data.depth}
          />
        </div>

        <div className="space-y-5">
          <SourcesPanel data={data} />
          <ActivityTimeline data={data} />
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-3 text-xs leading-5 text-muted-foreground">
            <Clock3 className="mt-0.5 size-3.5 shrink-0" />
            <p>
              All activity, agents, task states, and source counts on this screen
              are sample UI data. They are not live research results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
