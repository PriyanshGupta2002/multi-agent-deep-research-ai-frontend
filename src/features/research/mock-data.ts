import type { ResearchWorkspaceData } from "@/features/research/types";

export const mockResearchId = "urban-heat-adaptation";

const mockResearch: ResearchWorkspaceData = {
  id: mockResearchId,
  topic: "How are cities adapting to extreme heat?",
  depth: "Comprehensive",
  createdAt: "Nov 5, 2026 at 10:42 AM",
  status: "In progress",
  agents: [
    {
      id: "supervisor",
      name: "Supervisor",
      role: "Orchestration",
      status: "Working",
      activity: "Coordinating research branches and reviewing task coverage.",
      icon: "supervisor",
    },
    {
      id: "researcher-01",
      name: "Researcher 01",
      role: "Urban planning",
      status: "Working",
      activity: "Mapping city heat action plans and adaptation strategies.",
      icon: "urban-researcher",
    },
    {
      id: "researcher-02",
      name: "Researcher 02",
      role: "Public health",
      status: "Working",
      activity: "Looking into heat-risk communication and public health measures.",
      icon: "health-researcher",
    },
    {
      id: "aggregator",
      name: "Aggregator",
      role: "Synthesis",
      status: "Queued",
      activity: "Will combine findings after the research branches complete.",
      icon: "aggregator",
    },
    {
      id: "critic",
      name: "Critic",
      role: "Quality review",
      status: "Waiting",
      activity: "Will review evidence quality and identify gaps in the synthesis.",
      icon: "critic",
    },
    {
      id: "report-generator",
      name: "Final report generator",
      role: "Report",
      status: "Waiting",
      activity: "Will prepare a structured report after review.",
      icon: "report",
    },
  ],
  tasks: [
    {
      id: "task-01",
      title: "Define research scope and key questions",
      status: "Completed",
      researcher: "Supervisor",
      detail:
        "Set the investigation scope around city-level heat adaptation, including built-environment strategies, public health response, and implementation considerations.",
    },
    {
      id: "task-02",
      title: "Survey urban heat mitigation approaches",
      status: "Running",
      researcher: "Researcher 01",
      detail:
        "Review common city planning approaches such as shade, cool surfaces, urban greenery, and heat-aware infrastructure. Findings are illustrative until live research is connected.",
    },
    {
      id: "task-03",
      title: "Review public health preparedness measures",
      status: "Running",
      researcher: "Researcher 02",
      detail:
        "Explore heat alert systems, cooling resources, and public guidance as categories for the eventual research synthesis.",
    },
    {
      id: "task-04",
      title: "Cross-check city implementation examples",
      status: "Failed",
      researcher: "Researcher 01",
      detail:
        "This mock task represents a branch that needs another pass. No city-level claims have been verified in this frontend preview.",
    },
    {
      id: "task-05",
      title: "Consolidate findings across research branches",
      status: "Pending",
      researcher: "Aggregator",
      detail:
        "Compare themes and note where the research branches agree, differ, or leave evidence gaps.",
    },
    {
      id: "task-06",
      title: "Review citations and identify evidence gaps",
      status: "Pending",
      researcher: "Critic",
      detail:
        "Assess source relevance and coverage before any report is prepared.",
    },
    {
      id: "task-07",
      title: "Prepare the final research report",
      status: "Pending",
      researcher: "Final report generator",
      detail:
        "Create a readable report with a concise summary, organized findings, limitations, and source references.",
    },
  ],
  sourcesDiscovered: 12,
  sources: [
    {
      title: "Urban heat islands",
      domain: "epa.gov",
      description:
        "Government information hub for the urban heat island topic and related resources.",
      href: "https://www.epa.gov/heatislands",
    },
    {
      title: "Climate change and extreme heat",
      domain: "who.int",
      description:
        "Public health organization topic page covering heat and health resources.",
      href: "https://www.who.int/health-topics/heatwaves",
    },
    {
      title: "Cities and climate change",
      domain: "unhabitat.org",
      description:
        "Organization resource area related to cities, climate, and urban development.",
      href: "https://unhabitat.org/topic/climate-change",
    },
    {
      title: "Climate adaptation",
      domain: "c40knowledgehub.org",
      description:
        "City-focused knowledge hub with climate adaptation resources and guidance.",
      href: "https://www.c40knowledgehub.org/",
    },
  ],
  timeline: [
    {
      title: "Research started",
      description: "Research brief received and workspace initialized.",
      time: "10:42 AM",
      complete: true,
    },
    {
      title: "Tasks generated",
      description: "Seven investigation tasks organized across research roles.",
      time: "10:43 AM",
      complete: true,
    },
    {
      title: "Researchers started",
      description: "Two research branches began exploring the assigned topics.",
      time: "10:44 AM",
      complete: true,
    },
    {
      title: "Sources collected",
      description: "A first set of source candidates was added to the workspace.",
      time: "10:47 AM",
      complete: true,
    },
    {
      title: "Critic review",
      description: "Evidence review will begin when research tasks are complete.",
      time: "Up next",
      complete: false,
    },
    {
      title: "Final report generation",
      description: "A report preview will be available after synthesis and review.",
      time: "Pending",
      complete: false,
    },
  ],
};

export function getMockResearch(
  researchId: string,
  topic?: string,
  depth?: ResearchWorkspaceData["depth"],
): ResearchWorkspaceData {
  if (researchId === mockResearchId && !topic) {
    return mockResearch;
  }

  return {
    ...mockResearch,
    id: researchId,
    topic: topic?.trim() || "A new research investigation",
    depth: depth || mockResearch.depth,
    createdAt: "Just now",
  };
}
