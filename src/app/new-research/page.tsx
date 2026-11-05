import { ResearchComposer } from "@/features/dashboard/components/research-composer";

export default function NewResearchPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          New research
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">
          Start an investigation
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Frame a clear question to begin exploring a topic in depth.
        </p>
      </div>
      <ResearchComposer />
    </div>
  );
}
