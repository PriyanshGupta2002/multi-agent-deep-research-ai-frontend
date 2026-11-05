import type {
  ResearchDepth,
  ResearchStatus,
} from "@/features/research/api/research-api";

type EmptyPayload = Record<string, unknown>;

export type ResearchEventPayloads = {
  research_started: { query: string; depth: ResearchDepth };
  supervisor_started: EmptyPayload;
  tasks_generated: { tasks: string[]; total_tasks: number };
  researcher_started: { subtask: string };
  researcher_completed: { subtask: string; source_count: number };
  researcher_failed: { subtask: string; error: string };
  aggregator_started: EmptyPayload;
  aggregator_completed: EmptyPayload;
  critic_started: EmptyPayload;
  critic_completed: {
    critic_score?: number | null;
    critic_acceptable?: boolean | null;
    critic_feedback?: string | null;
    retry_tasks: string[];
  };
  retry_started: EmptyPayload;
  retry_completed: {
    retry_count?: number | null;
    retry_tasks: string[];
  };
  final_report_started: EmptyPayload;
  final_report_completed: { report_generated: boolean };
  research_completed: {
    status: "completed";
    retry_count: number;
    critic_score: number;
  };
  research_failed: { status: "failed"; error: string };
  research_cancelled: { status: "cancelled"; message: string };
  stream_end: { status: ResearchStatus };
};

export type ResearchEventName = keyof ResearchEventPayloads;

export type ResearchLiveEvent = {
  [Name in ResearchEventName]: {
    id: string;
    type: Name;
    payload: ResearchEventPayloads[Name];
    receivedAt: string;
  };
}[ResearchEventName];

