import { Suspense } from "react";
import { ResearchWorkspaceLive } from "@/features/research/research-workspace-live";

type ResearchPageProps = {
  params: Promise<{ researchId: string }>;
};

async function ResearchContent({ params }: ResearchPageProps) {
  const { researchId } = await params;
  return <ResearchWorkspaceLive researchId={researchId} />;
}

export default function ResearchPage(props: ResearchPageProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-label="Loading research workspace"
          className="mx-auto max-w-6xl animate-pulse space-y-5"
          role="status"
        >
          <div className="h-8 w-2/3 rounded bg-muted" />
          <div className="h-32 rounded-xl border bg-card" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 rounded-xl border bg-card" />
            <div className="h-72 rounded-xl border bg-card" />
          </div>
        </div>
      }
    >
      <ResearchContent {...props} />
    </Suspense>
  );
}
