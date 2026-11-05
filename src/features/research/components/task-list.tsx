"use client";

import { Check, ChevronDown, Circle, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchTask, TaskStatus } from "@/features/research/types";

const taskStatusStyles: Record<TaskStatus, string> = {
  Pending: "border-border bg-muted/40 text-muted-foreground",
  Running: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Completed:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Failed: "border-destructive/25 bg-destructive/10 text-destructive",
};

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "Completed") return <Check className="size-3.5" />;
  if (status === "Running") return <LoaderCircle className="size-3.5" />;
  if (status === "Failed") return <X className="size-3.5" />;
  return <Circle className="size-3.5" />;
}

export function TaskList({ tasks }: { tasks: ResearchTask[] }) {
  return (
    <div className="divide-y">
      {tasks.map((task) => (
        <details className="group px-4 sm:px-5" key={task.id}>
          <summary className="flex cursor-pointer list-none items-center gap-3 py-4 outline-none [&::-webkit-details-marker]:hidden">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                taskStatusStyles[task.status],
              )}
            >
              <StatusIcon status={task.status} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-5">{task.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Assigned to {task.researcher}
              </span>
            </span>
            <span
              className={cn(
                "hidden shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium sm:inline-flex",
                taskStatusStyles[task.status],
              )}
            >
              {task.status}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4 pl-9 pr-2 text-xs leading-5 text-muted-foreground">
            <p className="mb-1 font-medium text-foreground/80">Task details</p>
            {task.detail}
          </div>
        </details>
      ))}
    </div>
  );
}