export const researchEventNames: ResearchEventName[] = [
  "research_started",
  "supervisor_started",
  "tasks_generated",
  "researcher_started",
  "researcher_completed",
  "researcher_failed",
  "aggregator_started",
  "aggregator_completed",
  "critic_started",
  "critic_completed",
  "retry_started",
  "retry_completed",
  "final_report_started",
  "final_report_completed",
  "research_completed",
  "research_failed",
  "research_cancelled",
  "stream_end",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isResearchDepth(value: unknown): value is ResearchDepth {
  return (
    value === "quick" || value === "standard" || value === "comprehensive"
  );
}

function isResearchStatus(value: unknown): value is ResearchStatus {
  return (
    value === "queued" ||
    value === "running" ||
    value === "completed" ||
    value === "failed" ||
    value === "cancelled"
  );
}

function isOptionalNumber(value: unknown) {
  return value === undefined || value === null || isNumber(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || value === null || isString(value);
}

export function parseResearchEvent(
  type: ResearchEventName,
  id: string,
  data: string,
): ResearchLiveEvent {
  const parsed: unknown = JSON.parse(data);
  if (!isObject(parsed)) {
    throw new Error(`The ${type} event payload must be an object.`);
  }

  let payload: ResearchEventPayloads[ResearchEventName] = parsed;
  switch (type) {
    case "research_started":
      if (!isString(parsed.query) || !isResearchDepth(parsed.depth)) {
        throw new Error("The research_started event payload is invalid.");
      }
      payload = { query: parsed.query, depth: parsed.depth };
      break;
    case "tasks_generated":
      if (!isStringArray(parsed.tasks) || !isNumber(parsed.total_tasks)) {
        throw new Error("The tasks_generated event payload is invalid.");
      }
      payload = { tasks: parsed.tasks, total_tasks: parsed.total_tasks };
      break;
    case "researcher_started":
      if (!isString(parsed.subtask)) {
        throw new Error("The researcher_started event payload is invalid.");
      }
      payload = { subtask: parsed.subtask };
      break;
    case "researcher_completed":
      if (!isString(parsed.subtask) || !isNumber(parsed.source_count)) {
        throw new Error("The researcher_completed event payload is invalid.");
      }
      payload = {
        subtask: parsed.subtask,
        source_count: parsed.source_count,
      };
      break;
    case "researcher_failed":
      if (!isString(parsed.subtask) || !isString(parsed.error)) {
        throw new Error("The researcher_failed event payload is invalid.");
      }
      payload = { subtask: parsed.subtask, error: parsed.error };
      break;
    case "critic_completed":
      if (
        !isOptionalNumber(parsed.critic_score) ||
        (parsed.critic_acceptable !== undefined &&
          parsed.critic_acceptable !== null &&
          typeof parsed.critic_acceptable !== "boolean") ||
        !isOptionalString(parsed.critic_feedback) ||
        !isStringArray(parsed.retry_tasks)
      ) {
        throw new Error("The critic_completed event payload is invalid.");
      }
      payload = {
        critic_score: parsed.critic_score,
        critic_acceptable: parsed.critic_acceptable,
        critic_feedback: parsed.critic_feedback,
        retry_tasks: parsed.retry_tasks,
      };
      break;
    case "retry_completed":
      if (
        !isOptionalNumber(parsed.retry_count) ||
        !isStringArray(parsed.retry_tasks)
      ) {
        throw new Error("The retry_completed event payload is invalid.");
      }
      payload = {
        retry_count: parsed.retry_count,
        retry_tasks: parsed.retry_tasks,
      };
      break;
    case "final_report_completed":
      if (typeof parsed.report_generated !== "boolean") {
        throw new Error("The final_report_completed event payload is invalid.");
      }
      payload = { report_generated: parsed.report_generated };
      break;
    case "research_completed":
      if (
        parsed.status !== "completed" ||
        !isNumber(parsed.retry_count) ||
        !isNumber(parsed.critic_score)
      ) {
        throw new Error("The research_completed event payload is invalid.");
      }
      payload = {
        status: "completed",
        retry_count: parsed.retry_count,
        critic_score: parsed.critic_score,
      };
      break;
    case "research_failed":
      if (parsed.status !== "failed" || !isString(parsed.error)) {
        throw new Error("The research_failed event payload is invalid.");
      }
      payload = { status: "failed", error: parsed.error };
      break;
    case "research_cancelled":
      if (parsed.status !== "cancelled" || !isString(parsed.message)) {
        throw new Error("The research_cancelled event payload is invalid.");
      }
      payload = { status: "cancelled", message: parsed.message };
      break;
    case "stream_end":
      if (!isResearchStatus(parsed.status)) {
        throw new Error("The stream_end event payload is invalid.");
      }
      payload = { status: parsed.status };
      break;
    case "supervisor_started":
    case "aggregator_started":
    case "aggregator_completed":
    case "critic_started":
    case "retry_started":
    case "final_report_started":
      payload = parsed;
      break;
  }

  return {
    id,
    type,
    payload,
    receivedAt: new Date().toISOString(),
  } as ResearchLiveEvent;
}

export function describeResearchEvent(event: ResearchLiveEvent): {
  title: string;
  description: string;
} {
  switch (event.type) {
    case "research_started":
      return {
        title: "Research started",
        description: `${event.payload.depth} research started for “${event.payload.query}”.`,
      };
    case "supervisor_started":
      return { title: "Supervisor started", description: "Planning research tasks." };
    case "tasks_generated":
      return {
        title: "Tasks generated",
        description: `${event.payload.total_tasks} task(s) were generated.`,
      };
    case "researcher_started":
      return {
        title: "Researcher started",
        description: event.payload.subtask,
      };
    case "researcher_completed":
      return {
        title: "Researcher completed",
        description: `${event.payload.subtask} · ${event.payload.source_count} source(s) found.`,
      };
    case "researcher_failed":
      return {
        title: "Researcher failed",
        description: `${event.payload.subtask}: ${event.payload.error}`,
      };
    case "aggregator_started":
      return { title: "Aggregator started", description: "Combining research findings." };
    case "aggregator_completed":
      return { title: "Aggregator completed", description: "Findings have been combined." };
    case "critic_started":
      return { title: "Critic started", description: "Reviewing evidence and coverage." };
    case "critic_completed":
      return {
        title: "Critic completed",
        description:
          event.payload.critic_feedback ||
          `Review completed${event.payload.critic_score == null ? "." : ` with score ${event.payload.critic_score}.`}`,
      };
    case "retry_started":
      return { title: "Retry started", description: "Revisiting selected research tasks." };
    case "retry_completed":
      return {
        title: "Retry completed",
        description: `${event.payload.retry_tasks.length} task(s) selected for another pass.`,
      };
    case "final_report_started":
      return { title: "Final report started", description: "Preparing the research report." };
    case "final_report_completed":
      return {
        title: "Final report completed",
        description: event.payload.report_generated
          ? "The report was generated."
          : "The report generation step completed without a report.",
      };
    case "research_completed":
      return {
        title: "Research completed",
        description: `Research completed after ${event.payload.retry_count} retry attempt(s).`,
      };
    case "research_failed":
      return { title: "Research failed", description: event.payload.error };
    case "research_cancelled":
      return { title: "Research cancelled", description: event.payload.message };
    case "stream_end":
      return {
        title: "Live stream ended",
        description: `The research stream closed with status: ${event.payload.status}.`,
      };
  }
}
