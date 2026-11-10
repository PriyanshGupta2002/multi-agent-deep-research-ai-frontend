"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  CircleAlert,
  Circle,
  Clock3,
  FileText,
  Layers3,
  LoaderCircle,
  Pause,
  ScanSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useCancelResearch,
  useResearchDetail,
  useResearchReport,
  useResearchSources,
  useResearchTasks,
} from "@/features/research/hooks/use-researches";
import { useResearchEvents } from "@/features/research/hooks/use-research-events";
import { SaveReportButton } from "@/features/saved-reports/components/save-report-button";
import { ResearchChatLink } from "@/features/research/components/research-chat-link";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import {
  describeResearchEvent,
  type ResearchLiveEvent,
} from "@/features/research/api/research-events";
import type {
  ResearchDepth,
  ResearchRecord,
  ResearchSourceRecord,
  ResearchStatus,
  ResearchTaskRecord,
} from "@/features/research/api/research-api";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const sections = [
  { id: "agents", label: "Agents" },
  { id: "tasks", label: "Tasks" },
  { id: "sources", label: "Sources" },
  { id: "activity", label: "Activity" },
  { id: "report-preview", label: "Report" },
];

const statusLabels: Record<ResearchStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const statusStyles: Record<ResearchStatus, string> = {
  queued: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  running: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  completed:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "border-destructive/25 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const depthLabels: Record<ResearchDepth, string> = {
  quick: "Quick",
  standard: "Standard",
  comprehensive: "Comprehensive",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function PanelHeading({
  title,
  description,
  action,
  headingId,
  titleAdornment,
  stackOnMobile = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  headingId?: string;
  titleAdornment?: React.ReactNode;
  stackOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5",
        stackOnMobile && "flex-col items-stretch sm:flex-row sm:items-center",
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold" id={headingId}>
            {title}
          </h2>
          {titleAdornment}
        </div>
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

function StatusBadge({ status }: { status: ResearchStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div aria-label={`Loading ${label}`} className="space-y-4 p-5" role="status">
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      <span className="sr-only">Loading {label}</span>
    </div>
  );
}

function SectionError({
  error,
  retry,
  subject,
}: {
  error: unknown;
  retry: () => void;
  subject: string;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      <p className="text-sm font-medium">Couldn’t load {subject}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {getResearchErrorMessage(error, `Unable to load ${subject}.`)}
      </p>
      <Button className="mt-4" onClick={retry} size="sm" variant="outline">
        <RefreshCw className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div
      aria-label="Loading research workspace"
      className="mx-auto max-w-6xl animate-pulse space-y-5"
      role="status"
    >
      <div className="h-5 w-28 rounded bg-muted" />
      <div className="h-24 rounded-xl border bg-card" />
      <div className="h-32 rounded-xl border bg-card" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 rounded-xl border bg-card" />
        <div className="h-72 rounded-xl border bg-card" />
      </div>
      <span className="sr-only">Loading research workspace</span>
    </div>
  );
}

function sourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Invalid source URL";
  }
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function SourcesPanel({
  sources,
  isPending,
  error,
  retry,
}: {
  sources: ResearchSourceRecord[] | undefined;
  isPending: boolean;
  error: Error | null;
  retry: () => void;
}) {
  return (
    <section
      aria-labelledby="sources-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="sources"
    >
      <PanelHeading
        action={
          sources ? (
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {sources.length} discovered
            </span>
          ) : null
        }
        description="Sources returned for this research."
        headingId="sources-title"
        title="Sources"
      />
      {isPending ? (
        <SectionSkeleton label="sources" />
      ) : error ? (
        <SectionError error={error} retry={retry} subject="sources" />
      ) : !sources?.length ? (
        <p className="px-5 py-8 text-center text-xs text-muted-foreground">
          No sources have been recorded yet.
        </p>
      ) : (
        <div className="workspace-scrollbar max-h-[380px] overflow-y-auto overscroll-contain scroll-smooth divide-y">
          {sources.map((source) => {
            const href = safeExternalUrl(source.url);
            return (
              <div className="px-4 py-4 sm:px-5" key={source.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {href ? (
                      <a
                        className="text-sm font-medium hover:underline"
                        href={href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.title?.trim() || source.url}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">
                        {source.title?.trim() || "Untitled source"}
                      </p>
                    )}
                    <p className="mt-1 break-all text-[11px] text-muted-foreground">
                      {sourceDomain(source.url)}
                    </p>
                    {source.snippet && (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {source.snippet}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Added {formatDate(source.created_at)}
                    </p>
                  </div>
                  {href && (
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function taskStatusLabel(status: string) {
  const known: Record<string, string> = {
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  };
  return known[status.toLowerCase()] ?? (status || "Unknown");
}

function taskStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "running":
      return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "completed":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "failed":
      return "border-destructive/25 bg-destructive/10 text-destructive";
    case "pending":
      return "border-border bg-muted/40 text-muted-foreground";
    default:
      return "border-border bg-background text-muted-foreground";
  }
}

function TaskStatusIcon({
  status,
  animate,
}: {
  status: string;
  animate: boolean;
}) {
  switch (status.toLowerCase()) {
    case "completed":
      return <Check className="size-3.5" />;
    case "running":
      return animate ? (
        <span
          aria-hidden="true"
          className="workspace-live-pulse size-2 rounded-full bg-sky-500"
        />
      ) : (
        <LoaderCircle className="size-3.5" />
      );
    case "failed":
      return <X className="size-3.5" />;
    default:
      return <Circle className="size-3.5" />;
  }
}

function TasksPanel({
  tasks,
  isPending,
  error,
  retry,
  researchActive,
}: {
  tasks: ResearchTaskRecord[] | undefined;
  isPending: boolean;
  error: Error | null;
  retry: () => void;
  researchActive: boolean;
}) {
  const completed = tasks?.filter(
    (task) => task.status.toLowerCase() === "completed",
  ).length;

  return (
    <section
      aria-labelledby="tasks-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="tasks"
    >
      <PanelHeading
        action={
          tasks ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {completed} / {tasks.length} complete
            </span>
          ) : null
        }
        description="Expand a task to review its description, result, or error."
        headingId="tasks-title"
        title="Task execution"
      />
      {isPending ? (
        <SectionSkeleton label="tasks" />
      ) : error ? (
        <SectionError error={error} retry={retry} subject="tasks" />
      ) : !tasks?.length ? (
        <p className="px-5 py-8 text-center text-xs text-muted-foreground">
          No tasks have been recorded yet.
        </p>
      ) : (
        <div className="workspace-scrollbar max-h-[420px] overflow-y-auto overscroll-contain scroll-smooth divide-y">
          {tasks.map((task) => (
            <details
              className={cn(
                "group px-4 sm:px-5",
                researchActive && task.status.toLowerCase() === "running"
                  ? "workspace-task-running"
                  : "",
              )}
              key={task.id}
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 py-4 outline-none [&::-webkit-details-marker]:hidden">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    taskStatusClass(task.status),
                  )}
                >
                  <TaskStatusIcon
                    animate={researchActive}
                    status={task.status}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5">
                    {task.title}
                  </span>
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium sm:inline-flex",
                    taskStatusClass(task.status),
                  )}
                >
                  {taskStatusLabel(task.status)}
                </span>
              </summary>
              <div className="space-y-3 pb-4 pl-9 pr-2 text-xs leading-5 text-muted-foreground">
                {task.description && (
                  <div>
                    <p className="mb-1 font-medium text-foreground/80">
                      Description
                    </p>
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}
                {task.result && (
                  <div>
                    <p className="mb-1 font-medium text-foreground/80">Result</p>
                    <p className="whitespace-pre-wrap">{task.result}</p>
                  </div>
                )}
                {task.error && (
                  <div>
                    <p className="mb-1 font-medium text-destructive">Error</p>
                    <p className="whitespace-pre-wrap">{task.error}</p>
                  </div>
                )}
                {!task.description && !task.result && !task.error && (
                  <p>No additional task details are available.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

type PipelineStageStatus = "Unknown" | "Pending" | "Active" | "Completed" | "Failed";

type PipelineStage = {
  id: string;
  title: string;
  status: PipelineStageStatus;
  description: string;
  statusDetail: string;
  icon: typeof Bot;
};

const pipelineStatusStyles: Record<PipelineStageStatus, string> = {
  Unknown: "border-border bg-background text-muted-foreground",
  Pending: "border-border bg-muted/40 text-muted-foreground",
  Active: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Completed:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Failed: "border-destructive/25 bg-destructive/10 text-destructive",
};

function PipelineStatusIcon({ status }: { status: PipelineStageStatus }) {
  if (status === "Active") {
    return (
      <LoaderCircle
        aria-hidden="true"
        className="workspace-stage-spinner size-3"
      />
    );
  }
  if (status === "Completed") {
    return <Check aria-hidden="true" className="size-3" />;
  }
  if (status === "Failed") {
    return <CircleAlert aria-hidden="true" className="size-3" />;
  }
  return <Circle aria-hidden="true" className="size-3" />;
}

function ResearchPipeline({
  events,
  tasks,
  research,
}: {
  events: ResearchLiveEvent[];
  tasks: ResearchTaskRecord[] | undefined;
  research: ResearchRecord;
}) {
  const researchTerminal =
    research.status === "completed" ||
    research.status === "failed" ||
    research.status === "cancelled";
  const latest = <T extends ResearchLiveEvent["type"]>(
    types: readonly T[],
  ): Extract<ResearchLiveEvent, { type: T }> | undefined =>
    [...events]
      .reverse()
      .find((event): event is Extract<ResearchLiveEvent, { type: T }> =>
        types.includes(event.type as T),
      );
  const supervisorStarted = latest(["supervisor_started"]);
  const generatedTasks = latest(["tasks_generated"]);
  const aggregatorEvent = latest([
    "aggregator_started",
    "aggregator_completed",
  ]);
  const criticEvent = latest(["critic_started", "critic_completed"]);
  const retryEvent = latest(["retry_completed"]);
  const reportEvent = latest([
    "final_report_started",
    "final_report_completed",
  ]);

  const researcherEventByTask = new Map<string, ResearchLiveEvent>();
  for (const event of events) {
    if (
      event.type === "researcher_started" ||
      event.type === "researcher_completed" ||
      event.type === "researcher_failed"
    ) {
      researcherEventByTask.set(event.payload.subtask, event);
    }
  }

  const researchTaskStatuses = (tasks ?? []).map((task) => {
    const taskEvent = researcherEventByTask.get(task.title);
    if (taskEvent) {
      if (taskEvent.type === "researcher_started") return "running";
      if (taskEvent.type === "researcher_completed") return "completed";
      return "failed";
    }
    return task.status.toLowerCase();
  });
  const eventTaskStatuses = [...researcherEventByTask.values()].map((event) =>
    event.type === "researcher_started"
      ? "running"
      : event.type === "researcher_completed"
        ? "completed"
        : "failed",
  );
  const effectiveResearcherStatuses =
    tasks && tasks.length > 0 ? researchTaskStatuses : eventTaskStatuses;
  const researcherCounts = effectiveResearcherStatuses.reduce(
    (counts, status) => {
      if (status === "completed") counts.completed += 1;
      if (status === "running") counts.running += 1;
      if (status === "failed") counts.failed += 1;
      return counts;
    },
    { completed: 0, running: 0, failed: 0 },
  );
  const hasResearcherEvidence =
    researcherEventByTask.size > 0 ||
    effectiveResearcherStatuses.some((status) =>
      ["running", "completed", "failed"].includes(status),
    );
  const researchersActive = effectiveResearcherStatuses.includes("running");
  const researchersPending = effectiveResearcherStatuses.includes("pending");
  const researchersFailed = effectiveResearcherStatuses.includes("failed");
  const researchersComplete =
    effectiveResearcherStatuses.length > 0 &&
    effectiveResearcherStatuses.every((status) => status === "completed");
  const researcherCountsAvailable =
    effectiveResearcherStatuses.length > 0 || (tasks !== undefined && tasks.length > 0);
  let researcherStatus: PipelineStageStatus = "Unknown";
  let researcherStatusDetail = "No researcher task status received.";
  if (researchersActive) {
    researcherStatus = researchTerminal ? "Unknown" : "Active";
    researcherStatusDetail = researchTerminal
      ? "A task was last reported running; research has since ended."
      : "Research tasks are in progress.";
  } else if (researchersComplete) {
    researcherStatus = "Completed";
    researcherStatusDetail = "All reported research tasks are completed.";
  } else if (researchersFailed && !researchersPending) {
    researcherStatus = "Failed";
    researcherStatusDetail = "One or more reported research tasks failed.";
  } else if (researchersPending || hasResearcherEvidence) {
    researcherStatus = "Pending";
    researcherStatusDetail = "Research task statuses are recorded.";
  } else if (
    events.length > 0 &&
    research.status !== "completed" &&
    research.status !== "failed" &&
    research.status !== "cancelled"
  ) {
    researcherStatus = "Pending";
    researcherStatusDetail = "Waiting for researcher task updates.";
  }
  if (researcherCountsAvailable) {
    researcherStatusDetail = `Task statuses: ${researcherCounts.completed} completed · ${researcherCounts.running} running · ${researcherCounts.failed} failed.`;
  }

  const stageNotObserved =
    research.status === "completed" ||
    research.status === "failed" ||
    research.status === "cancelled"
      ? "Unknown"
      : events.length > 0
        ? "Pending"
        : "Unknown";
  const stageStatus = (
    event: ResearchLiveEvent | undefined,
  ): PipelineStageStatus => {
    if (!event) return stageNotObserved;
    if (event.type.endsWith("_completed")) return "Completed";
    return researchTerminal ? "Unknown" : "Active";
  };
  const supervisorStatusDetail = generatedTasks
    ? `${generatedTasks.payload.total_tasks} subtasks generated.`
    : supervisorStarted
      ? researchTerminal
        ? "Supervisor started; task generation was not reported."
        : "Supervisor started; task generation is in progress."
      : stageNotObserved === "Pending"
        ? "Waiting for supervisor task generation."
        : "No supervisor event recorded yet.";
  const aggregatorStatusDetail = !aggregatorEvent
    ? stageNotObserved === "Pending"
      ? "Waiting for an aggregation event."
      : "No aggregation event recorded yet."
    : aggregatorEvent.type === "aggregator_completed"
      ? "Aggregation completed."
      : researchTerminal
        ? "Aggregation started; no completion event was received."
        : "Aggregation started.";
  let criticStatusDetail: string;
  if (!criticEvent) {
    criticStatusDetail =
      stageNotObserved === "Pending"
        ? "Waiting for a review event."
        : "No critic event recorded yet.";
  } else if (criticEvent.type === "critic_completed") {
    const reviewDetail =
      criticEvent.payload.critic_acceptable === false
        ? "Review completed; additional research was requested."
        : criticEvent.payload.critic_acceptable === true
          ? "Review completed; no additional research was requested."
          : "Review completed.";
    const retryCount = retryEvent?.payload.retry_count;
    criticStatusDetail =
      retryCount === undefined || retryCount === null
        ? reviewDetail
        : `${reviewDetail} Retry count: ${retryCount}.`;
  } else {
    criticStatusDetail = researchTerminal
      ? "Review started; no completion event was received."
      : "Review started.";
  }
  const reportStatusDetail = !reportEvent
    ? stageNotObserved === "Pending"
      ? "Waiting for a report-generation event."
      : "No report-generation event recorded yet."
    : reportEvent.type === "final_report_completed"
      ? reportEvent.payload.report_generated
        ? "Report generation completed."
        : "Report generation completed without a report."
      : researchTerminal
        ? "Report generation started; no completion event was received."
        : "Report generation started.";

  const stages: PipelineStage[] = [
    {
      id: "supervisor",
      title: "Supervisor",
      status: generatedTasks
        ? "Completed"
        : supervisorStarted
          ? researchTerminal
            ? "Unknown"
            : "Active"
          : stageNotObserved,
      description:
        "Breaks down your research question into focused subtasks and coordinates the research workflow.",
      statusDetail: supervisorStatusDetail,
      icon: Bot,
    },
    {
      id: "researchers",
      title: "Researchers",
      status: researcherStatus,
      description:
        "Investigate individual subtasks in parallel, gather relevant information, and collect supporting sources.",
      statusDetail: researcherStatusDetail,
      icon: ScanSearch,
    },
    {
      id: "aggregator",
      title: "Aggregator",
      status: stageStatus(aggregatorEvent),
      description:
        "Combines research findings, removes overlapping information, and identifies common themes, conflicting evidence, and research gaps.",
      statusDetail: aggregatorStatusDetail,
      icon: Layers3,
    },
    {
      id: "critic",
      title: "Critic",
      status: stageStatus(criticEvent),
      description:
        "Evaluates research quality, checks evidence coverage, identifies unsupported claims, and determines whether additional research is needed.",
      statusDetail: criticStatusDetail,
      icon: ShieldCheck,
    },
    {
      id: "final-report",
      title: "Final Report",
      status: stageStatus(reportEvent),
      description:
        "Synthesizes the reviewed findings into a comprehensive report with supporting evidence, limitations, and actionable recommendations.",
      statusDetail: reportStatusDetail,
      icon: FileText,
    },
  ];

  return (
    <section
      aria-labelledby="pipeline-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="agents"
    >
      <PanelHeading
        action={<StatusBadge status={research.status} />}
        description="Stages are derived from recorded backend events and task status."
        headingId="pipeline-title"
        title="Research Pipeline"
      />
      <ol className="divide-y">
        {stages.map(
          ({ id, title, status, description, statusDetail, icon: Icon }) => (
            <li className="flex items-start gap-3 px-4 py-4 sm:px-5" key={id}>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{title}</p>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none align-middle",
                      pipelineStatusStyles[status],
                    )}
                  >
                    <PipelineStatusIcon status={status} />
                    {status}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-foreground/80">
                  {description}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {statusDetail}
                </p>
              </div>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function ResearchProgress({
  research,
  tasks,
  sources,
}: {
  research: ResearchRecord;
  tasks: ResearchTaskRecord[] | undefined;
  sources: ResearchSourceRecord[] | undefined;
}) {
  const completedTasks =
    tasks?.filter((task) => task.status.toLowerCase() === "completed").length ??
    0;
  const totalTasks = tasks?.length ?? 0;
  const progress: number | null =
    research.status === "completed"
      ? 100
      : tasks
        ? totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0
        : null;
  const metrics = [
    {
      label: "Tasks completed",
      value: tasks ? `${completedTasks} / ${totalTasks}` : "Unavailable",
      icon: Check,
    },
    { label: "Active agents", value: "Unavailable", icon: Users },
    {
      label: "Sources discovered",
      value: sources ? String(sources.length) : "Unavailable",
      icon: BookOpen,
    },
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
                {research.status === "completed"
                  ? "Research completed."
                  : research.status === "failed"
                    ? "Research failed."
                    : research.status === "cancelled"
                      ? "Research was cancelled."
                      : "Progress reflects completed tasks reported by the service."}
              </p>
            </div>
            <span className="text-lg font-semibold tabular-nums">
              {progress === null ? "—" : `${progress}%`}
            </span>
          </div>
          <div
            aria-label={
              progress === null
                ? "Research progress unavailable"
                : `Research progress: ${progress}%`
            }
            aria-valuemax={progress === null ? undefined : 100}
            aria-valuemin={progress === null ? undefined : 0}
            aria-valuenow={progress ?? undefined}
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress ?? 0}%` }}
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

function ActivityTimeline({
  events,
  status,
  error,
  retry,
}: {
  events: ResearchLiveEvent[];
  status:
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "unavailable";
  error: string | null;
  retry: () => void;
}) {
  const connectionLabels = {
    connecting: "Connecting",
    connected: "Live updates connected",
    reconnecting: "Reconnecting",
    disconnected: "Disconnected",
    unavailable: "Live updates unavailable",
  } as const;
  const connected = status === "connected";
  const reconnecting = status === "reconnecting";
  const unavailable = status === "unavailable";
  const indicatorClass =
    status === "connected"
      ? "workspace-connection-dot workspace-connection-dot--connected"
      : reconnecting
        ? "workspace-connection-dot workspace-connection-dot--reconnecting"
        : unavailable
          ? "workspace-connection-dot workspace-connection-dot--unavailable"
          : "workspace-connection-dot workspace-connection-dot--disconnected";

  return (
    <section
      aria-labelledby="activity-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="activity"
    >
      <PanelHeading
        titleAdornment={
          <span
            aria-hidden="true"
            className={cn(
              "workspace-connection-dot",
              connected
                ? "workspace-connection-dot--connected"
                : reconnecting
                  ? "workspace-connection-dot--reconnecting"
                  : "workspace-connection-dot--disconnected",
            )}
          />
        }
        action={
          <span
            aria-live="polite"
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium",
              connected
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : unavailable
                  ? "border-destructive/25 bg-destructive/10 text-destructive"
                  : "border-border bg-muted text-muted-foreground",
            )}
          >
            <span aria-hidden="true" className={indicatorClass} />
            {connectionLabels[status]}
          </span>
        }
        description="Live events emitted by the research worker."
        headingId="activity-title"
        title="Activity"
      />
      {status === "unavailable" && (
        <div
          aria-live="polite"
          className="flex items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3 sm:px-5"
          role="status"
        >
          <p className="text-xs leading-5 text-muted-foreground">
            {error ||
              "Live updates are unavailable. The browser will continue attempting to reconnect."}
          </p>
          <Button
            className="shrink-0"
            onClick={retry}
            size="sm"
            variant="outline"
          >
            Retry now
          </Button>
        </div>
      )}
      {status === "reconnecting" && (
        <p
          aria-live="polite"
          className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground sm:px-5"
          role="status"
        >
          {error || "Connection interrupted. Reconnecting automatically…"}
        </p>
      )}
      {events.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs text-muted-foreground">
          {status === "connected" || status === "connecting"
            ? "Waiting for research activity…"
            : "No live events were received."}
        </p>
      ) : (
        <ol className="workspace-scrollbar max-h-[420px] overflow-y-auto overscroll-contain scroll-smooth px-4 py-2 sm:px-5">
          {events.map((event, index) => {
            const entry = describeResearchEvent(event);
            return (
            <li
              className="workspace-event-enter relative flex gap-3 py-3"
              key={`${event.id}:${event.type}:${index}`}
            >
              {index < events.length - 1 && (
                <span className="absolute bottom-0 left-[7px] top-7 w-px bg-border" />
              )}
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
                <Check className="size-2.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-xs font-medium">{entry.title}</p>
                  <time className="text-[10px] text-muted-foreground">
                    {formatDate(event.receivedAt)}
                  </time>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {entry.description}
                </p>
              </div>
            </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ReportPreview({
  research,
}: {
  research: ResearchRecord;
}) {
  const reportQuery = useResearchReport(research.id, research.status);
  const reportHref = `/research/${encodeURIComponent(research.id)}/report`;
  const reportNotReady =
    reportQuery.error instanceof ApiError &&
    reportQuery.error.code === "RESEARCH_REPORT_NOT_FOUND";
  const reportDate = reportQuery.data
    ? formatDate(reportQuery.data.created_at)
    : null;
  const reportPreview = reportQuery.data?.content
    ? getReportPreview(reportQuery.data.content)
    : null;

  return (
    <section
      aria-labelledby="report-title"
      className="overflow-hidden rounded-xl border bg-card"
      id="report-preview"
    >
      <PanelHeading
        headingId="report-title"
        stackOnMobile
        title="Report Preview"
        action={
          reportQuery.data && (
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
              <SaveReportButton
                canSave={research.status === "completed"}
                researchId={research.id}
                size="sm"
              />
              <Link
                className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
                href={reportHref}
              >
                View Full Report <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          )
        }
      />
      <div className="px-4 py-4 sm:px-5">
        {reportQuery.isPending ? (
          <div
            aria-live="polite"
            className="flex items-center gap-2 py-2 text-xs text-muted-foreground"
            role="status"
          >
            <LoaderCircle className="size-3.5 animate-spin" />
            Checking for a generated report…
          </div>
        ) : reportQuery.data ? (
          <div>
            {reportDate && (
              <p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Created {reportDate}
              </p>
            )}
            {reportPreview ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/85">
                {reportPreview}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                The generated report has no text to preview.
              </p>
            )}
          </div>
        ) : reportNotReady &&
          (research.status === "queued" || research.status === "running") ? (
          <div
            aria-live="polite"
            className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
            role="status"
          >
            <LoaderCircle className="size-4 animate-spin text-sky-600 dark:text-sky-400" />
            Your report is being prepared
          </div>
        ) : reportNotReady && research.status === "completed" ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Report is not available yet
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={reportQuery.isFetching}
                onClick={() => void reportQuery.refetch()}
                size="sm"
                variant="outline"
              >
                <RefreshCw
                  className={cn(
                    "size-3.5",
                    reportQuery.isFetching && "animate-spin",
                  )}
                />
                Retry
              </Button>
              <Link
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                href={reportHref}
              >
                Open report page
              </Link>
            </div>
          </div>
        ) : reportNotReady && research.status === "failed" ? (
          <p className="text-sm text-muted-foreground">
            A report could not be generated because this research failed.
          </p>
        ) : reportNotReady && research.status === "cancelled" ? (
          <p className="text-sm text-muted-foreground">
            Report generation stopped because this research was cancelled.
          </p>
        ) : reportQuery.isError ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              {getResearchErrorMessage(
                reportQuery.error,
                "Unable to load the report preview.",
              )}
            </p>
            <div className="flex shrink-0 gap-2">
              {reportQuery.error instanceof ApiError &&
              reportQuery.error.status === 401 ? (
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href="/login"
                >
                  Sign in
                </Link>
              ) : (
                <Button
                  disabled={reportQuery.isFetching}
                  onClick={() => void reportQuery.refetch()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw
                    className={cn(
                      "size-3.5",
                      reportQuery.isFetching && "animate-spin",
                    )}
                  />
                  Retry
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            A report will be available when research is complete.
          </div>
        )}
      </div>
    </section>
  );
}

function getReportPreview(content: string, maxLength = 420) {
  const readableContent = content
    .trim()
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__|~~|`)(.*?)\1/g, "$2")
    .replace(/\n{3,}/g, "\n\n");

  if (readableContent.length <= maxLength) return readableContent;
  const excerpt = readableContent.slice(0, maxLength);
  const lastWordBoundary = excerpt.lastIndexOf(" ");
  return `${excerpt.slice(0, lastWordBoundary > 0 ? lastWordBoundary : maxLength).trimEnd()}…`;
}

function ResearchError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const status = error instanceof ApiError ? error.status : undefined;
  const isUnauthorized = status === 401;
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
        <Search className="size-5" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">
        {status === 404
          ? "Research unavailable"
          : status === 403
            ? "Access denied"
            : isUnauthorized
              ? "Sign in required"
              : "Couldn’t load research"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {getResearchErrorMessage(error, "Unable to load this research.")}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {isUnauthorized ? (
          <Link className={buttonVariants({ variant: "outline" })} href="/login">
            Sign in
          </Link>
        ) : status === 404 || status === 403 ? (
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Back to dashboard
          </Link>
        ) : (
          <Button onClick={retry} variant="outline">
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        )}
      </div>
    </main>
  );
}

export function ResearchWorkspaceLive({ researchId }: { researchId: string }) {
  const researchQuery = useResearchDetail(researchId);
  const research = researchQuery.data;
  const liveUpdates = useResearchEvents(researchId, Boolean(research));
  const tasksQuery = useResearchTasks(
    researchId,
    Boolean(research),
    research?.status,
  );
  const sourcesQuery = useResearchSources(
    researchId,
    Boolean(research),
    research?.status,
  );
  const cancelResearch = useCancelResearch();
  const [cancelError, setCancelError] = useState<Error | null>(null);

  if (researchQuery.isPending) return <WorkspaceSkeleton />;
  if (researchQuery.isError) {
    return (
      <ResearchError error={researchQuery.error} retry={() => void researchQuery.refetch()} />
    );
  }
  if (!research) return null;

  const canCancel =
    research.status === "queued" || research.status === "running";
  const completedTasks =
    tasksQuery.data?.filter(
      (task) => task.status.toLowerCase() === "completed",
    ).length ?? 0;

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
              <StatusBadge status={research.status} />
              <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                {depthLabels[research.depth]} depth
              </span>
            </div>
            <h1 className="mt-3 max-w-4xl text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">
              {research.query}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Created {formatDate(research.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers3 className="size-3.5" />
                Research workspace
              </span>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <ResearchChatLink
              available={research.status === "completed"}
              researchId={research.id}
            />
            <Button
              className="w-full shrink-0 sm:w-auto"
              disabled={!canCancel || cancelResearch.isPending}
              onClick={() => {
                setCancelError(null);
                cancelResearch.mutate(research.id, {
                  onError: (error) => {
                    setCancelError(error);
                    void researchQuery.refetch();
                  },
                });
              }}
              variant="outline"
            >
              <Pause className="size-4" />
              {cancelResearch.isPending
                ? "Cancelling…"
                : research.status === "cancelled"
                  ? "Research cancelled"
                  : canCancel
                    ? "Cancel research"
                    : "Research ended"}
            </Button>
          </div>
        </div>
        {cancelError && (
          <p
            aria-live="polite"
            className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
            role="alert"
          >
            {getResearchErrorMessage(cancelError, "Could not cancel research.")}
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

      <ResearchProgress
        research={research}
        sources={sourcesQuery.data}
        tasks={tasksQuery.data}
      />

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-5">
          <ResearchPipeline
            events={liveUpdates.events}
            research={research}
            tasks={tasksQuery.data}
          />

          <TasksPanel
            error={tasksQuery.error}
            isPending={tasksQuery.isPending}
            researchActive={
              research.status === "queued" || research.status === "running"
            }
            retry={() => void tasksQuery.refetch()}
            tasks={tasksQuery.data}
          />

          <ReportPreview research={research} />
        </div>

        <div className="space-y-5">
          <SourcesPanel
            error={sourcesQuery.error}
            isPending={sourcesQuery.isPending}
            retry={() => void sourcesQuery.refetch()}
            sources={sourcesQuery.data}
          />
          <ActivityTimeline
            error={liveUpdates.error}
            events={liveUpdates.events}
            retry={liveUpdates.retry}
            status={liveUpdates.status}
          />
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-3 text-xs leading-5 text-muted-foreground">
            <Clock3 className="mt-0.5 size-3.5 shrink-0" />
            <p>
              {tasksQuery.data
                ? `${completedTasks} of ${tasksQuery.data.length} tasks are completed.`
                : "Task progress is unavailable until tasks finish loading."}{" "}
              Timeline entries are persisted backend events delivered in real
              time; researcher events update task statuses as they arrive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
