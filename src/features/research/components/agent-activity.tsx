import { cn } from "@/lib/utils";
import {
  Bot,
  CheckCheck,
  FileSearch,
  FileText,
  FlaskConical,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";
import type {
  AgentIcon,
  AgentStatus,
  ResearchAgent,
} from "@/features/research/types";

const agentIcons: Record<AgentIcon, LucideIcon> = {
  supervisor: Bot,
  "urban-researcher": ScanSearch,
  "health-researcher": FlaskConical,
  aggregator: FileSearch,
  critic: CheckCheck,
  report: FileText,
};

const statusStyles: Record<AgentStatus, string> = {
  Working: "bg-sky-500",
  Completed: "bg-emerald-500",
  Queued: "bg-muted-foreground/50",
  Waiting: "bg-muted-foreground/30",
};

export function AgentActivity({ agents }: { agents: ResearchAgent[] }) {
  return (
    <div className="divide-y">
      {agents.map(({ id, name, role, status, activity, icon }) => {
        const Icon = agentIcons[icon];

        return (
          <div className="flex gap-3 px-4 py-4 sm:px-5" key={id}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-medium">{name}</p>
                <span className="text-xs text-muted-foreground">{role}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {activity}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 self-start rounded-full border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", statusStyles[status])} />
              {status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
