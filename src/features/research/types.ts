export type ResearchStatus = "In progress" | "Completed" | "Cancelled";
export type TaskStatus = "Pending" | "Running" | "Completed" | "Failed";
export type AgentStatus = "Working" | "Completed" | "Queued" | "Waiting";
export type AgentIcon =
  | "supervisor"
  | "urban-researcher"
  | "health-researcher"
  | "aggregator"
  | "critic"
  | "report";

export type ResearchAgent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  activity: string;
  icon: AgentIcon;
};

export type ResearchTask = {
  id: string;
  title: string;
  status: TaskStatus;
  researcher: string;
  detail: string;
};

export type ResearchSource = {
  title: string;
  domain: string;
  description: string;
  href: string;
};

export type TimelineEvent = {
  title: string;
  description: string;
  time: string;
  complete: boolean;
};

export type ResearchWorkspaceData = {
  id: string;
  topic: string;
  depth: string;
  createdAt: string;
  status: ResearchStatus;
  agents: ResearchAgent[];
  tasks: ResearchTask[];
  sourcesDiscovered: number;
  sources: ResearchSource[];
  timeline: TimelineEvent[];
};
